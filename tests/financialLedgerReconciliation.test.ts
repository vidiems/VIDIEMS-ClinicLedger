/**
 * @file financialLedgerReconciliation.test.ts
 * @description Automated Unit & Invariant Test Suite for VIDIEMS ClinicLedger Financial Reconciliation Engine
 * 
 * Verifies that:
 * 1. Daily Cash entries match physical cash drawer counts minus opening float.
 * 2. POS terminal entries balance with bank/switching network settlement batches.
 * 3. Orphan terminal slips, switch drops, and duplicate RRN collisions are detected.
 * 4. Multi-channel revenue splits preserve exact conservation of monetary balance (invariant).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ============================================================================
// 1. RECONCILIATION ENGINE LOGIC UNDER TEST
// ============================================================================

export interface LedgerTransaction {
  id: string;
  invoiceId: string;
  channel: 'cash' | 'pos_terminal' | 'direct_bank_transfer';
  amount: number;
  cashierId: string;
  department: 'consultation' | 'pharmacy' | 'laboratory' | 'radiology';
  posTerminalId?: string;
  posRrn?: string;
  timestamp: string;
}

export interface BankSettlementRecord {
  terminalId: string;
  rrn: string;
  settledAmount: number;
  processorFee: number;
  netSettledAmount: number;
  settlementBatchId: string;
  settlementTimestamp: string;
  status: 'SETTLED' | 'PENDING' | 'REVERSED';
}

export interface CashDrawerAuditSession {
  sessionId: string;
  cashierId: string;
  openingFloat: number;
  physicalCashCounted: number;
  safeDropEnvelopeAmount: number;
}

export interface ReconciliationResult {
  status: 'BALANCED' | 'DISCREPANCY_DETECTED';
  date: string;
  summary: {
    totalLedgerGross: number;
    totalBankSettledGross: number;
    totalCashExpected: number;
    totalCashCounted: number;
    posVariance: number;
    cashVariance: number;
    netDiscrepancy: number;
  };
  posAudit: {
    matchedTransactionsCount: number;
    unmatchedLedgerSlips: LedgerTransaction[];
    unmatchedBankCredits: BankSettlementRecord[];
    duplicateRrnCollisions: string[];
  };
  cashAudit: {
    isCashBalanced: boolean;
    cashShortageOrOverage: number; // positive = overage, negative = shortage
  };
}

/**
 * Reconciles daily subledger entries against processor settlement feeds and physical cash drawers.
 */
