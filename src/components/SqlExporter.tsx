import React, { useState } from 'react';
import { 
  POSTGRESQL_DDL, 
  MYSQL_DDL, 
  DRIZZLE_ORM_SCHEMA, 
  PRISMA_SCHEMA, 
  DBML_SCHEMA 
} from '../data/sqlDialects';
import { Copy, Check, Download, FileCode, CheckCircle2 } from 'lucide-react';

export const SqlExporter: React.FC = () => {
  const [activeDialect, setActiveDialect] = useState<'postgres' | 'mysql' | 'drizzle' | 'prisma' | 'dbml'>('postgres');
  const [copied, setCopied] = useState<boolean>(false);

  const getCodeContent = () => {
    switch (activeDialect) {
      case 'postgres': return { code: POSTGRESQL_DDL, ext: 'sql', label: 'PostgreSQL 15+ DDL' };
      case 'mysql': return { code: MYSQL_DDL, ext: 'sql', label: 'MySQL 8.0+ DDL' };
      case 'drizzle': return { code: DRIZZLE_ORM_SCHEMA, ext: 'ts', label: 'Drizzle ORM Schema (TypeScript)' };
      case 'prisma': return { code: PRISMA_SCHEMA, ext: 'prisma', label: 'Prisma Schema' };
      case 'dbml': return { code: DBML_SCHEMA, ext: 'dbml', label: 'DBML Database Markup' };
      default: return { code: POSTGRESQL_DDL, ext: 'sql', label: 'SQL DDL' };
    }
  };

  const { code, ext, label } = getCodeContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vidiems_clinicledger_schema.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>Code Generation Engine</span>
              <span>·</span>
              <span>Multi-Dialect & ORM Ready</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Production SQL DDL & ORM Export
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Export ready-to-run database migrations and strongly typed schemas for PostgreSQL, MySQL, Drizzle ORM, Prisma, and DBML.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .{ext}</span>
            </button>
          </div>
        </div>

        {/* Dialect Tabs */}
        <div className="mt-6 flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-md overflow-x-auto">
          {[
            { id: 'postgres', label: 'PostgreSQL 15+ (Reference DDL)' },
            { id: 'mysql', label: 'MySQL 8.0+' },
            { id: 'drizzle', label: 'Drizzle ORM (TypeScript)' },
            { id: 'prisma', label: 'Prisma Schema' },
            { id: 'dbml', label: 'DBML (dbdiagram.io)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDialect(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeDialect === tab.id
                  ? 'bg-slate-800 text-cyan-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Code Viewer Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xs">
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>vidiems_clinicledger_schema.{ext}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">{label}</span>
          </div>

          <span className="text-slate-500 text-[11px]">
            {code.split('\n').length} lines
          </span>
        </div>

        <div className="p-4 bg-slate-950/90 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto">
          <pre>{code}</pre>
        </div>
      </div>
    </div>
  );
};
