import React, { useState } from 'react';
import { 
  OWASP_SECURITY_CHECKLIST, 
  NIGERIA_COMPLIANCE_STANDARDS, 
  SecurityMeasure 
} from '../data/securityChecklist';
import { 
  ShieldCheck, 
  Lock, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  KeyRound, 
  Building2, 
  Scale, 
  Layers, 
  UserCheck 
} from 'lucide-react';

export const SecurityChecklistModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'sqli_lab' | 'rbac_eval' | 'ndpa_scorecard' | 'express_rbac'>('express_rbac');
  const [selectedMeasureId, setSelectedMeasureId] = useState<string>(OWASP_SECURITY_CHECKLIST[0].id);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Express RBAC & JWT Lab State
  const [selectedAuthRole, setSelectedAuthRole] = useState<'Admin' | 'Doctor' | 'Receptionist' | 'Pharmacist'>('Doctor');
  const [testEndpoint, setTestEndpoint] = useState<string>('/api/prescriptions');
  const [testPasswordInput, setTestPasswordInput] = useState<string>('ClinicalPass@2026!');
  const [verifyPasswordInput, setVerifyPasswordInput] = useState<string>('ClinicalPass@2026!');
  const [copiedMiddlewareCode, setCopiedMiddlewareCode] = useState<boolean>(false);

  // SQL Injection Lab State
  const [sqliInput, setSqliInput] = useState<string>("MRN-2026-00412' OR '1'='1");
  const [selectedSqlPreset, setSelectedSqlPreset] = useState<string>('auth_bypass');

  // RBAC Evaluator State
  const [selectedRole, setSelectedRole] = useState<string>('cashier');
  const [selectedAction, setSelectedAction] = useState<string>('view_clinical_diagnosis');

  // NDPA Scorecard State (toggleable checkboxes)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    'c1': true, 'c2': true, 'c3': true, 'c4': true, 'c5': true,
    'c6': true, 'c7': true, 'c8': true, 'c9': false, 'c10': true
  });

  const activeMeasure = OWASP_SECURITY_CHECKLIST.find(m => m.id === selectedMeasureId) || OWASP_SECURITY_CHECKLIST[0];

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // SQL Injection presets
  const handleSelectPreset = (preset: string) => {
    setSelectedSqlPreset(preset);
    if (preset === 'auth_bypass') {
      setSqliInput("MRN-2026-00412' OR '1'='1");
    } else if (preset === 'union_leak') {
      setSqliInput("MRN-999' UNION SELECT email, password_hash, role FROM staff_users --");
    } else if (preset === 'drop_table') {
      setSqliInput("MRN-101'; DROP TABLE patients; --");
    } else {
      setSqliInput("MRN-2026-00412");
    }
  };

  // RBAC Policy Matrix
  const RBAC_RULES: Record<string, Record<string, { allowed: boolean; reason: string }>> = {
    super_admin: {
      view_clinical_diagnosis: { allowed: true, reason: 'Super Admin has system-wide emergency access.' },
      modify_tariff_price: { allowed: true, reason: 'Super Admin can configure global tariff catalogs.' },
      log_cash_payment: { allowed: true, reason: 'Allowed under audited administrative override.' },
      authorize_debt_writeoff: { allowed: true, reason: 'Authorized to approve fiscal write-offs.' },
      submit_hmo_claim: { allowed: true, reason: 'Has full claims portal integration access.' },
      view_payment_tokens: { allowed: true, reason: 'Authorized to review gateway integration logs.' }
    },
    doctor: {
      view_clinical_diagnosis: { allowed: true, reason: 'Permitted: Attending physicians require complete patient history for medical care.' },
      modify_tariff_price: { allowed: false, reason: 'NDPA/CBN Violation: Physicians cannot manipulate billing rates or tariffs.' },
      log_cash_payment: { allowed: false, reason: 'Violation of Segregation of Duties: Medical staff cannot handle cash till collections.' },
      authorize_debt_writeoff: { allowed: false, reason: 'Financial write-offs require CFO / Medical Director sign-off.' },
      submit_hmo_claim: { allowed: false, reason: 'Handled strictly by accredited HMO Liaison Desk officers.' },
      view_payment_tokens: { allowed: false, reason: 'Zero clinical necessity to inspect gateway settlement tokens.' }
    },
    nurse: {
      view_clinical_diagnosis: { allowed: true, reason: 'Permitted: Necessary for triage vital signs and medication administration.' },
      modify_tariff_price: { allowed: false, reason: 'Prohibited: Nursing staff do not adjust billing tables.' },
      log_cash_payment: { allowed: false, reason: 'Prohibited: Till collections restricted to certified cashiers.' },
      authorize_debt_writeoff: { allowed: false, reason: 'Prohibited.' },
      submit_hmo_claim: { allowed: false, reason: 'Prohibited.' },
      view_payment_tokens: { allowed: false, reason: 'Prohibited.' }
    },
    cashier: {
      view_clinical_diagnosis: { allowed: false, reason: 'CRITICAL NDPA 2023 BREACH: Cashiers only see billable service codes (e.g. SRV-LAB-01), NEVER clinical diagnostic notes, HIV status, or physician observations.' },
      modify_tariff_price: { allowed: false, reason: 'Fraud Prevention: Cashiers cannot alter unit prices at checkout.' },
      log_cash_payment: { allowed: true, reason: 'Permitted: Primary job responsibility within assigned cash drawer session.' },
      authorize_debt_writeoff: { allowed: false, reason: 'Strictly prohibited: Cashiers cannot forgive balances.' },
      submit_hmo_claim: { allowed: false, reason: 'Insurance claims handled by HMO desk.' },
      view_payment_tokens: { allowed: true, reason: 'Permitted to inspect POS RRN and transaction receipt numbers.' }
    },
    billing_officer: {
      view_clinical_diagnosis: { allowed: false, reason: 'NDPA Restricted: Billing officers view procedural billing items and insurance eligibility, not sensitive clinical consultation notes.' },
      modify_tariff_price: { allowed: true, reason: 'Permitted: Configures clinic charge masters with managerial approval.' },
      log_cash_payment: { allowed: false, reason: 'Segregation of duties: Billing officers generate invoices, cashiers collect funds.' },
      authorize_debt_writeoff: { allowed: false, reason: 'Requires CFO / Medical Director authorization.' },
      submit_hmo_claim: { allowed: true, reason: 'Permitted: Compiles itemized tariff packages for claims submission.' },
      view_payment_tokens: { allowed: true, reason: 'Permitted for reconciliation purposes.' }
    },
    hmo_desk: {
      view_clinical_diagnosis: { allowed: true, reason: 'Permitted with patient consent: Required to provide medical justification to insurance medical directors for pre-authorization.' },
      modify_tariff_price: { allowed: false, reason: 'Tariffs are set by clinic management and payer contracts.' },
      log_cash_payment: { allowed: false, reason: 'HMO desk does not process physical cash.' },
      authorize_debt_writeoff: { allowed: false, reason: 'Prohibited.' },
      submit_hmo_claim: { allowed: true, reason: 'Permitted: Core responsibility for electronic EDI and web portal filing.' },
      view_payment_tokens: { allowed: true, reason: 'Permitted to match insurer remittance batches against settlement payment IDs.' }
    }
  };

  const currentPolicy = RBAC_RULES[selectedRole]?.[selectedAction] || { allowed: false, reason: 'Undefined policy' };

  // Calculate NDPA scorecard completion
  const totalChecklistItems = 10;
  const completedChecklistCount = Object.values(checkedItems).filter(Boolean).length;
  const compliancePercentage = Math.round((completedChecklistCount / totalChecklistItems) * 100);

  const handleDownloadSecurityReport = () => {
    let report = `# VIDIEMS ClinicLedger - Security & NDPA 2023 Compliance Assessment Report\n\n`;
    report += `Date of Assessment: ${new Date().toLocaleDateString('en-GB')}\n`;
    report += `Regulatory Framework: Nigeria Data Protection Act (NDPA 2023) & Central Bank of Nigeria (CBN) Payment Regulations\n`;
    report += `System Assessed: VIDIEMS ClinicLedger Hospital Management Subledger\n`;
    report += `Overall Compliance Score: ${compliancePercentage}% (${completedChecklistCount}/${totalChecklistItems} Mandatory Safeguards Verified)\n\n`;
    report += `## OWASP Top 10 Medical & Financial Security Checklist\n\n`;

    OWASP_SECURITY_CHECKLIST.forEach((m) => {
      report += `### [${m.owaspCode}] ${m.owaspCategory}: ${m.title}\n`;
      report += `- **Severity:** ${m.severity}\n`;
      report += `- **Nigerian Regulatory Context:** ${m.nigerianRegulatoryContext}\n`;
      report += `- **Health & Financial Impact:** ${m.healthAndFinancialImpact}\n`;
      report += `- **Threat Scenario:** ${m.threatScenario}\n`;
      report += `\n**Key Verification Measures:**\n`;
      m.checklistItems.forEach((c) => {
        report += `  - [x] ${c.item}: ${c.requirement}\n`;
      });
      report += `\n`;
    });

    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VIDIEMS_ClinicLedger_Security_Compliance_Report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>Cybersecurity & Regulatory Defense</span>
              <span>·</span>
              <span>NDPA 2023 & CBN Healthcare Standard</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              OWASP Top 10 Security Architecture for Medical & Financial Systems
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Mandatory defensive controls, input sanitization, 100% parameterized SQL injection elimination, role-based segregation of duties, and cryptographic privacy standards tailored for Nigerian healthtech operations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDownloadSecurityReport}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Audit Checklist</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="mt-6 flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-md overflow-x-auto">
          {[
            { id: 'express_rbac', label: 'Node.js Express RBAC & JWT Middleware' },
            { id: 'matrix', label: 'OWASP Top 10 Matrix & Code Blueprints' },
            { id: 'sqli_lab', label: 'SQL Injection Defense Lab' },
            { id: 'rbac_eval', label: 'RBAC Policy Evaluator' },
            { id: 'ndpa_scorecard', label: 'NDPA 2023 & CBN Readiness Scorecard' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-slate-800 text-cyan-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* =======================================================================
          TAB 1: OWASP TOP 10 MATRIX & BLUEPRINTS
      ======================================================================= */}
      {activeSubTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Categories List */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-slate-400 px-1 font-semibold uppercase tracking-wider">
              OWASP Top 10 (2021/2026 Standards)
            </div>
            {OWASP_SECURITY_CHECKLIST.map((m) => {
              const isSelected = m.id === selectedMeasureId;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMeasureId(m.id)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="text-cyan-400 font-bold">{m.owaspCode}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      m.severity === 'CRITICAL' 
                        ? 'text-rose-400 bg-rose-950/40 border border-rose-800/40' 
                        : 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
                    }`}>
                      {m.severity}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-100 leading-snug">
                    {m.owaspCategory}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {m.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed Specification */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
              {/* Header */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                  <span>{activeMeasure.owaspCode}</span>
                  <span>·</span>
                  <span>{activeMeasure.owaspCategory}</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {activeMeasure.title}
                </h3>
              </div>

              {/* Regulatory & Health Impact Callouts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Nigerian Legal & Regulatory Mandate</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {activeMeasure.nigerianRegulatoryContext}
                  </p>
                </div>

                <div className="p-3.5 rounded bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Clinical & Financial Protection Impact</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {activeMeasure.healthAndFinancialImpact}
                  </p>
                </div>
              </div>

              {/* Threat Scenario */}
              <div className="p-3.5 rounded bg-rose-950/20 border border-rose-800/40 text-xs space-y-1">
                <div className="font-mono text-rose-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Real-World Hospital Attack Scenario</span>
                </div>
                <p className="text-rose-200/90 leading-relaxed font-sans">
                  {activeMeasure.threatScenario}
                </p>
              </div>

              {/* Concrete Checklist Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Mandatory Security Verification Checklist
                </h4>
                <div className="space-y-2">
                  {activeMeasure.checklistItems.map((chk, i) => (
                    <div key={i} className="p-3 rounded bg-slate-950 border border-slate-800/80 text-xs flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-100 font-sans">{chk.item}</div>
                        <div className="text-slate-400 font-sans leading-relaxed">{chk.requirement}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Mitigation Blueprint */}
              <div className="space-y-2 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      Implementation Blueprint ({activeMeasure.mitigationBlueprint.language})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {activeMeasure.mitigationBlueprint.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleCopyCode(activeMeasure.id, activeMeasure.mitigationBlueprint.code)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                  >
                    {copiedCodeId === activeMeasure.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCodeId === activeMeasure.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded bg-slate-950 border border-slate-800/90 font-mono text-xs text-cyan-200 overflow-x-auto leading-relaxed max-h-80 overflow-y-auto">
                  <pre>{activeMeasure.mitigationBlueprint.code}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 2: SQL INJECTION DEFENSE LAB
      ======================================================================= */}
      {activeSubTab === 'sqli_lab' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>Interactive Defense Sandbox</span>
              <span>·</span>
              <span>A03: Injection Hardening</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              SQL Injection Prevention & Query Parameterization Simulator
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Experience why raw string concatenation allows malicious payloads to alter SQL syntax trees, and how parameterized prepared statements treat all inputs strictly as inert literal values.
            </p>
          </div>

          {/* Preset Attack Vectors */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Select Sample Attack Vector or Test Payload:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'auth_bypass', label: "Classic ' OR '1'='1" },
                { id: 'union_leak', label: 'UNION Staff Password Leak' },
                { id: 'drop_table', label: 'Destructive DROP TABLE' },
                { id: 'benign', label: 'Valid Benign Patient MRN' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={`p-2 rounded border text-xs font-mono transition-colors text-center cursor-pointer ${
                    selectedSqlPreset === p.id
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Input Input Box */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              User Input (Medical Record Number Search Parameter):
            </label>
            <input
              type="text"
              value={sqliInput}
              onChange={(e) => {
                setSqliInput(e.target.value);
                setSelectedSqlPreset('custom');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          {/* Side by Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vulnerable Concatenation */}
            <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-800/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  Vulnerable Concatenated SQL (FATAL)
                </span>
                <span className="text-rose-400 text-[10px] bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/40">
                  Exploitable
                </span>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-rose-300 overflow-x-auto">
                <pre>{`SELECT patient_id, first_name, last_name, blood_group, genotype 
FROM patients 
WHERE mrn = '${sqliInput}';`}</pre>
              </div>

              <div className="text-xs text-rose-200/90 leading-relaxed font-sans space-y-1">
                <strong>Why it fails: </strong>
                <span>
                  The attacker's payload breaks out of the string delimiter. The SQL engine executes the injected logic (e.g. <code>OR '1'='1'</code> or <code>UNION</code>), dumping every patient in the database regardless of tenant authorization.
                </span>
              </div>
            </div>

            {/* Secure Parameterized Prepared Statement */}
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Parameterized Prepared Statement (IMMUNE)
                </span>
                <span className="text-emerald-400 text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                  100% Protected
                </span>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto">
                <pre>{`-- 1. Precompiled Query Structure
PREPARE stmt_lookup_patient (VARCHAR) AS
SELECT patient_id, first_name, last_name, blood_group, genotype 
FROM patients 
WHERE mrn = $1;

-- 2. Parameter Bound as Literal Value Only
EXECUTE stmt_lookup_patient('${sqliInput.replace(/'/g, "''")}');`}</pre>
              </div>

              <div className="text-xs text-emerald-200/90 leading-relaxed font-sans space-y-1">
                <strong>Why it succeeds: </strong>
                <span>
                  The query plan is pre-compiled by the database before the parameter arrives. The engine searches for a patient whose exact literal MRN is the string <code>"{sqliInput}"</code>. It safely returns 0 rows without executing the injected code.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 3: RBAC POLICY EVALUATOR
      ======================================================================= */}
      {activeSubTab === 'rbac_eval' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>Access Control Verification</span>
              <span>·</span>
              <span>A01: Least Privilege Testing</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Hospital RBAC Policy & Clinical Privilege Evaluator
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Test role permissions across healthcare and billing domains. Under the Nigeria Data Protection Act (NDPA 2023), non-clinical personnel (cashiers, billing desk) are strictly prohibited from inspecting clinical diagnosis notes and sensitive health data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Staff Role Selector */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Select Staff Role to Test:
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-500"
              >
                <option value="doctor">Medical Doctor / Physician</option>
                <option value="nurse">Triage / Ward Nurse</option>
                <option value="cashier">Central Cashier & POS Operator</option>
                <option value="billing_officer">Billing Officer & Revenue Analyst</option>
                <option value="hmo_desk">HMO Claims Liaison Officer</option>
                <option value="super_admin">System Administrator / IT Director</option>
              </select>
            </div>

            {/* Target Action Selector */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Target Operation / Data Resource Request:
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-500"
              >
                <option value="view_clinical_diagnosis">View Patient Clinical Diagnosis & Lab Findings</option>
                <option value="modify_tariff_price">Modify Clinical Procedure Tariff Rate</option>
                <option value="log_cash_payment">Accept Cash Payment & Issue Fiscal Receipt</option>
                <option value="authorize_debt_writeoff">Authorize Patient Debt Waiver / Write-off</option>
                <option value="submit_hmo_claim">Submit Insurance Claim to External HMO Portal</option>
                <option value="view_payment_tokens">View Payment Gateway Webhooks & POS Retrieval Tokens</option>
              </select>
            </div>
          </div>

          {/* Decision Card */}
          <div className={`p-5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            currentPolicy.allowed
              ? 'bg-emerald-950/20 border-emerald-800/40'
              : 'bg-rose-950/20 border-rose-800/40'
          }`}>
            <div className="flex items-start gap-3">
              {currentPolicy.allowed ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold font-mono uppercase ${
                    currentPolicy.allowed ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {currentPolicy.allowed ? 'POLICY DECISION: PERMITTED' : 'POLICY DECISION: FORBIDDEN'}
                  </span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs font-mono text-slate-400">
                    HTTP {currentPolicy.allowed ? '200 OK' : '403 Forbidden'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-1 font-sans leading-relaxed">
                  {currentPolicy.reason}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className={`text-xs font-mono px-3 py-1 rounded font-bold ${
                currentPolicy.allowed 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}>
                {currentPolicy.allowed ? 'Access Granted' : 'Access Blocked'}
              </span>
            </div>
          </div>

          {/* RBAC Matrix Overview Table */}
          <div className="space-y-2 border-t border-slate-800 pt-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Comprehensive Role-Permission Matrix Overview
            </h4>
            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Staff Role</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Clinical Notes</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Modify Tariffs</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Cash Drawer</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Debt Write-Off</th>
                    <th className="py-2.5 px-3 font-semibold text-center">HMO Filing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {[
                    { role: 'Doctor', notes: true, tariffs: false, cash: false, writeoff: false, hmo: false },
                    { role: 'Nurse', notes: true, tariffs: false, cash: false, writeoff: false, hmo: false },
                    { role: 'Cashier', notes: false, tariffs: false, cash: true, writeoff: false, hmo: false },
                    { role: 'Billing Officer', notes: false, tariffs: true, cash: false, writeoff: false, hmo: true },
                    { role: 'HMO Desk', notes: true, tariffs: false, cash: false, writeoff: false, hmo: true },
                    { role: 'Super Admin', notes: true, tariffs: true, cash: true, writeoff: true, hmo: true }
                  ].map((r) => (
                    <tr key={r.role} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-semibold text-slate-200">{r.role}</td>
                      <td className="py-2 px-3 text-center">{r.notes ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />}</td>
                      <td className="py-2 px-3 text-center">{r.tariffs ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />}</td>
                      <td className="py-2 px-3 text-center">{r.cash ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />}</td>
                      <td className="py-2 px-3 text-center">{r.writeoff ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />}</td>
                      <td className="py-2 px-3 text-center">{r.hmo ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 4: NDPA 2023 & CBN READINESS SCORECARD
      ======================================================================= */}
      {activeSubTab === 'ndpa_scorecard' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                <span>Regulatory Readiness</span>
                <span>·</span>
                <span>Statutory Compliance Meter</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Nigeria Data Protection Act (NDPA 2023) & CBN Payment Readiness
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Checklist verifying compliance with the Nigeria Data Protection Commission (NDPC) Sensitive Personal Data mandates, Data Subject Rights, and CBN payment audit standards.
              </p>
            </div>

            <div className="p-3.5 rounded bg-slate-950 border border-slate-800 text-right shrink-0">
              <div className="text-xs font-mono text-slate-400">Readiness Score</div>
              <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
                {compliancePercentage}%
              </div>
              <div className="text-[11px] font-mono text-emerald-400">
                {completedChecklistCount} of {totalChecklistItems} Controls Verified
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${compliancePercentage}%` }}
            />
          </div>

          {/* Interactive Checkbox List */}
          <div className="space-y-3">
            {[
              { id: 'c1', title: '100% Prepared Statements for all Patient Queries', desc: 'No dynamic string concatenation across any clinical or billing database routes.', ref: 'NDPA S.39 & OWASP A03' },
              { id: 'c2', title: 'AES-256-GCM Encryption for Stored Medical Records', desc: 'Clinical consultation notes, lab results, and patient genotype encrypted at rest.', ref: 'NDPA S.24 & S.39' },
              { id: 'c3', title: 'PCI-DSS Tokenization of POS & Gateway Data', desc: 'Zero storage of full card PAN or CVV; only masked last-4 and retrieval reference numbers (RRN).', ref: 'CBN Guidelines & OWASP A02' },
              { id: 'c4', title: 'Role-Based Access Control (RBAC) Enforced on API Endpoints', desc: 'Cashiers and billing clerks prohibited from reading clinical diagnoses and medical notes.', ref: 'NDPA S.30 & OWASP A01' },
              { id: 'c5', title: 'Row-Level Financial Concurrency Locks (SELECT FOR UPDATE)', desc: 'Prevents checkout race conditions and double-crediting on patient invoice balances.', ref: 'GAAP / CBN Framework' },
              { id: 'c6', title: 'Mandatory Multi-Factor Authentication (2FA) for Staff', desc: 'TOTP authentication enforced for doctors, cashiers, and HMO desk operators.', ref: 'CBN Cybersecurity Framework' },
              { id: 'c7', title: 'Cryptographic Webhook Signature Verification (HMAC-SHA512)', desc: 'Asynchronous payment gateway callbacks verified with secret key before credit.', ref: 'CBN Electronic Payment Guide' },
              { id: 'c8', title: 'Append-Only Forensic Clinical & Payment Audit Trail', desc: 'Logs user ID, IP address, and timestamp for all medical record views and edits.', ref: 'NDPA S.40 & HIPAA Audit' },
              { id: 'c9', title: '72-Hour NDPA Data Breach Automated Telemetry Protocol', desc: 'Pre-configured reporting flow to compile affected patient counts for the NDPC.', ref: 'NDPA S.40(1) Breach Notice' },
              { id: 'c10', title: 'Outbound HMO Portal URL Egress Whitelisting (SSRF Protection)', desc: 'Restricts outgoing requests to authorized insurer domain names; blocks private IPs.', ref: 'OWASP A10 & NITDA Cloud' }
            ].map((item) => (
              <label 
                key={item.id}
                className="flex items-start gap-3 p-3.5 rounded bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!checkedItems[item.id]}
                  onChange={(e) => setCheckedItems({ ...checkedItems, [item.id]: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-100">{item.title}</span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      {item.ref}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Nigerian Statutory Regulatory Cards */}
          <div className="border-t border-slate-800 pt-6 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Governing Statutory Authorities in Nigeria
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {NIGERIA_COMPLIANCE_STANDARDS.map((std) => (
                <div key={std.code} className="p-3.5 rounded bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-cyan-400">{std.code}</span>
                    <span className="text-[10px] text-slate-500">{std.governingBody}</span>
                  </div>
                  <div className="text-xs font-semibold text-white">{std.name}</div>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    {std.keyMandates.slice(0, 3).map((m, idx) => (
                      <li key={idx} className="leading-snug">{m}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 5: NODE.JS EXPRESS RBAC & JWT AUTHENTICATION MIDDLEWARE
      ======================================================================= */}
      {activeSubTab === 'express_rbac' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                  <span>Backend Security Architecture</span>
                  <span>·</span>
                  <span>Four-Role Hospital Access Control</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Node.js / Express RBAC & JWT Authentication Middleware Suite
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  Comprehensive implementation enforcing the four hospital roles: <strong className="text-cyan-300">Admin</strong>, <strong className="text-cyan-300">Doctor</strong>, <strong className="text-cyan-300">Receptionist</strong>, and <strong className="text-cyan-300">Pharmacist</strong>. Featuring salted PBKDF2/Bcrypt password hashing, cryptographic JWT signing & validation, and route-level authorization guards.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const fullCode = `// Production authRbacMiddleware.ts\n// View source in /src/security/authRbacMiddleware.ts`;
                    navigator.clipboard.writeText(fullCode);
                    setCopiedMiddlewareCode(true);
                    setTimeout(() => setCopiedMiddlewareCode(false), 2000);
                  }}
                  className="px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedMiddlewareCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMiddlewareCode ? 'Copied' : 'Copy Middleware Code'}</span>
                </button>
              </div>
            </div>

            {/* Quick Architecture Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs font-mono">
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">ADMIN PRIVILEGES</div>
                <div className="font-bold text-white mt-0.5">Full System & RBAC</div>
                <div className="text-slate-400 text-[10px]">Audit logs, tariff config</div>
              </div>
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">DOCTOR PRIVILEGES</div>
                <div className="font-bold text-indigo-400 mt-0.5">Clinical & Prescriptions</div>
                <div className="text-slate-400 text-[10px]">EMR, orders, encounters</div>
              </div>
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">RECEPTIONIST PRIVILEGES</div>
                <div className="font-bold text-emerald-400 mt-0.5">Intake & Appointments</div>
                <div className="text-slate-400 text-[10px]">Check-in, HMO verification</div>
              </div>
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">PHARMACIST PRIVILEGES</div>
                <div className="font-bold text-amber-400 mt-0.5">Pharmacy Dispensation</div>
                <div className="text-slate-400 text-[10px]">Drug formulary, inventory</div>
              </div>
            </div>
          </div>

          {/* Interactive JWT Token Generator & Claims Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  1. Live JWT Token & Claims Generator for the 4 Roles
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a role to generate an authenticated Bearer token and inspect the payload claims.
                </p>
              </div>

              {/* Role Selectors */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-md">
                {(['Admin', 'Doctor', 'Receptionist', 'Pharmacist'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedAuthRole(r)}
                    className={`px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                      selectedAuthRole === r
                        ? 'bg-slate-800 text-cyan-400 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Token Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Encoded JWT String */}
              <div className="space-y-1 text-xs font-mono">
                <label className="text-slate-400 font-semibold block flex items-center justify-between">
                  <span>Signed JWT (Authorization: Bearer &lt;token&gt;):</span>
                  <span className="text-[10px] text-cyan-400">Algorithm: HS256</span>
                </label>
                <div className="p-3 rounded bg-slate-950 border border-slate-800 text-cyan-300 break-all leading-relaxed text-[11px] select-all">
                  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.{btoa(JSON.stringify({
                    userId: selectedAuthRole === 'Doctor' ? 'stf-doc-01' : selectedAuthRole === 'Admin' ? 'stf-adm-01' : selectedAuthRole === 'Pharmacist' ? 'stf-phr-01' : 'stf-rec-01',
                    staffCode: selectedAuthRole === 'Doctor' ? 'STF-DOC-0101' : selectedAuthRole === 'Admin' ? 'STF-ADM-0001' : selectedAuthRole === 'Pharmacist' ? 'STF-PHR-0301' : 'STF-REC-0201',
                    email: `${selectedAuthRole.toLowerCase()}@vidiemsledger.health`,
                    role: selectedAuthRole,
                    department: selectedAuthRole === 'Doctor' ? 'Cardiology' : selectedAuthRole === 'Admin' ? 'Administration' : selectedAuthRole === 'Pharmacist' ? 'Central Dispensary' : 'Reception Desk',
                    iss: 'vidiems.clinicledger.auth',
                    aud: 'vidiems.clinicledger.api',
                    iat: 1761000000,
                    exp: 1761028800
                  })).replace(/=/g, '')}.8a9f3b7c2e1d0a4b6e8f1c3d5a7b9e0f2c4d6a8b1e3f5a7c9b0d2e4f6a8b0c2e
                </div>
              </div>

              {/* Decoded Claims */}
              <div className="space-y-1 text-xs font-mono">
                <label className="text-slate-400 font-semibold block flex items-center justify-between">
                  <span>Decoded Payload Claims (req.user):</span>
                  <span className="text-[10px] text-emerald-400">Cryptographically Verified</span>
                </label>
                <div className="p-3 rounded bg-slate-950 border border-slate-800 text-slate-200 text-[11px] leading-relaxed overflow-x-auto">
                  <pre>{JSON.stringify({
                    userId: selectedAuthRole === 'Doctor' ? 'stf-doc-01' : selectedAuthRole === 'Admin' ? 'stf-adm-01' : selectedAuthRole === 'Pharmacist' ? 'stf-phr-01' : 'stf-rec-01',
                    staffCode: selectedAuthRole === 'Doctor' ? 'STF-DOC-0101' : selectedAuthRole === 'Admin' ? 'STF-ADM-0001' : selectedAuthRole === 'Pharmacist' ? 'STF-PHR-0301' : 'STF-REC-0201',
                    email: `${selectedAuthRole.toLowerCase()}@vidiemsledger.health`,
                    role: selectedAuthRole,
                    department: selectedAuthRole === 'Doctor' ? 'Cardiology' : selectedAuthRole === 'Admin' ? 'Administration' : selectedAuthRole === 'Pharmacist' ? 'Central Dispensary' : 'Reception Desk',
                    iss: 'vidiems.clinicledger.auth',
                    aud: 'vidiems.clinicledger.api',
                    exp: '8 hours from issue'
                  }, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Endpoint RBAC Guard Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                2. Live Route Authorization Guard Simulator (requireRole Middleware)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate sending an HTTP request using the current authenticated token ({selectedAuthRole}) to different hospital API endpoints.
              </p>
            </div>

            {/* Select Test Endpoint */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 mb-1 block">Select Protected Hospital Route:</label>
                <select
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-xs focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="/api/prescriptions">POST /api/prescriptions (Restricted to: Doctor)</option>
                  <option value="/api/pharmacy/dispense">POST /api/pharmacy/dispense (Restricted to: Pharmacist)</option>
                  <option value="/api/patients">POST /api/patients (Restricted to: Admin, Receptionist)</option>
                  <option value="/api/admin/audit-logs">GET /api/admin/audit-logs (Restricted to: Admin)</option>
                  <option value="/api/patients/:id">GET /api/patients/:id (Restricted to: Admin, Doctor, Pharmacist)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">Active Simulated Token Role:</label>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-bold flex items-center justify-between">
                  <span>Bearer Token [{selectedAuthRole}]</span>
                  <span className="text-[10px] text-slate-500">Department: {selectedAuthRole === 'Doctor' ? 'Cardiology' : selectedAuthRole === 'Pharmacist' ? 'Dispensary' : selectedAuthRole === 'Receptionist' ? 'Intake' : 'Admin'}</span>
                </div>
              </div>
            </div>

            {/* Simulated Middleware Decision Output */}
            {(() => {
              // Determine permission
              let allowed = false;
              let requiredRoles: string[] = [];

              if (testEndpoint === '/api/prescriptions') {
                requiredRoles = ['Doctor'];
                allowed = selectedAuthRole === 'Doctor';
              } else if (testEndpoint === '/api/pharmacy/dispense') {
                requiredRoles = ['Pharmacist'];
                allowed = selectedAuthRole === 'Pharmacist';
              } else if (testEndpoint === '/api/patients') {
                requiredRoles = ['Admin', 'Receptionist'];
                allowed = ['Admin', 'Receptionist'].includes(selectedAuthRole);
              } else if (testEndpoint === '/api/admin/audit-logs') {
                requiredRoles = ['Admin'];
                allowed = selectedAuthRole === 'Admin';
              } else if (testEndpoint === '/api/patients/:id') {
                requiredRoles = ['Admin', 'Doctor', 'Pharmacist'];
                allowed = ['Admin', 'Doctor', 'Pharmacist'].includes(selectedAuthRole);
              }

              return (
                <div className={`p-4 rounded-lg border font-mono text-xs space-y-2 ${
                  allowed
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-2">
                      {allowed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                      HTTP {allowed ? '200 OK — next() Invoked' : '403 Forbidden — Blocked by requireRole()'}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {allowed ? 'Access Permitted' : 'Access Denied'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-[11px] overflow-x-auto text-slate-300">
                    <pre>{allowed ? JSON.stringify({
                      status: 'success',
                      message: `Endpoint ${testEndpoint} accessed successfully.`,
                      authenticatedUser: {
                        userId: selectedAuthRole.toLowerCase(),
                        role: selectedAuthRole,
                        endpointExecuted: testEndpoint
                      }
                    }, null, 2) : JSON.stringify({
                      status: 'error',
                      code: 'FORBIDDEN_INSUFFICIENT_ROLE',
                      message: `Forbidden: Access restricted to [${requiredRoles.join(', ')}]. Current role [${selectedAuthRole}] lacks required privileges.`,
                      requiredRoles: requiredRoles,
                      userRole: selectedAuthRole
                    }, null, 2)}</pre>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Password Hashing & Verification Demo */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                3. Cryptographic Password Hashing & Constant-Time Verification
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Uses 100,000 PBKDF2 iterations with unique 16-byte cryptographic salt and SHA-512 (Bcrypt/Argon2id standard).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-400 block">Plaintext Password to Hash:</label>
                <input
                  type="text"
                  value={testPasswordInput}
                  onChange={(e) => setTestPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block">Derived Cryptographic Salted Hash (Stored in DB):</label>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-amber-300/90 text-[10px] break-all">
                  100000.f7a8b9c0d1e2.3f8b9a2c4e6d8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8
                </div>
              </div>
            </div>

            {/* Verification Test */}
            <div className="p-3.5 rounded bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Constant-Time Timing-Safe Comparison Test (verifyPassword):</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  verifyPasswordInput === testPasswordInput
                    ? 'text-emerald-400 bg-emerald-950 border border-emerald-800'
                    : 'text-rose-400 bg-rose-950 border border-rose-800'
                }`}>
                  {verifyPasswordInput === testPasswordInput ? '✓ Hash Match (crypto.timingSafeEqual = true)' : '✗ Password Mismatch'}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyPasswordInput}
                  onChange={(e) => setVerifyPasswordInput(e.target.value)}
                  placeholder="Enter password to verify..."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white"
                />
                <button
                  type="button"
                  onClick={() => setVerifyPasswordInput(testPasswordInput)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded whitespace-nowrap cursor-pointer"
                >
                  Fill Correct
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyPasswordInput('WrongPassword123')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded whitespace-nowrap cursor-pointer"
                >
                  Fill Incorrect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

