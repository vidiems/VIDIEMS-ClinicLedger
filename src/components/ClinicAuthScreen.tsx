import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Building2, 
  Stethoscope, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

export interface AuthUser {
  name: string;
  email: string;
  role: string;
  title: string;
  department: string;
  branch: string;
  avatarInitials: string;
}

interface ClinicAuthScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

const PRESET_ACCOUNTS: Array<AuthUser & { passwordHint: string }> = [
  {
    name: 'Dr. Adebayo Okonkwo, FWACS',
    email: 'cmo.okonkwo@clinicledger.ng',
    role: 'Chief Medical Officer (CMO)',
    title: 'Consultant Surgeon & Medical Director',
    department: 'Clinical Governance & Surgery',
    branch: 'Victoria Island Main Hospital',
    avatarInitials: 'AO',
    passwordHint: 'DocAdmin#2026'
  },
  {
    name: 'Grace Bassey',
    email: 'grace.billing@clinicledger.ng',
    role: 'Head of Billing & Reconciliation',
    title: 'Senior Revenue Cycle Lead',
    department: 'Finance & HMO Adjudication',
    branch: 'Victoria Island Main Hospital',
    avatarInitials: 'GB',
    passwordHint: 'LedgerSecure!9'
  },
  {
    name: 'Tunde Adeleke',
    email: 'tunde.reception@clinicledger.ng',
    role: 'Front-Desk Administrator',
    title: 'Patient Intake & Triage Coordinator',
    department: 'Outpatient Services',
    branch: 'Victoria Island Main Hospital',
    avatarInitials: 'TA',
    passwordHint: 'FrontDesk@2026'
  },
  {
    name: 'Nurse Chioma Obi, RN',
    email: 'chioma.triage@clinicledger.ng',
    role: 'Triage & Charge Nurse',
    title: 'Senior Emergency Care Practitioner',
    department: 'Emergency & Urgent Triage',
    branch: 'Victoria Island Main Hospital',
    avatarInitials: 'CO',
    passwordHint: 'TriageCare#2026'
  }
];

