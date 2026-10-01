import { ClaimRecord } from '../types/schema';

export const INITIAL_STAFF_USERS = [
  {
    staff_id: '11111111-1111-4111-8111-111111111111',
    staff_code: 'STF-DOC-0101',
    first_name: 'Dr. Adebayo',
    last_name: 'Okonkwo',
    email: 'adebayo.o@vidiemsledger.health',
    phone: '+1 (555) 234-9081',
    role: 'doctor',
    department: 'Internal Medicine & Cardiology',
    license_number: 'MD-84920-F',
    is_active: true
  },
  {
    staff_id: '11111111-1111-4111-8111-222222222222',
    staff_code: 'STF-DOC-0102',
    first_name: 'Dr. Elena',
    last_name: 'Vargas',
    email: 'elena.v@vidiemsledger.health',
    phone: '+1 (555) 345-8192',
    role: 'doctor',
    department: 'Pediatrics & Neonatology',
    license_number: 'MD-77192-K',
    is_active: true
  },
  {
    staff_id: '11111111-1111-4111-8111-333333333333',
    staff_code: 'STF-CSH-0201',
    first_name: 'Marcus',
    last_name: 'Sterling',
    email: 'marcus.s@vidiemsledger.health',
    phone: '+1 (555) 678-1209',
    role: 'cashier',
    department: 'Central Cashier & POS Operations',
    license_number: null,
    is_active: true
  },
  {
    staff_id: '11111111-1111-4111-8111-444444444444',
    staff_code: 'STF-HMO-0301',
    first_name: 'Fatima',
    last_name: 'Bello',
    email: 'fatima.b@vidiemsledger.health',
    phone: '+1 (555) 901-4432',
    role: 'hmo_desk',
    department: 'HMO Liaison & Pre-Authorization Desk',
    license_number: null,
    is_active: true
  },
  {
    staff_id: '11111111-1111-4111-8111-555555555555',
    staff_code: 'STF-BIL-0401',
    first_name: 'Jonathan',
    last_name: 'Chen',
    email: 'jonathan.c@vidiemsledger.health',
    phone: '+1 (555) 432-8871',
    role: 'billing_officer',
    department: 'Revenue Cycle & Patient Billing',
    license_number: null,
    is_active: true
  }
];

export const INITIAL_HMO_PROVIDERS = [
  {
    provider_id: '22222222-2222-4222-8222-111111111111',
    provider_code: 'HMO-AXA',
    provider_name: 'AXA Health & Corporate Assurance',
    contact_email: 'claims@axa-health-corp.com',
    contact_phone: '+1 (800) 555-0199',
    claims_portal_url: 'https://claims.axa-health.portal/api/v2',
    reimbursement_terms_days: 30,
    is_active: true
  },
  {
    provider_id: '22222222-2222-4222-8222-222222222222',
    provider_code: 'HMO-RELIANCE',
    provider_name: 'Reliance Care HMO',
    contact_email: 'providers@reliancecare.org',
    contact_phone: '+1 (800) 555-0244',
    claims_portal_url: 'https://edi.reliancecare.org/v1/claims',
    reimbursement_terms_days: 21,
    is_active: true
  },
  {
    provider_id: '22222222-2222-4222-8222-333333333333',
    provider_code: 'HMO-HYGEIA',
    provider_name: 'Hygeia Health Management',
    contact_email: 'adjudication@hygeiahmo.com',
    contact_phone: '+1 (800) 555-0377',
    claims_portal_url: 'https://gateway.hygeiahmo.com',
    reimbursement_terms_days: 45,
    is_active: true
  }
];