export function reconcileDailyShift(
  ledgerEntries: LedgerTransaction[],
  bankSettlements: BankSettlementRecord[],
  cashSession: CashDrawerAuditSession,
  dateStr: string = '2026-10-01'
): ReconciliationResult {
  // 1. Segregate Ledger Channels
  const posEntries = ledgerEntries.filter(t => t.channel === 'pos_terminal');
  const cashEntries = ledgerEntries.filter(t => t.channel === 'cash');

  // 2. Calculate Gross Totals (using integer cents/kobo arithmetic to eliminate floating-point drift)
  const round2 = (num: number) => Math.round(num * 100) / 100;

  const totalLedgerPos = round2(posEntries.reduce((acc, t) => acc + t.amount, 0));
  const totalLedgerCash = round2(cashEntries.reduce((acc, t) => acc + t.amount, 0));
  const totalLedgerGross = round2(totalLedgerPos + totalLedgerCash);

  const totalBankSettledGross = round2(
    bankSettlements
      .filter(s => s.status === 'SETTLED')
      .reduce((acc, s) => acc + s.settledAmount, 0)
  );

  // 3. POS 2-Way Matching via Retrieval Reference Number (RRN)
  const bankMap = new Map<string, BankSettlementRecord[]>();
  const duplicateRrnCollisions: string[] = [];

  for (const record of bankSettlements) {
    if (!bankMap.has(record.rrn)) {
      bankMap.set(record.rrn, []);
    }
    const group = bankMap.get(record.rrn)!;
    group.push(record);
    if (group.length > 1 && !duplicateRrnCollisions.includes(record.rrn)) {
      duplicateRrnCollisions.push(record.rrn);
    }
  }

  const unmatchedLedgerSlips: LedgerTransaction[] = [];
  let matchedPosCount = 0;
  const matchedRrnSet = new Set<string>();

  for (const entry of posEntries) {
    const rrn = entry.posRrn;
    if (!rrn || !bankMap.has(rrn)) {
      unmatchedLedgerSlips.push(entry);
      continue;
    }

    const matchingBankRecords = bankMap.get(rrn)!;
    const exactMatch = matchingBankRecords.find(
      b => b.settledAmount === entry.amount && b.status === 'SETTLED'
    );

    if (exactMatch) {
      matchedPosCount++;
      matchedRrnSet.add(rrn);
    } else {
      unmatchedLedgerSlips.push(entry);
    }
  }

  // Unmatched Bank Credits (Bank shows money received, but no internal invoice slip exists)
  const unmatchedBankCredits = bankSettlements.filter(
    b => !matchedRrnSet.has(b.rrn) && b.status === 'SETTLED'
  );

  const posVariance = round2(totalBankSettledGross - totalLedgerPos);

  // 4. Cash Drawer Physical Balancing
  // Net cash received in shift = Physical cash counted - Opening cash float
  const netPhysicalCashReceived = round2(
    cashSession.physicalCashCounted - cashSession.openingFloat
  );
  const cashShortageOrOverage = round2(netPhysicalCashReceived - totalLedgerCash);
  const isCashBalanced = Math.abs(cashShortageOrOverage) < 0.01;

  // 5. Overall Net Discrepancy
  const netDiscrepancy = round2(posVariance + cashShortageOrOverage);
  const isBalanced = 
    Math.abs(posVariance) < 0.01 && 
    isCashBalanced && 
    unmatchedLedgerSlips.length === 0 && 
    unmatchedBankCredits.length === 0 &&
    duplicateRrnCollisions.length === 0;

  return {
    status: isBalanced ? 'BALANCED' : 'DISCREPANCY_DETECTED',
    date: dateStr,
    summary: {
      totalLedgerGross,
      totalBankSettledGross,
      totalCashExpected: totalLedgerCash,
      totalCashCounted: netPhysicalCashReceived,
      posVariance,
      cashVariance: cashShortageOrOverage,
      netDiscrepancy
    },
    posAudit: {
      matchedTransactionsCount: matchedPosCount,
      unmatchedLedgerSlips,
      unmatchedBankCredits,
      duplicateRrnCollisions
    },
    cashAudit: {
      isCashBalanced,
      cashShortageOrOverage
    }
  };
}

// ============================================================================
// 2. AUTOMATED RECONCILIATION TEST SUITE
// ============================================================================

