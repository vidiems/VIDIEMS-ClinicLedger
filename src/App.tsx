import React, { useState } from 'react';
import { Header } from './components/Header';
import { ClinicAuthScreen, AuthUser } from './components/ClinicAuthScreen';
import { ClinicAdminDashboard } from './components/ClinicAdminDashboard';
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
import { Database, ShieldCheck, HeartPulse, LogIn, LayoutDashboard, ChevronRight } from 'lucide-react';

export default function App() {
  // Authentication State: starts at split-screen login page as requested
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Module view state inside authenticated session
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [inspectedTable, setInspectedTable] = useState<SchemaTable | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const handleExportAll = () => {
    navigator.clipboard.writeText(POSTGRESQL_DDL);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActiveModule('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-500/20 selection:text-teal-900">
      
      {/* Dynamic View Swapping: Split-Screen Authentication vs. Main Dashboard Shell */}
      {!isAuthenticated || !currentUser ? (
        <div className="relative">
          {/* Quick Reviewer Helper Bar (Top right toggle) */}
          <div className="absolute top-3 right-4 z-50 flex items-center gap-2">
            <button
              onClick={() => {
                handleLoginSuccess({
                  name: 'Grace Bassey',
                  email: 'grace.billing@clinicledger.ng',
                  role: 'Head of Billing & Reconciliation',
                  title: 'Senior Revenue Cycle Lead',
                  department: 'Finance & HMO Adjudication',
                  branch: 'Victoria Island Main Hospital',
                  avatarInitials: 'GB'
                });
              }}
              className="text-xs bg-white/90 backdrop-blur-sm border border-slate-300 hover:border-teal-500 hover:text-teal-700 text-slate-700 px-3 py-1.5 rounded-lg shadow-sm font-medium flex items-center gap-1.5 transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-teal-600" />
              <span>Instant Preview: Dashboard</span>
            </button>
          </div>

          {/* Clean, centered, high-end split-screen Login/Authentication screen */}
          <ClinicAuthScreen onLoginSuccess={handleLoginSuccess} />
        </div>
      ) : (
        <div className="flex flex-col min-h-screen">
          {/* Secondary banner when viewing legacy sub-modules from sidebar */}
          {activeModule !== 'dashboard' && (
            <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-teal-400">ClinicLedger Module View:</span>
                <span className="text-slate-300 capitalize">{activeModule.replace('_', ' ')}</span>
              </div>
              <button
                onClick={() => setActiveModule('dashboard')}
                className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-medium text-[11px] transition-colors flex items-center gap-1"
              >
                <span>Return to Admin Dashboard</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* When activeModule is 'dashboard', render the full Medical SaaS Dashboard Shell */}
          {activeModule === 'dashboard' ? (
            <ClinicAdminDashboard
              currentUser={currentUser}
              onLogout={handleLogout}
              onNavigateToModule={(mod) => setActiveModule(mod)}
            />
          ) : (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
              <Header
                activeTab={activeModule}
                onSelectTab={setActiveModule}
                onExportAll={handleExportAll}
                copiedNotification={copiedNotification}
              />
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeModule === 'triage_billing' && <TriageBillingIntakeForm />}
                {activeModule === 'reconciliation_tests' && <ReconciliationTestRunnerModule />}
                {activeModule === 'erd' && <ERDVisualizer onSelectTable={setInspectedTable} />}
                {activeModule === 'claims_api' && <HmoClaimsApiConsole />}
                {activeModule === 'revenue' && <RevenueSplitReconciliationModule />}
                {activeModule === 'journey' && <UserJourneyWalkthrough />}
                {activeModule === 'dictionary' && <DataDictionary onSelectTable={setInspectedTable} />}
                {activeModule === 'architect' && <ArchitectReportView />}
                {activeModule === 'simulator' && <InteractiveLedgerSimulator />}
                {activeModule === 'queries' && <QueryStudio />}
                {activeModule === 'security' && <SecurityChecklistModule />}
                {activeModule === 'sql' && <SqlExporter />}
              </main>
              
              <TableInspectorModal
                table={inspectedTable}
                onClose={() => setInspectedTable(null)}
              />

              <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-400">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-slate-300">VIDIEMS ClinicLedger</span>
                    <span className="text-slate-500">·</span>
                    <span>Hospital Management System Architecture</span>
                  </div>
                  <button
                    onClick={() => setActiveModule('dashboard')}
                    className="text-cyan-400 hover:underline font-mono text-[11px]"
                  >
                    ← Back to Executive Admin Dashboard
                  </button>
                </div>
              </footer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