export const INITIAL_PATIENTS = [
  {
    patient_id: '33333333-3333-4333-8333-111111111111',
    mrn: 'MRN-2026-00412',
    first_name: 'Sarah',
    last_name: 'Jenkins',
    date_of_birth: '1988-06-14',
    gender: 'female',
    blood_group: 'O+',
    genotype: 'AA',
    email: 'sarah.j@example.com',
    phone_number: '+1 (555) 782-9012',
    residential_address: '742 Evergreen Terrace, West Wing, Metro City',
    emergency_contact_name: 'David Jenkins (Spouse)',
    emergency_contact_phone: '+1 (555) 782-9013',
    primary_hmo_provider_id: '22222222-2222-4222-8222-111111111111',
    hmo_policy_number: 'AXA-POL-8831920'
  },
  {
    patient_id: '33333333-3333-4333-8333-222222222222',
    mrn: 'MRN-2026-00413',
    first_name: 'Ibrahim',
    last_name: 'Kallon',
    date_of_birth: '1974-11-29',
    gender: 'male',
    blood_group: 'A+',
    genotype: 'AS',
    email: 'i.kallon@example.com',
    phone_number: '+1 (555) 441-2983',
    residential_address: '18 Victoria Boulevard, Victoria Island',
    emergency_contact_name: 'Amina Kallon (Daughter)',
    emergency_contact_phone: '+1 (555) 441-2984',
    primary_hmo_provider_id: '22222222-2222-4222-8222-222222222222',
    hmo_policy_number: 'REL-PL-0049182'
  },
  {
    patient_id: '33333333-3333-4333-8333-333333333333',
    mrn: 'MRN-2026-00414',
    first_name: 'Clara',
    last_name: 'Moreau',
    date_of_birth: '1995-03-08',
    gender: 'female',
    blood_group: 'B-',
    genotype: 'AA',
    email: 'clara.moreau@example.com',
    phone_number: '+1 (555) 910-3341',
    residential_address: '88 St. Germain Crescent, Uptown',
    emergency_contact_name: 'Jean-Luc Moreau (Father)',
    emergency_contact_phone: '+1 (555) 910-3342',
    primary_hmo_provider_id: null, // Self-Pay / Cash
    hmo_policy_number: null
  }
];

export const INITIAL_APPOINTMENTS = [
  {
    appointment_id: '44444444-4444-4444-8444-111111111111',
    appointment_code: 'APT-2026-0810',
    patient_id: '33333333-3333-4333-8333-111111111111',
    doctor_staff_id: '11111111-1111-4111-8111-111111111111',
    booked_by_staff_id: '11111111-1111-4111-8111-555555555555',
    appointment_type: 'consultation',
    scheduled_start_time: '2026-10-01T08:30:00Z',
    scheduled_end_time: '2026-10-01T09:15:00Z',
    status: 'completed',
    chief_complaint: 'Persistent chest tightness on moderate exertion and palpitations.'
  },
  {
    appointment_id: '44444444-4444-4444-8444-222222222222',
    appointment_code: 'APT-2026-0811',
    patient_id: '33333333-3333-4333-8333-222222222222',
    doctor_staff_id: '11111111-1111-4111-8111-111111111111',
    booked_by_staff_id: '11111111-1111-4111-8111-555555555555',
    appointment_type: 'routine_checkup',
    scheduled_start_time: '2026-10-01T09:30:00Z',
    scheduled_end_time: '2026-10-01T10:00:00Z',
    status: 'in_consultation',
    chief_complaint: 'Routine quarterly hypertensive review and medication renewal.'
  },
  {
    appointment_id: '44444444-4444-4444-8444-333333333333',
    appointment_code: 'APT-2026-0812',
    patient_id: '33333333-3333-4333-8333-333333333333',
    doctor_staff_id: '11111111-1111-4111-8111-222222222222',
    booked_by_staff_id: '11111111-1111-4111-8111-555555555555',
    appointment_type: 'emergency',
    scheduled_start_time: '2026-10-01T10:30:00Z',
    scheduled_end_time: '2026-10-01T11:15:00Z',
    status: 'checked_in',
    chief_complaint: 'Acute abdominal cramping with high fever and nausea.'
  }
];

