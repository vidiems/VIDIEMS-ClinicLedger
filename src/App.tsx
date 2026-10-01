import React, { useState } from 'react';
import { Header } from './components/Header';
import { ERDVisualizer } from './components/ERDVisualizer';
import { DataDictionary } from './components/DataDictionary';
import { ArchitectReportView } from './components/ArchitectReportView';
import { InteractiveLedgerSimulator } from './components/InteractiveLedgerSimulator';
import { QueryStudio } from './components/QueryStudio';
import { SqlExporter } from './components/SqlExporter';
import { SecurityChecklistModule } from './components/SecurityChecklistModule';
import { UserJourneyWalkthrough } from './components/UserJourneyWalkthrough';
import { RevenueSplitReconciliationModule } from './components/RevenueSplitReconciliationModule';
import { HmoClaimsApiConsole } from './components/HmoClaimsApiConsole';
import { AdminDashboardModule } from './components/AdminDashboardModule';
import { TriageBillingIntakeForm } from './components/TriageBillingIntakeForm';
import { ReconciliationTestRunnerModule } from './components/ReconciliationTestRunnerModule';
import { TableInspectorModal } from './components/TableInspectorModal';
import { SchemaTable } from './types/schema';
import { POSTGRESQL_DDL } from './data/sqlDialects';
import { Database, ShieldCheck, HeartPulse } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('reconciliation_tests');
  const [inspectedTable, setInspectedTable] = useState<SchemaTable | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const handleExportAll = () => {
    navigator.clipboard.writeText(POSTGRESQL_DDL);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract Compliant Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onExportAll={handleExportAll}
        copiedNotification={copiedNotification}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'reconciliation_tests' && (
          <ReconciliationTestRunnerModule />
        )}

        {activeTab === 'triage_billing' && (
          <TriageBillingIntakeForm />
        )}

        {activeTab === 'dashboard' && (
          <AdminDashboardModule />
        )}

        {activeTab === 'erd' && (
          <ERDVisualizer onSelectTable={setInspectedTable} />
        )}

        {activeTab === 'claims_api' && (
          <HmoClaimsApiConsole />
        )}

        {activeTab === 'revenue' && (
          <RevenueSplitReconciliationModule />
        )}

        {activeTab === 'journey' && (
          <UserJourneyWalkthrough />
        )}

        {activeTab === 'dictionary' && (
          <DataDictionary onSelectTable={setInspectedTable} />
        )}

        {activeTab === 'architect' && (
          <ArchitectReportView />
        )}

        {activeTab === 'simulator' && (
          <InteractiveLedgerSimulator />
        )}

        {activeTab === 'queries' && (
          <QueryStudio />
        )}

        {activeTab === 'security' && (
          <SecurityChecklistModule />
        )}

        {activeTab === 'sql' && (
          <SqlExporter />
        )}
      </main>

      {/* Table Detail Slide-over Modal */}
      <TableInspectorModal
        table={inspectedTable}
        onClose={() => setInspectedTable(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">VIDIEMS ClinicLedger</span>
            <span className="text-slate-500">·</span>
            <span>Hospital Management System Relational Database Architecture</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>ANSI SQL-92 / ISO 9075 Compliant</span>
            <span>·</span>
            <span>3NF / BCNF Certified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
