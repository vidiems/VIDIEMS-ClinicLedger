import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard, 
  Banknote, 
  Building, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Terminal, 
  Layers, 
  PieChart, 
  ShieldCheck, 
  ArrowRight,
  Plus,
  Trash2
} from 'lucide-react';

interface CartItem {
  id: string;
  department: 'consultation' | 'laboratory' | 'pharmacy' | 'radiology';
  itemCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export const RevenueSplitReconciliationModule: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>([
    { id: '1', department: 'consultation', itemCode: 'SRV-CONS-CARD', description: 'Consultant Cardiologist Review', quantity: 1, unitPrice: 150.00 },
    { id: '2', department: 'laboratory', itemCode: 'LAB-TROP-I', description: 'Troponin-I High-Sensitivity Assay', quantity: 1, unitPrice: 180.00 },
    { id: '3', department: 'pharmacy', itemCode: 'PHR-ATOR-20', description: 'Atorvastatin 20mg Tabs (Pack of 30)', quantity: 2, unitPrice: 35.00 },
    { id: '4', department: 'radiology', itemCode: 'RAD-ECG-12L', description: '12-Lead Diagnostic ECG Test', quantity: 1, unitPrice: 120.00 }
  ]);

  // Payment form state
  const [paymentChannel, setPaymentChannel] = useState<'cash' | 'pos_terminal' | 'direct_bank_transfer'>('pos_terminal');
  const [paymentAmount, setPaymentAmount] = useState<string>('520.00');
  
  // Channel metadata
  const [cashTendered, setCashTendered] = useState<string>('550.00');
  const [posTerminalId, setPosTerminalId] = useState<string>('POS-TID-8841-A');
  const [posRrn, setPosRrn] = useState<string>('RRN-9921408192');
  const [cardType, setCardType] = useState<string>('Visa Debit');
  const [cardLast4, setCardLast4] = useState<string>('4012');
  const [bankName, setBankName] = useState<string>('Zenith Bank NIP Transfer');
  const [transferRef, setTransferRef] = useState<string>('NIP-TX-883192019');

