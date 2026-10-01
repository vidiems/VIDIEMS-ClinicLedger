import React, { useState } from 'react';
import { SchemaTable } from '../types/schema';
import { 
  X, 
  Key, 
  Link, 
  ShieldCheck, 
  Zap, 
  ListTree, 
  Copy, 
  Check, 
  Table as TableIcon 
} from 'lucide-react';
import { 
  INITIAL_STAFF_USERS, 
  INITIAL_HMO_PROVIDERS, 
  INITIAL_PATIENTS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_INVOICES, 
  INITIAL_INVOICE_ITEMS, 
  INITIAL_PAYMENTS, 
  INITIAL_HMO_CLAIMS, 
  INITIAL_CLAIM_HISTORY 
} from '../data/seedData';

interface TableInspectorModalProps {
  table: SchemaTable | null;
  onClose: () => void;
}

export const TableInspectorModal: React.FC<TableInspectorModalProps> = ({ table, onClose }) => {
  const [activeTab, setActiveTab] = useState<'columns' | 'constraints' | 'indexes' | 'triggers' | 'data'>('columns');
  const [copiedSql, setCopiedSql] = useState(false);

  if (!table) return null;

  // Retrieve seed data for this table
  const getSeedData = () => {
    switch (table.id) {
      case 'staff_users': return INITIAL_STAFF_USERS;
      case 'hmo_providers': return INITIAL_HMO_PROVIDERS;
      case 'patients': return INITIAL_PATIENTS;
      case 'appointments': return INITIAL_APPOINTMENTS;
      case 'billing_invoices': return INITIAL_INVOICES;
      case 'invoice_items': return INITIAL_INVOICE_ITEMS;
      case 'payments': return INITIAL_PAYMENTS;
      case 'hmo_claims': return INITIAL_HMO_CLAIMS;
      case 'hmo_claim_history': return INITIAL_CLAIM_HISTORY;
      default: return [];
    }
  };

  const seedRows = getSeedData();

  const handleCopyTableDdl = () => {
    const lines: string[] = [];
    lines.push(`CREATE TABLE ${table.tableName} (`);
    table.columns.forEach((c, idx) => {
      let colDef = `  ${c.name} ${c.type}`;
      if (c.isPrimaryKey) colDef += ' PRIMARY KEY';
      if (!c.isNullable && !c.isPrimaryKey) colDef += ' NOT NULL';
      if (c.isUnique && !c.isPrimaryKey) colDef += ' UNIQUE';
      if (c.defaultValue) colDef += ` DEFAULT ${c.defaultValue}`;
      if (c.isForeignKey && c.foreignKeyRef) {
        colDef += ` REFERENCES ${c.foreignKeyRef.table}(${c.foreignKeyRef.column})`;
        if (c.foreignKeyRef.onDelete) colDef += ` ON DELETE ${c.foreignKeyRef.onDelete}`;
      }
      if (idx < table.columns.length - 1 || table.constraints.filter(con => con.type === 'CHECK').length > 0) {
        colDef += ',';
      }
      lines.push(colDef);
    });

    table.constraints.filter(con => con.type === 'CHECK').forEach((chk, idx, arr) => {
      lines.push(`  CONSTRAINT ${chk.name} ${chk.definition}${idx < arr.length - 1 ? ',' : ''}`);
    });

    lines.push(');');
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                <TableIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-mono text-white">{table.tableName}</h3>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-mono text-cyan-400">{table.normalizationLevel}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{table.displayName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTableDdl}
                className="px-2.5 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Copy Table SQL DDL"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied' : 'Copy DDL'}</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-300 leading-relaxed">
            {table.description}
          </p>

          {/* Tab navigation */}
          <div className="flex items-center gap-1 mt-5 border-b border-slate-800 -mb-6 pb-2">
            {[
              { id: 'columns', label: `Columns (${table.columns.length})` },
              { id: 'constraints', label: `Constraints (${table.constraints.length})` },
              { id: 'indexes', label: `Indexes (${table.indexes.length})` },
              { id: 'triggers', label: `Triggers (${table.triggers?.length || 0})` },
              { id: 'data', label: `Sample Rows (${seedRows.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'columns' && (
            <div className="space-y-3">
              {table.columns.map((col) => (
                <div 
                  key={col.name}
                  className="p-3 rounded border border-slate-800 bg-slate-950/40 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-sm text-slate-100">{col.name}</span>
                      <span className="font-mono text-xs text-cyan-400/90 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
                        {col.type}
                      </span>
                      {col.isPrimaryKey && (
                        <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                          <Key className="w-3 h-3" /> PK
                        </span>
                      )}
                      {col.isForeignKey && col.foreignKeyRef && (
                        <span className="flex items-center gap-1 text-[11px] font-mono text-indigo-300 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-800/40">
                          <Link className="w-3 h-3" /> FK &rarr; {col.foreignKeyRef.table}.{col.foreignKeyRef.column}
                        </span>
                      )}
                      {col.isUnique && !col.isPrimaryKey && (
                        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                          UNIQUE
                        </span>
                      )}
                    </div>

                    <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
                      {col.isNullable ? 'NULL' : 'NOT NULL'}
                    </div>
                  </div>

                  <p className="mt-1.5 text-xs text-slate-300 leading-normal">
                    {col.description}
                  </p>

                  {col.defaultValue && (
                    <div className="mt-1 text-[11px] font-mono text-slate-400">
                      <span className="text-slate-500">Default: </span>
                      <span className="text-slate-300">{col.defaultValue}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'constraints' && (
            <div className="space-y-3">
              {table.constraints.map((c) => (
                <div key={c.name} className="p-3.5 rounded border border-slate-800 bg-slate-950/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span className="font-mono text-xs font-bold text-white">{c.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {c.type}
                    </span>
                  </div>
                  <pre className="text-xs font-mono text-cyan-300 bg-slate-900 p-2 rounded border border-slate-800/80 overflow-x-auto">
                    {c.definition}
                  </pre>
                  <p className="text-xs text-slate-400">{c.description}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'indexes' && (
            <div className="space-y-3">
              {table.indexes.map((idx) => (
                <div key={idx.name} className="p-3.5 rounded border border-slate-800 bg-slate-950/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListTree className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono text-xs font-bold text-white">{idx.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      {idx.type || 'B-Tree'}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    Columns: [{idx.columns.join(', ')}]
                  </div>
                  {idx.condition && (
                    <div className="text-xs font-mono text-amber-300/90 bg-amber-950/20 px-2 py-1 rounded">
                      WHERE {idx.condition}
                    </div>
                  )}
                  <p className="text-xs text-slate-400">{idx.rationale}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'triggers' && (
            <div className="space-y-3">
              {table.id === 'payments' ? (
                <div className="p-4 rounded border border-slate-800 bg-slate-950/40 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Zap className="w-4 h-4" />
                    <span className="font-mono text-xs font-bold">trg_payments_balance_sync</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    AFTER INSERT OR UPDATE OF amount, channel_status ON payments FOR EACH ROW
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Executes <code className="text-cyan-300">fn_update_invoice_payment_balance()</code>. Automatically calculates total cleared settled funds for the invoice, updates <code className="text-cyan-300">amount_paid</code>, decrements <code className="text-cyan-300">balance_due</code>, and shifts payment status to <code className="text-cyan-300">fully_paid</code> or <code className="text-cyan-300">partially_paid</code> atomically.
                  </p>
                </div>
              ) : table.id === 'hmo_claims' ? (
                <div className="p-4 rounded border border-slate-800 bg-slate-950/40 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Zap className="w-4 h-4" />
                    <span className="font-mono text-xs font-bold">trg_hmo_claims_state_log</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    AFTER UPDATE OF claim_status ON hmo_claims FOR EACH ROW
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Executes <code className="text-cyan-300">fn_log_hmo_claim_transition()</code>. Automatically appends a new state audit entry to <code className="text-cyan-300">hmo_claim_history</code> preserving previous status, new status, adjudicator remarks, and timestamp.
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  No automated triggers bound directly to this entity. Integrity maintained via FOREIGN KEY RESTRICT and CHECK constraints.
                </div>
              )}
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Showing {seedRows.length} simulated ledger rows</span>
                <span className="font-mono text-slate-500">Read-Only View</span>
              </div>
              <div className="overflow-x-auto border border-slate-800 rounded">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                    <tr>
                      {table.columns.slice(0, 5).map((col) => (
                        <th key={col.name} className="px-3 py-2 whitespace-nowrap">{col.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
                    {seedRows.map((row: any, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        {table.columns.slice(0, 5).map((col) => (
                          <td key={col.name} className="px-3 py-2 whitespace-nowrap text-slate-300">
                            {String(row[col.name] ?? '-')}
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
  );
};
