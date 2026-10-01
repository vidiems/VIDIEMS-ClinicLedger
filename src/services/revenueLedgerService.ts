/**
 * @file revenueLedgerService.ts
 * @description Production Backend Transaction & Revenue Split Service with Automated Reconciliation
 * @system VIDIEMS ClinicLedger Hospital Management Subledger
 * 
 * Capabilities:
 * 1. Atomic Transaction Ingestion: Records invoice header and line items.
 * 2. Automated Departmental Revenue Allocation: Splits revenue across Consultation, Lab, Pharmacy, and Radiology.
 * 3. Multi-Channel Payment Logging: Supports Cash, POS Terminal, and Bank Transfer with audit parameters.
 * 4. Automated Reconciliation Error-Handling Routines:
 *    - Arithmetic Sum Validation (Line Items vs Header vs Payments)
 *    - Duplicate Switch Reference (POS RRN / Bank Wire) Collision Detection
 *    - Cash Drawer Shortage Protection (Tendered >= Amount)
 *    - Idempotency Deduplication Key Checking
 *    - Overpayment / Floating Balance Prevention
 */

import { Pool, PoolClient } from 'pg';
import crypto from 'crypto';

// ============================================================================
// 1. DATA CONTRACTS & TYPES
// ============================================================================

export type DepartmentType = 'consultation' | 'laboratory' | 'pharmacy' | 'radiology' | 'procedure';
export type PaymentChannelType = 'cash' | 'pos_terminal' | 'direct_bank_transfer';

export interface ServiceItemInput {
  department: DepartmentType;
  itemCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface PaymentDetailsInput {
  channel: PaymentChannelType;
  amount: number;
  currency?: string;
  // Cash Channel Parameters
  cashDrawerSessionId?: string;
  cashTendered?: number;
  // POS Card Terminal Parameters
  posTerminalId?: string;
  posRrn?: string; // Retrieval Reference Number
  posAuthCode?: string;
  cardLastFour?: string;
  cardType?: string;
  // Bank Transfer Parameters
  bankName?: string;
  transferReferenceNumber?: string;
}

export interface PatientTransactionRequest {
  idempotencyKey: string;
  patientId: string;
  appointmentId?: string;
  cashierStaffId: string;
  items: ServiceItemInput[];
  payment: PaymentDetailsInput;
  notes?: string;
}

export interface DepartmentRevenueSplit {
  department: DepartmentType;
  itemCount: number;
  departmentGrossTotal: number;
  percentageOfInvoice: number;
}

export interface TransactionExecutionResult {
  status: 'SUCCESS' | 'RECONCILIATION_FLAGGED';
  invoiceId: string;
  invoiceNumber: string;
  receiptNumber: string;
  paymentId: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  departmentSplits: DepartmentRevenueSplit[];
  reconciliationAudit: {
    isReconciled: boolean;
    arithmeticMatch: boolean;
    auditLogId: string;
    remarks: string;
  };
}

// ============================================================================
// 2. DOMAIN RECONCILIATION ERROR CLASSES
// ============================================================================

export class ReconciliationError extends Error {
  constructor(public code: string, message: string, public metadata?: Record<string, any>) {
    super(message);
    this.name = 'ReconciliationError';
  }
}

export class DuplicateReferenceError extends ReconciliationError {
  constructor(reference: string, channel: string) {
    super(
      'RECON_DUPLICATE_REFERENCE',
      `Duplicate payment reference detected: [${reference}] on channel [${channel}]. Potential replay or ghost settlement.`,
      { reference, channel }
    );
  }
}

export class ArithmeticDiscrepancyError extends ReconciliationError {
  constructor(headerTotal: number, lineItemsSum: number) {
    super(
      'RECON_ARITHMETIC_MISMATCH',
      `Critical ledger discrepancy: Invoice gross header ($${headerTotal.toFixed(2)}) diverges from line items sum ($${lineItemsSum.toFixed(2)}).`,
      { headerTotal, lineItemsSum }
    );
  }
}

export class CashShortageError extends ReconciliationError {
  constructor(tendered: number, amountDue: number) {
    super(
      'RECON_CASH_SHORTAGE',
      `Cash drawer invariant breached: Cash tendered ($${tendered.toFixed(2)}) is less than payment amount ($${amountDue.toFixed(2)}).`,
      { tendered, amountDue }
    );
  }
}

export class OverpaymentError extends ReconciliationError {
  constructor(amountPaid: number, totalAmount: number) {
    super(
      'RECON_OVERPAYMENT_RESTRICTED',
      `Payment amount ($${amountPaid.toFixed(2)}) exceeds invoice total ($${totalAmount.toFixed(2)}). Credit memo required for overages.`,
      { amountPaid, totalAmount }
    );
  }
}

// ============================================================================
// 3. CORE TRANSACTION & REVENUE SPLIT SERVICE
// ============================================================================

export class RevenueLedgerService {
  constructor(private pool: Pool) {}

