import React from 'react';
import { Database, Download, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onExportAll: () => void;
  copiedNotification: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onExportAll,
  copiedNotification
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Admin Dashboard' },
    { id: 'reconciliation_tests', label: 'Reconciliation Tests' },
    { id: 'triage_billing', label: 'Triage & Billing Intake' },
    { id: 'erd', label: 'Interactive ERD' },
    { id: 'claims_api', label: 'HMO Claims API & Aging' },
    { id: 'revenue', label: 'Revenue Split Engine' },
    { id: 'journey', label: 'Patient Journey' },
    { id: 'simulator', label: 'Live Subledger & HMO' },
    { id: 'queries', label: 'Query Studio' },
    { id: 'security', label: 'OWASP & NDPA Security' },
    { id: 'dictionary', label: 'Data Dictionary' },
    { id: 'architect', label: 'Architect Whitepaper' },
    { id: 'sql', label: 'SQL & ORM DDL' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Database className="w-4 h-4" />
          </div>
          <a
            href="#erd"
            onClick={(e) => { e.preventDefault(); onSelectTab('erd'); }}
            className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap"
          >
            VIDIEMS ClinicLedger
          </a>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-400">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`transition-colors relative py-1 text-sm ${
                  isActive
                    ? 'text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExportAll}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 transition-colors rounded shadow-sm whitespace-nowrap cursor-pointer"
          >
            {copiedNotification ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Copied DDL Bundle</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export PostgreSQL DDL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-2 border-t border-slate-800/80 overflow-x-auto text-xs bg-slate-900/60">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`px-2.5 py-1 whitespace-nowrap rounded font-medium ${
              activeTab === item.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