export const INITIAL_INVOICES = [
  {
    invoice_id: '55555555-5555-4555-8555-111111111111',
    invoice_number: 'INV-2026-10901',
    patient_id: '33333333-3333-4333-8333-111111111111',
    appointment_id: '44444444-4444-4444-8444-111111111111',
    generated_by_staff_id: '11111111-1111-4111-8111-555555555555',
    issue_date: '2026-10-01T09:20:00Z',
    due_date: '2026-10-31T23:59:59Z',
    subtotal_amount: 450.00,
    discount_amount: 0.00,
    tax_amount: 0.00,
    total_amount: 450.00,
    patient_payable_amount: 50.00, // 10% co-pay
    hmo_payable_amount: 400.00,    // 90% HMO underwritten
    amount_paid: 50.00,           // Patient co-pay cleared via POS
    balance_due: 400.00,          // Remaining awaiting HMO claim settlement
    payment_status: 'partially_paid',
    notes: 'Cardiology workup: ECG, Troponin-I biomarker, and Specialist Consultation.'
  },
  {
    invoice_id: '55555555-5555-4555-8555-222222222222',
    invoice_number: 'INV-2026-10902',
    patient_id: '33333333-3333-4333-8333-222222222222',
    appointment_id: '44444444-4444-4444-8444-222222222222',
    generated_by_staff_id: '11111111-1111-4111-8111-555555555555',
    issue_date: '2026-10-01T10:05:00Z',
    due_date: '2026-10-31T23:59:59Z',
    subtotal_amount: 180.00,
    discount_amount: 0.00,
    tax_amount: 0.00,
    total_amount: 180.00,
    patient_payable_amount: 0.00, // 100% comprehensive HMO cover
    hmo_payable_amount: 180.00,
    amount_paid: 0.00,
    balance_due: 180.00,
    payment_status: 'unpaid',
    notes: 'Hypertension routine visit with serum electrolytes profile.'
  },
  {
    invoice_id: '55555555-5555-4555-8555-333333333333',
    invoice_number: 'INV-2026-10903',
    patient_id: '33333333-3333-4333-8333-333333333333',
    appointment_id: '44444444-4444-4444-8444-333333333333',
    generated_by_staff_id: '11111111-1111-4111-8111-555555555555',
    issue_date: '2026-10-01T11:00:00Z',
    due_date: '2026-10-01T23:59:59Z',
    subtotal_amount: 320.00,
    discount_amount: 20.00, // Clinic compassionate waiver
    tax_amount: 0.00,
    total_amount: 300.00,
    patient_payable_amount: 300.00, // 100% Self-Pay
    hmo_payable_amount: 0.00,
    amount_paid: 300.00,          // Paid via online gateway transfer
    balance_due: 0.00,
    payment_status: 'fully_paid',
    notes: 'Emergency IV hydration, analgesia, and abdominal ultrasound scan.'
  }
];

