import React, { useState } from 'react';
import { SCHEMA_TABLES } from '../data/schemaDefinition';
import { SchemaTable } from '../types/schema';
import { Search, Key, Link, ShieldCheck, Download, Filter, Upload, CheckCircle2 } from 'lucide-react';
import { CsvSchemaImporterModal } from './CsvSchemaImporterModal';

interface DataDictionaryProps {
  onSelectTable: (table: SchemaTable) => void;
}

export const DataDictionary: React.FC<DataDictionaryProps> = ({ onSelectTable }) => {
  const [selectedTableId, setSelectedTableId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all'); // all, keys, nullable, constraints
  const [isImporterOpen, setIsImporterOpen] = useState<boolean>(false);
  const [lastImportNotification, setLastImportNotification] = useState<{ table: string; count: number } | null>(null);

  const tablesToRender = selectedTableId === 'all'
    ? SCHEMA_TABLES
    : SCHEMA_TABLES.filter(t => t.id === selectedTableId);

  // Flattened columns if needed or rendered grouped by table
  const totalColumnsCount = SCHEMA_TABLES.reduce((sum, t) => sum + t.columns.length, 0);

  const handleExportCsv = () => {
    const rows = [
      ['Table Name', 'Column Name', 'Data Type', 'Nullable', 'Primary Key', 'Foreign Key Ref', 'Default Value', 'Description']
    ];

    SCHEMA_TABLES.forEach((t) => {
      t.columns.forEach((c) => {
        rows.push([
          t.tableName,
          c.name,
          c.type,
          c.isNullable ? 'YES' : 'NO',
          c.isPrimaryKey ? 'YES' : 'NO',
          c.foreignKeyRef ? `${c.foreignKeyRef.table}.${c.foreignKeyRef.column}` : '',
          c.defaultValue || '',
          `"${c.description.replace(/"/g, '""')}"`
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'VIDIEMS_ClinicLedger_Data_Dictionary.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>Data Governance & Schema Catalog</span>
              <span>·</span>
              <span>Total {totalColumnsCount} Documented Attributes</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Data Dictionary & Column Specifications
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Exhaustive technical definitions, field constraints, default generators, and medical/financial domain semantics across VIDIEMS ClinicLedger.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImporterOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono text-white bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded transition-colors cursor-pointer shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV to Bootstrap</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 rounded transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Import Success Banner */}
        {lastImportNotification && (
          <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-800/80 rounded text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Bootstrap successful: <strong>{lastImportNotification.count} records</strong> imported into <strong>{lastImportNotification.table}</strong> schema catalog.
              </span>
            </div>
            <button 
              onClick={() => setLastImportNotification(null)}
              className="text-emerald-400 hover:text-white underline text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <span className="text-xs font-mono text-slate-500 shrink-0">Filter Table:</span>
            <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-md">
              <button
                onClick={() => setSelectedTableId('all')}
                className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer ${
                  selectedTableId === 'all'
                    ? 'bg-slate-800 text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Tables
              </button>
              {SCHEMA_TABLES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTableId(t.id)}
                  className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap cursor-pointer ${
                    selectedTableId === t.id
                      ? 'bg-slate-800 text-cyan-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.tableName}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search column or description..."
              className="w-full bg-slate-950 border border-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 rounded focus:outline-hidden focus:border-cyan-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Tables & Attributes List */}
      <div className="space-y-6">
        {tablesToRender.map((table) => {
          const matchingColumns = table.columns.filter((c) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return c.name.toLowerCase().includes(q) ||
                   c.type.toLowerCase().includes(q) ||
                   c.description.toLowerCase().includes(q);
          });

          if (matchingColumns.length === 0) return null;

          return (
            <div key={table.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xs">
              {/* Table section header */}
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold font-mono text-white">{table.tableName}</span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs text-slate-400">{table.displayName}</span>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {table.normalizationLevel}
                  </span>
                </div>

                <button
                  onClick={() => onSelectTable(table)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  View Details & DDL &rarr;
                </button>
              </div>

              {/* Attributes Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Column Name</th>
                      <th className="py-2.5 px-4 font-semibold">Data Type</th>
                      <th className="py-2.5 px-4 font-semibold">Nullable</th>
                      <th className="py-2.5 px-4 font-semibold">Constraints / Default</th>
                      <th className="py-2.5 px-4 font-semibold font-sans">Business & Clinical Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {matchingColumns.map((col) => (
                      <tr key={col.name} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-100 flex items-center gap-1.5 whitespace-nowrap">
                          {col.isPrimaryKey && (
                            <span title="Primary Key"><Key className="w-3.5 h-3.5 text-amber-400 shrink-0" /></span>
                          )}
                          {col.isForeignKey && (
                            <span title="Foreign Key"><Link className="w-3.5 h-3.5 text-indigo-400 shrink-0" /></span>
                          )}
                          <span>{col.name}</span>
                        </td>
                        <td className="py-3 px-4 text-cyan-400 whitespace-nowrap">
                          {col.type}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            col.isNullable ? 'text-slate-400 bg-slate-800' : 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/30'
                          }`}>
                            {col.isNullable ? 'NULL' : 'NOT NULL'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 text-[11px] whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            {col.isPrimaryKey && <span className="text-amber-400">PRIMARY KEY</span>}
                            {col.isUnique && !col.isPrimaryKey && <span className="text-emerald-400">UNIQUE</span>}
                            {col.foreignKeyRef && (
                              <span className="text-indigo-400">
                                FK &rarr; {col.foreignKeyRef.table}.{col.foreignKeyRef.column}
                              </span>
                            )}
                            {col.defaultValue && (
                              <span className="text-slate-500">
                                default: <span className="text-slate-300">{col.defaultValue}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-sans text-xs text-slate-300 leading-relaxed min-w-[320px]">
                          {col.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* CSV Schema Importer Modal */}
      <CsvSchemaImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportSuccess={(table, count) => setLastImportNotification({ table, count })}
      />
    </div>
  );
};
