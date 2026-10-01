import React, { useState } from 'react';
import { ClaimRecord } from '../types/schema';
import { 
  INITIAL_INVOICES, 
  INITIAL_PAYMENTS, 
  INITIAL_HMO_CLAIMS, 
  INITIAL_CLAIM_HISTORY, 
  INITIAL_PATIENTS,
  INITIAL_HMO_PROVIDERS 
} from '../data/seedData';
import { 
  CreditCard, 
  Banknote, 
  Globe, 
  Building, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Receipt, 
  RefreshCw 
} from 'lucide-react';

export const InteractiveLedgerSimulator: React.FC = () => {
  // Live in-memory state
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);
  const [claims, setClaims] = useState<ClaimRecord[]>(INITIAL_HMO_CLAIMS);
  const [claimHistory, setClaimHistory] = useState(INITIAL_CLAIM_HISTORY);

  // Payment form state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0].invoice_id);
  const [paymentChannel, setPaymentChannel] = useState<'cash' | 'pos_terminal' | 'gateway_transfer'>('pos_terminal');
  const [paymentAmount, setPaymentAmount] = useState<string>('50.00');
  
  // Channel-specific form state
  const [cashTendered, setCashTendered] = useState<string>('60.00');
  const [posTerminalId, setPosTerminalId] = useState('POS-TID-8841-B');
  const [posCardType, setPosCardType] = useState('Mastercard');
  const [cardLastFour, setCardLastFour] = useState('5190');
  const [gatewayProvider, setGatewayProvider] = useState('Stripe Direct');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // HMO claim transition state
  const [selectedClaimId, setSelectedClaimId] = useState(claims[0].claim_id);
  const [targetClaimStatus, setTargetClaimStatus] = useState<string>('settled_paid');
  const [transitionNotes, setTransitionNotes] = useState<string>('Weekly electronic funds batch settlement processed by insurer.');
  const [claimSuccessMsg, setClaimSuccessMsg] = useState<string | null>(null);

  const activeInvoice = invoices.find(inv => inv.invoice_id === selectedInvoiceId) || invoices[0];
  const activePatient = INITIAL_PATIENTS.find(p => p.patient_id === activeInvoice.patient_id);
  const activeClaim = claims.find(c => c.claim_id === selectedClaimId) || claims[0];
  const activeClaimProvider = INITIAL_HMO_PROVIDERS.find(p => p.provider_id === activeClaim.hmo_provider_id);
  const claimHistoryItems = claimHistory.filter(h => h.claim_id === activeClaim.claim_id);

  // Handle Payment Submission
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    if (amountNum > activeInvoice.balance_due) {
      alert(`Amount cannot exceed the current invoice balance due ($${activeInvoice.balance_due.toFixed(2)})`);
      return;
    }

    const newPaymentId = `pay-${Date.now().toString(36)}`;
    const newReceiptNum = `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const timestamp = new Date().toISOString();

    let newPaymentObj: any = {
      payment_id: newPaymentId,
      receipt_number: newReceiptNum,
      invoice_id: activeInvoice.invoice_id,
      patient_id: activeInvoice.patient_id,
      cashier_staff_id: '11111111-1111-4111-8111-333333333333',
      payment_channel: paymentChannel,
      amount: amountNum,
      currency: 'USD',
      payment_timestamp: timestamp,
      channel_status: 'settled',
      reconciliation_status: 'reconciled',
      remarks: `Simulated ${paymentChannel} payment applied via VIDIEMS subledger console.`
    };

    if (paymentChannel === 'cash') {
      const tendered = parseFloat(cashTendered) || amountNum;
      newPaymentObj.cash_drawer_session_id = 'DRAWER-SHIFT-01';
      newPaymentObj.cash_tendered = tendered;
      newPaymentObj.change_returned = Math.max(0, tendered - amountNum);
    } else if (paymentChannel === 'pos_terminal') {
      newPaymentObj.pos_terminal_id = posTerminalId;
      newPaymentObj.pos_rrn = `RRN-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      newPaymentObj.pos_auth_code = `AUTH-${Math.floor(10000 + Math.random() * 90000)}`;
      newPaymentObj.card_last_four = cardLastFour;
      newPaymentObj.card_type = posCardType;
    } else if (paymentChannel === 'gateway_transfer') {
      newPaymentObj.gateway_provider = gatewayProvider;
      newPaymentObj.gateway_transaction_id = `ch_${Math.random().toString(36).substring(2, 14)}`;
      newPaymentObj.gateway_session_id = `cs_${Math.random().toString(36).substring(2, 14)}`;
      newPaymentObj.gateway_webhook_verified = true;
    }

    // Trigger simulation: Update payments and update invoice
    const updatedPayments = [newPaymentObj, ...payments];
    setPayments(updatedPayments);

    // Recalculate invoice totals
    const newAmountPaid = activeInvoice.amount_paid + amountNum;
    const newBalanceDue = Math.max(0, activeInvoice.total_amount - newAmountPaid);
    const newStatus = newBalanceDue === 0 ? 'fully_paid' : 'partially_paid';

    const updatedInvoices = invoices.map(inv => {
      if (inv.invoice_id === activeInvoice.invoice_id) {
        return {
          ...inv,
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,
          payment_status: newStatus
        };
      }
      return inv;
    });

    setInvoices(updatedInvoices);
    setPaymentSuccessMsg(`Success! Payment logged with Receipt ${newReceiptNum}. Trigger fn_update_invoice_payment_balance() synchronized invoice balance.`);
    setTimeout(() => setPaymentSuccessMsg(null), 5000);
  };

  // Handle HMO Claim Transition
  const handleTransitionClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetClaimStatus === activeClaim.claim_status) return;

    const previousStatus = activeClaim.claim_status;
    const timestamp = new Date().toISOString();

    const updatedClaims = claims.map(c => {
      if (c.claim_id === activeClaim.claim_id) {
        const isSettled = targetClaimStatus === 'settled_paid';
        return {
          ...c,
          claim_status: targetClaimStatus as any,
          adjudication_date: c.adjudication_date || timestamp,
          settlement_date: isSettled ? timestamp : c.settlement_date,
          amount_settled: isSettled ? c.approved_amount : c.amount_settled,
          updated_at: timestamp
        };
      }
      return c;
    });

    const newHistoryEntry = {
      history_id: `hist-${Date.now().toString(36)}`,
      claim_id: activeClaim.claim_id,
      previous_status: previousStatus,
      new_status: targetClaimStatus,
      changed_by_staff_id: '11111111-1111-4111-8111-444444444444',
      transition_notes: transitionNotes,
      transition_timestamp: timestamp
    };

    setClaims(updatedClaims);
    setClaimHistory([newHistoryEntry, ...claimHistory]);
    setClaimSuccessMsg(`Claim ${activeClaim.claim_reference_number} advanced to "${targetClaimStatus}". Immutable audit log recorded.`);
    setTimeout(() => setClaimSuccessMsg(null), 5000);
  };

  const handleResetData = () => {
    setInvoices(INITIAL_INVOICES);
    setPayments(INITIAL_PAYMENTS);
    setClaims(INITIAL_HMO_CLAIMS);
    setClaimHistory(INITIAL_CLAIM_HISTORY);
    setPaymentSuccessMsg(null);
    setClaimSuccessMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* Simulator Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>Relational Engine Simulator</span>
              <span>·</span>
              <span>ACID Invariant & Trigger Testing</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Multi-Channel Payments & HMO Claims Live Workbench
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Test database behavior in real time: post multi-channel payments to test the automated PostgreSQL balance trigger, and transition HMO claims through the lifecycle state machine.
            </p>
          </div>

          <button
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo State</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* =====================================================================
            MODULE 1: MULTI-CHANNEL PAYMENT RECORDER
        ===================================================================== */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  1. Multi-Channel Payment Recorder
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulates cashier terminal settlement and trigger <code className="text-cyan-300">trg_payments_balance_sync</code>.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              Subledger Engine
            </span>
          </div>

          {paymentSuccessMsg && (
            <div className="p-3 rounded bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{paymentSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleProcessPayment} className="space-y-4">
            {/* Select Target Invoice */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Select Outstanding Patient Invoice:
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => {
                  setSelectedInvoiceId(e.target.value);
                  const inv = invoices.find(i => i.invoice_id === e.target.value);
                  if (inv) setPaymentAmount(inv.balance_due.toFixed(2));
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-500"
              >
                {invoices.map((inv) => (
                  <option key={inv.invoice_id} value={inv.invoice_id}>
                    {inv.invoice_number} — Total: ${inv.total_amount.toFixed(2)} | Balance Due: ${inv.balance_due.toFixed(2)} ({inv.payment_status})
                  </option>
                ))}
              </select>
            </div>

            {/* Active Invoice Snapshot */}
            <div className="p-3 rounded bg-slate-950 border border-slate-800/80 text-xs font-mono grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px]">PATIENT</span>
                <span className="font-bold text-white truncate block">{activePatient?.first_name} {activePatient?.last_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">TOTAL BILLED</span>
                <span className="tabular-nums font-bold text-slate-200">${activeInvoice.total_amount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">AMOUNT CLEARED</span>
                <span className="tabular-nums font-bold text-emerald-400">${activeInvoice.amount_paid.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">BALANCE DUE</span>
                <span className="tabular-nums font-bold text-amber-400">${activeInvoice.balance_due.toFixed(2)}</span>
              </div>
            </div>

            {/* Channel Selection */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                Payment Channel (Multi-Channel Routing):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: 'Physical Cash', icon: Banknote },
                  { id: 'pos_terminal', label: 'POS Terminal', icon: CreditCard },
                  { id: 'gateway_transfer', label: 'Online Gateway', icon: Globe }
                ].map((ch) => {
                  const Icon = ch.icon;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setPaymentChannel(ch.id as any)}
                      className={`p-2.5 rounded border text-xs font-mono flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        paymentChannel === ch.id
                          ? 'bg-cyan-950/40 border-cyan-500/80 text-cyan-300'
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

            {/* Dynamic Channel Audit Fields */}
            {paymentChannel === 'cash' && (
              <div className="p-3 rounded bg-slate-950/80 border border-slate-800 space-y-3 text-xs font-mono">
                <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cash Drawer Session: DRAWER-SHIFT-01</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Cash Tendered ($):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Change Returned ($):</label>
                    <div className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-bold tabular-nums">
                      ${Math.max(0, (parseFloat(cashTendered) || 0) - (parseFloat(paymentAmount) || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentChannel === 'pos_terminal' && (
              <div className="p-3 rounded bg-slate-950/80 border border-slate-800 space-y-3 text-xs font-mono">
                <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                  <span>EMV POS Terminal Audit Parameters</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1">Terminal ID</label>
                    <input
                      type="text"
                      value={posTerminalId}
                      onChange={(e) => setPosTerminalId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1">Card Scheme</label>
                    <input
                      type="text"
                      value={posCardType}
                      onChange={(e) => setPosCardType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1">Masked PAN (Last 4)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={cardLastFour}
                      onChange={(e) => setCardLastFour(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentChannel === 'gateway_transfer' && (
              <div className="p-3 rounded bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Online Gateway Webhook Configuration</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Gateway Provider</label>
                    <select
                      value={gatewayProvider}
                      onChange={(e) => setGatewayProvider(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs"
                    >
                      <option value="Stripe Direct">Stripe Checkout</option>
                      <option value="Paystack Collections">Paystack Nigeria</option>
                      <option value="Flutterwave API">Flutterwave Global</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Webhook Signature</label>
                    <div className="text-[11px] text-emerald-400 pt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified HMAC-SHA256</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Amount Input */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Settlement Amount ($):
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={activeInvoice.balance_due}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm font-mono text-cyan-300 font-bold focus:outline-hidden focus:border-cyan-500 tabular-nums"
                required
              />
            </div>

            <button
              type="submit"
              disabled={activeInvoice.balance_due === 0}
              className={`w-full py-2.5 px-4 rounded text-xs font-bold font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                activeInvoice.balance_due === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md'
              }`}
            >
              <span>Commit Payment Transaction & Sync Invoice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Recent Payments Stream */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>Recent Payments Subledger Logs ({payments.length})</span>
              <span className="text-[10px] text-emerald-400">100% Invariant Reconciled</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {payments.slice(0, 4).map((p) => (
                <div key={p.payment_id} className="p-2 rounded bg-slate-950 border border-slate-800/60 text-xs font-mono flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{p.receipt_number}</span>
                    <span className="text-slate-500 mx-1.5">·</span>
                    <span className="text-cyan-400">{p.payment_channel}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold tabular-nums">+${p.amount.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 block">{new Date(p.payment_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* =====================================================================
            MODULE 2: HMO CLAIMS LIFECYCLE STATE MACHINE
        ===================================================================== */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  2. HMO Claim Lifecycle State Machine
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulates claim status progression from submitted to paid and trigger <code className="text-emerald-300">trg_hmo_claims_state_log</code>.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              State Machine FSM
            </span>
          </div>

          {claimSuccessMsg && (
            <div className="p-3 rounded bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{claimSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleTransitionClaim} className="space-y-4">
            {/* Select Claim */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Select Active Insurance Claim:
              </label>
              <select
                value={selectedClaimId}
                onChange={(e) => setSelectedClaimId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-emerald-500"
              >
                {claims.map((cl) => (
                  <option key={cl.claim_id} value={cl.claim_id}>
                    {cl.claim_reference_number} — Claimed: ${cl.claimed_amount.toFixed(2)} | Current: {cl.claim_status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Claim Snapshot */}
            <div className="p-3 rounded bg-slate-950 border border-slate-800/80 text-xs font-mono grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px]">PAYER / HMO</span>
                <span className="font-bold text-white truncate block">{activeClaimProvider?.provider_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">CLAIMED AMOUNT</span>
                <span className="tabular-nums font-bold text-slate-200">${activeClaim.claimed_amount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">APPROVED AMOUNT</span>
                <span className="tabular-nums font-bold text-cyan-400">${activeClaim.approved_amount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">CURRENT STATUS</span>
                <span className="font-bold text-emerald-400 uppercase">{activeClaim.claim_status}</span>
              </div>
            </div>

            {/* State Transition Target */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                Transition Claim Into State:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'under_review', label: 'Under Review' },
                  { id: 'query_issued', label: 'Query Issued' },
                  { id: 'approved', label: 'Approved' },
                  { id: 'settled_paid', label: 'Settled / Paid' }
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setTargetClaimStatus(st.id)}
                    className={`p-2 rounded border text-xs font-mono text-center transition-all cursor-pointer ${
                      targetClaimStatus === st.id
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transition Notes */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Adjudicator Remarks / Transition Audit Note:
              </label>
              <textarea
                rows={2}
                value={transitionNotes}
                onChange={(e) => setTransitionNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded text-xs font-bold font-mono bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span>Execute State Transition & Append Audit History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Immutable Audit Log History */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>HMO Claim State Audit Trail ({claimHistoryItems.length} events)</span>
              <span className="text-[10px] text-slate-500">Immutable 4NF Log</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {claimHistoryItems.map((h, i) => (
                <div key={h.history_id} className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-400">{h.previous_status || 'init'}</span>
                      <span className="text-slate-600">&rarr;</span>
                      <span className="text-emerald-400 font-bold uppercase">{h.new_status}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(h.transition_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-300 font-sans text-[11px] leading-snug">
                    {h.transition_notes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