export const INITIAL_INVOICE_ITEMS = [
  {
    item_id: '66666666-6666-4666-8666-111111111111',
    invoice_id: '55555555-5555-4555-8555-111111111111',
    service_category: 'consultation',
    item_code: 'SRV-CONS-CARD',
    description: 'Senior Consultant Cardiologist Assessment',
    quantity: 1,
    unit_price: 150.00,
    total_line_amount: 150.00,
    is_hmo_covered: true
  },
  {
    item_id: '66666666-6666-4666-8666-222222222222',
    invoice_id: '55555555-5555-4555-8555-111111111111',
    service_category: 'procedure',
    item_code: 'PRC-ECG-12L',
    description: '12-Lead Diagnostic Electrocardiogram (ECG)',
    quantity: 1,
    unit_price: 120.00,
    total_line_amount: 120.00,
    is_hmo_covered: true
  },
  {
    item_id: '66666666-6666-4666-8666-333333333333',
    invoice_id: '55555555-5555-4555-8555-111111111111',
    service_category: 'laboratory',
    item_code: 'LAB-TROP-I',
    description: 'Quantitative High-Sensitivity Troponin-I Assay',
    quantity: 1,
    unit_price: 180.00,
    total_line_amount: 180.00,
    is_hmo_covered: true
  },
  {
    item_id: '66666666-6666-4666-8666-444444444444',
    invoice_id: '55555555-5555-4555-8555-333333333333',
    service_category: 'radiology',
    item_code: 'RAD-US-ABD',
    description: 'Abdominal & Pelvic Ultrasound Sonography',
    quantity: 1,
    unit_price: 190.00,
    total_line_amount: 190.00,
    is_hmo_covered: false
  },
  {
    item_id: '66666666-6666-4666-8666-555555555555',
    invoice_id: '55555555-5555-4555-8555-333333333333',
    service_category: 'pharmacy',
    item_code: 'PHR-IV-BUSC',
    description: 'Hyoscine Butylbromide 20mg/ml IV Solution & Consumables',
    quantity: 2,
    unit_price: 65.00,
    total_line_amount: 130.00,
    is_hmo_covered: false
  }
];

export const INITIAL_PAYMENTS = [
  {
    payment_id: '77777777-7777-4777-8777-111111111111',
    receipt_number: 'REC-2026-90412',
    invoice_id: '55555555-5555-4555-8555-111111111111',
    patient_id: '33333333-3333-4333-8333-111111111111',
    cashier_staff_id: '11111111-1111-4111-8111-333333333333',
    payment_channel: 'pos_terminal',
    amount: 50.00,
    currency: 'USD',
    payment_timestamp: '2026-10-01T09:25:14Z',
    channel_status: 'settled',
    pos_terminal_id: 'POS-TID-8841-A',
    pos_rrn: 'RRN-9921408192',
    pos_auth_code: 'AUTH-61029',
    card_last_four: '4012',
    card_type: 'Visa Debit',
    cash_drawer_session_id: null,
    cash_tendered: null,
    change_returned: null,
    gateway_provider: null,
    gateway_transaction_id: null,
    reconciliation_status: 'reconciled',
    remarks: 'Patient 10% co-pay settled at Front Desk POS.'
  },
  {
    payment_id: '77777777-7777-4777-8777-222222222222',
    receipt_number: 'REC-2026-90413',
    invoice_id: '55555555-5555-4555-8555-333333333333',
    patient_id: '33333333-3333-4333-8333-333333333333',
    cashier_staff_id: '11111111-1111-4111-8111-333333333333',
    payment_channel: 'gateway_transfer',
    amount: 300.00,
    currency: 'USD',
    payment_timestamp: '2026-10-01T11:15:30Z',
    channel_status: 'settled',
    pos_terminal_id: null,
    pos_rrn: null,
    pos_auth_code: null,
    card_last_four: '8910',
    card_type: 'Mastercard',
    gateway_provider: 'Stripe Direct Checkout',
    gateway_transaction_id: 'ch_3N1xXp2eZvKYlo2C0123984A',
    gateway_session_id: 'cs_live_b1k9827361a',
    gateway_webhook_verified: true,
    cash_drawer_session_id: null,
    cash_tendered: null,
    change_returned: null,
    reconciliation_status: 'reconciled',
    remarks: 'Immediate mobile portal payment link settled by patient spouse.'
  }
];

