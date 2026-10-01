import React, { useState } from 'react';
import { SchemaTable } from '../types/schema';
import { SCHEMA_TABLES, SCHEMA_RELATIONS } from '../data/schemaDefinition';
import { 
  Search, 
  Key, 
  Link, 
  Layers, 
  Info, 
  CreditCard, 
  FileText, 
  Building2, 
  Sparkles 
} from 'lucide-react';

interface ERDVisualizerProps {
  onSelectTable: (table: SchemaTable) => void;
}

export const ERDVisualizer: React.FC<ERDVisualizerProps> = ({ onSelectTable }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRelation, setSelectedRelation] = useState<string | null>(null);

  // Filter tables
  const filteredTables = SCHEMA_TABLES.filter((t) => {
    const matchesCategory = 
      activeCategory === 'all' || 
      (activeCategory === 'clinical' && (t.id === 'patients' || t.id === 'appointments' || t.id === 'staff_users')) ||
      (activeCategory === 'billing' && (t.id === 'billing_invoices' || t.id === 'invoice_items' || t.id === 'patients')) ||
      (activeCategory === 'payments' && (t.id === 'payments' || t.id === 'billing_invoices' || t.id === 'staff_users')) ||
      (activeCategory === 'hmo' && (t.id === 'hmo_claims' || t.id === 'hmo_claim_history' || t.id === 'hmo_providers' || t.id === 'billing_invoices'));

    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesName = t.tableName.toLowerCase().includes(query) || t.displayName.toLowerCase().includes(query);
    const matchesColumn = t.columns.some((c) => c.name.toLowerCase().includes(query) || c.type.toLowerCase().includes(query));

    return matchesCategory && (matchesName || matchesColumn);
  });

  const totalColumns = SCHEMA_TABLES.reduce((acc, t) => acc + t.columns.length, 0);
  const totalConstraints = SCHEMA_TABLES.reduce((acc, t) => acc + t.constraints.length, 0);
  const totalIndexes = SCHEMA_TABLES.reduce((acc, t) => acc + t.indexes.length, 0);

  return (
    <div className="space-y-6">
      {/* Top Architecture Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>VIDIEMS Enterprise Architecture</span>
              <span>·</span>
              <span>PostgreSQL 15+ Core Schema</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              VIDIEMS ClinicLedger Relational Entity Diagram
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Fully normalized relational architecture with atomic line-item invoicing, multi-channel payment subledgering (Cash, POS Terminal, Gateway Transfers), and formal HMO insurance claim lifecycle state tracking.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
            <div>
              <div className="text-slate-500">Entities</div>
              <div className="text-base font-bold text-white tabular-nums">8 Tables</div>
            </div>
            <div>
              <div className="text-slate-500">Columns</div>
              <div className="text-base font-bold text-cyan-400 tabular-nums">{totalColumns} Cols</div>
            </div>
            <div>
              <div className="text-slate-500">Integrity</div>
              <div className="text-base font-bold text-emerald-400 tabular-nums">{totalConstraints} Checks/FKs</div>
            </div>
            <div>
              <div className="text-slate-500">Indexes</div>
              <div className="text-base font-bold text-indigo-400 tabular-nums">{totalIndexes} B-Trees</div>
            </div>
          </div>
        </div>

        {/* Filter and search bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          {/* Domain Category Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-md overflow-x-auto w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Tables' },
              { id: 'clinical', label: 'Clinical & Encounters' },
              { id: 'billing', label: 'Billing & Invoicing' },
              { id: 'payments', label: 'Multi-Channel Payments' },
              { id: 'hmo', label: 'HMO Claims Lifecycle' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-slate-800 text-cyan-400 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table or column (e.g., pos_rrn)..."
              className="w-full bg-slate-950 border border-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 rounded focus:outline-hidden focus:border-cyan-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const isHighlighted = searchQuery && (
            table.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            table.columns.some((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
          );

          return (
            <div
              key={table.id}
              onClick={() => onSelectTable(table)}
              className={`bg-slate-900 border rounded-lg overflow-hidden flex flex-col transition-all cursor-pointer group hover:shadow-xl ${
                isHighlighted 
                  ? 'border-cyan-500 ring-1 ring-cyan-500/50' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {table.tableName}
                    </span>
                    <span className="text-[10px] text-slate-500">·</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {table.normalizationLevel.split(' ')[0]}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {table.displayName}
                  </div>
                </div>

                <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-950/50 transition-colors">
                  <Info className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Columns preview list */}
              <div className="p-3 space-y-1.5 flex-1 bg-slate-900/40 text-xs font-mono max-h-72 overflow-y-auto">
                {table.columns.map((col) => {
                  const matchesSearch = searchQuery && col.name.toLowerCase().includes(searchQuery.toLowerCase());
                  return (
                    <div 
                      key={col.name} 
                      className={`flex items-center justify-between py-0.5 px-1 rounded text-[11px] ${
                        matchesSearch ? 'bg-cyan-950/70 text-cyan-200' : 'text-slate-300 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        {col.isPrimaryKey ? (
                          <span title="Primary Key"><Key className="w-3 h-3 text-amber-400 shrink-0" /></span>
                        ) : col.isForeignKey ? (
                          <span title="Foreign Key"><Link className="w-3 h-3 text-indigo-400 shrink-0" /></span>
                        ) : (
                          <span className="w-3 inline-block shrink-0" />
                        )}
                        <span className={`truncate ${col.isPrimaryKey ? 'font-bold text-white' : ''}`}>
                          {col.name}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[10px] shrink-0">
                        {col.type.replace('VARCHAR', 'VARCHAR')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Card Footer */}
              <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono">{table.columns.length} columns</span>
                <span className="text-cyan-400 group-hover:underline flex items-center gap-1">
                  Inspect &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Relational Foreign Key Topology Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Foreign Key Relational Constraints & Referential Topology
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforcing referential integrity across master registries, fiscal ledger transactions, and insurance claims.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {SCHEMA_RELATIONS.length} Enforced Foreign Keys
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {SCHEMA_RELATIONS.map((rel) => (
            <div 
              key={rel.id}
              className="p-3 rounded border border-slate-800/90 bg-slate-950/40 hover:border-slate-700 transition-colors text-xs font-mono"
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-sans font-semibold text-slate-300">{rel.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                  rel.onDelete === 'CASCADE' ? 'text-amber-400 bg-amber-950/40 border border-amber-800/40' : 'text-slate-400 bg-slate-800'
                }`}>
                  ON DELETE {rel.onDelete}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <span className="text-cyan-300 font-semibold">{rel.fromTable}</span>
                <span className="text-slate-600">&rarr;</span>
                <span className="text-emerald-300 font-semibold">{rel.toTable}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                ({rel.fromColumn}) &rarr; ({rel.toColumn})
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
