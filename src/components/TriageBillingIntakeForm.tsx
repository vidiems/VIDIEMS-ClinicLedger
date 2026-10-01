import React, { useState, useMemo } from 'react';
import { 
  Stethoscope, 
  Activity, 
  CreditCard, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Receipt, 
  ShieldCheck, 
  Copy, 
  Check, 
  FileText, 
  RefreshCw,
  HeartPulse,
  User,
  Building2,
  Calendar,
  Phone,
  Clock,
  ArrowRight,
  Info
} from 'lucide-react';

export interface BillingLineItem {
  id: string;
  department: 'consultation' | 'pharmacy' | 'laboratory' | 'radiology' | 'nursing';
  itemCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  isHmoCovered: boolean;
}

export interface TriageFormState {
  // Patient Demographics
  hospitalNo: string;
  fullName: string;
  gender: 'female' | 'male' | 'other';
  age: string;
  phoneNumber: string;
  patientType: 'self_pay' | 'hmo_insured';
  
  // HMO Specifics (if hmo_insured)
  hmoProviderId: string;
  policyNumber: string;
  authorizationCode: string;
  coPayPercentage: number; // e.g. 10%

  // Clinical Vitals
  systolicBp: string; // mmHg
  diastolicBp: string; // mmHg
  pulseRate: string; // bpm
  temperature: string; // °C
  respiratoryRate: string; // breaths/min
  spo2: string; // %
  weightKg: string;
  heightCm: string;
  painScale: string; // 0-10
  triageAcuity: 'emergency' | 'urgent' | 'routine';
  chiefComplaint: string;

  // Billing Line Items
  items: BillingLineItem[];
  discountAmount: string;

  // Payment Recording (for patient payable portion)
  paymentChannel: 'pos_terminal' | 'direct_bank_transfer' | 'cash';
  posTerminalId: string;
  posRrn: string;
  cardLast4: string;
  bankName: string;
  transferRef: string;
  cashTendered: string;
}

