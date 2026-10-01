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
  Smartphone, 
  Monitor, 
  Tablet, 
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
  HelpCircle,
  Eye,
  Check,
  Zap,
  ArrowRight
} from 'lucide-react';

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
}

export const AdminDashboardModule: React.FC = () => {
  // Viewport preview mode
  const [viewportMode, setViewportMode] = useState<'fluid' | 'desktop' | 'tablet' | 'mobile' | 'ux_specs'>('fluid');
  
  // Dashboard operational states
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const currencyRate = currency === 'NGN' ? 1500 : 1;
  const currencySymbol = currency === 'NGN' ? '₦' : '$';

  // Key Metric 1: Daily Revenue breakdown state
  const [selectedRevenuePeriod, setSelectedRevenuePeriod] = useState<'today' | 'yesterday' | 'wtd'>('today');
  const [revenueFilterChannel, setRevenueFilterChannel] = useState<'all' | 'pos' | 'transfer' | 'cash'>('all');

  // Key Metric 2: HMO Claims state
  const [hmoAgingFilter, setHmoAgingFilter] = useState<'all' | 'current' | 'due_soon' | 'overdue_30d'>('all');
  const [claimsList, setClaimsList] = useState<HmoClaimItem[]>([
    { id: 'c1', claimRef: 'CLM-2026-00382', hmoProvider: 'AXA Mansard Health', patientName: 'Folashade Adeyemi', patientHospitalNo: 'HSP-00281', amount: 400 * currencyRate, daysAging: 8, status: 'approved', urgency: 'normal' },
    { id: 'c2', claimRef: 'CLM-2026-00383', hmoProvider: 'Reliance HMO', patientName: 'Chukwudi Eze', patientHospitalNo: 'HSP-00282', amount: 180 * currencyRate, daysAging: 16, status: 'submitted', urgency: 'due_soon' },
    { id: 'c3', claimRef: 'CLM-2026-00219', hmoProvider: 'AXA Mansard Health', patientName: 'Amina Bello', patientHospitalNo: 'HSP-00194', amount: 850 * currencyRate, daysAging: 47, status: 'query_issued', urgency: 'overdue_30d' },
    { id: 'c4', claimRef: 'CLM-2026-00190', hmoProvider: 'Hygeia HMO', patientName: 'Olumide Bakare', patientHospitalNo: 'HSP-00177', amount: 620 * currencyRate, daysAging: 38, status: 'query_issued', urgency: 'overdue_30d' },
    { id: 'c5', claimRef: 'CLM-2026-00389', hmoProvider: 'Avon Healthcare', patientName: 'Ngozi Okolie', patientHospitalNo: 'HSP-00301', amount: 310 * currencyRate, daysAging: 4, status: 'submitted', urgency: 'normal' },
    { id: 'c6', claimRef: 'CLM-2026-00244', hmoProvider: 'Leadway Health', patientName: 'Ibrahim Sanusi', patientHospitalNo: 'HSP-00205', amount: 540 * currencyRate, daysAging: 34, status: 'query_issued', urgency: 'overdue_30d' }
  ]);

  // Key Metric 3: Unreconciled POS Transactions state
  const [posTransactions, setPosTransactions] = useState<PosTransaction[]>([
    { id: 'pos-1', terminalId: 'POS-TID-8841-A', terminalProvider: 'Moniepoint', location: 'Central Reception Desk 1', rrn: 'RRN-9921408192', authCode: 'AUTH-61029', amount: 50 * currencyRate, timestamp: '10:14:02 AM', status: 'unmatched', discrepancyReason: 'Missing cashier cashup shift slip' },
    { id: 'pos-2', terminalId: 'POS-TID-8841-B', terminalProvider: 'Stanbic IBTC', location: 'Outpatient Pharmacy Desk', rrn: 'RRN-9921409941', authCode: 'AUTH-72910', amount: 65 * currencyRate, timestamp: '10:48:30 AM', status: 'unmatched', discrepancyReason: 'EOD batch terminal total mismatch with subledger' },
    { id: 'pos-3', terminalId: 'POS-TID-8841-C', terminalProvider: 'OPay Business', location: 'Emergency Room Cashier', rrn: 'RRN-9921410118', authCode: 'AUTH-84192', amount: 20 * currencyRate, timestamp: '11:05:15 AM', status: 'unmatched', discrepancyReason: 'Late network drop, awaiting bank gateway settlement' },
    { id: 'pos-4', terminalId: 'POS-TID-8841-A', terminalProvider: 'Moniepoint', location: 'Central Reception Desk 1', rrn: 'RRN-9921411540', authCode: 'AUTH-90123', amount: 15 * currencyRate, timestamp: '11:22:45 AM', status: 'unmatched', discrepancyReason: 'Split payment incomplete on invoice INV-2026-10904' }
  ]);
  const [reconcilingState, setReconcilingState] = useState<boolean>(false);
  const [reconciliationSuccess, setReconciliationSuccess] = useState<boolean>(false);

  // Key Metric 4: Active Patient Queue state
  const [queueStationFilter, setQueueStationFilter] = useState<'all' | 'reception' | 'triage' | 'consultation' | 'pharmacy' | 'laboratory'>('all');
  const [patientsQueue, setPatientsQueue] = useState<QueuePatient[]>([
    { id: 'q1', hospitalNo: 'HSP-00281', name: 'Folashade Adeyemi', gender: 'F', age: 34, station: 'consultation', acuity: 'urgent', waitTimeMinutes: 14, assignedStaff: 'Dr. Adebayo Okonkwo', chiefComplaint: 'Chest tightness, elevated BP 160/95' },
    { id: 'q2', hospitalNo: 'HSP-00282', name: 'Chukwudi Eze', gender: 'M', age: 48, station: 'pharmacy', acuity: 'routine', waitTimeMinutes: 28, assignedStaff: 'Pharm. Bisi Adeleke', chiefComplaint: 'Hypertension refill (Amlodipine & Lisinopril)' },
    { id: 'q3', hospitalNo: 'HSP-00283', name: 'Amina Bello', gender: 'F', age: 29, station: 'laboratory', acuity: 'urgent', waitTimeMinutes: 12, assignedStaff: 'Lab Tech O. Davies', chiefComplaint: 'Acute febrile episode, MP & Widal test' },
    { id: 'q4', hospitalNo: 'HSP-00284', name: 'Olumide Bakare', gender: 'M', age: 52, station: 'consultation', acuity: 'routine', waitTimeMinutes: 19, assignedStaff: 'Dr. Elena Vargas', chiefComplaint: 'Annual diabetic foot and glycemic check' },
    { id: 'q5', hospitalNo: 'HSP-00285', name: 'Emeka Nwosu', gender: 'M', age: 61, station: 'triage', acuity: 'emergency', waitTimeMinutes: 4, assignedStaff: 'Nurse Chioma Obi', chiefComplaint: 'Severe shortness of breath, SpO2 91%' },
    { id: 'q6', hospitalNo: 'HSP-00286', name: 'Zainab Danjuma', gender: 'F', age: 24, station: 'reception', acuity: 'routine', waitTimeMinutes: 6, assignedStaff: 'Desk Officer M. Bello', chiefComplaint: 'HMO AXA pre-authorization registration' },
    { id: 'q7', hospitalNo: 'HSP-00287', name: 'David Adeleke', gender: 'M', age: 42, station: 'pharmacy', acuity: 'urgent', waitTimeMinutes: 32, assignedStaff: 'Pharm. Bisi Adeleke', chiefComplaint: 'Post-op analgesics & IV Antibiotics' }
  ]);

  // Active modal/drawer detail
  const [selectedPatientForDrawer, setSelectedPatientForDrawer] = useState<QueuePatient | null>(null);

  // Trigger automated POS reconciliation
  const handleAutoReconcile = () => {
    setReconcilingState(true);
    setTimeout(() => {
      setPosTransactions(prev => prev.map(tx => ({ ...tx, status: 'reconciled', discrepancyReason: 'Auto-matched with bank settlement batch STANBIC-BATCH-W40' })));
      setReconcilingState(false);
      setReconciliationSuccess(true);
      setTimeout(() => setReconciliationSuccess(false), 4000);
    }, 1200);
  };

  // Re-route or prioritize patient in queue
  const handleAdvancePatient = (patientId: string) => {
    setPatientsQueue(prev => prev.map(p => {
      if (p.id === patientId) {
        const nextStations: Record<string, 'reception' | 'triage' | 'consultation' | 'pharmacy' | 'laboratory'> = {
          'reception': 'triage',
          'triage': 'consultation',
          'consultation': 'pharmacy',
          'pharmacy': 'laboratory',
          'laboratory': 'consultation'
        };
        return {
          ...p,
          station: nextStations[p.station] || 'consultation',
          waitTimeMinutes: 2
        };
      }
      return p;
    }));
  };

  // Metric 1: Daily Revenue calculations
  const totalRevenue = 4850000;
  const targetRevenue = 6000000;
  const revenuePercent = Math.round((totalRevenue / targetRevenue) * 100);

  // Metric 2: Pending HMO Claims calculations
  const pendingHmoTotal = claimsList.reduce((acc, c) => acc + c.amount, 0);
  const overdue30Count = claimsList.filter(c => c.urgency === 'overdue_30d').length;
  const overdue30Amount = claimsList.filter(c => c.urgency === 'overdue_30d').reduce((acc, c) => acc + c.amount, 0);

  // Metric 3: Unreconciled POS calculations
  const unmatchedPosCount = posTransactions.filter(p => p.status === 'unmatched').length;
  const unreconciledVariance = posTransactions.filter(p => p.status === 'unmatched').reduce((acc, p) => acc + p.amount, 0);

  // Metric 4: Active Patient Queue calculations
  const totalActivePatients = patientsQueue.length;
  const avgWaitTime = Math.round(patientsQueue.reduce((acc, p) => acc + p.waitTimeMinutes, 0) / (totalActivePatients || 1));
  const emergencyCount = patientsQueue.filter(p => p.acuity === 'emergency').length;
  const pharmacyQueueCount = patientsQueue.filter(p => p.station === 'pharmacy').length;

  // Filtered lists
  const filteredClaims = claimsList.filter(c => {
    if (hmoAgingFilter === 'all') return true;
    return c.urgency === hmoAgingFilter;
  });

  const filteredQueue = patientsQueue.filter(p => {
    if (queueStationFilter === 'all') return true;
    return p.station === queueStationFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Domain Context & Responsive Viewport Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium tracking-wide">
              <span>EXECUTIVE CLINICAL OPERATIONS & REVENUE CYCLE</span>
              <span aria-hidden="true">·</span>
              <span>ROLE: HOSPITAL ADMINISTRATOR</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-1">
              ClinicLedger Administrator Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Real-time executive nerve center balancing clinical throughput and multi-channel financial integrity. Built strictly according to the SaaS Dashboard Constitution: zero vanity slop, 60-30-10 color discipline, and monospace tabular numerals.
            </p>
          </div>

          {/* Viewport Simulation Mode Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-md text-xs">
              <button
                onClick={() => setViewportMode('fluid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  viewportMode === 'fluid'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">Fluid (Auto)</span>
              </button>
              <button
                onClick={() => setViewportMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  viewportMode === 'desktop'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-[11px] font-mono">1440px</span>
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                onClick={() => setViewportMode('tablet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  viewportMode === 'tablet'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span className="text-[11px] font-mono">768px</span>
              </button>
              <button
                onClick={() => setViewportMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  viewportMode === 'mobile'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-[11px] font-mono">375px</span>
              </button>
              <button
                onClick={() => setViewportMode('ux_specs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  viewportMode === 'ux_specs'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>UX Architecture Specs</span>
              </button>
            </div>

            {/* Currency toggle */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs">
              <span className="text-slate-400 text-[11px]">Ledger Currency:</span>
              <button 
                onClick={() => setCurrency('NGN')}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-medium ${currency === 'NGN' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
              >
                NGN (₦)
              </button>
              <button 
                onClick={() => setCurrency('USD')}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-medium ${currency === 'USD' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
              >
                USD ($)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RENDER VIEWPORT FRAME (FLUID, SIMULATED DESKTOP, TABLET, MOBILE, OR ARCHITECTURE SPECS) */}
      {viewportMode === 'ux_specs' ? (
        /* UX SPECIFICATION BLUEPRINT SECTION */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs text-amber-400 font-mono tracking-wider">UX ARCHITECTURAL SPECIFICATION & DESIGN CONSTITUTION</span>
              <h2 className="text-xl font-bold text-white mt-1">
                ClinicLedger Administrator Dashboard Responsive System
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Formal blueprint detailing information architecture, responsive breakpoint geometry, cognitive load containment, and state management for medical and financial administration in Nigeria.
              </p>
            </div>

            {/* 1. Core Ergonomic Principles & Information Architecture */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-950 border border-slate-800/80 rounded p-4">
                <div className="text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  01. The F-Pattern Triad
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">
                  Financial Risk Precedence
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hospital administrators scan left-to-right, top-to-bottom. The top 4-card banner puts Revenue Pace first, followed immediately by Pending HMO Claims, POS Discrepancies, and Live Patient Load. No secondary card nesting or ornamental slop.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded p-4">
                <div className="text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  02. Action-Over-Inspection
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">
                  1-Click Triage & Reconciliation
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every card contains an immediate micro-action affordance: Auto-Reconcile POS terminals within the card, filter HMO claims &gt;30 days aging, and reroute blocked patients directly into next available consult rooms.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded p-4">
                <div className="text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  03. Tabular Numeral Discipline
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">
                  Zero Jitter & Precision Math
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  All figures use <code className="text-cyan-300 font-mono">tabular-nums font-mono</code> to guarantee vertical decimal alignment across multi-million Naira subledgers and real-time waiting room stopwatches.
                </p>
              </div>
            </div>

            {/* 2. Responsive Breakpoint Layout Matrix */}
            <div className="border border-slate-800 rounded overflow-hidden">
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 text-xs font-semibold text-slate-300">
                Responsive Viewport Grid & Ergonomic Constraints Matrix
              </div>
              <div className="divide-y divide-slate-800 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-4 p-4 gap-4 bg-slate-900/40">
                  <div className="font-semibold text-white">
                    Desktop Viewport<br />
                    <span className="text-slate-500 font-normal font-mono">1280px – 1440px+</span>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-medium">Grid Structure:</span><br />
                    4-Column KPI Bar (1fr 1fr 1fr 1fr) + 2:1 Asymmetric Split (Financial Operations left 66%, Live Queue right 34%).
                  </div>
                  <div>
                    <span className="text-cyan-400 font-medium">Data Density:</span><br />
                    36px–40px dense table row height with simultaneous view of POS terminal health and HMO aging breakdown.
                  </div>
                  <div>
                    <span className="text-cyan-400 font-medium">Interactions:</span><br />
                    Right-side slide-over drawer for patient details and multi-tier POS batch reconciliation log.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 p-4 gap-4 bg-slate-900/20">
                  <div className="font-semibold text-white">
                    Tablet Viewport<br />
                    <span className="text-slate-500 font-normal font-mono">768px – 1024px</span>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-medium">Grid Structure:</span><br />
                    2×2 Metric Card Grid + 1-column stacked operational workbenches with segmented tabs.
                  </div>
                  <div>
                    <span className="text-cyan-400 font-medium">Data Density:</span><br />
                    44px touch-friendly row heights, horizontal overflow indicators with swipe affordances.
                  </div>
                  <div>
                    <span className="text-cyan-400 font-medium">Interactions:</span><br />
                    Full-width modal overlays and quick-action bottom trigger buttons.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 p-4 gap-4 bg-slate-900/40">
                  <div className="font-semibold text-white">
                    Mobile Viewport<br />
                    <span className="text-slate-500 font-normal font-mono">375px – 430px</span>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-medium">Grid Structure:</span><br />
                    1-Column Vertical Priority Stack or Horizontal KPI Carousel with scroll snap points.
                  </div>
                  <div>
                    <span className="text-cyan-400 font-medium">Ergonomics:</span><br />
                    Sticky Top Bar capped at &le;15% viewport height. Minimum touch target &ge;44px for thumbs.
                  </div>
                  <div>
                    <span className="text-cyan-400 font-medium">Interactions:</span><br />
                    Bottom Sheet modal for patient check-in details and emergency queue overrides.
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Deep Dive into the 4 Key Metrics */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Detailed Functional Anatomy of the 4 Key Administrator Metrics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Metric 1 */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400">Metric 1: Daily Hospital Revenue</span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">Pacing: 80.8%</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong>Primary Display:</strong> Net collections across all revenue centers (Consultation, Pharmacy, Laboratory, Radiology) compared to daily budget benchmark.
                  </p>
                  <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                    <li><strong className="text-slate-300">Channel Segmentation:</strong> POS Terminal collections (54.6%), Direct Bank Transfers (29.3%), and Cash Desk (16.1%).</li>
                    <li><strong className="text-slate-300">UX Warning Indicator:</strong> Shifts into amber if cash collections exceed 25% (indicating manual handling risk) or if hourly pacing drops below 70%.</li>
                    <li><strong className="text-slate-300">Micro-Action:</strong> Direct drilldown into daily shift cashier balances.</li>
                  </ul>
                </div>

                {/* Metric 2 */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">Metric 2: Pending HMO Claims & Aging</span>
                    <span className="text-[11px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded">5 Overdue &gt;30d</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong>Primary Display:</strong> Total capital locked in unresolved health maintenance organization claim batches with risk aging stratification.
                  </p>
                  <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                    <li><strong className="text-slate-300">Aging Stratification:</strong> &lt;14 Days (Current), 15–30 Days (Due Soon), and &gt;30 Days (Critical Bad Debt Alert).</li>
                    <li><strong className="text-slate-300">Carrier Concentration:</strong> Direct view of top outstanding debtors (AXA Mansard, Reliance, Hygeia).</li>
                    <li><strong className="text-slate-300">Micro-Action:</strong> 1-click filter for overdue claims with batch EDI dispute resubmission.</li>
                  </ul>
                </div>

                {/* Metric 3 */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400">Metric 3: Unreconciled POS Transactions</span>
                    <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded">Variance: ₦47,500</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong>Primary Display:</strong> Count and monetary variance of payment terminal slips unassigned to an active clinic billing invoice.
                  </p>
                  <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                    <li><strong className="text-slate-300">Terminal Breakdown:</strong> Front Desk Moniepoint, Pharmacy Stanbic, and Emergency OPay terminals.</li>
                    <li><strong className="text-slate-300">Root-Cause Flagging:</strong> Network drops, orphan slips, split-billing incomplete records.</li>
                    <li><strong className="text-slate-300">Micro-Action:</strong> Automated Reconciliation Algorithm (RRN + Terminal ID + Amount within &plusmn;30s window).</li>
                  </ul>
                </div>

                {/* Metric 4 */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">Metric 4: Active Patient Queue & Acuity</span>
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded">Avg Wait: 18m</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong>Primary Display:</strong> Live census of patients currently on clinic grounds, segmented by care station and triage acuity.
                  </p>
                  <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                    <li><strong className="text-slate-300">Station Throughput:</strong> Reception &rarr; Triage &rarr; Consultation &rarr; Pharmacy &rarr; Laboratory.</li>
                    <li><strong className="text-slate-300">Bottleneck Alerts:</strong> Real-time alerts when Pharmacy or Lab queues exceed 25-minute wait time SLAs.</li>
                    <li><strong className="text-slate-300">Micro-Action:</strong> Quick patient re-routing and emergency priority escalation.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 4. Wireframe ASCII Architecture Chart */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Full-Stack Viewport ASCII Layout Schematic
              </span>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-cyan-300 overflow-x-auto leading-relaxed">
{`+-------------------------------------------------------------------------------------------------------------------------+
| VIDIEMS ClinicLedger  ·  Executive Operations  ·  Hospital Administrator Dashboard                           10:45 AM   |
+-------------------------------------------------------------------------------------------------------------------------+
| [ METRIC 1: DAILY REVENUE ]   | [ METRIC 2: HMO CLAIMS ]      | [ METRIC 3: UNRECONCILED POS ] | [ METRIC 4: PATIENT QUEUE ]    |
| ₦4,850,000 (Target ₦6.0M)     | ₦3,420,500 (28 Claims)        | 4 Slips (₦47,500 Variance)     | 34 Active (Avg Wait 18m)       |
| Pacing: 80.8% [========--]    | 5 Overdue >30d [ALERT]        | 3 Terminals (Moniepoint/Stanb) | 1 Emergency  ·  8 in Pharmacy  |
| POS 54% · Trans 29% · Cash 16%| AXA 42% · Reliance 28%        | [ Auto-Match Algorithm ]       | [ Bottleneck: Rx Station ]     |
+-------------------------------------------------------------------------------------------------------------------------+
| DESKTOP 2:1 ASYMMETRIC GRID (1440px)                                                                                    |
| +-------------------------------------------------------------------+ +-------------------------------------------------+ |
| | MAIN WORKBENCH: FINANCIAL LEDGER & HMO AGING                      | | LIVE CLINICAL QUEUE THROUGHPUT (KANBAN / FLOW)  | |
| | [Daily Revenue Channels] [HMO Aging Workbench] [POS Terminal Log] | | Stations: [Check-in] [Triage] [Doctor] [Rx]     | |
| | ----------------------------------------------------------------- | | ----------------------------------------------- | |
| | Filter: [All HMOs] [Overdue >30d] [Disputed]                      | | [!] HSP-00285  Emeka Nwosu (61M)  - EMERGENCY   | |
| | CLM-2026-00219  AXA Mansard  ₦1,275,000  47d Aging  [QUERY]       | |     Station: Triage -> Cons 1 (SpO2 91%) [14m]  | |
| | CLM-2026-00190  Hygeia HMO   ₦930,000    38d Aging  [QUERY]       | | [-] HSP-00281  Folashade Adeyemi - URGENT       | |
| | CLM-2026-00382  AXA Mansard  ₦600,000    8d Aging   [APPROVED]    | |     Station: Consultation 2 -> Rx [Wait 18m]    | |
| |                                                                   | | [-] HSP-00282  Chukwudi Eze       - ROUTINE     | |
| | [Trigger Batch Dispute Resolution] [Export Aging Report]          | |     Station: Pharmacy Dispensing [Wait 28m] (!) | |
| +-------------------------------------------------------------------+ +-------------------------------------------------+ |
+-------------------------------------------------------------------------------------------------------------------------+`}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        /* INTERACTIVE DASHBOARD CONTAINER (SCALED OR FLUID DEPENDING ON VIEWPORT MODE) */
        <div className={`transition-all duration-300 mx-auto ${
          viewportMode === 'desktop'
            ? 'max-w-[1440px] border border-cyan-500/40 rounded-xl p-4 bg-slate-950 shadow-2xl ring-4 ring-cyan-950/50'
            : viewportMode === 'tablet'
            ? 'max-w-[768px] border border-cyan-500/40 rounded-xl p-3 bg-slate-950 shadow-2xl ring-4 ring-cyan-950/50'
            : viewportMode === 'mobile'
            ? 'max-w-[375px] border border-cyan-500/40 rounded-xl p-2 bg-slate-950 shadow-2xl ring-4 ring-cyan-950/50'
            : 'w-full'
        }`}>
          {/* Active Viewport Badge when simulating */}
          {viewportMode !== 'fluid' && (
            <div className="mb-4 bg-slate-900 border border-cyan-500/30 rounded px-3 py-1.5 flex items-center justify-between text-xs">
              <span className="text-cyan-300 font-mono">
                Active Viewport Simulation: <strong>{viewportMode.toUpperCase()} ({viewportMode === 'desktop' ? '1440px' : viewportMode === 'tablet' ? '768px' : '375px'})</strong>
              </span>
              <button 
                onClick={() => setViewportMode('fluid')}
                className="text-slate-400 hover:text-white underline text-[11px] cursor-pointer"
              >
                Reset to Full Width
              </button>
            </div>
          )}

          {/* SECTION 1: THE 4 KEY METRIC CARDS */}
          <div className={`grid gap-4 mb-6 ${
            viewportMode === 'mobile'
              ? 'grid-cols-1'
              : viewportMode === 'tablet'
              ? 'grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          }`}>
            {/* CARD 1: DAILY REVENUE */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">Daily Revenue</span>
                  <span className="text-emerald-400 flex items-center gap-0.5 text-[11px] font-mono font-medium">
                    <ArrowUpRight className="w-3 h-3" />
                    +14.2%
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white tracking-tight tabular-nums">
                    {currencySymbol}{totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Target: {currencySymbol}{targetRevenue.toLocaleString()}</span>
                  <span className="font-mono text-cyan-300">{revenuePercent}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${revenuePercent}%` }} 
                  />
                </div>
              </div>

              {/* Sub-breakdown channels */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between items-center">
                  <span>POS Terminals</span>
                  <span className="font-mono text-slate-200 tabular-nums">54.6% · {currencySymbol}2,650,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Bank Transfers (NIP)</span>
                  <span className="font-mono text-slate-200 tabular-nums">29.3% · {currencySymbol}1,420,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cash Drawer</span>
                  <span className="font-mono text-slate-200 tabular-nums">16.1% · {currencySymbol}780,000</span>
                </div>
              </div>
            </div>

            {/* CARD 2: PENDING HMO CLAIMS */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">Pending HMO Claims</span>
                  <span className="text-rose-400 text-[11px] font-mono font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {overdue30Count} Overdue
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white tracking-tight tabular-nums">
                    {currencySymbol}{pendingHmoTotal.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400">({claimsList.length} claims)</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  <span>Critical Risk: {currencySymbol}{overdue30Amount.toLocaleString()} &gt;30 days</span>
                </div>
                {/* Visual aging stack */}
                <div className="flex items-center gap-1 mt-2 text-[10px] font-mono">
                  <button 
                    onClick={() => setHmoAgingFilter('current')} 
                    className={`flex-1 py-0.5 rounded text-center cursor-pointer transition-colors ${hmoAgingFilter === 'current' ? 'bg-emerald-600 text-white' : 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900'}`}
                  >
                    &lt;14d
                  </button>
                  <button 
                    onClick={() => setHmoAgingFilter('due_soon')} 
                    className={`flex-1 py-0.5 rounded text-center cursor-pointer transition-colors ${hmoAgingFilter === 'due_soon' ? 'bg-amber-600 text-white' : 'bg-amber-950 text-amber-300 hover:bg-amber-900'}`}
                  >
                    15-30d
                  </button>
                  <button 
                    onClick={() => setHmoAgingFilter('overdue_30d')} 
                    className={`flex-1 py-0.5 rounded text-center cursor-pointer transition-colors ${hmoAgingFilter === 'overdue_30d' ? 'bg-rose-600 text-white' : 'bg-rose-950 text-rose-300 hover:bg-rose-900'}`}
                  >
                    &gt;30d ({overdue30Count})
                  </button>
                </div>
              </div>

              {/* Provider exposure */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between items-center">
                  <span>AXA Mansard</span>
                  <span className="font-mono text-slate-200 tabular-nums">₦1,875,000 (3 claims)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Hygeia HMO</span>
                  <span className="font-mono text-slate-200 tabular-nums">₦930,000 (1 claim)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Reliance HMO</span>
                  <span className="font-mono text-slate-200 tabular-nums">₦270,000 (1 claim)</span>
                </div>
              </div>
            </div>

            {/* CARD 3: UNRECONCILED POS TRANSACTIONS */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">Unreconciled POS</span>
                  <span className={`text-[11px] font-mono font-medium ${unmatchedPosCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {unmatchedPosCount > 0 ? `${unmatchedPosCount} Pending Slips` : '100% Reconciled'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white tracking-tight tabular-nums">
                    {currencySymbol}{unreconciledVariance.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400">variance</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>3 Active Terminals</span>
                  <span className="text-amber-300 font-mono text-[10px]">Moniepoint / Stanbic</span>
                </div>
              </div>

              {/* Micro-Action: Auto-Match Algorithm */}
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                {reconciliationSuccess ? (
                  <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs px-2.5 py-1.5 rounded flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Auto-matched 4 slips (₦0 variance)</span>
                  </div>
                ) : (
                  <button
                    onClick={handleAutoReconcile}
                    disabled={reconcilingState || unmatchedPosCount === 0}
                    className={`w-full text-xs font-semibold py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      unmatchedPosCount > 0
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${reconcilingState ? 'animate-spin' : ''}`} />
                    <span>{reconcilingState ? 'Matching Bank RRNs...' : 'Run Auto-Reconcile'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* CARD 4: ACTIVE PATIENT QUEUE */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">Active Patient Queue</span>
                  <span className="text-cyan-400 text-[11px] font-mono font-medium flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {totalActivePatients} in Facility
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white tracking-tight tabular-nums">
                    {avgWaitTime} min
                  </span>
                  <span className="text-xs text-slate-400">avg wait time</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Facility SLA: &lt; 25 min</span>
                  {emergencyCount > 0 && (
                    <span className="text-rose-400 font-mono text-[10px] font-bold">
                      {emergencyCount} Emergency Priority
                    </span>
                  )}
                </div>
              </div>

              {/* Station throughput distribution */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between items-center">
                  <span>Doctor Consultations</span>
                  <span className="font-mono text-slate-200 tabular-nums">2 active · 4 waiting</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={pharmacyQueueCount >= 2 ? 'text-amber-400 font-medium' : ''}>
                    Pharmacy Dispensing
                  </span>
                  <span className="font-mono text-slate-200 tabular-nums">
                    {pharmacyQueueCount} waiting {pharmacyQueueCount >= 2 && '(!)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Nurse Triage</span>
                  <span className="font-mono text-slate-200 tabular-nums">1 patient</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: WORKBENCH LAYOUT (2:1 ASYMMETRIC GRID ON DESKTOP, STACKED ON TABLET/MOBILE) */}
          <div className={`grid gap-6 ${
            viewportMode === 'mobile' || viewportMode === 'tablet'
              ? 'grid-cols-1'
              : 'grid-cols-1 lg:grid-cols-3'
          }`}>
            {/* LEFT / PRIMARY COLUMN (2 SPANS ON DESKTOP): FINANCIAL & HMO RECONCILIATION */}
            <div className="lg:col-span-2 space-y-6">
              {/* SUBSECTION A: HMO CLAIMS AGING & DISPUTE WORKBENCH */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        HMO Claims Aging & Pre-Authorization Registry
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        ({filteredClaims.length} records)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Claims aging past 30 days without EDI remittance are escalated for legal dispute and tariff audit.
                    </p>
                  </div>

                  {/* Filter segmented buttons */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded text-xs">
                    <button
                      onClick={() => setHmoAgingFilter('all')}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${hmoAgingFilter === 'all' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
                    >
                      All ({claimsList.length})
                    </button>
                    <button
                      onClick={() => setHmoAgingFilter('due_soon')}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${hmoAgingFilter === 'due_soon' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
                    >
                      15–30d
                    </button>
                    <button
                      onClick={() => setHmoAgingFilter('overdue_30d')}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${hmoAgingFilter === 'overdue_30d' ? 'bg-rose-600 text-white font-medium' : 'text-rose-400 hover:text-rose-300'}`}
                    >
                      &gt;30d Overdue ({overdue30Count})
                    </button>
                  </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Claim Ref / Provider</th>
                        <th className="py-2.5 px-4 font-semibold">Patient</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
                        <th className="py-2.5 px-4 font-semibold">Aging Days</th>
                        <th className="py-2.5 px-4 font-semibold">Status</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredClaims.map((claim) => (
                        <tr key={claim.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-mono font-medium text-slate-200">{claim.claimRef}</div>
                            <div className="text-[11px] text-slate-400">{claim.hmoProvider}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-200 font-medium">{claim.patientName}</div>
                            <div className="text-[11px] font-mono text-slate-400">{claim.patientHospitalNo}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-white tabular-nums">
                            {currencySymbol}{claim.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className={`w-2 h-2 rounded-full ${
                                claim.urgency === 'overdue_30d'
                                  ? 'bg-rose-500'
                                  : claim.urgency === 'due_soon'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`} />
                              <span className={`tabular-nums ${
                                claim.urgency === 'overdue_30d' ? 'text-rose-400 font-bold' : 'text-slate-300'
                              }`}>
                                {claim.daysAging} days
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] font-mono uppercase text-slate-300">
                              {claim.status === 'query_issued' ? 'Under Query' : claim.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                alert(`Opening EDI dispute package for ${claim.claimRef} against ${claim.hmoProvider}`);
                              }}
                              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SUBSECTION B: POS TERMINAL RECONCILIATION LOG */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      POS Hardware Terminal Settlement Feeds
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Front Desk Moniepoint, Pharmacy Stanbic, and Emergency OPay batch verification.
                    </p>
                  </div>
                  <button
                    onClick={handleAutoReconcile}
                    disabled={reconcilingState}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <RefreshCw className={`w-3 h-3 ${reconcilingState ? 'animate-spin' : ''}`} />
                    <span>Sync Bank Gateway</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-800/80 text-xs">
                  {posTransactions.map(tx => (
                    <div key={tx.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-200">{tx.terminalId}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-300 font-medium">{tx.terminalProvider}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-400 text-[11px]">{tx.location}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          RRN: <span className="text-slate-300">{tx.rrn}</span> · Auth: {tx.authCode} · Time: {tx.timestamp}
                        </div>
                        {tx.discrepancyReason && tx.status === 'unmatched' && (
                          <div className="text-[11px] text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{tx.discrepancyReason}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <span className="text-sm font-mono font-bold text-white tabular-nums">
                          {currencySymbol}{tx.amount.toLocaleString()}
                        </span>
                        <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                          tx.status === 'reconciled'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {tx.status === 'reconciled' ? 'Reconciled' : 'Unmatched Slip'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (1 SPAN ON DESKTOP): ACTIVE PATIENT QUEUE & CLINICAL FLOW */}
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col h-full">
                <div className="p-4 border-b border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      Active Patient Queue Flow
                    </h3>
                    <span className="text-xs font-mono text-cyan-400">
                      {patientsQueue.length} Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Real-time clinical queue with bottleneck surveillance and acuity triage.
                  </p>

                  {/* Station filter tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto pt-3 text-[11px]">
                    <button
                      onClick={() => setQueueStationFilter('all')}
                      className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer ${queueStationFilter === 'all' ? 'bg-cyan-600 text-white font-medium' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
                    >
                      All ({patientsQueue.length})
                    </button>
                    <button
                      onClick={() => setQueueStationFilter('consultation')}
                      className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer ${queueStationFilter === 'consultation' ? 'bg-cyan-600 text-white font-medium' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
                    >
                      Doctor ({patientsQueue.filter(p => p.station === 'consultation').length})
                    </button>
                    <button
                      onClick={() => setQueueStationFilter('pharmacy')}
                      className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer ${queueStationFilter === 'pharmacy' ? 'bg-cyan-600 text-white font-medium' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
                    >
                      Pharmacy ({pharmacyQueueCount})
                    </button>
                    <button
                      onClick={() => setQueueStationFilter('triage')}
                      className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer ${queueStationFilter === 'triage' ? 'bg-cyan-600 text-white font-medium' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
                    >
                      Triage ({patientsQueue.filter(p => p.station === 'triage').length})
                    </button>
                  </div>
                </div>

                {/* Queue list cards */}
                <div className="divide-y divide-slate-800/80 p-2 space-y-2 flex-1 overflow-y-auto max-h-[600px]">
                  {filteredQueue.map((patient) => (
                    <div 
                      key={patient.id} 
                      className={`p-3 rounded border transition-colors ${
                        patient.acuity === 'emergency'
                          ? 'bg-rose-950/20 border-rose-800/80 hover:border-rose-700'
                          : patient.waitTimeMinutes > 25
                          ? 'bg-amber-950/20 border-amber-800/80 hover:border-amber-700'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{patient.name}</span>
                            <span className="text-[10px] text-slate-400">({patient.gender}, {patient.age}y)</span>
                          </div>
                          <div className="text-[11px] font-mono text-cyan-400">{patient.hospitalNo}</div>
                        </div>

                        {/* Acuity tag */}
                        <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                          patient.acuity === 'emergency'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : patient.acuity === 'urgent'
                            ? 'bg-amber-900 text-amber-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {patient.acuity}
                        </span>
                      </div>

                      {/* Complaint & Assignment */}
                      <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                        {patient.chiefComplaint}
                      </p>

                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <div className="text-slate-400">
                          Station: <strong className="text-slate-200 capitalize">{patient.station}</strong>
                          <div className="text-[10px] text-slate-400">{patient.assignedStaff}</div>
                        </div>

                        <div className="text-right">
                          <div className={`font-mono tabular-nums ${patient.waitTimeMinutes > 25 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                            {patient.waitTimeMinutes}m wait
                          </div>
                          <button
                            onClick={() => handleAdvancePatient(patient.id)}
                            className="mt-1 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer font-medium"
                          >
                            <span>Advance</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