export const ClinicAuthScreen: React.FC<ClinicAuthScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('grace.billing@clinicledger.ng');
  const [password, setPassword] = useState<string>('LedgerSecure!9');
  const [role, setRole] = useState<string>('Head of Billing & Reconciliation');
  const [branch, setBranch] = useState<string>('Victoria Island Main Hospital');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberTerminal, setRememberTerminal] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSelectPreset = (preset: typeof PRESET_ACCOUNTS[0]) => {
    setEmail(preset.email);
    setPassword(preset.passwordHint);
    setRole(preset.role);
    setBranch(preset.branch);
    setAuthError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email.trim() || !email.includes('@')) {
      setAuthError('Please enter a valid clinical workstation email address.');
      return;
    }

    if (!password || password.length < 6) {
      setAuthError('Password must contain at least 6 characters.');
      return;
    }

    setIsLoading(true);

    // Simulate enterprise authentication with role verification
    setTimeout(() => {
      setIsLoading(false);
      const matched = PRESET_ACCOUNTS.find(p => p.email.toLowerCase() === email.toLowerCase());
      
      const loggedUser: AuthUser = matched || {
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: email,
        role: role,
        title: role,
        department: 'Clinical Operations',
        branch: branch,
        avatarInitials: email.substring(0, 2).toUpperCase()
      };

      onLoginSuccess(loggedUser);
    }, 650);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans selection:bg-teal-500/20 selection:text-teal-900">
      <div className="w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* Left Side: Clinical Brand & Trust Showcase (Desktop Split Screen) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-8 flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle geometric pattern backdrop */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-auth" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-auth)" />
            </svg>
          </div>

          {/* Top Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 shadow-inner">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  ClinicLedger
                  <span className="text-[11px] font-mono font-medium text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/60">
                    SaaS Core
                  </span>
                </h1>
                <p className="text-xs text-slate-300">Hospital Management & Billing System</p>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-2xl font-semibold text-white tracking-tight leading-snug">
                Real-time subledger reconciliation for hospital operations.
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Seamlessly unify daily cash drawers, multi-terminal POS card settlements, and HMO claims aging into an auditable double-entry ledger.
              </p>
            </div>
          </div>

          {/* Center Clinical Statistics & Trust Pillars */}
          <div className="relative z-10 my-6 space-y-3.5">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Multi-Terminal POS Settlement</span>
                <span className="font-mono text-teal-300 tabular-nums font-semibold">100% Reconciled</span>
              </div>
              <div className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                <div className="bg-teal-400 h-full rounded-full w-full" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>HMO Claims Adjudication (EDI 837)</span>
                <span className="font-mono text-sky-300 tabular-nums font-semibold">&lt; 14d Turnaround</span>
              </div>
              <div className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                <div className="bg-sky-400 h-full rounded-full w-4/5" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Patient Queue Throughput</span>
                <span className="font-mono text-emerald-300 tabular-nums font-semibold">18m Avg. Triage</span>
              </div>
              <div className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full w-11/12" />
              </div>
            </div>
          </div>

          {/* Bottom Security Compliance Notice */}
          <div className="relative z-10 pt-4 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-300 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>NDPA & HIPAA Invariant Vault</span>
            </div>
            <span>TLS 1.3 / AES-256</span>
          </div>
        </div>

        {/* Right Side: Authentication Form Card */}
        <div className="col-span-1 lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            {/* Mobile Header Brand (visible when split is stacked) */}
            <div className="flex lg:hidden items-center justify-between pb-6 mb-6 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900">ClinicLedger</h1>
                  <p className="text-[11px] text-slate-500">Hospital Management & Billing System</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-200">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Secure</span>
              </div>
            </div>

            {/* Form Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md mb-2.5">
                  <Lock className="w-3.5 h-3.5 text-teal-600" />
                  <span>Clinical Workstation Portal</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Sign in to your account
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Enter your assigned credentials and department role to access clinical records and ledger tools.
                </p>
              </div>
            </div>

            {/* Quick Demo Persona Switcher */}
            <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  Quick Demo Autofill:
                </span>
                <span className="text-[11px] text-slate-400">Click to fill</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {PRESET_ACCOUNTS.map((preset) => (
                  <button
                    key={preset.email}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-left p-2 rounded-lg text-xs transition-colors border ${
                      email === preset.email
                        ? 'bg-teal-50 text-teal-900 border-teal-300 font-medium shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="truncate font-semibold text-[11px]">{preset.name.split(' ')[0]} {preset.name.split(' ')[1]}</div>
                    <div className="truncate text-[10px] text-slate-500">{preset.role.split(' ')[0]} {preset.role.split(' ')[1] || ''}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Auth Error Banner */}
            {authError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Branch Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hospital Campus / Center
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors shadow-sm"
                  >
                    <option value="Victoria Island Main Hospital">Victoria Island Main Hospital (Central Campus)</option>
                    <option value="Ikeja Outpatient Specialist Center">Ikeja Outpatient Specialist Center</option>
                    <option value="Lekki Phase 1 Pediatric Wing">Lekki Phase 1 Pediatric Wing</option>
                    <option value="Abuja Central Referral Hospital">Abuja Central Referral Hospital</option>
                  </select>
                </div>
              </div>

              {/* Department Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designated Staff Role
                </label>
                <div className="relative">
                  <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors shadow-sm"
                  >
                    <option value="Head of Billing & Reconciliation">Head of Billing & Financial Reconciliation</option>
                    <option value="Chief Medical Officer (CMO)">Chief Medical Officer (CMO)</option>
                    <option value="Front-Desk Administrator">Front-Desk Administrator</option>
                    <option value="Triage & Charge Nurse">Triage & Charge Nurse</option>
                    <option value="Pharmacy Operations Lead">Pharmacy Operations Lead</option>
                    <option value="Medical Laboratory Scientist">Medical Laboratory Scientist</option>
                  </select>
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Workstation Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor.name@clinicledger.ng"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors shadow-sm font-mono text-[13px]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Clinical Passcode / Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('For this demo, select any of the 4 Quick Demo buttons above to fill credentials instantly.')}
                    className="text-[11px] text-teal-600 hover:text-teal-800 transition-colors"
                  >
                    Forgot passcode?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors shadow-sm font-mono text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberTerminal}
                    onChange={(e) => setRememberTerminal(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600">Remember this medical workstation</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">Session: 8 hrs</span>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Clinical Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to ClinicLedger</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Card Footer */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Subledger Terminal Node Online</span>
            </div>
            <span className="font-mono text-[11px]">v2.6.4 · ISO 9075</span>
          </div>
        </div>

      </div>
    </div>
  );
};
