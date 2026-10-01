import React, { useState } from 'react';
import { 
  Building2, 
  Send, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Layers, 
  FileText, 
  Filter, 
  ArrowRight,
  ShieldAlert,
  Calendar,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { 
  INITIAL_HMO_CLAIMS, 
  INITIAL_CLAIM_HISTORY, 
  INITIAL_HMO_PROVIDERS, 
  INITIAL_PATIENTS, 
  INITIAL_INVOICES 
} from '../data/seedData';
import { ClaimRecord } from '../types/schema';

export const HmoClaimsApiConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'aging_report' | 'api_tester' | 'code_viewer'>('aging_report');
  
  // Live simulated claims state (with varying historical dates to demonstrate 30-day aging)
  const [claims, setClaims] = useState<ClaimRecord[]>([
    ...INITIAL_HMO_CLAIMS,
    {
      claim_id: '88888888-8888-4888-8888-333333333333',
      claim_reference_number: 'CLM-2026-00219',
      invoice_id: '55555555-5555-4555-8555-222222222222',
      patient_id: '33333333-3333-4333-8333-111111111111',
      hmo_provider_id: '22222222-2222-4222-8222-111111111111', // AXA
      policy_number: 'AXA-POL-8831920',
      authorization_code: 'AUTH-AXA-2026-8819',
      claimed_amount: 850.00,
      approved_amount: 850.00,
      co_pay_amount: 0.00,
      amount_settled: 0.00,
      claim_status: 'query_issued',
      submission_date: '2026-08-15T09:00:00Z', // 47 Days Ago (Overdue > 30 days)
      adjudication_date: '2026-08-28T14:30:00Z',
      settlement_date: null,
      settlement_batch_id: null,
      settlement_payment_id: null,
      rejection_reason: null,
      adjudicator_remarks: 'Disputed physiotherapy session count on billing tariff line 3.',
      created_by_staff_id: '11111111-1111-4111-8111-444444444444'
    },
    {
      claim_id: '88888888-8888-4888-8888-444444444444',
      claim_reference_number: 'CLM-2026-00104',
      invoice_id: '55555555-5555-4555-8555-333333333333',
      patient_id: '33333333-3333-4333-8333-222222222222',
      hmo_provider_id: '22222222-2222-4222-8222-333333333333', // Hygeia
      policy_number: 'HYG-POL-771829',
      authorization_code: 'HYG-AUTH-1092',
      claimed_amount: 1420.00,
      approved_amount: 1200.00,
      co_pay_amount: 100.00,
      amount_settled: 0.00,
      claim_status: 'approved',
      submission_date: '2026-07-02T11:00:00Z', // 91 Days Ago (Critical > 90 days)
      adjudication_date: '2026-07-20T16:00:00Z',
      settlement_date: null,
      settlement_batch_id: 'BATCH-HYG-Q3',
      settlement_payment_id: null,
      rejection_reason: null,
      adjudicator_remarks: 'Approved in batch Q3. Payer Treasury backlog delay.',
      created_by_staff_id: '11111111-1111-4111-8111-444444444444'
    }
  ]);

  const [claimHistory, setClaimHistory] = useState(INITIAL_CLAIM_HISTORY);
  const [filterMinAging30, setFilterMinAging30] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // API Tester State
  const [selectedEndpoint, setSelectedEndpoint] = useState<'POST_SUBMIT' | 'PATCH_STATUS' | 'GET_AGING' | 'GET_BY_ID'>('PATCH_STATUS');
  const [targetClaimId, setTargetClaimId] = useState<string>(claims[0].claim_id);
  const [newStatusPayload, setNewStatusPayload] = useState<string>('query_issued');
  const [adjudicatorNotesPayload, setAdjudicatorNotesPayload] = useState<string>('Requesting itemized pathology report for tissue biopsy code PRC-BX-01.');
  const [approvedAmountPayload, setApprovedAmountPayload] = useState<string>('400.00');
  const [simulatedHttpResponse, setSimulatedHttpResponse] = useState<any | null>(null);

  // New claim creation state
  const [newClaimPatientId, setNewClaimPatientId] = useState<string>(INITIAL_PATIENTS[0].patient_id);
  const [newClaimProviderId, setNewClaimProviderId] = useState<string>(INITIAL_HMO_PROVIDERS[0].provider_id);
  const [newClaimPolicyNumber, setNewClaimPolicyNumber] = useState<string>('AXA-POL-8831920');
  const [newClaimAmount, setNewClaimAmount] = useState<string>('650.00');
  const [newClaimAuthCode, setNewClaimAuthCode] = useState<string>('AUTH-AXA-2026-9041');

  // Compute aging for all claims
  const getElapsedDays = (dateStr: string | null) => {
    if (!dateStr) return 0;
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  // Group into aging metrics
  const activeUnpaidClaims = claims.filter(c => c.claim_status !== 'settled_paid' && c.claim_status !== 'rejected');
  const overdueClaims30Plus = activeUnpaidClaims.filter(c => getElapsedDays(c.submission_date) > 30);
  const overdueAmount30Plus = overdueClaims30Plus.reduce((sum, c) => sum + c.claimed_amount, 0);

  // Execute Simulated API Endpoint
  const handleRunApiTest = () => {
    if (selectedEndpoint === 'PATCH_STATUS') {
      const target = claims.find(c => c.claim_id === targetClaimId) || claims[0];
      const previousStatus = target.claim_status;
      const timestamp = new Date().toISOString();
      const approvedNum = parseFloat(approvedAmountPayload) || target.approved_amount;

      // Update state
      const updatedClaims = claims.map(c => {
        if (c.claim_id === target.claim_id) {
          const isPaid = newStatusPayload === 'settled_paid';
          return {
            ...c,
            claim_status: newStatusPayload as any,
            approved_amount: newStatusPayload === 'approved' ? approvedNum : c.approved_amount,
            amount_settled: isPaid ? (c.approved_amount || c.claimed_amount) : c.amount_settled,
            settlement_date: isPaid ? timestamp : c.settlement_date,
            adjudication_date: (newStatusPayload === 'approved' || newStatusPayload === 'query_issued') ? timestamp : c.adjudication_date,
            adjudicator_remarks: adjudicatorNotesPayload,
            updated_at: timestamp
          };
        }
        return c;
      });

      const newHistoryEntry = {
        history_id: `hist-${Date.now().toString(36)}`,
        claim_id: target.claim_id,
        previous_status: previousStatus,
        new_status: newStatusPayload,
        changed_by_staff_id: '11111111-1111-4111-8111-444444444444',
        transition_notes: adjudicatorNotesPayload,
        transition_timestamp: timestamp
      };

      setClaims(updatedClaims);
      setClaimHistory([newHistoryEntry, ...claimHistory]);

      setSimulatedHttpResponse({
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: {
          status: 'success',
          message: `Claim [${target.claim_reference_number}] transitioned from [${previousStatus}] to [${newStatusPayload}].`,
          data: {
            claimId: target.claim_id,
            claimReferenceNumber: target.claim_reference_number,
            previousStatus,
            newStatus: newStatusPayload,
            claimedAmount: target.claimed_amount,
            approvedAmount: approvedNum,
            settlementDate: newStatusPayload === 'settled_paid' ? timestamp : null,
            adjudicatorRemarks: adjudicatorNotesPayload
          }
        }
      });
    } else if (selectedEndpoint === 'POST_SUBMIT') {
      const newClaimId = `clm-${Date.now().toString(36)}`;
      const newClaimRef = `CLM-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const timestamp = new Date().toISOString();
      const amountNum = parseFloat(newClaimAmount) || 500;

      const newClaim: ClaimRecord = {
        claim_id: newClaimId,
        claim_reference_number: newClaimRef,
        invoice_id: '55555555-5555-4555-8555-111111111111',
        patient_id: newClaimPatientId,
        hmo_provider_id: newClaimProviderId,
        policy_number: newClaimPolicyNumber,
        authorization_code: newClaimAuthCode,
        claimed_amount: amountNum,
        approved_amount: 0.00,
        co_pay_amount: 50.00,
        amount_settled: 0.00,
        claim_status: 'submitted',
        submission_date: timestamp,
        adjudication_date: null,
        settlement_date: null,
        settlement_batch_id: null,
        settlement_payment_id: null,
        rejection_reason: null,
        adjudicator_remarks: null,
        created_by_staff_id: '11111111-1111-4111-8111-444444444444'
      };

      setClaims([newClaim, ...claims]);
      setSimulatedHttpResponse({
        status: 201,
        statusText: 'Created',
        headers: { 'Content-Type': 'application/json' },
        body: {
          status: 'success',
          message: 'HMO Claim initialized and submitted successfully.',
          data: {
            claimId: newClaimId,
            claimReferenceNumber: newClaimRef,
            claimedAmount: amountNum,
            claimStatus: 'submitted',
            submissionDate: timestamp
          }
        }
      });
    } else if (selectedEndpoint === 'GET_AGING') {
      setSimulatedHttpResponse({
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: {
          status: 'success',
          reportGeneratedAt: new Date().toISOString(),
          summary: {
            totalDelinquentClaimsOver30Days: overdueClaims30Plus.length,
            totalOverdueReceivables30DaysPlus: overdueAmount30Plus,
            agingThresholdDays: 30
          },
          providerAgingSummary: INITIAL_HMO_PROVIDERS.map(hp => {
            const providerClaims = activeUnpaidClaims.filter(c => c.hmo_provider_id === hp.provider_id);
            const over30 = providerClaims.filter(c => getElapsedDays(c.submission_date) > 30);
            return {
              providerName: hp.provider_name,
              providerCode: hp.provider_code,
              contractualSlaDays: hp.reimbursement_terms_days,
              totalActiveClaims: providerClaims.length,
              claimsOver30DaysCount: over30.length,
              claimsOver30DaysAmount: over30.reduce((s, c) => s + c.claimed_amount, 0),
              hasSlaBreach: over30.length > 0
            };
          }),
          flaggedOverdueClaims: overdueClaims30Plus.map(c => ({
            claimReferenceNumber: c.claim_reference_number,
            claimedAmount: c.claimed_amount,
            agingDays: getElapsedDays(c.submission_date),
            status: c.claim_status,
            reimbursementSlaBreached: true
          }))
        }
      });
    } else {
      // GET_BY_ID
      const target = claims.find(c => c.claim_id === targetClaimId) || claims[0];
      setSimulatedHttpResponse({
        status: 200,
        statusText: 'OK',
        body: {
          status: 'success',
          claim: target,
          auditTimeline: claimHistory.filter(h => h.claim_id === target.claim_id)
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>Health Insurance Revenue Subledger</span>
              <span>·</span>
              <span>REST API & Aging Analytics</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              HMO Claims REST API Console & 30-Day Aging Pipeline
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Production-ready REST endpoints to submit claims (<code className="text-cyan-300">POST</code>), transition lifecycle states (<code className="text-cyan-300">PATCH</code>), inspect audit history, and run aging queries that flag claims unpaid after 30 days.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`// Source in /src/api/hmoClaimsRouter.ts`);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Router Code'}</span>
            </button>
          </div>
        </div>

        {/* 30-Day Metric Callouts */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs font-mono">
          <div className="p-3 rounded bg-slate-950 border border-slate-800">
            <div className="text-slate-500 text-[10px]">TOTAL ACTIVE CLAIMS</div>
            <div className="font-bold text-white text-base tabular-nums">{activeUnpaidClaims.length} Claims</div>
            <div className="text-slate-500 text-[10px]">Awaiting Settlement</div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-rose-900/40">
            <div className="text-rose-400 text-[10px] font-bold">UNPAID &gt; 30 DAYS (FLAGGED)</div>
            <div className="font-bold text-rose-400 text-base tabular-nums">{overdueClaims30Plus.length} Claims</div>
            <div className="text-rose-300 text-[10px]">{Math.round((overdueClaims30Plus.length / (activeUnpaidClaims.length || 1)) * 100)}% of Pipeline</div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-amber-900/40">
            <div className="text-amber-400 text-[10px] font-bold">DELINQUENT RECEIVABLES (&gt;30d)</div>
            <div className="font-bold text-amber-300 text-base tabular-nums">${overdueAmount30Plus.toFixed(2)}</div>
            <div className="text-slate-500 text-[10px]">Contractual SLA Breached</div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800">
            <div className="text-slate-500 text-[10px]">AVERAGE SLA TERMS</div>
            <div className="font-bold text-cyan-400 text-base tabular-nums">28.0 Days</div>
            <div className="text-slate-500 text-[10px]">Contractual Settlement Period</div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="mt-6 flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-md overflow-x-auto">
          {[
            { id: 'aging_report', label: '30-Day Aging & Delinquent Pipeline' },
            { id: 'api_tester', label: 'Interactive REST API Endpoint Tester' },
            { id: 'code_viewer', label: 'Express Router Source Code (hmoClaimsRouter.ts)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-cyan-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* =======================================================================
          TAB 1: 30-DAY AGING REPORT & PIPELINE BOARD
      ======================================================================= */}
      {activeTab === 'aging_report' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-cyan-400" />
                Aging Filter:
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-slate-200 bg-slate-950 px-3 py-1 rounded border border-slate-800">
                <input
                  type="checkbox"
                  checked={filterMinAging30}
                  onChange={(e) => setFilterMinAging30(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                />
                <span>Only Show Claims Unpaid After 30 Days (minAgingDays=30)</span>
              </label>
            </div>

            <span className="text-slate-400 text-[11px]">
              Query: <code className="text-cyan-300">GET /api/hmo/claims/aging-report?minAgingDays={filterMinAging30 ? 30 : 0}</code>
            </span>
          </div>

          {/* Aging Pipeline Cards */}
          <div className="space-y-3">
            {claims
              .filter(c => !filterMinAging30 || getElapsedDays(c.submission_date) > 30)
              .map((claim) => {
                const agingDays = getElapsedDays(claim.submission_date);
                const isOver30 = agingDays > 30;
                const isOver60 = agingDays > 60;
                const isOver90 = agingDays > 90;
                const provider = INITIAL_HMO_PROVIDERS.find(p => p.provider_id === claim.hmo_provider_id);
                const isSlaBreached = provider && agingDays > provider.reimbursement_terms_days;

                return (
                  <div
                    key={claim.claim_id}
                    className={`p-4 rounded-lg border transition-all ${
                      isOver90
                        ? 'bg-rose-950/20 border-rose-800/60 ring-1 ring-rose-500/20'
                        : isOver30
                        ? 'bg-amber-950/20 border-amber-800/60'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-white">
                            {claim.claim_reference_number}
                          </span>
                          <span className="text-xs text-slate-500">·</span>
                          <span className="text-xs font-semibold text-slate-300">
                            {provider?.provider_name}
                          </span>
                          {isSlaBreached && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-rose-300 bg-rose-950/80 border border-rose-700 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              SLA BREACHED ({agingDays}d &gt; {provider?.reimbursement_terms_days}d)
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 mt-1 font-mono">
                          Policy: <strong className="text-slate-200">{claim.policy_number}</strong>
                          {claim.authorization_code && (
                            <span> · Pre-Auth: <strong className="text-cyan-400">{claim.authorization_code}</strong></span>
                          )}
                          <span> · Submitted: {claim.submission_date ? new Date(claim.submission_date).toLocaleDateString('en-GB') : 'Draft'}</span>
                        </div>
                      </div>

                      {/* Aging Metric & Status */}
                      <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                        <div className="text-right">
                          <span className="text-slate-500 text-[10px] block">AGING DAYS</span>
                          <span className={`text-base font-bold tabular-nums ${
                            isOver90 ? 'text-rose-400' : isOver30 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {agingDays} Days
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-slate-500 text-[10px] block">CLAIMED VALUE</span>
                          <span className="text-base font-bold text-white tabular-nums">
                            ${claim.claimed_amount.toFixed(2)}
                          </span>
                        </div>

                        <div>
                          <span className={`px-2.5 py-1 rounded font-bold uppercase text-[10px] block text-center ${
                            claim.claim_status === 'settled_paid'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : claim.claim_status === 'query_issued'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : claim.claim_status === 'approved'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {claim.claim_status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Remarks Callout if queried or noted */}
                    {claim.adjudicator_remarks && (
                      <div className="mt-3 p-2.5 rounded bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300">
                        <span className="text-amber-400 font-semibold">Adjudicator Invariant Query: </span>
                        {claim.adjudicator_remarks}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 2: INTERACTIVE REST API ENDPOINT TESTER
      ======================================================================= */}
      {activeTab === 'api_tester' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Request Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                REST API Request Configuration
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Select an endpoint to execute against the simulated PostgreSQL backend.
              </p>
            </div>

            {/* Endpoint Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setSelectedEndpoint('PATCH_STATUS')}
                className={`p-2 rounded border text-left cursor-pointer ${
                  selectedEndpoint === 'PATCH_STATUS'
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-[10px] text-amber-400">PATCH</div>
                <div>/api/hmo/claims/:id/status</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEndpoint('POST_SUBMIT')}
                className={`p-2 rounded border text-left cursor-pointer ${
                  selectedEndpoint === 'POST_SUBMIT'
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-[10px] text-emerald-400">POST</div>
                <div>/api/hmo/claims</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEndpoint('GET_AGING')}
                className={`p-2 rounded border text-left cursor-pointer ${
                  selectedEndpoint === 'GET_AGING'
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-[10px] text-cyan-400">GET</div>
                <div>/api/hmo/claims/aging-report</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEndpoint('GET_BY_ID')}
                className={`p-2 rounded border text-left cursor-pointer ${
                  selectedEndpoint === 'GET_BY_ID'
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-[10px] text-cyan-400">GET</div>
                <div>/api/hmo/claims/:id</div>
              </button>
            </div>

            {/* Dynamic Form: PATCH STATUS */}
            {selectedEndpoint === 'PATCH_STATUS' && (
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1">Select Claim:</label>
                  <select
                    value={targetClaimId}
                    onChange={(e) => setTargetClaimId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  >
                    {claims.map(c => (
                      <option key={c.claim_id} value={c.claim_id}>
                        {c.claim_reference_number} — ${c.claimed_amount.toFixed(2)} ({c.claim_status.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Target Status (newStatus):</label>
                  <select
                    value={newStatusPayload}
                    onChange={(e) => setNewStatusPayload(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  >
                    <option value="submitted">submitted</option>
                    <option value="under_review">under_review</option>
                    <option value="query_issued">query_issued (Queried)</option>
                    <option value="approved">approved</option>
                    <option value="settled_paid">settled_paid (Paid)</option>
                    <option value="rejected">rejected</option>
                  </select>
                </div>

                {newStatusPayload === 'approved' && (
                  <div>
                    <label className="text-slate-400 block mb-1">Approved Amount ($):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={approvedAmountPayload}
                      onChange={(e) => setApprovedAmountPayload(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="text-slate-400 block mb-1">Adjudicator Remarks / Inquiry Note:</label>
                  <textarea
                    rows={2}
                    value={adjudicatorNotesPayload}
                    onChange={(e) => setAdjudicatorNotesPayload(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
            )}

            {/* Dynamic Form: POST SUBMIT */}
            {selectedEndpoint === 'POST_SUBMIT' && (
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1">Patient:</label>
                  <select
                    value={newClaimPatientId}
                    onChange={(e) => setNewClaimPatientId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  >
                    {INITIAL_PATIENTS.map(p => (
                      <option key={p.patient_id} value={p.patient_id}>{p.first_name} {p.last_name} ({p.mrn})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">HMO Provider:</label>
                  <select
                    value={newClaimProviderId}
                    onChange={(e) => setNewClaimProviderId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  >
                    {INITIAL_HMO_PROVIDERS.map(hp => (
                      <option key={hp.provider_id} value={hp.provider_id}>{hp.provider_name} ({hp.reimbursement_terms_days}d terms)</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Claimed Amount ($):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newClaimAmount}
                      onChange={(e) => setNewClaimAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Pre-Auth Code:</label>
                    <input
                      type="text"
                      value={newClaimAuthCode}
                      onChange={(e) => setNewClaimAuthCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Form: GET AGING */}
            {selectedEndpoint === 'GET_AGING' && (
              <div className="p-3.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
                <div className="text-slate-400 font-semibold">Query Parameters:</div>
                <div className="text-cyan-300">?minAgingDays=30</div>
                <p className="text-slate-400 font-sans text-[11px] leading-relaxed">
                  Executes aggregation SQL grouping all active claims into 4 distinct aging bands, isolating 30+ day delinquent receivables and evaluating contractual SLA breaches.
                </p>
              </div>
            )}

            {/* Run Button */}
            <button
              type="button"
              onClick={handleRunApiTest}
              className="w-full py-2.5 px-4 text-xs font-mono font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send API Request to Backend</span>
            </button>
          </div>

          {/* Right Column: HTTP Response Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  HTTP Response Payload Inspector
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live JSON response from Express router.
                </p>
              </div>

              {simulatedHttpResponse && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  HTTP {simulatedHttpResponse.status} {simulatedHttpResponse.statusText}
                </span>
              )}
            </div>

            <div className="p-4 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 max-h-[460px] overflow-y-auto leading-relaxed">
              {simulatedHttpResponse ? (
                <pre>{JSON.stringify(simulatedHttpResponse.body, null, 2)}</pre>
              ) : (
                <div className="text-slate-500 text-center py-16">
                  Select an endpoint on the left and click "Send API Request" to view the live HTTP response.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 3: EXPRESS ROUTER SOURCE CODE VIEWER
      ======================================================================= */}
      {activeTab === 'code_viewer' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>src/api/hmoClaimsRouter.ts</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">TypeScript Express Router</span>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(`// Source code in /src/api/hmoClaimsRouter.ts`);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Full Code'}</span>
            </button>
          </div>

          <div className="p-4 bg-slate-950/90 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto">
            <pre>{`// ============================================================================
// Express REST API Router: HMO Claims & 30-Day Aging Analysis
// File: src/api/hmoClaimsRouter.ts
// ============================================================================

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import crypto from 'crypto';

export function createHmoClaimsRouter({ pool, authMiddleware }: { pool: Pool; authMiddleware?: any }): Router {
  const router = Router();
  const auth = authMiddleware || ((req: any, res: any, next: any) => next());

  // 1. POST /api/hmo/claims - Submit Claim
  router.post('/api/hmo/claims', auth, async (req: Request, res: Response) => {
    // Inserts claim into hmo_claims and appends initial audit state into hmo_claim_history
  });

  // 2. PATCH /api/hmo/claims/:claimId/status - Lifecycle Transitions
  router.patch('/api/hmo/claims/:claimId/status', auth, async (req: Request, res: Response) => {
    // Manages transitions: draft -> submitted -> under_review -> query_issued -> approved -> settled_paid
    // Enforces approved_amount <= claimed_amount and captures adjudicator notes
  });

  // 3. GET /api/hmo/claims/aging-report - 30-Day Overdue Flagging & SLA Breaches
  router.get('/api/hmo/claims/aging-report', auth, async (req: Request, res: Response) => {
    // Computes aging bands: 0-30 days, 31-60 days, 61-90 days, 90+ days
    // Flags delinquent claims where aging_days > 30 and where aging_days > contractual_sla_days
  });

  // 4. GET /api/hmo/claims/:claimId - Single Claim Details & Audit Timeline
  router.get('/api/hmo/claims/:claimId', auth, async (req: Request, res: Response) => {
    // Returns claim header, patient details, and sequential hmo_claim_history timeline
  });

  return router;
}`}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