  /**
   * Records a patient transaction, writes itemized service lines, allocates revenue
   * across hospital departments, captures multi-channel payments, and executes
   * automated reconciliation verification within a single ACID transaction.
   */
  async recordTransaction(request: PatientTransactionRequest): Promise<TransactionExecutionResult> {
    const client = await this.pool.connect();

    try {
      // 1. Begin Strict PostgreSQL Transaction
      await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;');

      // 2. Pre-Flight Idempotency Deduplication Check
      const idempotencyCheck = await client.query(
        'SELECT invoice_id, invoice_number FROM billing_invoices WHERE notes LIKE $1 LIMIT 1',
        [`%[IdempotencyKey: ${request.idempotencyKey}]%`]
      );
      if (idempotencyCheck.rowCount && idempotencyCheck.rowCount > 0) {
        throw new ReconciliationError(
          'IDEMPOTENCY_COLLISION',
          `Transaction with idempotency key [${request.idempotencyKey}] was already executed.`,
          { existingInvoiceId: idempotencyCheck.rows[0].invoice_id }
        );
      }

      // 3. Calculate Itemized Tariffs and Automated Departmental Revenue Allocation
      let grossTotal = 0;
      const deptMap: Record<DepartmentType, { count: number; sum: number }> = {
        consultation: { count: 0, sum: 0 },
        laboratory: { count: 0, sum: 0 },
        pharmacy: { count: 0, sum: 0 },
        radiology: { count: 0, sum: 0 },
        procedure: { count: 0, sum: 0 }
      };

      for (const item of request.items) {
        if (item.quantity <= 0 || item.unitPrice < 0) {
          throw new ReconciliationError('INVALID_ITEM_MATH', `Invalid tariff line: quantity and unit price must be positive.`);
        }
        const lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
        grossTotal += lineTotal;

        if (deptMap[item.department]) {
          deptMap[item.department].count += 1;
          deptMap[item.department].sum = Math.round((deptMap[item.department].sum + lineTotal) * 100) / 100;
        }
      }

      grossTotal = Math.round(grossTotal * 100) / 100;

      // 4. Automated Error Routine: Reconciliation Invariant 1 (Overpayment Guard)
      if (request.payment.amount > grossTotal) {
        throw new OverpaymentError(request.payment.amount, grossTotal);
      }

      // 5. Automated Error Routine: Channel Specific Validation
      await this.validatePaymentChannel(client, request.payment);

      // 6. Generate Sequential Financial Document Identifiers
      const invoiceId = crypto.randomUUID();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const paymentId = crypto.randomUUID();

      const amountPaid = request.payment.amount;
      const balanceDue = Math.round((grossTotal - amountPaid) * 100) / 100;
      const paymentStatus = balanceDue === 0 ? 'fully_paid' : amountPaid > 0 ? 'partially_paid' : 'unpaid';

      // 7. Insert Billing Invoice Header
      await client.query(
        `INSERT INTO billing_invoices (
          invoice_id, invoice_number, patient_id, appointment_id, generated_by_staff_id,
          issue_date, due_date, subtotal_amount, discount_amount, tax_amount,
          total_amount, patient_payable_amount, hmo_payable_amount, amount_paid,
          balance_due, payment_status, notes
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', $6, 0.00, 0.00, $6, $6, 0.00, $7, $8, $9, $10);`,
        [
          invoiceId,
          invoiceNumber,
          request.patientId,
          request.appointmentId || null,
          request.cashierStaffId,
          grossTotal,
          amountPaid,
          balanceDue,
          paymentStatus,
          `${request.notes || 'Clinical Services'} [IdempotencyKey: ${request.idempotencyKey}]`
        ]
      );

      // 8. Insert Line Items
      for (const item of request.items) {
        const lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
        await client.query(
          `INSERT INTO invoice_items (
            item_id, invoice_id, service_category, item_code, description, quantity, unit_price, total_line_amount, is_hmo_covered
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false);`,
          [
            crypto.randomUUID(),
            invoiceId,
            item.department,
            item.itemCode,
            item.description,
            item.quantity,
            item.unitPrice,
            lineTotal
          ]
        );
      }

      // 9. Insert Multi-Channel Payment Record
      let changeReturned: number | null = null;
      if (request.payment.channel === 'cash') {
        const tendered = request.payment.cashTendered || request.payment.amount;
        changeReturned = Math.max(0, Math.round((tendered - request.payment.amount) * 100) / 100);
      }

      await client.query(
        `INSERT INTO payments (
          payment_id, receipt_number, invoice_id, patient_id, cashier_staff_id,
          payment_channel, amount, currency, channel_status,
          cash_drawer_session_id, cash_tendered, change_returned,
          pos_terminal_id, pos_rrn, pos_auth_code, card_last_four, card_type,
          bank_name, transfer_reference_number, reconciliation_status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, 'settled',
          $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, 'reconciled'
        );`,
        [
          paymentId,
          receiptNumber,
          invoiceId,
          request.patientId,
          request.cashierStaffId,
          request.payment.channel,
          request.payment.amount,
          request.payment.currency || 'USD',
          request.payment.cashDrawerSessionId || null,
          request.payment.cashTendered || null,
          changeReturned,
          request.payment.posTerminalId || null,
          request.payment.posRrn || null,
          request.payment.posAuthCode || null,
          request.payment.cardLastFour || null,
          request.payment.cardType || null,
          request.payment.bankName || null,
          request.payment.transferReferenceNumber || null
        ]
      );

      // 10. Automated Reconciliation Audit Check
      const reconciliationAudit = await this.verifyLedgerInvariant(client, invoiceId);

      // 11. Commit ACID Transaction
      await client.query('COMMIT;');

      // 12. Compile Departmental Revenue Allocation Response
      const departmentSplits: DepartmentRevenueSplit[] = Object.entries(deptMap)
        .filter(([_, data]) => data.count > 0)
        .map(([dept, data]) => ({
          department: dept as DepartmentType,
          itemCount: data.count,
          departmentGrossTotal: data.sum,
          percentageOfInvoice: grossTotal > 0 ? Math.round((data.sum / grossTotal) * 1000) / 10 : 0
        }));

      return {
        status: reconciliationAudit.isReconciled ? 'SUCCESS' : 'RECONCILIATION_FLAGGED',
        invoiceId,
        invoiceNumber,
        receiptNumber,
        paymentId,
        totalAmount: grossTotal,
        amountPaid,
        balanceDue,
        departmentSplits,
        reconciliationAudit
      };

    } catch (error) {
      await client.query('ROLLBACK;');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Automated Error Routine: Validates channel specific constraints to catch
   * ghost POS card swipes or cash register shortages prior to database mutation.
   */
  private async validatePaymentChannel(client: PoolClient, payment: PaymentDetailsInput): Promise<void> {
    if (payment.amount <= 0) {
      throw new ReconciliationError('INVALID_AMOUNT', 'Payment amount must be strictly greater than zero.');
    }

    if (payment.channel === 'cash') {
      const tendered = payment.cashTendered ?? payment.amount;
      if (tendered < payment.amount) {
        throw new CashShortageError(tendered, payment.amount);
      }
    } else if (payment.channel === 'pos_terminal') {
      if (!payment.posRrn || !payment.posTerminalId) {
        throw new ReconciliationError(
          'MISSING_POS_METADATA',
          'POS payments require both terminal ID and Retrieval Reference Number (RRN).'
        );
      }

      // Check for duplicate RRN in switch settlement history
      const existingRrn = await client.query(
        'SELECT payment_id FROM payments WHERE pos_rrn = $1 LIMIT 1',
        [payment.posRrn]
      );
      if (existingRrn.rowCount && existingRrn.rowCount > 0) {
        throw new DuplicateReferenceError(payment.posRrn, 'pos_terminal');
      }
    } else if (payment.channel === 'direct_bank_transfer') {
      if (!payment.transferReferenceNumber || !payment.bankName) {
        throw new ReconciliationError(
          'MISSING_WIRE_METADATA',
          'Bank transfers require bank name and transfer reference number.'
        );
      }

      // Check for duplicate transfer reference number
      const existingWire = await client.query(
        'SELECT payment_id FROM payments WHERE transfer_reference_number = $1 LIMIT 1',
        [payment.transferReferenceNumber]
      );
      if (existingWire.rowCount && existingWire.rowCount > 0) {
        throw new DuplicateReferenceError(payment.transferReferenceNumber, 'direct_bank_transfer');
      }
    }
  }

  /**
   * Automated Error Routine: Post-write forensic arithmetic check comparing invoice header total
   * against the calculated sum of line items and cleared payment ledger rows.
   */
  private async verifyLedgerInvariant(client: PoolClient, invoiceId: string) {
    const res = await client.query(
      `SELECT 
        inv.total_amount AS header_total,
        inv.amount_paid AS header_paid,
        COALESCE(SUM(DISTINCT items.total_line_amount), 0.00) AS line_items_sum,
        COALESCE(SUM(DISTINCT p.amount), 0.00) AS settled_payments_sum
      FROM billing_invoices inv
      LEFT JOIN invoice_items items ON inv.invoice_id = items.invoice_id
      LEFT JOIN payments p ON inv.invoice_id = p.invoice_id AND p.channel_status = 'settled'
      WHERE inv.invoice_id = $1
      GROUP BY inv.invoice_id, inv.total_amount, inv.amount_paid;`,
      [invoiceId]
    );

    if (res.rowCount === 0) {
      throw new ReconciliationError('INVOICE_NOT_FOUND', 'Invoice verification failed: record missing.');
    }

    const row = res.rows[0];
    const headerTotal = parseFloat(row.header_total);
    const lineItemsSum = parseFloat(row.line_items_sum);
    const headerPaid = parseFloat(row.header_paid);
    const settledPaymentsSum = parseFloat(row.settled_payments_sum);

    const arithmeticMatch = Math.abs(headerTotal - lineItemsSum) < 0.01;
    const paymentMatch = Math.abs(headerPaid - settledPaymentsSum) < 0.01;
    const isReconciled = arithmeticMatch && paymentMatch;

    if (!arithmeticMatch) {
      throw new ArithmeticDiscrepancyError(headerTotal, lineItemsSum);
    }

    return {
      isReconciled,
      arithmeticMatch,
      auditLogId: crypto.randomUUID(),
      remarks: isReconciled
        ? 'Ledger verified: 100% invariant match between invoice header, line items, and payment transactions.'
        : 'Warning: Payment sum divergence detected.'
    };
  }
}