export const INITIAL_HMO_CLAIMS: ClaimRecord[] = [
  {
    claim_id: '88888888-8888-4888-8888-111111111111',
    claim_reference_number: 'CLM-2026-00382',
    invoice_id: '55555555-5555-4555-8555-111111111111',
    patient_id: '33333333-3333-4333-8333-111111111111',
    hmo_provider_id: '22222222-2222-4222-8222-111111111111',
    policy_number: 'AXA-POL-8831920',
    authorization_code: 'AUTH-AXA-2026-9912',
    claimed_amount: 400.00,
    approved_amount: 400.00,
    co_pay_amount: 50.00,
    amount_settled: 0.00, // Awaiting insurer bank wire
    claim_status: 'approved',
    submission_date: '2026-10-01T09:30:00Z',
    adjudication_date: '2026-10-01T10:15:00Z',
    settlement_date: null,
    settlement_batch_id: 'BATCH-AXA-W40',
    settlement_payment_id: null,
    rejection_reason: null,
    adjudicator_remarks: 'Full tariff authorized. Scheduled for weekly electronic transfer batch on Friday.',
    created_by_staff_id: '11111111-1111-4111-8111-444444444444'
  },
  {
    claim_id: '88888888-8888-4888-8888-222222222222',
    claim_reference_number: 'CLM-2026-00383',
    invoice_id: '55555555-5555-4555-8555-222222222222',
    patient_id: '33333333-3333-4333-8333-222222222222',
    hmo_provider_id: '22222222-2222-4222-8222-222222222222',
    policy_number: 'REL-PL-0049182',
    authorization_code: 'REL-PRE-8192',
    claimed_amount: 180.00,
    approved_amount: 0.00,
    co_pay_amount: 0.00,
    amount_settled: 0.00,
    claim_status: 'under_review',
    submission_date: '2026-10-01T10:10:00Z',
    adjudication_date: null,
    settlement_date: null,
    settlement_batch_id: null,
    settlement_payment_id: null,
    rejection_reason: null,
    adjudicator_remarks: 'Dispatched to Reliance automated EDI claims gateway. Awaiting medical auditor sign-off.',
    created_by_staff_id: '11111111-1111-4111-8111-444444444444'
  }
];

export const INITIAL_CLAIM_HISTORY = [
  {
    history_id: '99999999-9999-4999-8999-111111111111',
    claim_id: '88888888-8888-4888-8888-111111111111',
    previous_status: 'draft',
    new_status: 'submitted',
    changed_by_staff_id: '11111111-1111-4111-8111-444444444444',
    transition_notes: 'Initial electronic submission to AXA Health API portal with attached ECG report.',
    transition_timestamp: '2026-10-01T09:30:00Z'
  },
  {
    history_id: '99999999-9999-4999-8999-222222222222',
    claim_id: '88888888-8888-4888-8888-111111111111',
    previous_status: 'submitted',
    new_status: 'under_review',
    changed_by_staff_id: '11111111-1111-4111-8111-444444444444',
    transition_notes: 'Claim acknowledged by AXA medical auditor Dr. R. Henderson.',
    transition_timestamp: '2026-10-01T09:48:00Z'
  },
  {
    history_id: '99999999-9999-4999-8999-333333333333',
    claim_id: '88888888-8888-4888-8888-111111111111',
    previous_status: 'under_review',
    new_status: 'approved',
    changed_by_staff_id: '11111111-1111-4111-8111-444444444444',
    transition_notes: 'Claim approved in full ($400.00). Allocated to payment batch BATCH-AXA-W40.',
    transition_timestamp: '2026-10-01T10:15:00Z'
  },
  {
    history_id: '99999999-9999-4999-8999-444444444444',
    claim_id: '88888888-8888-4888-8888-222222222222',
    previous_status: 'draft',
    new_status: 'submitted',
    changed_by_staff_id: '11111111-1111-4111-8111-444444444444',
    transition_notes: 'Electronic claims dispatch initiated.',
    transition_timestamp: '2026-10-01T10:10:00Z'
  },
  {
    history_id: '99999999-9999-4999-8999-555555555555',
    claim_id: '88888888-8888-4888-8888-222222222222',
    previous_status: 'submitted',
    new_status: 'under_review',
    changed_by_staff_id: '11111111-1111-4111-8111-444444444444',
    transition_notes: 'Awaiting EDI adjudication.',
    transition_timestamp: '2026-10-01T10:25:00Z'
  }
];