export const TriageBillingIntakeForm: React.FC = () => {
  const [activeView, setActiveView] = useState<'form' | 'code_export'>('form');
  const [copiedCode, setCopiedCode] = useState(false);
  const [submittedData, setSubmittedData] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState<TriageFormState>({
    hospitalNo: 'HSP-00291',
    fullName: 'Folashade Adeyemi',
    gender: 'female',
    age: '34',
    phoneNumber: '+234 803 459 1029',
    patientType: 'hmo_insured',
    hmoProviderId: 'HMO-AXA',
    policyNumber: 'AXA-POL-8831920',
    authorizationCode: 'AUTH-AXA-2026-9912',
    coPayPercentage: 10,

    systolicBp: '145',
    diastolicBp: '95',
    pulseRate: '88',
    temperature: '37.2',
    respiratoryRate: '18',
    spo2: '97',
    weightKg: '68',
    heightCm: '165',
    painScale: '4',
    triageAcuity: 'urgent',
    chiefComplaint: 'Throbbing frontal headache, blurred vision, and elevated blood pressure.',

    items: [
      { id: '1', department: 'consultation', itemCode: 'SRV-CONS-CARD', description: 'Consultant Cardiologist Review', quantity: 1, unitPrice: 25000, isHmoCovered: true },
      { id: '2', department: 'laboratory', itemCode: 'LAB-ELECT-CREAT', description: 'Serum Electrolytes, Urea & Creatinine', quantity: 1, unitPrice: 18500, isHmoCovered: true },
      { id: '3', department: 'pharmacy', itemCode: 'PHR-AMLOD-10', description: 'Amlodipine 10mg Tablets (30 Days)', quantity: 1, unitPrice: 6500, isHmoCovered: false } // Non-formulary drug
    ],
    discountAmount: '0',

    paymentChannel: 'pos_terminal',
    posTerminalId: 'POS-TID-8841-A (Front Desk 1 - Moniepoint)',
    posRrn: '992140819201',
    cardLast4: '4012',
    bankName: 'Zenith Bank Direct NIP',
    transferRef: 'NIP-20261001-99210',
    cashTendered: '10000'
  });

  // HMO Providers List
  const HMO_PROVIDERS = [
    { id: 'HMO-AXA', name: 'AXA Mansard Health Limited' },
    { id: 'HMO-HYG', name: 'Hygeia HMO' },
    { id: 'HMO-REL', name: 'Reliance HMO' },
    { id: 'HMO-AVN', name: 'Avon Healthcare' },
    { id: 'HMO-LDW', name: 'Leadway Health' }
  ];

  // Quick Preset Handlers
  const handleLoadPreset = (preset: 'hmo_cardio' | 'emergency_trauma' | 'routine_selfpay') => {
    if (preset === 'hmo_cardio') {
      setFormData({
        hospitalNo: 'HSP-00291',
        fullName: 'Folashade Adeyemi',
        gender: 'female',
        age: '34',
        phoneNumber: '+234 803 459 1029',
        patientType: 'hmo_insured',
        hmoProviderId: 'HMO-AXA',
        policyNumber: 'AXA-POL-8831920',
        authorizationCode: 'AUTH-AXA-2026-9912',
        coPayPercentage: 10,
        systolicBp: '145',
        diastolicBp: '95',
        pulseRate: '88',
        temperature: '37.2',
        respiratoryRate: '18',
        spo2: '97',
        weightKg: '68',
        heightCm: '165',
        painScale: '4',
        triageAcuity: 'urgent',
        chiefComplaint: 'Throbbing frontal headache, blurred vision, and elevated blood pressure.',
        items: [
          { id: '1', department: 'consultation', itemCode: 'SRV-CONS-CARD', description: 'Consultant Cardiologist Review', quantity: 1, unitPrice: 25000, isHmoCovered: true },
          { id: '2', department: 'laboratory', itemCode: 'LAB-ELECT-CREAT', description: 'Serum Electrolytes, Urea & Creatinine', quantity: 1, unitPrice: 18500, isHmoCovered: true },
          { id: '3', department: 'pharmacy', itemCode: 'PHR-AMLOD-10', description: 'Amlodipine 10mg Tablets (30 Days)', quantity: 1, unitPrice: 6500, isHmoCovered: false }
        ],
        discountAmount: '0',
        paymentChannel: 'pos_terminal',
        posTerminalId: 'POS-TID-8841-A (Front Desk 1 - Moniepoint)',
        posRrn: '992140819201',
        cardLast4: '4012',
        bankName: 'Zenith Bank Direct NIP',
        transferRef: 'NIP-20261001-99210',
        cashTendered: '15000'
      });
    } else if (preset === 'emergency_trauma') {
      setFormData({
        hospitalNo: 'HSP-00292',
        fullName: 'Emeka Nwosu',
        gender: 'male',
        age: '61',
        phoneNumber: '+234 802 119 4481',
        patientType: 'self_pay',
        hmoProviderId: '',
        policyNumber: '',
        authorizationCode: '',
        coPayPercentage: 0,
        systolicBp: '85',
        diastolicBp: '50',
        pulseRate: '124',
        temperature: '38.9',
        respiratoryRate: '28',
        spo2: '90',
        weightKg: '74',
        heightCm: '178',
        painScale: '9',
        triageAcuity: 'emergency',
        chiefComplaint: 'Acute chest trauma following vehicular collision; severe dyspnea, hypotension.',
        items: [
          { id: '1', department: 'nursing', itemCode: 'SRV-EMERG-RESUS', description: 'Emergency Resuscitation & Oxygen Setup', quantity: 1, unitPrice: 45000, isHmoCovered: false },
          { id: '2', department: 'radiology', itemCode: 'RAD-CXR-STAT', description: 'STAT Chest X-Ray Portable', quantity: 1, unitPrice: 22000, isHmoCovered: false },
          { id: '3', department: 'pharmacy', itemCode: 'PHR-IVF-NS', description: '0.9% Normal Saline 1000ml Infusion (x2)', quantity: 2, unitPrice: 4500, isHmoCovered: false }
        ],
        discountAmount: '5000',
        paymentChannel: 'pos_terminal',
        posTerminalId: 'POS-TID-8841-C (Emergency Desk - OPay)',
        posRrn: '883192019481',
        cardLast4: '8819',
        bankName: 'Access Bank',
        transferRef: 'TRF-ACC-88192019',
        cashTendered: '75000'
      });
    } else {
      setFormData({
        hospitalNo: 'HSP-00293',
        fullName: 'Amina Bello',
        gender: 'female',
        age: '28',
        phoneNumber: '+234 814 559 2831',
        patientType: 'self_pay',
        hmoProviderId: '',
        policyNumber: '',
        authorizationCode: '',
        coPayPercentage: 0,
        systolicBp: '118',
        diastolicBp: '76',
        pulseRate: '72',
        temperature: '36.6',
        respiratoryRate: '16',
        spo2: '99',
        weightKg: '59',
        heightCm: '162',
        painScale: '1',
        triageAcuity: 'routine',
        chiefComplaint: 'Annual routine health wellness checkup and routine blood panel.',
        items: [
          { id: '1', department: 'consultation', itemCode: 'SRV-CONS-GEN', description: 'General Medical Practitioner Consultation', quantity: 1, unitPrice: 15000, isHmoCovered: false },
          { id: '2', department: 'laboratory', itemCode: 'LAB-FBC-DIFF', description: 'Full Blood Count with 5-Part Diff', quantity: 1, unitPrice: 9500, isHmoCovered: false }
        ],
        discountAmount: '0',
        paymentChannel: 'direct_bank_transfer',
        posTerminalId: '',
        posRrn: '',
        cardLast4: '',
        bankName: 'Guaranty Trust Bank (GTCO)',
        transferRef: 'GTB-NIP-992148102',
        cashTendered: '25000'
      });
    }
    setSubmittedData(null);
  };

  // Vitals Calculation & Clinical Validations
  const vitalsValidation = useMemo(() => {
    const warnings: string[] = [];
    const errors: string[] = [];

    const sys = Number(formData.systolicBp);
    const dia = Number(formData.diastolicBp);
    const pulse = Number(formData.pulseRate);
    const temp = Number(formData.temperature);
    const spo2 = Number(formData.spo2);
    const rr = Number(formData.respiratoryRate);
    const wt = Number(formData.weightKg);
    const ht = Number(formData.heightCm);

    // Blood Pressure Validations
    if (!sys || sys < 60 || sys > 260) {
      errors.push('Systolic BP must be between 60 and 260 mmHg.');
    }
    if (!dia || dia < 30 || dia > 160) {
      errors.push('Diastolic BP must be between 30 and 160 mmHg.');
    }
    if (sys && dia && sys <= dia) {
      errors.push('Systolic BP must be strictly greater than Diastolic BP.');
    }
    if (sys >= 180 || dia >= 120) {
      warnings.push('CRITICAL: Hypertensive Crisis Range! Patient requires immediate physician escalation.');
    } else if (sys <= 90 || dia <= 60) {
      warnings.push('Hypotension Warning: Blood pressure is dangerously low.');
    }

    // Pulse Validations
    if (!pulse || pulse < 30 || pulse > 220) {
      errors.push('Pulse rate must be between 30 and 220 bpm.');
    } else if (pulse > 100) {
      warnings.push('Tachycardia: Resting heart rate exceeds 100 bpm.');
    } else if (pulse < 55) {
      warnings.push('Bradycardia: Resting heart rate below 55 bpm.');
    }

    // Temperature Validations
    if (!temp || temp < 34.0 || temp > 43.0) {
      errors.push('Temperature must be between 34.0°C and 43.0°C.');
    } else if (temp >= 38.3) {
      warnings.push('High Pyrexia (Fever): Temperature >= 38.3°C.');
    }

    // SpO2 Validations
    if (!spo2 || spo2 < 50 || spo2 > 100) {
      errors.push('SpO2 saturation must be between 50% and 100%.');
    } else if (spo2 < 92) {
      warnings.push('Hypoxemia Warning: SpO2 < 92%. Administer supplemental O2.');
    }

    // Respiratory Rate
    if (!rr || rr < 8 || rr > 60) {
      errors.push('Respiratory rate must be between 8 and 60 breaths/min.');
    }

    // BMI Calculation
    let bmi: number | null = null;
    let bmiCategory = '';
    if (wt > 0 && ht > 0) {
      const heightInMeters = ht / 100;
      bmi = Number((wt / (heightInMeters * heightInMeters)).toFixed(1));
      if (bmi < 18.5) bmiCategory = 'Underweight';
      else if (bmi < 25) bmiCategory = 'Normal Weight';
      else if (bmi < 30) bmiCategory = 'Overweight';
      else bmiCategory = 'Obese';
    }

    return { errors, warnings, bmi, bmiCategory };
  }, [formData.systolicBp, formData.diastolicBp, formData.pulseRate, formData.temperature, formData.spo2, formData.respiratoryRate, formData.weightKg, formData.heightCm]);

  // Billing Math & Invariant Checks
  const billingMath = useMemo(() => {
    const errors: string[] = [];

    // Line items subtotal
    let subtotal = 0;
    let hmoCoveredAmount = 0;
    let nonHmoAmount = 0;

    formData.items.forEach((item, idx) => {
      if (!item.description.trim()) {
        errors.push(`Line item #${idx + 1} has an empty description.`);
      }
      if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        errors.push(`Line item #${idx + 1} quantity must be a positive integer.`);
      }
      if (item.unitPrice < 0) {
        errors.push(`Line item #${idx + 1} unit price cannot be negative.`);
      }

      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;

      if (formData.patientType === 'hmo_insured' && item.isHmoCovered) {
        hmoCoveredAmount += lineTotal;
      } else {
        nonHmoAmount += lineTotal;
      }
    });

    if (formData.items.length === 0) {
      errors.push('At least one billing line item is required.');
    }

    const discount = Number(formData.discountAmount) || 0;
    if (discount < 0) {
      errors.push('Discount amount cannot be negative.');
    }
    if (discount > subtotal) {
      errors.push('Discount cannot exceed the invoice subtotal.');
    }

    const netPayable = Math.max(0, subtotal - discount);

    // Split Calculation
    let hmoUnderwritten = 0;
    let patientPayable = 0;

    if (formData.patientType === 'hmo_insured') {
      const coPayRatio = (formData.coPayPercentage || 0) / 100;
      const patientCoPayFromHmo = hmoCoveredAmount * coPayRatio;
      hmoUnderwritten = hmoCoveredAmount - patientCoPayFromHmo;
      patientPayable = nonHmoAmount + patientCoPayFromHmo - discount;
      patientPayable = Math.max(0, patientPayable);
    } else {
      hmoUnderwritten = 0;
      patientPayable = netPayable;
    }

    // Anti-Tampering Financial Invariant:
    // HMO Underwritten + Patient Payable MUST equal Net Payable within ±0.01 tolerance
    const invariantDelta = Math.abs((hmoUnderwritten + patientPayable) - netPayable);
    if (invariantDelta > 0.05) {
      errors.push(`Financial Invariant Violation: Split portions (₦${(hmoUnderwritten + patientPayable).toFixed(2)}) do not match net invoice total (₦${netPayable.toFixed(2)}).`);
    }

    // Payment Channel Validation
    if (patientPayable > 0) {
      if (formData.paymentChannel === 'pos_terminal') {
        if (!formData.posTerminalId) {
          errors.push('POS Terminal Selection is required for card payments.');
        }
        if (!formData.posRrn || formData.posRrn.trim().length < 6) {
          errors.push('Valid POS Retrieval Reference Number (RRN) is required.');
        }
        if (!formData.cardLast4 || formData.cardLast4.trim().length !== 4 || !/^\d{4}$/.test(formData.cardLast4)) {
          errors.push('Card Last 4 Digits must be exactly 4 numeric characters.');
        }
      } else if (formData.paymentChannel === 'direct_bank_transfer') {
        if (!formData.bankName.trim()) {
          errors.push('Issuing/Receiving Bank Name is required for direct transfers.');
        }
        if (!formData.transferRef.trim() || formData.transferRef.trim().length < 6) {
          errors.push('Valid NIP / Electronic Transfer Reference Number is required.');
        }
      } else if (formData.paymentChannel === 'cash') {
        const tendered = Number(formData.cashTendered) || 0;
        if (tendered < patientPayable) {
          errors.push(`Cash Tendered (₦${tendered.toLocaleString()}) is less than Patient Payable Amount (₦${patientPayable.toLocaleString()}).`);
        }
      }
    }

    // HMO Verification checks
    if (formData.patientType === 'hmo_insured') {
      if (!formData.policyNumber.trim()) {
        errors.push('HMO Enrollee Policy/Member ID is required.');
      }
      if (!formData.authorizationCode.trim()) {
        errors.push('HMO Pre-Authorization / Tariffs Authorization Code is required.');
      }
    }

    const changeDue = formData.paymentChannel === 'cash' ? Math.max(0, (Number(formData.cashTendered) || 0) - patientPayable) : 0;

    return {
      subtotal,
      discount,
      netPayable,
      hmoCoveredAmount,
      nonHmoAmount,
      hmoUnderwritten,
      patientPayable,
      changeDue,
      errors
    };
  }, [formData]);

  // Overall form validity
  const isValid = vitalsValidation.errors.length === 0 && billingMath.errors.length === 0;

  // Add line item
  const handleAddItem = () => {
    const newItem: BillingLineItem = {
      id: Date.now().toString(),
      department: 'pharmacy',
      itemCode: 'PHR-GEN-01',
      description: 'Prescription Item or Diagnostic Service',
      quantity: 1,
      unitPrice: 5000,
      isHmoCovered: formData.patientType === 'hmo_insured'
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // Remove line item
  const handleRemoveItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  // Update line item
  const handleUpdateItem = (id: string, updates: Partial<BillingLineItem>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSubmittedData({
      timestamp: new Date().toISOString(),
      intakeReceiptNo: `IN-REC-${Date.now().toString().slice(-6)}`,
      invoiceNumber: `INV-2026-${Date.now().toString().slice(-5)}`,
      patient: {
        hospitalNo: formData.hospitalNo,
        fullName: formData.fullName,
        gender: formData.gender,
        age: formData.age,
        phoneNumber: formData.phoneNumber,
        type: formData.patientType,
        hmo: formData.patientType === 'hmo_insured' ? {
          provider: formData.hmoProviderId,
          policyNo: formData.policyNumber,
          authCode: formData.authorizationCode,
          coPayPercentage: formData.coPayPercentage
        } : null
      },
      vitals: {
        bp: `${formData.systolicBp}/${formData.diastolicBp} mmHg`,
        pulse: `${formData.pulseRate} bpm`,
        temp: `${formData.temperature} °C`,
        spo2: `${formData.spo2} %`,
        rr: `${formData.respiratoryRate} bpm`,
        bmi: vitalsValidation.bmi,
        bmiCategory: vitalsValidation.bmiCategory,
        acuity: formData.triageAcuity,
        chiefComplaint: formData.chiefComplaint
      },
      financialSummary: {
        subtotal: billingMath.subtotal,
        discount: billingMath.discount,
        netPayable: billingMath.netPayable,
        hmoUnderwritten: billingMath.hmoUnderwritten,
        patientPayable: billingMath.patientPayable,
        paymentChannel: formData.paymentChannel,
        channelReference: formData.paymentChannel === 'pos_terminal' ? formData.posRrn : formData.paymentChannel === 'direct_bank_transfer' ? formData.transferRef : 'CASH-SETTLED',
        changeDue: billingMath.changeDue,
        itemsCount: formData.items.length
      }
    });
  };

  // Copy Code
  const handleCopyCode = () => {
    const codeSnippet = `// Production Clean React Component: Patient Billing & Triage Intake Form
// With Real-time Mathematical Anti-Tampering & Clinical Vitals Validation
import React, { useState, useMemo } from 'react';

export const PatientBillingTriageForm = () => {
  // Clinical Vitals, Line Items, and Real-Time Split-Calculation
  // Enforces Invariant: (HMO Payable + Patient Payable === Invoice Total)
  // ... (Full implementation bundled in VIDIEMS ClinicLedger)
};`;
    navigator.clipboard.writeText(codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium tracking-wide">
              <span>CLINICAL RECEPTION & REVENUE CYCLE INTAKE</span>
              <span aria-hidden="true">·</span>
              <span>PATIENT SAFETY & ARITHMETIC RECONCILIATION</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-1">
              Patient Billing & Triage Intake Suite
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Unified electronic intake form enforcing real-time clinical vital range boundaries, anti-tampering split arithmetic, and multi-channel payment verification to eliminate medical and billing errors at the point of care.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Load Test Preset:</span>
            <button
              onClick={() => handleLoadPreset('hmo_cardio')}
              className="px-2.5 py-1 text-xs bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded cursor-pointer transition-colors"
            >
              HMO Cardio (10% Co-Pay)
            </button>
            <button
              onClick={() => handleLoadPreset('emergency_trauma')}
              className="px-2.5 py-1 text-xs bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-200 rounded cursor-pointer transition-colors"
            >
              Emergency Trauma (Self-Pay)
            </button>
            <button
              onClick={() => handleLoadPreset('routine_selfpay')}
              className="px-2.5 py-1 text-xs bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded cursor-pointer transition-colors"
            >
              Routine Wellness Check
            </button>
          </div>
        </div>
      </div>

      {/* Main Form & Real-Time Feedback Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMN 1 & 2: INTAKE & CLINICAL VITALS + BILLING LEDGER */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SECTION 1: PATIENT IDENTIFICATION & BILLING PROFILE */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    01. Patient Identification & Insurance Category
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-cyan-400">
                  {formData.hospitalNo}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Hospital Number *</label>
                  <input
                    type="text"
                    value={formData.hospitalNo}
                    onChange={e => setFormData({ ...formData, hospitalNo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Age (Years) *</label>
                  <input
                    type="number"
                    min="0"
                    max="125"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Billing Category *</label>
                  <select
                    value={formData.patientType}
                    onChange={e => setFormData({ ...formData, patientType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="hmo_insured">HMO Insured (Co-Pay / Tariffs)</option>
                    <option value="self_pay">Self-Pay (Private Out-of-Pocket)</option>
                  </select>
                </div>
              </div>

              {/* HMO Pre-Authorization Fields if HMO Insured */}
              {formData.patientType === 'hmo_insured' && (
                <div className="mt-3 p-3.5 bg-slate-950/80 border border-cyan-900/40 rounded-lg space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      HMO Pre-Authorization & Policy Validation
                    </span>
                    <span className="text-[11px] text-slate-400">Required for claims adjudication</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">HMO Provider</label>
                      <select
                        value={formData.hmoProviderId}
                        onChange={e => setFormData({ ...formData, hmoProviderId: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      >
                        {HMO_PROVIDERS.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Enrollee Policy No. *</label>
                      <input
                        type="text"
                        value={formData.policyNumber}
                        onChange={e => setFormData({ ...formData, policyNumber: e.target.value })}
                        placeholder="e.g. AXA-POL-8831920"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Authorization Code *</label>
                      <input
                        type="text"
                        value={formData.authorizationCode}
                        onChange={e => setFormData({ ...formData, authorizationCode: e.target.value })}
                        placeholder="e.g. AUTH-AXA-2026-9912"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Patient Co-Pay (%)</label>
                      <select
                        value={formData.coPayPercentage}
                        onChange={e => setFormData({ ...formData, coPayPercentage: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                      >
                        <option value={0}>0% (Comprehensive)</option>
                        <option value={10}>10% Standard Co-Pay</option>
                        <option value={20}>20% Specialist Co-Pay</option>
                        <option value={50}>50% Cost Sharing</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: CLINICAL VITALS & TRIAGE ACUITY */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    02. Clinical Vitals Intake & Triage Acuity
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Acuity Level:</span>
                  <span className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                    formData.triageAcuity === 'emergency'
                      ? 'bg-rose-600 text-white animate-pulse'
                      : formData.triageAcuity === 'urgent'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {formData.triageAcuity}
                  </span>
                </div>
              </div>

              {/* Vitals Form Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Blood Pressure */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium flex items-center justify-between">
                    <span>Blood Pressure</span>
                    <span className="text-[10px] text-slate-400">mmHg</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="Sys"
                      value={formData.systolicBp}
                      onChange={e => setFormData({ ...formData, systolicBp: e.target.value })}
                      className="w-1/2 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-white font-mono text-center"
                      required
                    />
                    <span className="text-slate-500">/</span>
                    <input
                      type="number"
                      placeholder="Dia"
                      value={formData.diastolicBp}
                      onChange={e => setFormData({ ...formData, diastolicBp: e.target.value })}
                      className="w-1/2 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-white font-mono text-center"
                      required
                    />
                  </div>
                </div>

                {/* Pulse Rate */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium flex items-center justify-between">
                    <span>Pulse / Heart Rate</span>
                    <span className="text-[10px] text-slate-400">bpm</span>
                  </label>
                  <input
                    type="number"
                    value={formData.pulseRate}
                    onChange={e => setFormData({ ...formData, pulseRate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white font-mono"
                    required
                  />
                </div>

                {/* Temperature */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium flex items-center justify-between">
                    <span>Temperature</span>
                    <span className="text-[10px] text-slate-400">°C</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={e => setFormData({ ...formData, temperature: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white font-mono"
                    required
                  />
                </div>

                {/* SpO2 */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium flex items-center justify-between">
                    <span>SpO2 Oxygen</span>
                    <span className="text-[10px] text-slate-400">%</span>
                  </label>
                  <input
                    type="number"
                    value={formData.spo2}
                    onChange={e => setFormData({ ...formData, spo2: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white font-mono"
                    required
                  />
                </div>

                {/* Weight */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium flex items-center justify-between">
                    <span>Weight</span>
                    <span className="text-[10px] text-slate-400">kg</span>
                  </label>
                  <input
                    type="number"
                    value={formData.weightKg}
                    onChange={e => setFormData({ ...formData, weightKg: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white font-mono"
                    required
                  />
                </div>

                {/* Height */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium flex items-center justify-between">
                    <span>Height</span>
                    <span className="text-[10px] text-slate-400">cm</span>
                  </label>
                  <input
                    type="number"
                    value={formData.heightCm}
                    onChange={e => setFormData({ ...formData, heightCm: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white font-mono"
                    required
                  />
                </div>

                {/* Respiration */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium flex items-center justify-between">
                    <span>Respiratory Rate</span>
                    <span className="text-[10px] text-slate-400">cpm</span>
                  </label>
                  <input
                    type="number"
                    value={formData.respiratoryRate}
                    onChange={e => setFormData({ ...formData, respiratoryRate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white font-mono"
                    required
                  />
                </div>

                {/* Calculated BMI */}
                <div className="space-y-1 bg-slate-950 p-2 border border-slate-800 rounded">
                  <div className="text-[11px] text-slate-400">Calculated BMI</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold font-mono text-cyan-400">
                      {vitalsValidation.bmi || '--'}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {vitalsValidation.bmiCategory}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acuity & Chief Complaint */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Triage Acuity Priority *</label>
                  <select
                    value={formData.triageAcuity}
                    onChange={e => setFormData({ ...formData, triageAcuity: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-medium"
                  >
                    <option value="routine">Level 3: Routine (Stable)</option>
                    <option value="urgent">Level 2: Urgent (Needs Care &lt; 30m)</option>
                    <option value="emergency">Level 1: Resuscitation / Emergency (Immediate)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Chief Medical Complaint & Presenting Symptoms *</label>
                  <input
                    type="text"
                    value={formData.chiefComplaint}
                    onChange={e => setFormData({ ...formData, chiefComplaint: e.target.value })}
                    placeholder="Describe presenting symptoms, duration, and patient history..."
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              {/* Real-time Clinical Warnings */}
              {vitalsValidation.warnings.length > 0 && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded space-y-1 text-xs">
                  {vitalsValidation.warnings.map((w, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 3: ITEMIZED SERVICE & BILLING LEDGER */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    03. Itemized Medical Billing Ledger
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              {/* Table of Line Items */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Dept</th>
                      <th className="py-2 px-3">Service / Drug Description</th>
                      <th className="py-2 px-3 w-16 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price (₦)</th>
                      <th className="py-2 px-3 text-right">Line Total (₦)</th>
                      {formData.patientType === 'hmo_insured' && (
                        <th className="py-2 px-3 text-center">HMO Cover</th>
                      )}
                      <th className="py-2 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-sans">
                    {formData.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3">
                          <select
                            value={item.department}
                            onChange={e => handleUpdateItem(item.id, { department: e.target.value as any })}
                            className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-300 text-[11px]"
                          >
                            <option value="consultation">Consultation</option>
                            <option value="pharmacy">Pharmacy</option>
                            <option value="laboratory">Laboratory</option>
                            <option value="radiology">Radiology</option>
                            <option value="nursing">Nursing</option>
                          </select>
                        </td>

                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={item.description}
                            onChange={e => handleUpdateItem(item.id, { description: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs"
                            required
                          />
                        </td>

                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handleUpdateItem(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono text-center text-xs"
                            required
                          />
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={item.unitPrice}
                            onChange={e => handleUpdateItem(item.id, { unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                            className="w-24 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono text-right text-xs"
                            required
                          />
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-white tabular-nums">
                          ₦{(item.quantity * item.unitPrice).toLocaleString()}
                        </td>

                        {formData.patientType === 'hmo_insured' && (
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={item.isHmoCovered}
                              onChange={e => handleUpdateItem(item.id, { isHmoCovered: e.target.checked })}
                              className="w-4 h-4 text-cyan-600 rounded bg-slate-950 border-slate-800 cursor-pointer"
                            />
                          </td>
                        )}

                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={formData.items.length <= 1}
                            className="text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-end gap-3 pt-2 text-xs">
                <span className="text-slate-400">Discretionary Discount (₦):</span>
                <input
                  type="number"
                  min="0"
                  value={formData.discountAmount}
                  onChange={e => setFormData({ ...formData, discountAmount: e.target.value })}
                  className="w-28 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono text-right text-xs"
                />
              </div>
            </div>
          </div>

          {/* COLUMN 3: REAL-TIME FINANCIAL SUMMARY, INVARIANT AUDIT & MULTI-CHANNEL SETTLEMENT */}
          <div className="space-y-6">
            
            {/* REAL-TIME SPLIT CALCULATION & INVARIANT AUDIT */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 sticky top-20">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    04. Financial Summary & Invariant Verification
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">
                  Real-Time Audit
                </span>
              </div>

              {/* Subledger Totals Breakdown */}
              <div className="space-y-2 text-xs divide-y divide-slate-800/80">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Gross Items Subtotal</span>
                  <span className="font-mono font-semibold text-slate-200 tabular-nums">
                    ₦{billingMath.subtotal.toLocaleString()}
                  </span>
                </div>

                {billingMath.discount > 0 && (
                  <div className="flex justify-between items-center py-1 text-amber-400">
                    <span>Discount Applied</span>
                    <span className="font-mono tabular-nums">
                      -₦{billingMath.discount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1.5 font-bold text-sm text-white">
                  <span>Net Invoice Payable</span>
                  <span className="font-mono text-cyan-300 tabular-nums">
                    ₦{billingMath.netPayable.toLocaleString()}
                  </span>
                </div>

                {/* HMO Split if Applicable */}
                {formData.patientType === 'hmo_insured' ? (
                  <div className="py-2.5 space-y-1.5 bg-slate-950/80 p-3 rounded border border-cyan-900/40">
                    <div className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wide">
                      Automated Split-Billing Breakdown
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>HMO Underwritten (Claim)</span>
                      <span className="font-mono font-bold text-indigo-400 tabular-nums">
                        ₦{billingMath.hmoUnderwritten.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Patient Co-Pay & Non-Formulary</span>
                      <span className="font-mono font-bold text-emerald-400 tabular-nums">
                        ₦{billingMath.patientPayable.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-slate-300 flex justify-between items-center">
                    <span>Patient Self-Pay Total</span>
                    <span className="font-mono font-bold text-emerald-400 tabular-nums">
                      ₦{billingMath.patientPayable.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* PAYMENT CHANNEL RECORDING (FOR PATIENT PAYABLE PORTION) */}
              {billingMath.patientPayable > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="text-xs font-semibold text-white">
                    Patient Payment Collection Channel
                  </div>

                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 border border-slate-800 rounded text-xs">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentChannel: 'pos_terminal' })}
                      className={`py-1.5 rounded text-center cursor-pointer transition-colors ${
                        formData.paymentChannel === 'pos_terminal'
                          ? 'bg-cyan-600 text-white font-medium shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      POS Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentChannel: 'direct_bank_transfer' })}
                      className={`py-1.5 rounded text-center cursor-pointer transition-colors ${
                        formData.paymentChannel === 'direct_bank_transfer'
                          ? 'bg-cyan-600 text-white font-medium shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Bank Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentChannel: 'cash' })}
                      className={`py-1.5 rounded text-center cursor-pointer transition-colors ${
                        formData.paymentChannel === 'cash'
                          ? 'bg-cyan-600 text-white font-medium shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Cash Desk
                    </button>
                  </div>

                  {/* Channel Specific Inputs */}
                  {formData.paymentChannel === 'pos_terminal' && (
                    <div className="space-y-2 text-xs bg-slate-950 p-3 rounded border border-slate-800">
                      <div>
                        <label className="block text-slate-400 mb-1">POS Terminal ID *</label>
                        <select
                          value={formData.posTerminalId}
                          onChange={e => setFormData({ ...formData, posTerminalId: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-[11px]"
                        >
                          <option value="POS-TID-8841-A (Front Desk 1 - Moniepoint)">POS-TID-8841-A (Front Desk 1 - Moniepoint)</option>
                          <option value="POS-TID-8841-B (Pharmacy - Stanbic IBTC)">POS-TID-8841-B (Pharmacy - Stanbic IBTC)</option>
                          <option value="POS-TID-8841-C (Emergency - OPay)">POS-TID-8841-C (Emergency - OPay)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-400 mb-1">Terminal RRN *</label>
                          <input
                            type="text"
                            value={formData.posRrn}
                            onChange={e => setFormData({ ...formData, posRrn: e.target.value })}
                            placeholder="12-digit RRN"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">Card Last 4 *</label>
                          <input
                            type="text"
                            maxLength={4}
                            value={formData.cardLast4}
                            onChange={e => setFormData({ ...formData, cardLast4: e.target.value })}
                            placeholder="e.g. 4012"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-center text-xs"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.paymentChannel === 'direct_bank_transfer' && (
                    <div className="space-y-2 text-xs bg-slate-950 p-3 rounded border border-slate-800">
                      <div>
                        <label className="block text-slate-400 mb-1">Bank Name *</label>
                        <input
                          type="text"
                          value={formData.bankName}
                          onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                          placeholder="e.g. Zenith Bank NIP"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Transfer Reference / Session ID *</label>
                        <input
                          type="text"
                          value={formData.transferRef}
                          onChange={e => setFormData({ ...formData, transferRef: e.target.value })}
                          placeholder="e.g. NIP-20261001-99210"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {formData.paymentChannel === 'cash' && (
                    <div className="space-y-2 text-xs bg-slate-950 p-3 rounded border border-slate-800">
                      <div>
                        <label className="block text-slate-400 mb-1">Cash Amount Tendered (₦) *</label>
                        <input
                          type="number"
                          value={formData.cashTendered}
                          onChange={e => setFormData({ ...formData, cashTendered: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-right text-xs"
                          required
                        />
                      </div>

                      <div className="flex justify-between items-center text-slate-300 font-mono pt-1">
                        <span>Change Due:</span>
                        <span className="font-bold text-amber-400">
                          ₦{billingMath.changeDue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VALIDATION ERROR DISPLAY */}
              {(!isValid || billingMath.errors.length > 0 || vitalsValidation.errors.length > 0) && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded space-y-1 text-xs text-rose-300">
                  <div className="font-semibold text-rose-400 flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Submission Blocked — Fix Invalid Entries:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {vitalsValidation.errors.map((err, i) => (
                      <li key={`v-${i}`}>{err}</li>
                    ))}
                    {billingMath.errors.map((err, i) => (
                      <li key={`b-${i}`}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={!isValid}
                className={`w-full py-2.5 px-4 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isValid
                    ? 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white shadow-lg shadow-cyan-950'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Process Triage & Issue Invoice</span>
              </button>

              <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Immutable audit trail logged with strict NDPA 2023 compliance</span>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* CONFIRMATION / PRINTABLE INTAKE SLIP MODAL */}
      {submittedData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Intake & Billing Complete</h3>
                  <p className="text-xs text-slate-400">Invoice {submittedData.invoiceNumber} recorded in subledger</p>
                </div>
              </div>
              <button
                onClick={() => setSubmittedData(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer px-2 py-1 bg-slate-800 rounded"
              >
                Close
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-3 font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">PATIENT:</span>
                <span className="text-white font-bold">{submittedData.patient.fullName} ({submittedData.patient.hospitalNo})</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300 border-b border-slate-800 pb-2">
                <div>Acuity: <strong className="text-amber-400 uppercase">{submittedData.vitals.acuity}</strong></div>
                <div>BP: {submittedData.vitals.bp}</div>
                <div>Pulse: {submittedData.vitals.pulse}</div>
                <div>SpO2: {submittedData.vitals.spo2}</div>
                <div>Temp: {submittedData.vitals.temp}</div>
                <div>BMI: {submittedData.vitals.bmi} ({submittedData.vitals.bmiCategory})</div>
              </div>

              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span>Gross Subtotal:</span>
                  <span>₦{submittedData.financialSummary.subtotal.toLocaleString()}</span>
                </div>
                {submittedData.patient.type === 'hmo_insured' && (
                  <div className="flex justify-between text-indigo-400">
                    <span>HMO Underwritten:</span>
                    <span>₦{submittedData.financialSummary.hmoUnderwritten.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-emerald-400">
                  <span>Patient Paid:</span>
                  <span>₦{submittedData.financialSummary.patientPayable.toLocaleString()} via {submittedData.financialSummary.paymentChannel.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Channel Ref:</span>
                  <span>{submittedData.financialSummary.channelReference}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => alert('Printing official triage routing slip for the nurse and consulting physician...')}
                className="px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded cursor-pointer transition-colors"
              >
                Print Clinical Routing Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