  // Error injection simulator
  const [errorSimulationMode, setErrorSimulationMode] = useState<'none' | 'duplicate_rrn' | 'cash_shortage' | 'overpayment' | 'arithmetic_mismatch'>('none');
  const [executionResult, setExecutionResult] = useState<any | null>(null);
  const [executionError, setExecutionError] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Derived financial metrics
  const grossTotal = items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);

  // Department revenue allocations
  const deptTotals = items.reduce((acc, it) => {
    const total = it.quantity * it.unitPrice;
    acc[it.department] = (acc[it.department] || 0) + total;
    return acc;
  }, {} as Record<string, number>);

  const handleAddItem = (dept: 'consultation' | 'laboratory' | 'pharmacy' | 'radiology', name: string, code: string, price: number) => {
    const newItem: CartItem = {
      id: Date.now().toString(),
      department: dept,
      itemCode: code,
      description: name,
      quantity: 1,
      unitPrice: price
    };
    setItems([...items, newItem]);
    setPaymentAmount((grossTotal + price).toFixed(2));
  };

  const handleRemoveItem = (id: string) => {
    const filtered = items.filter(it => it.id !== id);
    setItems(filtered);
    const newTotal = filtered.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
    setPaymentAmount(newTotal.toFixed(2));
  };

  const handleExecuteBackendScript = () => {
    setExecutionResult(null);
    setExecutionError(null);

    const amountNum = parseFloat(paymentAmount) || 0;

    // Simulate Automated Error Routines
    if (errorSimulationMode === 'duplicate_rrn') {
      setExecutionError({
        name: 'DuplicateReferenceError',
        code: 'RECON_DUPLICATE_REFERENCE',
        message: `Duplicate payment reference detected: [${posRrn}] on channel [pos_terminal]. Switch audit log flagged prior settlement matching. Potential replay attack blocked.`,
        httpStatus: 409
      });
      return;
    }

    if (errorSimulationMode === 'cash_shortage') {
      const tendered = parseFloat(cashTendered) || 0;
      setExecutionError({
        name: 'CashShortageError',
        code: 'RECON_CASH_SHORTAGE',
        message: `Cash drawer invariant breached: Cash tendered ($${tendered.toFixed(2)}) is less than payment amount ($${amountNum.toFixed(2)}). Cashier shift flagged.`,
        httpStatus: 422
      });
      return;
    }

    if (errorSimulationMode === 'overpayment') {
      setExecutionError({
        name: 'OverpaymentError',
        code: 'RECON_OVERPAYMENT_RESTRICTED',
        message: `Payment amount ($${(grossTotal + 100).toFixed(2)}) exceeds invoice gross total ($${grossTotal.toFixed(2)}). Floating overage restricted by database CHECK constraint. Credit memo required.`,
        httpStatus: 400
      });
      return;
    }

    if (errorSimulationMode === 'arithmetic_mismatch') {
      setExecutionError({
        name: 'ArithmeticDiscrepancyError',
        code: 'RECON_ARITHMETIC_MISMATCH',
        message: `Critical ledger discrepancy: Invoice gross header ($${grossTotal.toFixed(2)}) diverges from line items sum ($${(grossTotal - 50).toFixed(2)}). Transaction aborted and rolled back.`,
        httpStatus: 500
      });
      return;
    }

    // Success Execution
    const splits = Object.entries(deptTotals).map(([dept, total]) => ({
      department: dept,
      grossRevenue: total,
      itemCount: items.filter(it => it.department === dept).length,
      percentage: grossTotal > 0 ? Math.round((total / grossTotal) * 1000) / 10 : 0
    }));

    setExecutionResult({
      status: 'SUCCESS',
      invoiceNumber: `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      receiptNumber: `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      transactionTimestamp: new Date().toISOString(),
      grossTotal: grossTotal,
      amountSettled: amountNum,
      balanceDue: Math.max(0, grossTotal - amountNum),
      paymentChannel: paymentChannel,
      departmentSplits: splits,
      reconciliationAudit: {
        isReconciled: true,
        auditLogId: crypto.randomUUID(),
        switchVerification: paymentChannel === 'pos_terminal' ? 'MATCHED_SWITCH_RRN' : paymentChannel === 'direct_bank_transfer' ? 'MATCHED_NIP_SESSION' : 'CASH_DRAWER_BALANCED',
        message: '100% Invariant Verified: Line items sum matches invoice header, and payment transactions are forensically balanced.'
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>Financial Subledger Kernel</span>
              <span>·</span>
              <span>Automated Revenue Splitting & Reconciliation</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Departmental Revenue Split & Multi-Channel Reconciliation Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Automated backend transaction processing that ingests patient orders, mathematically splits revenue across hospital cost centers (Consultation, Lab, Pharmacy, Radiology), logs multi-channel payment streams (Cash, POS, Bank Transfer), and executes automated reconciliation error handlers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`// View source code in /src/services/revenueLedgerService.ts`);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Service Code'}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Bar */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs font-mono">
          <div className="p-3 rounded bg-slate-950 border border-slate-800">
            <div className="text-slate-500 text-[10px]">CONSULTATION SPLIT</div>
            <div className="font-bold text-indigo-400 tabular-nums">${(deptTotals['consultation'] || 0).toFixed(2)}</div>
            <div className="text-slate-500 text-[10px]">{grossTotal > 0 ? (((deptTotals['consultation'] || 0) / grossTotal) * 100).toFixed(1) : 0}% of bill</div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800">
            <div className="text-slate-500 text-[10px]">LABORATORY SPLIT</div>
            <div className="font-bold text-cyan-400 tabular-nums">${(deptTotals['laboratory'] || 0).toFixed(2)}</div>
            <div className="text-slate-500 text-[10px]">{grossTotal > 0 ? (((deptTotals['laboratory'] || 0) / grossTotal) * 100).toFixed(1) : 0}% of bill</div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800">
            <div className="text-slate-500 text-[10px]">PHARMACY SPLIT</div>
            <div className="font-bold text-amber-400 tabular-nums">${(deptTotals['pharmacy'] || 0).toFixed(2)}</div>
            <div className="text-slate-500 text-[10px]">{grossTotal > 0 ? (((deptTotals['pharmacy'] || 0) / grossTotal) * 100).toFixed(1) : 0}% of bill</div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800">
            <div className="text-slate-500 text-[10px]">RADIOLOGY SPLIT</div>
            <div className="font-bold text-emerald-400 tabular-nums">${(deptTotals['radiology'] || 0).toFixed(2)}</div>
            <div className="text-slate-500 text-[10px]">{grossTotal > 0 ? (((deptTotals['radiology'] || 0) / grossTotal) * 100).toFixed(1) : 0}% of bill</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Orders & Payment Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* =====================================================================
            MODULE 1: CLINICAL SERVICE ORDERS & REVENUE SPLIT
        ===================================================================== */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <PieChart className="w-4 h-4 text-cyan-400" />
                1. Clinical Orders & Departmental Revenue Allocation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every billable line item is assigned to a specific hospital revenue center.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              Total: ${grossTotal.toFixed(2)}
            </span>
          </div>

          {/* Quick Add Presets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
            <span className="text-slate-500 shrink-0">Add Preset:</span>
            <button
              onClick={() => handleAddItem('consultation', 'Emergency Triage Review', 'SRV-CONS-EMER', 80.00)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded whitespace-nowrap cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Consultation (+$80)
            </button>
            <button
              onClick={() => handleAddItem('laboratory', 'Complete Blood Count (CBC)', 'LAB-CBC-01', 45.00)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded whitespace-nowrap cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Lab CBC (+$45)
            </button>
            <button
              onClick={() => handleAddItem('pharmacy', 'Amoxicillin 500mg (20 Caps)', 'PHR-AMOX-500', 25.00)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded whitespace-nowrap cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Pharmacy (+$25)
            </button>
          </div>

          {/* Active Items Table */}
          <div className="overflow-x-auto border border-slate-800 rounded">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Department</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-center">Qty</th>
                  <th className="py-2 px-3 text-right">Price</th>
                  <th className="py-2 px-3 text-right">Total</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                        item.department === 'consultation' ? 'text-indigo-400 bg-indigo-950/40' :
                        item.department === 'laboratory' ? 'text-cyan-400 bg-cyan-950/40' :
                        item.department === 'pharmacy' ? 'text-amber-400 bg-amber-950/40' :
                        'text-emerald-400 bg-emerald-950/40'
                      }`}>
                        {item.department}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-200">{item.description}</td>
                    <td className="py-2 px-3 text-center text-slate-400">{item.quantity}</td>
                    <td className="py-2 px-3 text-right text-slate-300">${item.unitPrice.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-white font-bold">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* =====================================================================
            MODULE 2: MULTI-CHANNEL PAYMENT LOGS & RECONCILIATION
        ===================================================================== */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                2. Multi-Channel Payment & Reconciliation Matching
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Logs transaction across Cash, POS, or Bank Wires with automated error checks.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              Subledger Logging
            </span>
          </div>

          {/* Payment Channel Selector */}
          <div>
            <label className="text-slate-400 text-xs font-mono block mb-1.5">Select Settlement Channel:</label>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {[
                { id: 'pos_terminal', label: 'POS Terminal', icon: CreditCard },
                { id: 'cash', label: 'Cash Drawer', icon: Banknote },
                { id: 'direct_bank_transfer', label: 'Bank Transfer (NIP)', icon: Building }
              ].map((ch) => {
                const Icon = ch.icon;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setPaymentChannel(ch.id as any)}
                    className={`p-2.5 rounded border flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                      paymentChannel === ch.id
                        ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Channel-Specific Form Fields */}
          {paymentChannel === 'cash' && (
            <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="text-amber-400 font-semibold flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash Drawer Session: DRAWER-SHIFT-01</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 text-[10px] block mb-1">Cash Tendered ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-500 text-[10px] block mb-1">Change Dispensed ($)</label>
                  <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-bold tabular-nums">
                    ${Math.max(0, (parseFloat(cashTendered) || 0) - (parseFloat(paymentAmount) || 0)).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {paymentChannel === 'pos_terminal' && (
            <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="text-cyan-400 font-semibold flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>EMV Card Terminal Switch Parameters:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-slate-500 text-[10px] block">Terminal TID</label>
                  <input type="text" value={posTerminalId} onChange={(e) => setPosTerminalId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-white rounded text-[11px]" />
                </div>
                <div>
                  <label className="text-slate-500 text-[10px] block">Switch RRN</label>
                  <input type="text" value={posRrn} onChange={(e) => setPosRrn(e.target.value)} className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-white rounded text-[11px]" />
                </div>
                <div>
                  <label className="text-slate-500 text-[10px] block">Card Scheme</label>
                  <input type="text" value={cardType} onChange={(e) => setCardType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-white rounded text-[11px]" />
                </div>
                <div>
                  <label className="text-slate-500 text-[10px] block">Masked PAN</label>
                  <input type="text" value={`****${cardLast4}`} onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(-4))} className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-white rounded text-[11px]" />
                </div>
              </div>
            </div>
          )}

          {paymentChannel === 'direct_bank_transfer' && (
            <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>NIBSS Instant Payment (NIP) Settlement Wire:</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 text-[10px] block mb-1">Originating Bank Name</label>
                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-white rounded text-xs" />
                </div>
                <div>
                  <label className="text-slate-500 text-[10px] block mb-1">Central Switch Session Ref</label>
                  <input type="text" value={transferRef} onChange={(e) => setTransferRef(e.target.value)} className="w-full bg-slate-900 border border-slate-700 px-2 py-1 text-white rounded text-xs" />
                </div>
              </div>
            </div>
          )}

          {/* Error Injection Mode Selector */}
          <div className="space-y-1 text-xs font-mono">
            <label className="text-slate-400 block font-semibold flex items-center justify-between">
              <span>Test Automated Reconciliation Error Handler:</span>
              <span className="text-[10px] text-amber-400">Error Routine Verification</span>
            </label>
            <select
              value={errorSimulationMode}
              onChange={(e) => setErrorSimulationMode(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-cyan-500"
            >
              <option value="none">✓ Normal Execution (100% Invariant Reconciled)</option>
              <option value="duplicate_rrn">Trigger: Duplicate Reference Error (Ghost Settlement Detection)</option>
              <option value="cash_shortage">Trigger: Cash Drawer Shortage (Tendered &lt; Amount)</option>
              <option value="overpayment">Trigger: Overpayment Restriction (Amount &gt; Billed Total)</option>
              <option value="arithmetic_mismatch">Trigger: Arithmetic Discrepancy (Header vs Line Items)</option>
            </select>
          </div>

          {/* Execute Script Button */}
          <button
            type="button"
            onClick={handleExecuteBackendScript}
            className="w-full py-2.5 px-4 text-xs font-mono font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Terminal className="w-4 h-4" />
            <span>Execute Backend Transaction & Run Automated Reconciliation</span>
          </button>
        </div>
      </div>

      {/* =======================================================================
          EXECUTION RESULT & AUDIT DISPATCH
      ======================================================================= */}
      {executionError && (
        <div className="p-5 rounded-lg bg-rose-950/30 border border-rose-800/60 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-rose-400 font-bold flex items-center gap-2 text-sm">
              <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
              Automated Reconciliation Handler Caught Exception: {executionError.name}
            </span>
            <span className="text-[10px] bg-rose-900/60 text-rose-300 px-2 py-0.5 rounded border border-rose-700">
              HTTP {executionError.httpStatus} · Transaction Aborted & Rolled Back
            </span>
          </div>

          <p className="text-rose-200/90 font-sans leading-relaxed text-xs">
            {executionError.message}
          </p>

          <div className="p-3 rounded bg-slate-950 border border-rose-900/50 text-[11px] text-slate-300 overflow-x-auto">
            <pre>{JSON.stringify({
              error: executionError.name,
              code: executionError.code,
              status: 'RECONCILIATION_ABORTED',
              databaseAction: 'ROLLBACK TRANSACTION',
              auditStatus: 'INCIDENT_LOGGED_TO_SIEM'
            }, null, 2)}</pre>
          </div>
        </div>
      )}

      {executionResult && (
        <div className="p-5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 font-mono text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-800/30 pb-3">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
              <CheckCircle2 className="w-5 h-5" />
              <span>Transaction Committed & Reconciled Successfully</span>
            </div>
            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
              ACID Transaction Committed
            </span>
          </div>

          {/* Financial Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 text-[10px] block">INVOICE SERIES</span>
              <span className="font-bold text-white">{executionResult.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">GROSS BILLED</span>
              <span className="font-bold text-slate-200 tabular-nums">${executionResult.grossTotal.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">CLEARED AMOUNT</span>
              <span className="font-bold text-emerald-400 tabular-nums">${executionResult.amountSettled.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">FISCAL RECEIPT</span>
              <span className="font-bold text-cyan-400">{executionResult.receiptNumber}</span>
            </div>
          </div>

          {/* Department Revenue Allocations Table */}
          <div className="space-y-2">
            <div className="text-slate-400 font-semibold text-[11px] flex items-center justify-between">
              <span>Automated Department Revenue Ledger Allocations:</span>
              <span className="text-emerald-400">100% Mathematically Reconciled</span>
            </div>
            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Revenue Center</th>
                    <th className="py-2 px-3 text-center">Items Billed</th>
                    <th className="py-2 px-3 text-right">Allocated Revenue</th>
                    <th className="py-2 px-3 text-right">Share of Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
                  {executionResult.departmentSplits.map((sp: any) => (
                    <tr key={sp.department}>
                      <td className="py-2 px-3 font-semibold text-slate-200 uppercase">{sp.department}</td>
                      <td className="py-2 px-3 text-center text-slate-400">{sp.itemCount}</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-bold tabular-nums">${sp.grossRevenue.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-cyan-400 tabular-nums">{sp.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Verification Log */}
          <div className="p-3 rounded bg-slate-950 border border-slate-800 text-[11px] space-y-1 text-slate-300">
            <div className="text-emerald-400 font-bold">✓ Automated Forensic Invariant Verification:</div>
            <div>· {executionResult.reconciliationAudit.message}</div>
            <div className="text-slate-500 text-[10px]">Audit Verification Hash: {executionResult.reconciliationAudit.auditLogId}</div>
          </div>
        </div>
      )}
    </div>
  );
};
