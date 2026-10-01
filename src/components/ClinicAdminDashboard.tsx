import React, { useState } from 'react';
import { 
  DollarSign, 
  Clock, 
  CreditCard, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ChevronRight, 
  Building2, 
  Stethoscope, 
  Pill, 
  Activity, 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Layers, 
  ShieldCheck, 
  Check, 
  Zap, 
  ArrowRight,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Bell,
  SlidersHorizontal,
  Plus,
  HelpCircle,
  Database,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { AuthUser } from './ClinicAuthScreen';

interface ClinicAdminDashboardProps {
  currentUser: AuthUser;
  onLogout: () => void;
  onNavigateToModule?: (moduleId: string) => void;
}

interface PosTransaction {
  id: string;
  terminalId: string;
  terminalProvider: string;
  location: string;
  rrn: string;
  authCode: string;
  amount: number;
  timestamp: string;
  status: 'unmatched' | 'reconciled' | 'discrepancy';
  discrepancyReason?: string;
}

interface HmoClaimItem {
  id: string;
  claimRef: string;
  hmoProvider: string;
  patientName: string;
  patientHospitalNo: string;
  amount: number;
  daysAging: number;
  status: 'draft' | 'submitted' | 'query_issued' | 'approved';
  urgency: 'normal' | 'due_soon' | 'overdue_30d';
}

interface QueuePatient {
  id: string;
  hospitalNo: string;
  name: string;
  gender: string;
  age: number;
  station: 'reception' | 'triage' | 'consultation' | 'pharmacy' | 'laboratory';
  acuity: 'emergency' | 'urgent' | 'routine';
  waitTimeMinutes: number;
  assignedStaff: string;
  chiefComplaint: string;
  paymentType: 'HMO AXA' | 'HMO Hygeia' | 'Private Cash' | 'POS Card';
}

export const ClinicAdminDashboard: React.FC<ClinicAdminDashboardProps> = ({ 
  currentUser, 
  onLogout,
  onNavigateToModule 
}) => {
  // Sidebar collapsed state (desktop rail vs expanded)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Active view tab within dashboard
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'queue' | 'financials' | 'claims'>('overview');

  // Currency toggle
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const currencyRate = currency === 'NGN' ? 1500 : 1;
  const currencySymbol = currency === 'NGN' ? '₦' : '$';

  // Search input state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Notifications drawer state
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showQuickIntakeModal, setShowQuickIntakeModal] = useState<boolean>(false);

  // Key Metric 1: Daily Revenue breakdown state
  const [revenuePeriod, setRevenuePeriod] = useState<'today' | 'yesterday' | 'wtd'>('today');

  // Key Metric 2: HMO Claims state
  const [claimsList, setClaimsList] = useState<HmoClaimItem[]>([
    { id: 'c1', claimRef: 'CLM-2026-00382', hmoProvider: 'AXA Mansard Health', patientName: 'Folashade Adeyemi', patientHospitalNo: 'HSP-00281', amount: 400 * currencyRate, daysAging: 8, status: 'approved', urgency: 'normal' },
    { id: 'c2', claimRef: 'CLM-2026-00383', hmoProvider: 'Reliance HMO', patientName: 'Chukwudi Eze', patientHospitalNo: 'HSP-00282', amount: 180 * currencyRate, daysAging: 16, status: 'submitted', urgency: 'due_soon' },
    { id: 'c3', claimRef: 'CLM-2026-00219', hmoProvider: 'AXA Mansard Health', patientName: 'Amina Bello', patientHospitalNo: 'HSP-00194', amount: 850 * currencyRate, daysAging: 47, status: 'query_issued', urgency: 'overdue_30d' },
    { id: 'c4', claimRef: 'CLM-2026-00190', hmoProvider: 'Hygeia HMO', patientName: 'Olumide Bakare', patientHospitalNo: 'HSP-00177', amount: 620 * currencyRate, daysAging: 38, status: 'query_issued', urgency: 'overdue_30d' },
    { id: 'c5', claimRef: 'CLM-2026-00389', hmoProvider: 'Avon Healthcare', patientName: 'Ngozi Okolie', patientHospitalNo: 'HSP-00301', amount: 310 * currencyRate, daysAging: 4, status: 'submitted', urgency: 'normal' },
    { id: 'c6', claimRef: 'CLM-2026-00244', hmoProvider: 'Leadway Health', patientName: 'Ibrahim Sanusi', patientHospitalNo: 'HSP-00205', amount: 540 * currencyRate, daysAging: 34, status: 'query_issued', urgency: 'overdue_30d' }
  ]);
  const [claimsAgingFilter, setClaimsAgingFilter] = useState<'all' | 'current' | 'due_soon' | 'overdue_30d'>('all');

  // Key Metric 3: POS Transactions & Reconciliation
  const [posTransactions, setPosTransactions] = useState<PosTransaction[]>([
    { id: 'pos-1', terminalId: 'POS-TID-8841-A', terminalProvider: 'Moniepoint', location: 'Central Reception Desk 1', rrn: 'RRN-9921408192', authCode: 'AUTH-61029', amount: 25000, timestamp: '10:14:02 AM', status: 'unmatched', discrepancyReason: 'Missing cashier cashup shift slip' },
    { id: 'pos-2', terminalId: 'POS-TID-8841-B', terminalProvider: 'Stanbic IBTC', location: 'Outpatient Pharmacy Desk', rrn: 'RRN-9921409941', authCode: 'AUTH-72910', amount: 20000, timestamp: '10:48:30 AM', status: 'unmatched', discrepancyReason: 'EOD batch terminal total mismatch with subledger' },
    { id: 'pos-3', terminalId: 'POS-TID-8841-C', terminalProvider: 'OPay Business', location: 'Emergency Room Cashier', rrn: 'RRN-9921410118', authCode: 'AUTH-84192', amount: 35000, timestamp: '11:05:15 AM', status: 'reconciled' },
    { id: 'pos-4', terminalId: 'POS-TID-8841-A', terminalProvider: 'Moniepoint', location: 'Central Reception Desk 1', rrn: 'RRN-9921411540', authCode: 'AUTH-90123', amount: 15000, timestamp: '11:22:45 AM', status: 'reconciled' }
  ]);
  const [reconcilingState, setReconcilingState] = useState<boolean>(false);
  const [reconciliationToast, setReconciliationToast] = useState<string | null>(null);

  // Key Metric 4: Active Patient Queue
  const [queueStationFilter, setQueueStationFilter] = useState<'all' | 'reception' | 'triage' | 'consultation' | 'pharmacy' | 'laboratory'>('all');
  const [patientsQueue, setPatientsQueue] = useState<QueuePatient[]>([
    { id: 'q1', hospitalNo: 'HSP-00281', name: 'Folashade Adeyemi', gender: 'F', age: 34, station: 'consultation', acuity: 'urgent', waitTimeMinutes: 14, assignedStaff: 'Dr. Adebayo Okonkwo', chiefComplaint: 'Chest tightness, elevated BP 160/95', paymentType: 'HMO AXA' },
    { id: 'q2', hospitalNo: 'HSP-00282', name: 'Chukwudi Eze', gender: 'M', age: 48, station: 'pharmacy', acuity: 'routine', waitTimeMinutes: 28, assignedStaff: 'Pharm. Bisi Adeleke', chiefComplaint: 'Hypertension refill (Amlodipine & Lisinopril)', paymentType: 'Private Cash' },
    { id: 'q3', hospitalNo: 'HSP-00283', name: 'Amina Bello', gender: 'F', age: 29, station: 'laboratory', acuity: 'urgent', waitTimeMinutes: 12, assignedStaff: 'Lab Tech O. Davies', chiefComplaint: 'Acute febrile episode, MP & Widal test', paymentType: 'HMO Hygeia' },
    { id: 'q4', hospitalNo: 'HSP-00284', name: 'Olumide Bakare', gender: 'M', age: 52, station: 'consultation', acuity: 'routine', waitTimeMinutes: 19, assignedStaff: 'Dr. Elena Vargas', chiefComplaint: 'Annual diabetic foot and glycemic check', paymentType: 'POS Card' },
    { id: 'q5', hospitalNo: 'HSP-00285', name: 'Emeka Nwosu', gender: 'M', age: 61, station: 'triage', acuity: 'emergency', waitTimeMinutes: 4, assignedStaff: 'Nurse Chioma Obi', chiefComplaint: 'Severe shortness of breath, SpO2 91%', paymentType: 'HMO AXA' },
    { id: 'q6', hospitalNo: 'HSP-00286', name: 'Zainab Danjuma', gender: 'F', age: 24, station: 'reception', acuity: 'routine', waitTimeMinutes: 6, assignedStaff: 'Desk Officer M. Bello', chiefComplaint: 'HMO pre-authorization registration', paymentType: 'HMO Hygeia' },
    { id: 'q7', hospitalNo: 'HSP-00287', name: 'David Adeleke', gender: 'M', age: 42, station: 'pharmacy', acuity: 'urgent', waitTimeMinutes: 32, assignedStaff: 'Pharm. Bisi Adeleke', chiefComplaint: 'Post-op analgesics & IV Antibiotics', paymentType: 'Private Cash' }
  ]);

  // Selected patient detail drawer
  const [selectedPatient, setSelectedPatient] = useState<QueuePatient | null>(null);

  // Quick Intake Form state
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientComplaint, setNewPatientComplaint] = useState('');
  const [newPatientAcuity, setNewPatientAcuity] = useState<'emergency' | 'urgent' | 'routine'>('routine');

  // Trigger automated POS reconciliation
  const handleAutoReconcile = () => {
    setReconcilingState(true);
    setTimeout(() => {
      setPosTransactions(prev => prev.map(tx => ({ 
        ...tx, 
        status: 'reconciled', 
        discrepancyReason: 'Auto-matched with bank settlement batch STANBIC-BATCH-W40' 
      })));
      setReconcilingState(false);
      setReconciliationToast('All POS slips balanced! Variance reduced to ₦0.00.');
      setTimeout(() => setReconciliationToast(null), 4000);
    }, 1100);
  };

  // Re-route or advance patient in queue
  const handleAdvancePatient = (patientId: string) => {
    setPatientsQueue(prev => prev.map(p => {
      if (p.id === patientId) {
        const stationOrder: Record<string, 'reception' | 'triage' | 'consultation' | 'pharmacy' | 'laboratory'> = {
          'reception': 'triage',
          'triage': 'consultation',
          'consultation': 'pharmacy',
          'pharmacy': 'laboratory',
          'laboratory': 'consultation'
        };
        const next = stationOrder[p.station] || 'consultation';
        return {
          ...p,
          station: next,
          waitTimeMinutes: 2
        };
      }
      return p;
    }));
  };

  // Add new patient from quick modal
  const handleAddQuickPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const newId = `q${Date.now()}`;
    const newHospitalNo = `HSP-00${Math.floor(290 + Math.random() * 50)}`;
    const newEntry: QueuePatient = {
      id: newId,
      hospitalNo: newHospitalNo,
      name: newPatientName,
      gender: 'M',
      age: 38,
      station: 'triage',
      acuity: newPatientAcuity,
      waitTimeMinutes: 1,
      assignedStaff: currentUser.name,
      chiefComplaint: newPatientComplaint || 'General clinical consultation intake',
      paymentType: 'Private Cash'
    };

    setPatientsQueue(prev => [newEntry, ...prev]);
    setNewPatientName('');
    setNewPatientComplaint('');
    setShowQuickIntakeModal(false);
  };

  // Calculations for Metric 1: Daily Revenue
  const baseRevenue = 14845200;
  const convertedRevenue = currency === 'NGN' ? baseRevenue : Math.round(baseRevenue / currencyRate);
  const cashRevenue = currency === 'NGN' ? 3420000 : Math.round(3420000 / currencyRate);
  const posRevenue = currency === 'NGN' ? 6925200 : Math.round(6925200 / currencyRate);
  const hmoRevenue = currency === 'NGN' ? 4500000 : Math.round(4500000 / currencyRate);

  // Calculations for Metric 2: Pending HMO Claims
  const filteredClaims = claimsList.filter(c => {
    if (claimsAgingFilter === 'all') return true;
    if (claimsAgingFilter === 'current') return c.daysAging <= 14;
    if (claimsAgingFilter === 'due_soon') return c.daysAging > 14 && c.daysAging <= 30;
    if (claimsAgingFilter === 'overdue_30d') return c.daysAging > 30;
    return true;
  });
  const totalPendingHmo = claimsList.reduce((acc, c) => acc + c.amount, 0);
  const overdueClaimsCount = claimsList.filter(c => c.urgency === 'overdue_30d').length;

  // Calculations for Metric 3: POS Variance
  const unmatchedPos = posTransactions.filter(t => t.status === 'unmatched');
  const posVariance = unmatchedPos.reduce((sum, tx) => sum + tx.amount, 0);

  // Calculations for Metric 4: Queue
  const filteredPatients = patientsQueue.filter(p => {
    const matchesStation = queueStationFilter === 'all' || p.station === queueStationFilter;
    const matchesSearch = searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.hospitalNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStation && matchesSearch;
  });

  const triageCount = patientsQueue.filter(p => p.station === 'triage').length;
  const consultCount = patientsQueue.filter(p => p.station === 'consultation').length;
  const pharmacyCount = patientsQueue.filter(p => p.station === 'pharmacy').length;
  const labCount = patientsQueue.filter(p => p.station === 'laboratory').length;
  const receptionCount = patientsQueue.filter(p => p.station === 'reception').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased selection:bg-teal-500/20 selection:text-teal-900">
      
      {/* Toast Notification */}
      {reconciliationToast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{reconciliationToast}</span>
          <button 
            onClick={() => setReconciliationToast(null)}
            className="text-slate-400 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Dashboard Layout Shell: Fixed Sidebar + Header + Dynamic Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR NAVIGATION (Desktop: Fixed/Collapsible; Mobile: Off-canvas Drawer) */}
        <aside 
          className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between shrink-0 z-30 ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          } hidden md:flex`}
        >
          {/* Sidebar Top: Logo & Workstation Branding */}
          <div>
            <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
              {!sidebarCollapsed ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-sm shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-slate-900 text-base leading-tight truncate">ClinicLedger</div>
                    <div className="text-[11px] text-slate-500 truncate">Hospital OS & Billing</div>
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 mx-auto rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-sm">
                  <Activity className="w-5 h-5" />
                </div>
              )}

              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Navigation Groups */}
            <div className="p-3 space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 tracking-wider">
                  CLINICAL OPERATIONS
                </div>
              )}
              
              <button
                onClick={() => setDashboardTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  dashboardTab === 'overview'
                    ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-sm font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Overview & Metrics"
              >
                <Layers className={`w-4 h-4 shrink-0 ${dashboardTab === 'overview' ? 'text-teal-600' : 'text-slate-400'}`} />
                {!sidebarCollapsed && <span>Dashboard Overview</span>}
              </button>

              <button
                onClick={() => setDashboardTab('queue')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  dashboardTab === 'queue'
                    ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-sm font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Patient Queue"
              >
                <div className="flex items-center gap-3">
                  <Users className={`w-4 h-4 shrink-0 ${dashboardTab === 'queue' ? 'text-teal-600' : 'text-slate-400'}`} />
                  {!sidebarCollapsed && <span>Patient Queue</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="font-mono text-[11px] font-semibold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-full">
                    {patientsQueue.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setDashboardTab('financials')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  dashboardTab === 'financials'
                    ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-sm font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Financial Subledger"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className={`w-4 h-4 shrink-0 ${dashboardTab === 'financials' ? 'text-teal-600' : 'text-slate-400'}`} />
                  {!sidebarCollapsed && <span>Ledger & POS</span>}
                </div>
                {!sidebarCollapsed && unmatchedPos.length > 0 && (
                  <span className="font-mono text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    {unmatchedPos.length} slip
                  </span>
                )}
              </button>

              <button
                onClick={() => setDashboardTab('claims')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  dashboardTab === 'claims'
                    ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-sm font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="HMO Claims & Aging"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className={`w-4 h-4 shrink-0 ${dashboardTab === 'claims' ? 'text-teal-600' : 'text-slate-400'}`} />
                  {!sidebarCollapsed && <span>HMO Claims & Aging</span>}
                </div>
                {!sidebarCollapsed && overdueClaimsCount > 0 && (
                  <span className="font-mono text-[10px] text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                    {overdueClaimsCount} overdue
                  </span>
                )}
              </button>

              {/* Connected Modules Section */}
              {!sidebarCollapsed && (
                <div className="pt-4 px-3 py-1.5 text-[11px] font-semibold text-slate-400 tracking-wider">
                  SYSTEM MODULES
                </div>
              )}

              {onNavigateToModule && (
                <>
                  <button
                    onClick={() => onNavigateToModule('triage_billing')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    title="Triage & Billing Intake"
                  >
                    <Stethoscope className="w-4 h-4 text-slate-400 shrink-0" />
                    {!sidebarCollapsed && <span>Triage & Billing Intake</span>}
                  </button>

                  <button
                    onClick={() => onNavigateToModule('reconciliation_tests')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    title="Automated Test Runner"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                    {!sidebarCollapsed && <span>Reconciliation Tests</span>}
                  </button>

                  <button
                    onClick={() => onNavigateToModule('erd')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    title="Interactive ERD"
                  >
                    <Database className="w-4 h-4 text-slate-400 shrink-0" />
                    {!sidebarCollapsed && <span>Relational Schema ERD</span>}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sidebar Bottom: Current Staff User Card & Logout */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/70">
            {!sidebarCollapsed ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    {currentUser.avatarInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</div>
                    <div className="text-[11px] text-teal-700 truncate font-medium">{currentUser.role}</div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out / Switch User</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div 
                  className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer"
                  title={`${currentUser.name} (${currentUser.role})`}
                >
                  {currentUser.avatarInitials}
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN VIEWPORT */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          
          {/* TOP HEADER BAR (Strict One-Row, Three-Zone Layout) */}
          <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
            
            {/* Zone 1: Mobile toggle & Breadcrumb Trail */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-slate-600 p-2 rounded-lg hover:bg-slate-100"
                aria-label="Toggle navigation"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium truncate">
                <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-slate-900 font-semibold truncate">{currentUser.branch.split(' ')[0]} {currentUser.branch.split(' ')[1]}</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 truncate">Clinical Admin Console</span>
              </div>
            </div>

            {/* Zone 2: Global Search Bar */}
            <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient MRN, claim ref, or POS RRN (Press ⌘K)..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Zone 3: Actions, Currency Switcher & User Profile */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Currency Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setCurrency('NGN')}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    currency === 'NGN' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  NGN (₦)
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    currency === 'USD' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  USD ($)
                </button>
              </div>

              {/* Quick Action: New Triage */}
              <button
                onClick={() => setShowQuickIntakeModal(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Intake</span>
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 relative transition-colors"
                  title="Notifications & Alerts"
                >
                  <Bell className="w-4 h-4" />
                  {overdueClaimsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl p-3 z-50 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <span className="font-semibold text-slate-900">Hospital Alerts</span>
                      <span className="text-[11px] text-slate-400">Real-time sync</span>
                    </div>
                    <div className="space-y-2">
                      <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-800">
                        <div className="font-semibold text-[11px]">3 HMO Claims Overdue &gt; 30 Days</div>
                        <div className="text-[10px] text-rose-600 mt-0.5">AXA Mansard & Hygeia have pending tariff queries.</div>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-800">
                        <div className="font-semibold text-[11px]">2 Unmatched POS Card Slips</div>
                        <div className="text-[10px] text-amber-600 mt-0.5">Moniepoint Terminal 1 missing cashier sign-off slip.</div>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800">
                        <div className="font-semibold text-[11px]">Cash Drawer Session Balanced</div>
                        <div className="text-[10px] text-emerald-600 mt-0.5">Shift #1 cashier drop matched ₦3,420,000.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Logout Icon */}
              <button
                onClick={onLogout}
                className="md:hidden p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* MOBILE NAVIGATION DRAWER */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2 z-20">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-800">Navigation Menu</div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => { setDashboardTab('overview'); setMobileMenuOpen(false); }}
                  className={`p-2.5 rounded-lg text-xs text-left font-medium ${dashboardTab === 'overview' ? 'bg-teal-50 text-teal-800 font-semibold' : 'bg-slate-50 text-slate-700'}`}
                >
                  Dashboard Overview
                </button>
                <button
                  onClick={() => { setDashboardTab('queue'); setMobileMenuOpen(false); }}
                  className={`p-2.5 rounded-lg text-xs text-left font-medium ${dashboardTab === 'queue' ? 'bg-teal-50 text-teal-800 font-semibold' : 'bg-slate-50 text-slate-700'}`}
                >
                  Patient Queue ({patientsQueue.length})
                </button>
                <button
                  onClick={() => { setDashboardTab('financials'); setMobileMenuOpen(false); }}
                  className={`p-2.5 rounded-lg text-xs text-left font-medium ${dashboardTab === 'financials' ? 'bg-teal-50 text-teal-800 font-semibold' : 'bg-slate-50 text-slate-700'}`}
                >
                  Ledger & POS
                </button>
                <button
                  onClick={() => { setDashboardTab('claims'); setMobileMenuOpen(false); }}
                  className={`p-2.5 rounded-lg text-xs text-left font-medium ${dashboardTab === 'claims' ? 'bg-teal-50 text-teal-800 font-semibold' : 'bg-slate-50 text-slate-700'}`}
                >
                  HMO Claims
                </button>
              </div>
              <div className="pt-2 flex justify-between items-center text-xs text-slate-500">
                <span>{currentUser.name}</span>
                <button onClick={onLogout} className="text-rose-600 font-medium">Sign Out</button>
              </div>
            </div>
          )}

          {/* DASHBOARD CONTENT BODY */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
            
            {/* View Banner / Context Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {dashboardTab === 'overview' && 'Executive Administration Dashboard'}
                    {dashboardTab === 'queue' && 'Live Patient Queue & Station Throughput'}
                    {dashboardTab === 'financials' && 'Daily Financial Subledger & Multi-Channel Stream'}
                    {dashboardTab === 'claims' && 'HMO Claims Aging & Adjudication Console'}
                  </h1>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    Live System
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Logged in as <strong className="text-slate-700">{currentUser.name}</strong> · Role: <span className="text-teal-700 font-medium">{currentUser.role}</span>
                </p>
              </div>

              {/* View Tab Segmented Controller */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
                <button
                  onClick={() => setDashboardTab('overview')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    dashboardTab === 'overview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setDashboardTab('queue')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    dashboardTab === 'queue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Queue ({patientsQueue.length})
                </button>
                <button
                  onClick={() => setDashboardTab('financials')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    dashboardTab === 'financials' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ledger
                </button>
                <button
                  onClick={() => setDashboardTab('claims')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    dashboardTab === 'claims' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  HMO Claims
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* CRITICAL FEATURE: LIVE METRICS GRID (4 Production Cards in Pure White)   */}
            {/* ========================================================================= */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* METRIC 1: Daily Revenue */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Daily Revenue
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
                      {currencySymbol}{convertedRevenue.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-medium">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>+12.4% vs yesterday</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>POS Terminal Cards:</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-800">
                      {currencySymbol}{posRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Cash Drawer Till:</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-800">
                      {currencySymbol}{cashRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>HMO Pre-Auth Bookings:</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-800">
                      {currencySymbol}{hmoRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* METRIC 2: Pending HMO Claims */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Pending HMO Claims
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
                      {currencySymbol}{totalPendingHmo.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                      <span>48 Batched Claims</span>
                      <span>·</span>
                      <span className="text-rose-600 font-semibold">{overdueClaimsCount} overdue (&gt;30d)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="p-1 rounded bg-slate-50">
                      <div className="text-[10px] text-slate-400">&lt; 14d</div>
                      <div className="text-xs font-bold text-emerald-600 font-mono">₦4.2M</div>
                    </div>
                    <div className="p-1 rounded bg-slate-50">
                      <div className="text-[10px] text-slate-400">15-30d</div>
                      <div className="text-xs font-bold text-amber-600 font-mono">₦2.9M</div>
                    </div>
                    <div className="p-1 rounded bg-slate-50">
                      <div className="text-[10px] text-slate-400">&gt; 30d</div>
                      <div className="text-xs font-bold text-rose-600 font-mono">₦1.3M</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* METRIC 3: Active Patient Queue */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Active Patient Queue
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
                      {patientsQueue.length} <span className="text-sm font-normal text-slate-500">Patients</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>Avg. Wait: <strong className="text-slate-800 font-mono">18 mins</strong></span>
                      <span>·</span>
                      <span className="text-emerald-600 font-medium">Optimal</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                  <span>Triage: <strong className="text-slate-900 font-mono">{triageCount}</strong></span>
                  <span>·</span>
                  <span>Doctor: <strong className="text-slate-900 font-mono">{consultCount}</strong></span>
                  <span>·</span>
                  <span>Pharm: <strong className="text-slate-900 font-mono">{pharmacyCount}</strong></span>
                  <span>·</span>
                  <span>Lab: <strong className="text-slate-900 font-mono">{labCount}</strong></span>
                </div>
              </div>

              {/* METRIC 4: POS Variance & Settlement Check */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Unreconciled POS
                    </span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      posVariance > 0 ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight ${
                      posVariance > 0 ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                      {currencySymbol}{posVariance.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                      <span>{unmatchedPos.length} Unmatched slips</span>
                      <span>·</span>
                      <span>4 Terminals Online</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={handleAutoReconcile}
                    disabled={reconcilingState || posVariance === 0}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed shadow-xs"
                  >
                    {reconcilingState ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Matching Slips...</span>
                      </>
                    ) : posVariance === 0 ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Reconciled</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Auto-Match POS Slips</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </section>

            {/* ========================================================================= */}
            {/* WORKBENCH VIEWS ACCORDING TO USER'S ACTIVE TAB                            */}
            {/* ========================================================================= */}

            {/* WORKBENCH TAB 1: OVERVIEW & COMBINED STREAM */}
            {dashboardTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left 7 Cols: Real-Time Patient Station Flow */}
                <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-teal-600" />
                        <h2 className="text-sm font-bold text-slate-900">Current Station Throughput</h2>
                      </div>
                      <button
                        onClick={() => setDashboardTab('queue')}
                        className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1"
                      >
                        <span>View Full Queue ({patientsQueue.length})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Patient Station Progress Table */}
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-medium">
                            <th className="pb-2">MRN & Patient</th>
                            <th className="pb-2">Station</th>
                            <th className="pb-2">Acuity</th>
                            <th className="pb-2">Wait Time</th>
                            <th className="pb-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {patientsQueue.slice(0, 5).map((patient) => (
                            <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5">
                                <div className="font-semibold text-slate-900">{patient.name}</div>
                                <div className="text-[11px] font-mono text-slate-400">{patient.hospitalNo} · {patient.paymentType}</div>
                              </td>
                              <td className="py-2.5">
                                <span className="capitalize font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                  {patient.station}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <span className={`text-[11px] font-semibold ${
                                  patient.acuity === 'emergency' ? 'text-rose-600' :
                                  patient.acuity === 'urgent' ? 'text-amber-600' : 'text-slate-600'
                                }`}>
                                  {patient.acuity.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-2.5 font-mono text-[11px] text-slate-600">
                                {patient.waitTimeMinutes} mins
                              </td>
                              <td className="py-2.5 text-right">
                                <button
                                  onClick={() => handleAdvancePatient(patient.id)}
                                  className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-semibold transition-colors"
                                >
                                  Advance Station →
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Clinical Acuity Target: &lt; 20m consultation triage</span>
                    <button
                      onClick={() => setShowQuickIntakeModal(true)}
                      className="text-teal-600 font-semibold hover:underline"
                    >
                      + Register Patient Walk-in
                    </button>
                  </div>
                </div>

                {/* Right 5 Cols: Financial Reconciliation & Daily POS Stream */}
                <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <h2 className="text-sm font-bold text-slate-900">POS Slip Reconciliation Stream</h2>
                      </div>
                      <span className="font-mono text-xs text-slate-500">
                        {unmatchedPos.length} Pending
                      </span>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      {posTransactions.map((tx) => (
                        <div 
                          key={tx.id}
                          className={`p-3 rounded-lg border text-xs transition-all ${
                            tx.status === 'unmatched'
                              ? 'bg-amber-50/60 border-amber-200 text-slate-800'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{tx.terminalProvider} ({tx.terminalId.split('-')[2]})</span>
                            <span className="font-mono font-bold text-slate-900">
                              {currencySymbol}{tx.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 font-mono">
                            <span>{tx.rrn}</span>
                            <span>{tx.timestamp}</span>
                          </div>
                          {tx.status === 'unmatched' && tx.discrepancyReason && (
                            <div className="mt-1.5 text-[10px] text-amber-800 font-medium bg-amber-100/70 p-1 rounded">
                              {tx.discrepancyReason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Bank Switch Status: <strong className="text-emerald-600">Online</strong></span>
                    <button
                      onClick={() => setDashboardTab('financials')}
                      className="text-teal-600 font-semibold hover:underline"
                    >
                      Audit Full Subledger →
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* WORKBENCH TAB 2: DETAILED PATIENT QUEUE */}
            {dashboardTab === 'queue' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Hospital Patient Queue Management</h2>
                    <p className="text-xs text-slate-500">Real-time clinical station tracking, wait time monitoring, and physician handover.</p>
                  </div>

                  {/* Station Filters */}
                  <div className="flex flex-wrap gap-1">
                    {(['all', 'reception', 'triage', 'consultation', 'pharmacy', 'laboratory'] as const).map((station) => (
                      <button
                        key={station}
                        onClick={() => setQueueStationFilter(station)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                          queueStationFilter === station
                            ? 'bg-teal-600 text-white font-semibold shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {station === 'all' ? `All (${patientsQueue.length})` : station}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Queue Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-medium">
                        <th className="pb-3">MRN / Hospital #</th>
                        <th className="pb-3">Patient Name</th>
                        <th className="pb-3">Station</th>
                        <th className="pb-3">Clinical Acuity</th>
                        <th className="pb-3">Assigned Staff</th>
                        <th className="pb-3">Chief Complaint</th>
                        <th className="pb-3">Wait Time</th>
                        <th className="pb-3 text-right">Workflow</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPatients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 font-mono font-semibold text-slate-800">
                            {patient.hospitalNo}
                          </td>
                          <td className="py-3">
                            <div className="font-semibold text-slate-900">{patient.name}</div>
                            <div className="text-[11px] text-slate-500">{patient.gender}, {patient.age} yrs · {patient.paymentType}</div>
                          </td>
                          <td className="py-3">
                            <span className="capitalize px-2 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                              {patient.station}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`text-[11px] font-bold ${
                              patient.acuity === 'emergency' ? 'text-rose-600' :
                              patient.acuity === 'urgent' ? 'text-amber-600' : 'text-slate-600'
                            }`}>
                              {patient.acuity.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 text-slate-700">
                            {patient.assignedStaff}
                          </td>
                          <td className="py-3 text-slate-600 max-w-xs truncate">
                            {patient.chiefComplaint}
                          </td>
                          <td className="py-3 font-mono text-[11px] text-slate-800">
                            {patient.waitTimeMinutes} mins
                          </td>
                          <td className="py-3 text-right space-x-2">
                            <button
                              onClick={() => setSelectedPatient(patient)}
                              className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-medium"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => handleAdvancePatient(patient.id)}
                              className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold"
                            >
                              Advance →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* WORKBENCH TAB 3: FINANCIAL LEDGER & POS */}
            {dashboardTab === 'financials' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Hospital Multi-Channel Financial Subledger</h2>
                    <p className="text-xs text-slate-500">Audit trail verifying cash drawers and multi-bank POS card settlements.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAutoReconcile}
                      disabled={reconcilingState || posVariance === 0}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${reconcilingState ? 'animate-spin' : ''}`} />
                      <span>{reconcilingState ? 'Reconciling...' : 'Run Auto-Reconciliation'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Physical Cash Drawer</div>
                    <div className="text-xl font-bold font-mono text-slate-900 mt-1">₦3,420,000</div>
                    <div className="text-[11px] text-emerald-600 mt-1">Shift count verified by Head Cashier</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">POS Terminal Card Settlements</div>
                    <div className="text-xl font-bold font-mono text-slate-900 mt-1">₦6,925,200</div>
                    <div className="text-[11px] text-slate-500 mt-1">Moniepoint, Stanbic IBTC, OPay</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Net Settlement Variance</div>
                    <div className={`text-xl font-bold font-mono mt-1 ${posVariance === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      ₦{posVariance.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {posVariance === 0 ? 'Zero variance across all terminals' : '2 unmatched slips requiring supervisor review'}
                    </div>
                  </div>
                </div>

                {/* POS Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-medium">
                        <th className="pb-3">Terminal ID</th>
                        <th className="pb-3">Provider / Location</th>
                        <th className="pb-3">RRN</th>
                        <th className="pb-3">Auth Code</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Time</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Adjudication</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {posTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="py-3 font-mono font-semibold text-slate-800">{tx.terminalId}</td>
                          <td className="py-3">
                            <div className="font-semibold text-slate-800">{tx.terminalProvider}</div>
                            <div className="text-[11px] text-slate-500">{tx.location}</div>
                          </td>
                          <td className="py-3 font-mono text-slate-700">{tx.rrn}</td>
                          <td className="py-3 font-mono text-slate-500">{tx.authCode}</td>
                          <td className="py-3 font-mono font-bold text-slate-900">₦{tx.amount.toLocaleString()}</td>
                          <td className="py-3 font-mono text-slate-500">{tx.timestamp}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              tx.status === 'reconciled' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {tx.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {tx.status === 'unmatched' ? (
                              <button
                                onClick={handleAutoReconcile}
                                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold"
                              >
                                Match Slip
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-mono">Balanced</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* WORKBENCH TAB 4: HMO CLAIMS AGING */}
            {dashboardTab === 'claims' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">HMO Claims Aging & Adjudication Workbench</h2>
                    <p className="text-xs text-slate-500">Monitor NHIS/Private HMO claim submissions, tariff dispute inquiries, and EDI reconciliation.</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setClaimsAgingFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${claimsAgingFilter === 'all' ? 'bg-sky-600 text-white font-semibold' : 'bg-slate-100 text-slate-600'}`}
                    >
                      All Claims
                    </button>
                    <button
                      onClick={() => setClaimsAgingFilter('due_soon')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${claimsAgingFilter === 'due_soon' ? 'bg-amber-600 text-white font-semibold' : 'bg-slate-100 text-slate-600'}`}
                    >
                      15–30 Days
                    </button>
                    <button
                      onClick={() => setClaimsAgingFilter('overdue_30d')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${claimsAgingFilter === 'overdue_30d' ? 'bg-rose-600 text-white font-semibold' : 'bg-slate-100 text-slate-600'}`}
                    >
                      &gt; 30 Days Overdue ({overdueClaimsCount})
                    </button>
                  </div>
                </div>

                {/* Claims Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-medium">
                        <th className="pb-3">Claim Reference</th>
                        <th className="pb-3">HMO Provider</th>
                        <th className="pb-3">Patient & Hospital #</th>
                        <th className="pb-3">Claim Amount</th>
                        <th className="pb-3">Aging (Days)</th>
                        <th className="pb-3">Adjudication Status</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredClaims.map((claim) => (
                        <tr key={claim.id} className="hover:bg-slate-50">
                          <td className="py-3 font-mono font-semibold text-slate-900">{claim.claimRef}</td>
                          <td className="py-3 font-medium text-slate-800">{claim.hmoProvider}</td>
                          <td className="py-3">
                            <div className="font-semibold text-slate-900">{claim.patientName}</div>
                            <div className="text-[11px] font-mono text-slate-400">{claim.patientHospitalNo}</div>
                          </td>
                          <td className="py-3 font-mono font-bold text-slate-900">
                            {currencySymbol}{claim.amount.toLocaleString()}
                          </td>
                          <td className="py-3">
                            <span className={`font-mono font-semibold text-[11px] ${
                              claim.daysAging > 30 ? 'text-rose-600' :
                              claim.daysAging > 14 ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                              {claim.daysAging} days
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              claim.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                              claim.status === 'query_issued' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {claim.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => alert(`Opening EDI adjudication portal for claim ${claim.claimRef} (${claim.hmoProvider})`)}
                              className="px-2.5 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-semibold"
                            >
                              Adjudicate →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </main>
        </div>

      </div>

      {/* QUICK INTAKE MODAL */}
      {showQuickIntakeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Quick Patient Triage Intake</h3>
              </div>
              <button 
                onClick={() => setShowQuickIntakeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddQuickPatient} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="e.g. Babatunde Fashola"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Acuity Level</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPatientAcuity('routine')}
                    className={`py-2 rounded-lg font-semibold text-center border ${
                      newPatientAcuity === 'routine' ? 'bg-slate-100 border-slate-400 text-slate-900' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Routine
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPatientAcuity('urgent')}
                    className={`py-2 rounded-lg font-semibold text-center border ${
                      newPatientAcuity === 'urgent' ? 'bg-amber-50 border-amber-400 text-amber-900' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Urgent
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPatientAcuity('emergency')}
                    className={`py-2 rounded-lg font-semibold text-center border ${
                      newPatientAcuity === 'emergency' ? 'bg-rose-50 border-rose-400 text-rose-900' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Emergency
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chief Medical Complaint</label>
                <textarea
                  rows={2}
                  value={newPatientComplaint}
                  onChange={(e) => setNewPatientComplaint(e.target.value)}
                  placeholder="Symptoms, presenting vitals, or referral notes..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickIntakeModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                >
                  Queue into Triage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PATIENT DETAIL DRAWER */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs text-teal-600 font-semibold">{selectedPatient.hospitalNo}</span>
                  <h3 className="text-lg font-bold text-slate-900">{selectedPatient.name}</h3>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Clinical Acuity:</span>
                    <strong className="text-slate-900 capitalize">{selectedPatient.acuity}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Current Station:</span>
                    <strong className="text-slate-900 capitalize">{selectedPatient.station}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Assigned Staff:</span>
                    <strong className="text-slate-900">{selectedPatient.assignedStaff}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Billing Type:</span>
                    <strong className="text-slate-900">{selectedPatient.paymentType}</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Chief Complaint:</label>
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-800 leading-relaxed">
                    {selectedPatient.chiefComplaint}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={() => {
                  handleAdvancePatient(selectedPatient.id);
                  setSelectedPatient(null);
                }}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-xs transition-colors"
              >
                Advance to Next Station →
              </button>
              <button
                onClick={() => setSelectedPatient(null)}
                className="w-full py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-medium text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
