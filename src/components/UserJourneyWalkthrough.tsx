import React, { useState } from 'react';
import { 
  UserCheck, 
  Activity, 
  Stethoscope, 
  Split, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Building2, 
  Receipt, 
  ShieldCheck, 
  FileText, 
  Clock, 
  RefreshCw,
  Search,
  Key,
  Pill,
  DollarSign
} from 'lucide-react';

export const UserJourneyWalkthrough: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Step 1: Reception Check-In State
  const [searchMrn, setSearchMrn] = useState('MRN-2026-00412');
  const [patientFound, setPatientFound] = useState(true);
  const [checkInDone, setCheckInDone] = useState(false);
  const [appointmentStatus, setAppointmentStatus] = useState<'scheduled' | 'checked_in'>('scheduled');

  // Step 2: Triage Vitals State
  const [bpSystolic, setBpSystolic] = useState('122');
  const [bpDiastolic, setBpDiastolic] = useState('80');
  const [heartRate, setHeartRate] = useState('74');
  const [temperature, setTemperature] = useState('36.7');
  const [spo2, setSpo2] = useState('99');
  const [weightKg, setWeightKg] = useState('68');
  const [triageDone, setTriageDone] = useState(false);

  // Step 3: Doctor Consultation & Prescriptions State
  const [selectedItems, setSelectedItems] = useState<{ id: string; name: string; category: string; price: number; code: string; isHmoCovered: boolean }[]>([
    { id: '1', name: 'Cardiology Specialist Consultation', category: 'consultation', price: 150.00, code: 'SRV-CONS-CARD', isHmoCovered: true },
    { id: '2', name: '12-Lead Diagnostic Electrocardiogram (ECG)', category: 'procedure', price: 120.00, code: 'PRC-ECG-12L', isHmoCovered: true },
    { id: '3', name: 'High-Sensitivity Troponin-I Assay', category: 'laboratory', price: 180.00, code: 'LAB-TROP-I', isHmoCovered: true },
    { id: '4', name: 'Atorvastatin 20mg Tablets (30 Days)', category: 'pharmacy', price: 50.00, code: 'DRG-ATOR-20', isHmoCovered: true }
  ]);
  const [prescriptionSigned, setPrescriptionSigned] = useState(false);

  // Step 4: Split Engine State
  const [copayPercentage, setCopayPercentage] = useState(10); // 10% patient co-pay, 90% HMO
  const grossSubtotal = selectedItems.reduce((acc, item) => acc + item.price, 0);
  const patientCoPayDue = (grossSubtotal * copayPercentage) / 100;
  const hmoClaimLiability = grossSubtotal - patientCoPayDue;
  const [splitEngineProcessed, setSplitEngineProcessed] = useState(false);

  // Step 5: Cashier Payment State
  const [paymentMethod, setPaymentMethod] = useState<'pos_terminal' | 'cash' | 'gateway_transfer'>('pos_terminal');
  const [posRrn, setPosRrn] = useState('RRN-9921408192');
  const [posTid, setPosTid] = useState('POS-TID-8841-A');
  const [posCardType, setPosCardType] = useState('Visa Debit');
  const [cardLast4, setCardLast4] = useState('4012');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('REC-2026-90412');

  // Handle Step 1 Check In
  const handleCheckIn = () => {
    setAppointmentStatus('checked_in');
    setCheckInDone(true);
  };

  // Handle Step 2 Triage Submit
  const handleTriageSubmit = () => {
    setTriageDone(true);
  };

  // Handle Step 3 Prescription Sign
  const handleSignPrescription = () => {
    setPrescriptionSigned(true);
  };

  // Handle Step 4 Split Calculation
  const handleExecuteSplit = () => {
    setSplitEngineProcessed(true);
  };

  // Handle Step 5 Payment
  const handleProcessPayment = () => {
    setPaymentCompleted(true);
  };

  // Reset entire journey
  const handleReset = () => {
    setCurrentStep(1);
    setAppointmentStatus('scheduled');
    setCheckInDone(false);
    setTriageDone(false);
    setPrescriptionSigned(false);
    setSplitEngineProcessed(false);
    setPaymentCompleted(false);
  };

  const steps = [
    { num: 1, title: 'Check-In & HMO Eligibility', desc: 'Reception Desk', icon: UserCheck },
    { num: 2, title: 'Triage & Clinical Intake', desc: 'Nursing Station', icon: Activity },
    { num: 3, title: 'Consultation & Orders', desc: 'Doctor Room', icon: Stethoscope },
    { num: 4, title: 'Automated Split Engine', desc: 'Billing Subledger', icon: Split },
    { num: 5, title: 'Co-Pay & Remittance', desc: 'Cashier Till', icon: CreditCard }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>End-to-End Operational Blueprint</span>
              <span>·</span>
              <span>5-Stage ClinicLedger User Journey</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Patient Check-In, Triage, Prescriptions & Split Billing Journey
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Step-by-step click-through workflow tracking an HMO patient from reception intake and nurse triage to physician prescription orders and automated financial co-pay splitting.
            </p>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Journey Demo</span>
          </button>
        </div>

        {/* Journey Progress Stepper */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-5 gap-2 pt-6 border-t border-slate-800">
          {steps.map((st) => {
            const Icon = st.icon;
            const isCurrent = currentStep === st.num;
            const isCompleted = currentStep > st.num || (st.num === 1 && checkInDone) || (st.num === 2 && triageDone) || (st.num === 3 && prescriptionSigned) || (st.num === 4 && splitEngineProcessed) || (st.num === 5 && paymentCompleted);

            return (
              <button
                key={st.num}
                onClick={() => setCurrentStep(st.num)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-800/90 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                    : isCompleted
                    ? 'bg-slate-950 border-emerald-800/50 text-slate-300'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold ${
                      isCurrent
                        ? 'bg-cyan-500 text-slate-950'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {st.num}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{st.desc}</span>
                  </div>
                  {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className={`text-xs font-semibold leading-snug ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                  {st.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =======================================================================
          STAGE 1: RECEPTION DESK - CHECK-IN & HMO ELIGIBILITY
      ======================================================================= */}
      {currentStep === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                <span>Stage 1 of 5</span>
                <span>·</span>
                <span>Front Desk Reception Console</span>
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                Patient Check-In & HMO Eligibility Verification
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Role: <strong className="text-slate-200">Receptionist / Intake Desk</strong>
            </span>
          </div>

          <div className="space-y-4">
            {/* Search Box */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchMrn}
                  onChange={(e) => setSearchMrn(e.target.value)}
                  placeholder="Enter Medical Record Number (MRN) or Patient Phone..."
                  className="w-full bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-xs font-mono text-white rounded focus:outline-hidden focus:border-cyan-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setPatientFound(true)}
                className="px-4 py-2 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors cursor-pointer"
              >
                Search Directory
              </button>
            </div>

            {/* Patient Eligibility Record Card */}
            {patientFound && (
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">Sarah Jenkins</span>
                      <span className="text-xs font-mono text-cyan-400">MRN-2026-00412</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Female · DOB: 14 Jun 1988 (38 yrs) · Blood Group: O+ · Genotype: AA · +1 (555) 782-9012
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      HMO Active & Verified
                    </span>
                  </div>
                </div>

                {/* Insurance Policy Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
                    <div className="text-slate-500 text-[10px]">HMO PROVIDER</div>
                    <div className="font-bold text-slate-200 mt-0.5">AXA Health & Corporate Assurance</div>
                    <div className="text-slate-400 text-[10px]">Provider Code: HMO-AXA</div>
                  </div>
                  <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
                    <div className="text-slate-500 text-[10px]">POLICY NUMBER</div>
                    <div className="font-bold text-cyan-400 mt-0.5">AXA-POL-8831920</div>
                    <div className="text-slate-400 text-[10px]">Tier: Comprehensive Corporate</div>
                  </div>
                  <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
                    <div className="text-slate-500 text-[10px]">CO-PAY BENEFIT SCHEDULE</div>
                    <div className="font-bold text-amber-400 mt-0.5">10% Co-Pay / 90% HMO Remitted</div>
                    <div className="text-slate-400 text-[10px]">Pre-Auth Required &gt; $300</div>
                  </div>
                </div>

                {/* Appointment Queue Slot */}
                <div className="p-3 rounded bg-slate-900/40 border border-slate-800 text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">Today's Encounter: APT-2026-0810 (Cardiology Follow-Up)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Current Status:</span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                      appointmentStatus === 'checked_in'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {appointmentStatus}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-slate-400 font-sans">
                    {checkInDone 
                      ? '✓ Patient check-in logged to database. Queued for Vital Signs at Nurse Triage.' 
                      : 'Clicking Check In executes SQL: UPDATE appointments SET status = \'checked_in\' WHERE appointment_code = \'APT-2026-0810\';'}
                  </div>

                  {appointmentStatus === 'scheduled' ? (
                    <button
                      type="button"
                      onClick={handleCheckIn}
                      className="px-4 py-2 text-xs font-mono font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Check In Patient & Route to Triage</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-4 py-2 text-xs font-mono font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <span>Proceed to Stage 2: Triage Intake</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          STAGE 2: NURSE STATION - TRIAGE VITALS INTAKE
      ======================================================================= */}
      {currentStep === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                <span>Stage 2 of 5</span>
                <span>·</span>
                <span>Outpatient Triage Nursing Station</span>
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Clinical Triage & Patient Vital Signs Intake
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Role: <strong className="text-slate-200">Triage Staff Nurse</strong>
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800/80 pb-2">
              <span className="text-slate-300">Patient: <strong>Sarah Jenkins (MRN-2026-00412)</strong></span>
              <span className="text-emerald-400">Encounter: APT-2026-0810 (Dr. Adebayo Okonkwo)</span>
            </div>

            {/* Vital Signs Form Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                <label className="text-slate-500 text-[10px] block">BLOOD PRESSURE</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={bpSystolic}
                    onChange={(e) => setBpSystolic(e.target.value)}
                    className="w-12 bg-slate-950 border border-slate-700 px-1.5 py-1 text-center text-white rounded"
                  />
                  <span>/</span>
                  <input
                    type="text"
                    value={bpDiastolic}
                    onChange={(e) => setBpDiastolic(e.target.value)}
                    className="w-12 bg-slate-950 border border-slate-700 px-1.5 py-1 text-center text-white rounded"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">mmHg (Normotensive)</span>
              </div>

              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                <label className="text-slate-500 text-[10px] block">PULSE RATE</label>
                <input
                  type="text"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 px-2 py-1 text-white rounded"
                />
                <span className="text-[10px] text-slate-500 block">bpm (Regular)</span>
              </div>

              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                <label className="text-slate-500 text-[10px] block">TEMPERATURE</label>
                <input
                  type="text"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 px-2 py-1 text-white rounded"
                />
                <span className="text-[10px] text-slate-500 block">°C (Afebrile)</span>
              </div>

              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                <label className="text-slate-500 text-[10px] block">O2 SATURATION</label>
                <input
                  type="text"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 px-2 py-1 text-white rounded"
                />
                <span className="text-[10px] text-slate-500 block">% on Room Air</span>
              </div>

              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                <label className="text-slate-500 text-[10px] block">BODY WEIGHT</label>
                <input
                  type="text"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 px-2 py-1 text-white rounded"
                />
                <span className="text-[10px] text-slate-500 block">kg</span>
              </div>

              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                <label className="text-slate-500 text-[10px] block">TRIAGE STATUS</label>
                <div className="text-emerald-400 font-bold text-xs pt-1">
                  Category 4 (Standard)
                </div>
                <span className="text-[10px] text-slate-500 block">Routine Outpatient</span>
              </div>
            </div>

            {/* Chief Complaint Intake */}
            <div className="text-xs font-mono space-y-1">
              <label className="text-slate-400 block">Presenting Complaint & Triage Notes:</label>
              <textarea
                rows={2}
                defaultValue="Patient presents for quarterly cardiology check-up following moderate exertional chest heaviness last weekend. Vitals stable."
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Reception</span>
              </button>

              {!triageDone ? (
                <button
                  type="button"
                  onClick={handleTriageSubmit}
                  className="px-4 py-2 text-xs font-mono font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Activity className="w-4 h-4" />
                  <span>Submit Vitals & Transfer to Doctor's Queue</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 text-xs font-mono font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>Proceed to Stage 3: Doctor Consultation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          STAGE 3: DOCTOR'S ROOM - CONSULTATION & PRESCRIPTION ORDERS
      ======================================================================= */}
      {currentStep === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                <span>Stage 3 of 5</span>
                <span>·</span>
                <span>Physician Consultation Room</span>
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-indigo-400" />
                Doctor Encounter & Electronic Prescription Orders
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Physician: <strong className="text-slate-200">Dr. Adebayo Okonkwo (Cardiologist)</strong>
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800/80 pb-2">
              <span className="text-slate-300">Encounter: <strong>Cardiology Consultation (APT-2026-0810)</strong></span>
              <span className="text-cyan-400">Pre-Authorization Code: <strong>AUTH-AXA-2026-9912</strong></span>
            </div>

            {/* Prescribed Items Table */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
                <span>Billable Clinical Orders & Medications ({selectedItems.length} items)</span>
                <span className="text-slate-400">Tariff Gross Total: <strong className="text-white">${grossSubtotal.toFixed(2)}</strong></span>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Service Code</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-right">Tariff Rate</th>
                      <th className="py-2 px-3 text-center">HMO Covered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {selectedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-bold text-cyan-400">{item.code}</td>
                        <td className="py-2 px-3 text-slate-200">{item.name}</td>
                        <td className="py-2 px-3 text-slate-400">{item.category}</td>
                        <td className="py-2 px-3 text-right text-slate-100 tabular-nums">${item.price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded">
                            Yes (Formulary A)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Doctor's Diagnostic Summary */}
            <div className="p-3 rounded bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
              <div className="text-slate-400 font-semibold">Clinical Impression & Prescription Instructions:</div>
              <div className="text-slate-300 font-sans text-xs">
                Suspected exertional angina pectoris. Order 12-lead ECG, cardiac biomarkers, and initiate secondary cardioprotective pharmacotherapy. Review lab results in 48 hours.
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Triage</span>
              </button>

              {!prescriptionSigned ? (
                <button
                  type="button"
                  onClick={handleSignPrescription}
                  className="px-4 py-2 text-xs font-mono font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Pill className="w-4 h-4" />
                  <span>Sign & Transmit Orders to Automated Billing Engine</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 text-xs font-mono font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>Proceed to Stage 4: Automated Split Engine</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          STAGE 4: BILLING ENGINE - AUTOMATED LIABILITY SPLIT
      ======================================================================= */}
      {currentStep === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                <span>Stage 4 of 5</span>
                <span>·</span>
                <span>Central Financial Subledger Engine</span>
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Split className="w-5 h-5 text-amber-400" />
                Automated Transaction Split Algorithm & Invoice Generation
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              System: <strong className="text-slate-200">VIDIEMS Automated Billing Kernel</strong>
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-6">
            {/* Mathematical Invariant Box */}
            <div className="p-4 rounded bg-slate-900 border border-slate-800 text-xs font-mono space-y-2">
              <div className="text-cyan-400 font-bold flex items-center justify-between">
                <span>RELATIONAL CHECK CONSTRAINT: chk_total_liability_split</span>
                <span className="text-emerald-400">100% Invariant Guaranteed</span>
              </div>
              <div className="text-sm font-bold text-slate-100 bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between">
                <span>patient_payable_amount ($50.00) + hmo_payable_amount ($450.00) = total_amount ($500.00)</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                The database enforces that 100% of the invoice gross liability is assigned without unallocated floating debt. The patient is billed only for their contractual 10% co-pay, while the remaining 90% is compiled into an electronic HMO claim.
              </p>
            </div>

            {/* Split Breakdown Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Liability Card */}
              <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-800/50 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" />
                    Patient Out-of-Pocket Liability
                  </span>
                  <span className="text-amber-400 text-[11px] bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/40">
                    10% Co-Pay
                  </span>
                </div>

                <div className="text-2xl font-bold font-mono text-white tabular-nums">
                  ${patientCoPayDue.toFixed(2)}
                </div>

                <div className="text-xs text-slate-300 space-y-1 font-mono text-[11px]">
                  <div>· Payable immediately at cashier counter</div>
                  <div>· Payment Channels: Cash, POS terminal, or Online Gateway</div>
                  <div>· Status: <strong className="text-amber-400">Awaiting Cashier Settlement</strong></div>
                </div>
              </div>

              {/* HMO Insurer Liability Card */}
              <div className="p-4 rounded-lg bg-cyan-950/20 border border-cyan-800/50 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    HMO Insurer Claim Allocation
                  </span>
                  <span className="text-cyan-400 text-[11px] bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                    90% Underwritten
                  </span>
                </div>

                <div className="text-2xl font-bold font-mono text-white tabular-nums">
                  ${hmoClaimLiability.toFixed(2)}
                </div>

                <div className="text-xs text-slate-300 space-y-1 font-mono text-[11px]">
                  <div>· Claim Reference: <strong className="text-cyan-400">CLM-2026-00382</strong></div>
                  <div>· Underwriter: AXA Health & Corporate Assurance</div>
                  <div>· Pre-Auth Verified: AUTH-AXA-2026-9912</div>
                  <div>· Status: <strong className="text-cyan-400">Queued for Electronic EDI Batch</strong></div>
                </div>
              </div>
            </div>

            {/* Generated Invoices & Claim Records */}
            <div className="p-3.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono space-y-2">
              <div className="text-slate-400 font-semibold">Generated Database Header & Claim Records:</div>
              <div className="text-slate-300 space-y-1 text-[11px]">
                <div>1. Created <code className="text-cyan-300">billing_invoices</code> record <strong className="text-white">INV-2026-10901</strong> with total_amount = $500.00, patient_payable_amount = $50.00, balance_due = $500.00.</div>
                <div>2. Created 4 rows in <code className="text-cyan-300">invoice_items</code> with foreign key references to INV-2026-10901.</div>
                <div>3. Created <code className="text-cyan-300">hmo_claims</code> record <strong className="text-white">CLM-2026-00382</strong> with claimed_amount = $450.00 and claim_status = 'submitted'.</div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Doctor Room</span>
              </button>

              {!splitEngineProcessed ? (
                <button
                  type="button"
                  onClick={handleExecuteSplit}
                  className="px-4 py-2 text-xs font-mono font-bold text-white bg-amber-600 hover:bg-amber-500 rounded transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Split className="w-4 h-4" />
                  <span>Lock Invoices & Dispatch Co-Pay to Cashier Till</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="px-4 py-2 text-xs font-mono font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>Proceed to Stage 5: Cashier Desk Co-Pay Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          STAGE 5: CASHIER DESK - MULTI-CHANNEL CO-PAY SETTLEMENT
      ======================================================================= */}
      {currentStep === 5 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                <span>Stage 5 of 5</span>
                <span>·</span>
                <span>Central Hospital Cashier & Settlement Desk</span>
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-cyan-400" />
                Patient Co-Pay Collection & Automated Subledger Trigger
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Cashier: <strong className="text-slate-200">Marcus Sterling (Cashier Desk 01)</strong>
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-6">
            {/* Patient Invoice Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono p-3 rounded bg-slate-900 border border-slate-800">
              <div>
                <span className="text-slate-500 text-[10px] block">INVOICE SERIES</span>
                <span className="font-bold text-white">INV-2026-10901</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">TOTAL BILLED</span>
                <span className="font-bold text-slate-200">${grossSubtotal.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">HMO COVERAGE</span>
                <span className="font-bold text-cyan-400">${hmoClaimLiability.toFixed(2)} (AXA)</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">PATIENT CO-PAY DUE</span>
                <span className="font-bold text-amber-400">${patientCoPayDue.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Channel Selection */}
            {!paymentCompleted && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">
                    Select Patient Co-Pay Channel:
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'pos_terminal', label: 'POS Card Terminal' },
                      { id: 'cash', label: 'Physical Cash Drawer' },
                      { id: 'gateway_transfer', label: 'Online Gateway Link' }
                    ].map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setPaymentMethod(ch.id as any)}
                        className={`p-3 rounded border text-xs font-mono text-center transition-colors cursor-pointer ${
                          paymentMethod === ch.id
                            ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* POS Details */}
                {paymentMethod === 'pos_terminal' && (
                  <div className="p-3.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono space-y-2">
                    <div className="text-cyan-400 font-semibold">POS Card Terminal Audit Log Parameters:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <span className="text-slate-500 text-[10px] block">TERMINAL TID</span>
                        <input type="text" value={posTid} readOnly className="w-full bg-slate-950 border border-slate-700 px-2 py-1 text-slate-300 rounded" />
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">SWITCH RRN</span>
                        <input type="text" value={posRrn} readOnly className="w-full bg-slate-950 border border-slate-700 px-2 py-1 text-slate-300 rounded" />
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">CARD SCHEME</span>
                        <input type="text" value={posCardType} readOnly className="w-full bg-slate-950 border border-slate-700 px-2 py-1 text-slate-300 rounded" />
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">MASKED PAN</span>
                        <input type="text" value={`****-****-****-${cardLast4}`} readOnly className="w-full bg-slate-950 border border-slate-700 px-2 py-1 text-slate-300 rounded" />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleProcessPayment}
                  className="w-full py-2.5 px-4 text-xs font-mono font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Execute Co-Pay Settlement of ${patientCoPayDue.toFixed(2)} & Trigger PostgreSQL Sync</span>
                </button>
              </div>
            )}

            {/* Official Fiscal Receipt After Payment */}
            {paymentCompleted && (
              <div className="p-5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-800/30 pb-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold font-mono text-sm">Official Fiscal Co-Pay Settlement Receipt Issued</span>
                  </div>
                  <span className="font-mono text-xs text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    Cleared & Settled
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] block">RECEIPT NUMBER</span>
                    <span className="font-bold text-white">{receiptNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">AMOUNT SETTLED</span>
                    <span className="font-bold text-emerald-400">${patientCoPayDue.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">PAYMENT CHANNEL</span>
                    <span className="text-slate-200">POS Card (Visa ****4012)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">INVOICE BALANCE DUE</span>
                    <span className="text-cyan-400 font-bold">${hmoClaimLiability.toFixed(2)} (Awaiting HMO)</span>
                  </div>
                </div>

                {/* Subledger Trigger Audit Box */}
                <div className="p-3 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1 text-slate-300">
                  <div className="text-emerald-400 font-bold">✓ PostgreSQL Trigger trg_payments_balance_sync Fired:</div>
                  <div>· Inserted payment record into <code className="text-cyan-300">payments</code> with receipt {receiptNumber}.</div>
                  <div>· Updated <code className="text-cyan-300">billing_invoices</code>: amount_paid = $50.00, balance_due = $450.00, payment_status = 'partially_paid'.</div>
                  <div>· Patient is cleared to collect prescribed medications at the Pharmacy.</div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3.5 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Run Another Patient Journey Simulation</span>
                  </button>
                  <span className="text-xs font-mono text-emerald-400">
                    5 of 5 Stages Successfully Completed
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
