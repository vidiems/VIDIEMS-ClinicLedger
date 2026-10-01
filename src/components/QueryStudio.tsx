import React, { useState } from 'react';
import { BUILT_IN_QUERIES } from '../data/builtInQueries';
import { BuiltInQuery } from '../types/schema';
import { Play, Copy, Check, Terminal, Database, Sparkles, Layers } from 'lucide-react';

export const QueryStudio: React.FC = () => {
  const [selectedQueryId, setSelectedQueryId] = useState<string>(BUILT_IN_QUERIES[0].id);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [executionOutput, setExecutionOutput] = useState<{
    columns: string[];
    rows: any[][];
    executionTimeMs: number;
    rowCount: number;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const activeQuery = BUILT_IN_QUERIES.find(q => q.id === selectedQueryId) || BUILT_IN_QUERIES[0];

  const handleCopySql = () => {
    navigator.clipboard.writeText(activeQuery.sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleExecuteQuery = () => {
    setIsExecuting(true);
    setTimeout(() => {
      // Generate simulated query result based on activeQuery.id
      let resultCols: string[] = [];
      let resultRows: any[][] = [];

      if (activeQuery.id === 'query_multi_channel_recon') {
        resultCols = ['payment_channel', 'channel_status', 'total_transactions', 'total_amount_collected', 'active_cashiers', 'total_cash_tendered', 'total_change_given', 'pos_card_swipes', 'gateway_webhooks_processed'];
        resultRows = [
          ['gateway_transfer', 'settled', 1, '$300.00', 1, '-', '-', 0, 1],
          ['pos_terminal', 'settled', 1, '$50.00', 1, '-', '-', 1, 0],
          ['cash', 'settled', 1, '$45.00', 1, '$50.00', '$5.00', 0, 0]
        ];
      } else if (activeQuery.id === 'query_hmo_pipeline_aging') {
        resultCols = ['provider_name', 'claim_status', 'claim_count', 'total_claimed', 'total_approved', 'total_settled_cash', 'avg_turnaround_days', 'contractual_sla_days'];
        resultRows = [
          ['AXA Health & Corporate Assurance', 'approved', 1, '$400.00', '$400.00', '$0.00', 0.8, 30],
          ['Reliance Care HMO', 'under_review', 1, '$180.00', '$0.00', '$0.00', 0.2, 21]
        ];
      } else if (activeQuery.id === 'query_patient_copay_liability') {
        resultCols = ['mrn', 'patient_name', 'invoice_number', 'total_amount', 'patient_copay_due', 'insurer_liability', 'amount_paid', 'balance_due', 'payment_status', 'insurance_payer', 'aging_category'];
        resultRows = [
          ['MRN-2026-00412', 'Sarah Jenkins', 'INV-2026-10901', '$450.00', '$50.00', '$400.00', '$50.00', '$400.00', 'partially_paid', 'AXA Health & Corporate Assurance', 'Current'],
          ['MRN-2026-00413', 'Ibrahim Kallon', 'INV-2026-10902', '$180.00', '$0.00', '$180.00', '$0.00', '$180.00', 'unpaid', 'Reliance Care HMO', 'Current'],
          ['MRN-2026-00414', 'Clara Moreau', 'INV-2026-10903', '$300.00', '$300.00', '$0.00', '$300.00', '$0.00', 'fully_paid', 'Self-Pay / Private', 'Settled']
        ];
      } else if (activeQuery.id === 'query_doctor_encounter_revenue') {
        resultCols = ['physician_name', 'department', 'total_encounters', 'invoices_generated', 'gross_clinical_revenue', 'total_collections_realized'];
        resultRows = [
          ['Dr. Adebayo Okonkwo', 'Internal Medicine & Cardiology', 2, 2, '$630.00', '$50.00'],
          ['Dr. Elena Vargas', 'Pediatrics & Neonatology', 1, 1, '$300.00', '$300.00']
        ];
      } else {
        // audit check
        resultCols = ['invoice_id', 'invoice_number', 'header_total', 'line_items_sum', 'header_amount_paid', 'settled_payments_sum', 'audit_status'];
        resultRows = [
          ['55555555...1111', 'INV-2026-10901', '$450.00', '$450.00', '$50.00', '$50.00', 'VERIFIED: 100% Invariant Compliant'],
          ['55555555...2222', 'INV-2026-10902', '$180.00', '$180.00', '$0.00', '$0.00', 'VERIFIED: 100% Invariant Compliant'],
          ['55555555...3333', 'INV-2026-10903', '$300.00', '$300.00', '$300.00', '$300.00', 'VERIFIED: 100% Invariant Compliant']
        ];
      }

      setExecutionOutput({
        columns: resultCols,
        rows: resultRows,
        executionTimeMs: Math.floor(4 + Math.random() * 8),
        rowCount: resultRows.length
      });
      setIsExecuting(false);
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
          <span>Relational Query Engineering</span>
          <span>·</span>
          <span>PostgreSQL Analytical Studio</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">
          SQL Query Studio & Ledger Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Production-grade analytical queries designed for high-concurrency reporting, daily cashier reconciliation, HMO claims aging, and automated financial invariant auditing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Query List */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-slate-400 px-1 font-semibold uppercase tracking-wider">
            Architect Curated Queries
          </div>
          {BUILT_IN_QUERIES.map((q) => {
            const isSelected = q.id === selectedQueryId;
            return (
              <button
                key={q.id}
                onClick={() => {
                  setSelectedQueryId(q.id);
                  setExecutionOutput(null);
                }}
                className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/20'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-cyan-400">{q.category}</span>
                  <span className="text-slate-500">{q.tablesInvolved.length} tables</span>
                </div>
                <div className="text-xs font-semibold text-slate-100 leading-snug">
                  {q.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {q.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: SQL Editor & Output */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xs">
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  {activeQuery.title}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Tables: <span className="font-mono text-cyan-400">{activeQuery.tablesInvolved.join(', ')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="px-2.5 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
                </button>

                <button
                  onClick={handleExecuteQuery}
                  disabled={isExecuting}
                  className="px-3.5 py-1.5 text-xs font-bold font-mono text-white bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecuting ? 'Running...' : 'Execute'}</span>
                </button>
              </div>
            </div>

            {/* SQL Content */}
            <div className="p-4 bg-slate-950 font-mono text-xs text-cyan-200 overflow-x-auto leading-relaxed border-b border-slate-800">
              <pre>{activeQuery.sql}</pre>
            </div>

            {/* Explanation Note */}
            <div className="p-3 bg-slate-900/60 text-xs text-slate-300 border-b border-slate-800">
              <span className="font-mono font-semibold text-slate-400">Architect Rationale: </span>
              {activeQuery.explanation}
            </div>

            {/* Execution Result Area */}
            {executionOutput && (
              <div className="p-4 bg-slate-950/90 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Query Completed: <strong className="text-white">{executionOutput.rowCount} rows</strong></span>
                  </div>
                  <span>Execution Latency: <strong className="text-cyan-400">{executionOutput.executionTimeMs} ms</strong></span>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                      <tr>
                        {executionOutput.columns.map((col) => (
                          <th key={col} className="px-3 py-2 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {executionOutput.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-2 whitespace-nowrap text-slate-200 tabular-nums">
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