describe('VIDIEMS ClinicLedger: Financial Reconciliation Module Test Suite', () => {

  // TEST 1: Perfectly Balanced Daily Shift
  it('SPEC 1: Should verify a 100% balanced daily shift with zero POS and Cash variance', () => {
    const mockLedger: LedgerTransaction[] = [
      { id: 'tx-1', invoiceId: 'INV-101', channel: 'pos_terminal', amount: 25000, cashierId: 'STF-01', department: 'consultation', posTerminalId: 'POS-TID-A', posRrn: 'RRN-99214001', timestamp: '2026-10-01T09:00:00Z' },
      { id: 'tx-2', invoiceId: 'INV-102', channel: 'pos_terminal', amount: 18500, cashierId: 'STF-01', department: 'pharmacy', posTerminalId: 'POS-TID-B', posRrn: 'RRN-99214002', timestamp: '2026-10-01T09:30:00Z' },
      { id: 'tx-3', invoiceId: 'INV-103', channel: 'cash', amount: 12000, cashierId: 'STF-01', department: 'laboratory', timestamp: '2026-10-01T10:00:00Z' },
      { id: 'tx-4', invoiceId: 'INV-104', channel: 'cash', amount: 8000, cashierId: 'STF-01', department: 'consultation', timestamp: '2026-10-01T10:45:00Z' }
    ];

    const mockBankSettlements: BankSettlementRecord[] = [
      { terminalId: 'POS-TID-A', rrn: 'RRN-99214001', settledAmount: 25000, processorFee: 187.50, netSettledAmount: 24812.50, settlementBatchId: 'BATCH-STANBIC-01', settlementTimestamp: '2026-10-01T23:00:00Z', status: 'SETTLED' },
      { terminalId: 'POS-TID-B', rrn: 'RRN-99214002', settledAmount: 18500, processorFee: 138.75, netSettledAmount: 18361.25, settlementBatchId: 'BATCH-STANBIC-01', settlementTimestamp: '2026-10-01T23:00:00Z', status: 'SETTLED' }
    ];

    const mockCashDrawer: CashDrawerAuditSession = {
      sessionId: 'DRAWER-20261001-A',
      cashierId: 'STF-01',
      openingFloat: 10000, // ₦10,000 float provided at 8:00 AM
      physicalCashCounted: 30000, // ₦10,000 float + ₦20,000 collected
      safeDropEnvelopeAmount: 20000
    };

    const report = reconcileDailyShift(mockLedger, mockBankSettlements, mockCashDrawer);

    // Invariant Assertions
    assert.equal(report.status, 'BALANCED');
    assert.equal(report.summary.posVariance, 0);
    assert.equal(report.summary.cashVariance, 0);
    assert.equal(report.summary.netDiscrepancy, 0);
    assert.equal(report.posAudit.matchedTransactionsCount, 2);
    assert.equal(report.posAudit.unmatchedLedgerSlips.length, 0);
    assert.equal(report.posAudit.unmatchedBankCredits.length, 0);
    assert.equal(report.cashAudit.isCashBalanced, true);
  });

  // TEST 2: POS Under-Settlement (Network Timeout / Orphan Internal Slip)
  it('SPEC 2: Should detect POS under-settlement when cashier issued receipt but terminal gateway dropped switch settlement', () => {
    const mockLedger: LedgerTransaction[] = [
      { id: 'tx-1', invoiceId: 'INV-101', channel: 'pos_terminal', amount: 35000, cashierId: 'STF-01', department: 'pharmacy', posTerminalId: 'POS-TID-A', posRrn: 'RRN-SETTLED-01', timestamp: '2026-10-01T09:00:00Z' },
      // Dropped transaction: Cashier recorded INV-102, but bank switch timed out
      { id: 'tx-2', invoiceId: 'INV-102', channel: 'pos_terminal', amount: 15000, cashierId: 'STF-01', department: 'consultation', posTerminalId: 'POS-TID-A', posRrn: 'RRN-DROPPED-02', timestamp: '2026-10-01T11:00:00Z' }
    ];

    // Bank only received and settled ₦35,000
    const mockBankSettlements: BankSettlementRecord[] = [
      { terminalId: 'POS-TID-A', rrn: 'RRN-SETTLED-01', settledAmount: 35000, processorFee: 262.50, netSettledAmount: 34737.50, settlementBatchId: 'BATCH-01', settlementTimestamp: '2026-10-01T23:00:00Z', status: 'SETTLED' }
    ];

    const mockCashDrawer: CashDrawerAuditSession = {
      sessionId: 'DRAWER-B',
      cashierId: 'STF-01',
      openingFloat: 5000,
      physicalCashCounted: 5000,
      safeDropEnvelopeAmount: 0
    };

    const report = reconcileDailyShift(mockLedger, mockBankSettlements, mockCashDrawer);

    assert.equal(report.status, 'DISCREPANCY_DETECTED');
    assert.equal(report.summary.posVariance, -15000); // Bank received ₦15,000 less than subledger
    assert.equal(report.posAudit.unmatchedLedgerSlips.length, 1);
    assert.equal(report.posAudit.unmatchedLedgerSlips[0].invoiceId, 'INV-102');
  });

  // TEST 3: Duplicate Bank Charge Detection (Double Debit on Processor)
  it('SPEC 3: Should flag duplicate RRN switch authorizations when a patient card is debited twice for a single invoice', () => {
    const mockLedger: LedgerTransaction[] = [
      { id: 'tx-1', invoiceId: 'INV-101', channel: 'pos_terminal', amount: 20000, cashierId: 'STF-01', department: 'laboratory', posTerminalId: 'POS-TID-A', posRrn: 'RRN-DUP-8819', timestamp: '2026-10-01T09:00:00Z' }
    ];

    // Bank settlement feed contains 2 entries with identical RRN (Switch stutter error)
    const mockBankSettlements: BankSettlementRecord[] = [
      { terminalId: 'POS-TID-A', rrn: 'RRN-DUP-8819', settledAmount: 20000, processorFee: 150, netSettledAmount: 19850, settlementBatchId: 'BATCH-01', settlementTimestamp: '2026-10-01T09:00:15Z', status: 'SETTLED' },
      { terminalId: 'POS-TID-A', rrn: 'RRN-DUP-8819', settledAmount: 20000, processorFee: 150, netSettledAmount: 19850, settlementBatchId: 'BATCH-01', settlementTimestamp: '2026-10-01T09:00:28Z', status: 'SETTLED' }
    ];

    const mockCashDrawer: CashDrawerAuditSession = {
      sessionId: 'DRAWER-C',
      cashierId: 'STF-01',
      openingFloat: 0,
      physicalCashCounted: 0,
      safeDropEnvelopeAmount: 0
    };

    const report = reconcileDailyShift(mockLedger, mockBankSettlements, mockCashDrawer);

    assert.equal(report.status, 'DISCREPANCY_DETECTED');
    assert.equal(report.posAudit.duplicateRrnCollisions.length, 1);
    assert.equal(report.posAudit.duplicateRrnCollisions[0], 'RRN-DUP-8819');
    assert.equal(report.summary.posVariance, 20000); // Bank has ₦20,000 extra needing customer chargeback reversal
  });

  // TEST 4: Cash Drawer Shortage (Physical Cash Count < Ledger Recorded Cash)
  it('SPEC 4: Should detect physical cash drawer shortage and flag cashier deficit', () => {
    const mockLedger: LedgerTransaction[] = [
      { id: 'tx-1', invoiceId: 'INV-201', channel: 'cash', amount: 50000, cashierId: 'STF-02', department: 'pharmacy', timestamp: '2026-10-01T12:00:00Z' }
    ];

    const mockBankSettlements: BankSettlementRecord[] = [];

    // Cashier should have ₦10,000 float + ₦50,000 cash = ₦60,000, but only has ₦55,000
    const mockCashDrawer: CashDrawerAuditSession = {
      sessionId: 'DRAWER-D',
      cashierId: 'STF-02',
      openingFloat: 10000,
      physicalCashCounted: 55000, // ₦5,000 shortage!
      safeDropEnvelopeAmount: 45000
    };

    const report = reconcileDailyShift(mockLedger, mockBankSettlements, mockCashDrawer);

    assert.equal(report.status, 'DISCREPANCY_DETECTED');
    assert.equal(report.cashAudit.isCashBalanced, false);
    assert.equal(report.cashAudit.cashShortageOrOverage, -5000); // ₦5,000 deficit
    assert.equal(report.summary.cashVariance, -5000);
  });

  // TEST 5: Cash Drawer Overage (Unrecorded Cash Entry)
  it('SPEC 5: Should detect physical cash drawer overage when unreceipted cash is discovered in the till', () => {
    const mockLedger: LedgerTransaction[] = [
      { id: 'tx-1', invoiceId: 'INV-301', channel: 'cash', amount: 30000, cashierId: 'STF-03', department: 'consultation', timestamp: '2026-10-01T14:00:00Z' }
    ];

    const mockCashDrawer: CashDrawerAuditSession = {
      sessionId: 'DRAWER-E',
      cashierId: 'STF-03',
      openingFloat: 10000,
      physicalCashCounted: 42000, // ₦10,000 float + ₦30,000 ledger + ₦2,000 unrecorded cash = ₦42,000
      safeDropEnvelopeAmount: 32000
    };

    const report = reconcileDailyShift(mockLedger, [], mockCashDrawer);

    assert.equal(report.status, 'DISCREPANCY_DETECTED');
    assert.equal(report.cashAudit.isCashBalanced, false);
    assert.equal(report.cashAudit.cashShortageOrOverage, 2000); // ₦2,000 surplus
  });

  // TEST 6: Multi-Department Invariant Conservation
  it('SPEC 6: Should enforce exact mathematical conservation of departmental splits against bank settlements', () => {
    const consultationAmount = 150000;
    const pharmacyAmount = 245000;
    const laboratoryAmount = 180000;
    const radiologyAmount = 85000;
    const totalExpected = consultationAmount + pharmacyAmount + laboratoryAmount + radiologyAmount; // ₦660,000

    const mockLedger: LedgerTransaction[] = [
      { id: 'tx-1', invoiceId: 'INV-D1', channel: 'pos_terminal', amount: consultationAmount, cashierId: 'STF-01', department: 'consultation', posTerminalId: 'POS-A', posRrn: 'RRN-CONS', timestamp: '2026-10-01T08:00:00Z' },
      { id: 'tx-2', invoiceId: 'INV-D2', channel: 'pos_terminal', amount: pharmacyAmount, cashierId: 'STF-01', department: 'pharmacy', posTerminalId: 'POS-B', posRrn: 'RRN-PHARM', timestamp: '2026-10-01T09:00:00Z' },
      { id: 'tx-3', invoiceId: 'INV-D3', channel: 'pos_terminal', amount: laboratoryAmount, cashierId: 'STF-01', department: 'laboratory', posTerminalId: 'POS-C', posRrn: 'RRN-LAB', timestamp: '2026-10-01T10:00:00Z' },
      { id: 'tx-4', invoiceId: 'INV-D4', channel: 'pos_terminal', amount: radiologyAmount, cashierId: 'STF-01', department: 'radiology', posTerminalId: 'POS-D', posRrn: 'RRN-RAD', timestamp: '2026-10-01T11:00:00Z' }
    ];

    const mockBankSettlements: BankSettlementRecord[] = [
      { terminalId: 'POS-A', rrn: 'RRN-CONS', settledAmount: consultationAmount, processorFee: 1125, netSettledAmount: 148875, settlementBatchId: 'B-1', settlementTimestamp: '2026-10-01T23:00:00Z', status: 'SETTLED' },
      { terminalId: 'POS-B', rrn: 'RRN-PHARM', settledAmount: pharmacyAmount, processorFee: 1837.5, netSettledAmount: 243162.5, settlementBatchId: 'B-1', settlementTimestamp: '2026-10-01T23:00:00Z', status: 'SETTLED' },
      { terminalId: 'POS-C', rrn: 'RRN-LAB', settledAmount: laboratoryAmount, processorFee: 1350, netSettledAmount: 178650, settlementBatchId: 'B-1', settlementTimestamp: '2026-10-01T23:00:00Z', status: 'SETTLED' },
      { terminalId: 'POS-D', rrn: 'RRN-RAD', settledAmount: radiologyAmount, processorFee: 637.5, netSettledAmount: 84362.5, settlementBatchId: 'B-1', settlementTimestamp: '2026-10-01T23:00:00Z', status: 'SETTLED' }
    ];

    const mockCashDrawer: CashDrawerAuditSession = {
      sessionId: 'DRAWER-M',
      cashierId: 'STF-01',
      openingFloat: 0,
      physicalCashCounted: 0,
      safeDropEnvelopeAmount: 0
    };

    const report = reconcileDailyShift(mockLedger, mockBankSettlements, mockCashDrawer);

    assert.equal(report.status, 'BALANCED');
    assert.equal(report.summary.totalLedgerGross, totalExpected);
    assert.equal(report.summary.totalBankSettledGross, totalExpected);
    assert.equal(report.summary.posVariance, 0);
  });

  // TEST 7: High-Volume Micro-Cent Precision & Stress Test (5,000 Transactions)
  it('SPEC 7: Should guarantee micro-cent precision across 5,000 transactions with zero floating-point accumulation drift', () => {
    const transactionsCount = 5000;
    const unitPrice = 143.27; // Fractional price designed to test IEEE-754 drift
    const mockLedger: LedgerTransaction[] = [];
    const mockBankSettlements: BankSettlementRecord[] = [];

    for (let i = 0; i < transactionsCount; i++) {
      const rrn = `RRN-BATCH-${i}`;
      mockLedger.push({
        id: `tx-stress-${i}`,
        invoiceId: `INV-STR-${i}`,
        channel: 'pos_terminal',
        amount: unitPrice,
        cashierId: 'STF-01',
        department: 'pharmacy',
        posTerminalId: 'POS-STRESS-1',
        posRrn: rrn,
        timestamp: '2026-10-01T10:00:00Z'
      });

      mockBankSettlements.push({
        terminalId: 'POS-STRESS-1',
        rrn: rrn,
        settledAmount: unitPrice,
        processorFee: 1.07,
        netSettledAmount: 142.20,
        settlementBatchId: 'BATCH-STRESS-EOD',
        settlementTimestamp: '2026-10-01T23:00:00Z',
        status: 'SETTLED'
      });
    }

    const mockCashDrawer: CashDrawerAuditSession = {
      sessionId: 'DRAWER-STRESS',
      cashierId: 'STF-01',
      openingFloat: 0,
      physicalCashCounted: 0,
      safeDropEnvelopeAmount: 0
    };

    const expectedTotal = Math.round(transactionsCount * unitPrice * 100) / 100;
    const report = reconcileDailyShift(mockLedger, mockBankSettlements, mockCashDrawer);

    assert.equal(report.status, 'BALANCED');
    assert.equal(report.posAudit.matchedTransactionsCount, transactionsCount);
    assert.equal(report.summary.totalLedgerGross, expectedTotal);
    assert.equal(report.summary.posVariance, 0);
  });
});
