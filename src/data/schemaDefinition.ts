import { SchemaTable, SchemaRelation } from '../types/schema';

export const SCHEMA_TABLES: SchemaTable[] = [
  {
    id: 'staff_users',
    tableName: 'staff_users',
    displayName: 'Staff & Medical Personnel',
    category: 'staff',
    description: 'System users including medical doctors, nursing staff, billing officers, HMO liaisons, and clinic administrators with Role-Based Access Control (RBAC).',
    normalizationLevel: 'BCNF (Boyce-Codd Normal Form)',
    coordinates: { x: 50, y: 50 },
    columns: [
      { name: 'staff_id', type: 'UUID', isPrimaryKey: true, isNullable: false, defaultValue: 'gen_random_uuid()', description: 'Surrogate primary key for immutable staff referencing.' },
      { name: 'staff_code', type: 'VARCHAR(20)', isUnique: true, isNullable: false, description: 'Human-readable staff employee identifier (e.g., STF-DOC-0042).' },
      { name: 'first_name', type: 'VARCHAR(100)', isNullable: false, description: 'Given legal name.' },
      { name: 'last_name', type: 'VARCHAR(100)', isNullable: false, description: 'Family legal surname.' },
      { name: 'email', type: 'VARCHAR(255)', isUnique: true, isNullable: false, description: 'Unique institutional login email.' },
      { name: 'phone', type: 'VARCHAR(30)', isNullable: false, description: 'Direct contact phone number.' },
      { name: 'role', type: 'staff_role_enum', isNullable: false, description: 'Enums: super_admin, doctor, nurse, cashier, billing_officer, hmo_desk, pharmacist.' },
      { name: 'department', type: 'VARCHAR(100)', isNullable: false, description: 'Clinical or operational department (e.g. Cardiology, Outpatient, Accounts).' },
      { name: 'license_number', type: 'VARCHAR(100)', isNullable: true, description: 'Medical council or statutory practice license number.' },
      { name: 'is_active', type: 'BOOLEAN', isNullable: false, defaultValue: 'true', description: 'Account operational status flag for deactivating terminated personnel.' },
      { name: 'password_hash', type: 'VARCHAR(255)', isNullable: false, description: 'Secure argon2id / bcrypt salted authentication hash.' },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Record initialization audit timestamp.' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Record modification audit timestamp.' }
    ],
    constraints: [
      { name: 'pk_staff_users', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (staff_id)', description: 'Enforces entity uniqueness via cryptographic UUID.' },
      { name: 'uq_staff_code', type: 'UNIQUE', definition: 'UNIQUE (staff_code)', description: 'Prevents collision in institutional employee badge numbers.' },
      { name: 'uq_staff_email', type: 'UNIQUE', definition: 'UNIQUE (email)', description: 'Ensures single account per email address.' }
    ],
    indexes: [
      { name: 'idx_staff_role_active', columns: ['role', 'is_active'], type: 'Composite', rationale: 'Fast lookup of available doctors and active billing desk officers.' },
      { name: 'idx_staff_email', columns: ['email'], isUnique: true, type: 'B-tree', rationale: 'Sub-millisecond login credential resolution.' }
    ]
  },
  {
    id: 'hmo_providers',
    tableName: 'hmo_providers',
    displayName: 'HMO Insurers & Payers',
    category: 'hmo',
    description: 'Accredited Health Maintenance Organizations, corporate underwriters, and government health schemes underwriting patient policies.',
    normalizationLevel: '3NF (Third Normal Form)',
    coordinates: { x: 50, y: 520 },
    columns: [
      { name: 'provider_id', type: 'UUID', isPrimaryKey: true, isNullable: false, defaultValue: 'gen_random_uuid()', description: 'Surrogate primary key for HMO institution.' },
      { name: 'provider_code', type: 'VARCHAR(20)', isUnique: true, isNullable: false, description: 'Standard industry code (e.g. AXA-HEALTH, RELIANCE, HYGEIA).' },
      { name: 'provider_name', type: 'VARCHAR(150)', isNullable: false, description: 'Full legal name of the HMO payer corporation.' },
      { name: 'contact_email', type: 'VARCHAR(255)', isNullable: false, description: 'Claims dispatch and query resolution email.' },
      { name: 'contact_phone', type: 'VARCHAR(30)', isNullable: false, description: 'Liaison desk telephone number.' },
      { name: 'claims_portal_url', type: 'VARCHAR(255)', isNullable: true, description: 'API or web clearinghouse endpoint for automated pre-auth and batch filing.' },
      { name: 'reimbursement_terms_days', type: 'INTEGER', isNullable: false, defaultValue: '30', description: 'Standard contractual settlement period in days (e.g. 30, 45, 60).' },
      { name: 'is_active', type: 'BOOLEAN', isNullable: false, defaultValue: 'true', description: 'Whether the clinic is currently accepting patients under this provider.' },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Payer contract onboarding timestamp.' }
    ],
    constraints: [
      { name: 'pk_hmo_providers', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (provider_id)', description: 'Unique identifier for HMO provider.' },
      { name: 'uq_provider_code', type: 'UNIQUE', definition: 'UNIQUE (provider_code)', description: 'Prevents duplicate provider code configurations.' },
      { name: 'chk_terms_days_positive', type: 'CHECK', definition: 'CHECK (reimbursement_terms_days > 0)', description: 'Settlement term must be at least 1 calendar day.' }
    ],
    indexes: [
      { name: 'idx_hmo_providers_active', columns: ['is_active'], type: 'B-tree', rationale: 'Rapid filtering of currently approved health insurance carriers.' }
    ]
  },
  {
    id: 'patients',
    tableName: 'patients',
    displayName: 'Patient Registry',
    category: 'clinical',
    description: 'Master clinical patient demographic index, biological metadata, emergency contacts, and primary health insurance plan linkages.',
    normalizationLevel: '3NF (Third Normal Form)',
    coordinates: { x: 420, y: 50 },
    columns: [
      { name: 'patient_id', type: 'UUID', isPrimaryKey: true, isNullable: false, defaultValue: 'gen_random_uuid()', description: 'Universal Unique Identifier for patient entity.' },
      { name: 'mrn', type: 'VARCHAR(30)', isUnique: true, isNullable: false, description: 'Medical Record Number (e.g. MRN-2026-00812) stamped on physical charts and wristbands.' },
      { name: 'first_name', type: 'VARCHAR(100)', isNullable: false, description: 'Legal given name.' },
      { name: 'last_name', type: 'VARCHAR(100)', isNullable: false, description: 'Legal surname.' },
      { name: 'date_of_birth', type: 'DATE', isNullable: false, description: 'Biological birth date used for age verification and pediatric/geriatric dosing.' },
      { name: 'gender', type: 'gender_enum', isNullable: false, description: 'Standard clinical gender classification: male, female, other.' },
      { name: 'blood_group', type: 'blood_group_enum', isNullable: true, description: 'Enums: A+, A-, B+, B-, AB+, AB-, O+, O-, unknown.' },
      { name: 'genotype', type: 'VARCHAR(5)', isNullable: true, description: 'Hemoglobin genotype: AA, AS, SS, AC, SC.' },
      { name: 'email', type: 'VARCHAR(255)', isNullable: true, description: 'Patient communication email for portal and e-invoices.' },
      { name: 'phone_number', type: 'VARCHAR(30)', isNullable: false, description: 'Primary SMS and emergency call contact.' },
      { name: 'residential_address', type: 'TEXT', isNullable: true, description: 'Physical residential street address.' },
      { name: 'emergency_contact_name', type: 'VARCHAR(150)', isNullable: false, description: 'Next of kin or emergency representative.' },
      { name: 'emergency_contact_phone', type: 'VARCHAR(30)', isNullable: false, description: 'Next of kin emergency telephone number.' },
      { name: 'primary_hmo_provider_id', type: 'UUID', isForeignKey: true, isNullable: true, foreignKeyRef: { table: 'hmo_providers', column: 'provider_id', onDelete: 'RESTRICT' }, description: 'Affiliated health maintenance organization (if insured).' },
      { name: 'hmo_policy_number', type: 'VARCHAR(100)', isNullable: true, description: 'Enrollee insurance member policy ID.' },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Patient registration timestamp.' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Last demographic modification timestamp.' }
    ],
    constraints: [
      { name: 'pk_patients', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (patient_id)', description: 'Primary key.' },
      { name: 'uq_patients_mrn', type: 'UNIQUE', definition: 'UNIQUE (mrn)', description: 'Guarantee strictly unique Medical Record Numbers.' },
      { name: 'fk_patients_hmo', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (primary_hmo_provider_id) REFERENCES hmo_providers(provider_id) ON DELETE RESTRICT', description: 'Maintains referential integrity to active HMO provider.' },
      { name: 'chk_dob_past', type: 'CHECK', definition: 'CHECK (date_of_birth <= CURRENT_DATE)', description: 'Date of birth cannot exist in the future.' }
    ],
    indexes: [
      { name: 'idx_patients_mrn', columns: ['mrn'], isUnique: true, type: 'B-tree', rationale: 'Zero-latency chart retrieval during triage & consultation.' },
      { name: 'idx_patients_phone', columns: ['phone_number'], type: 'B-tree', rationale: 'Fast lookup when patient arrives without physical card.' },
      { name: 'idx_patients_hmo_policy', columns: ['primary_hmo_provider_id', 'hmo_policy_number'], type: 'Composite', rationale: 'Rapid insurance eligibility checking at reception.' }
    ]
  },
  {
    id: 'appointments',
    tableName: 'appointments',
    displayName: 'Clinical Appointments & Encounters',
    category: 'clinical',
    description: 'Scheduled, triage, emergency, or walk-in patient consultations assigned to specific attending physicians with real-time status orchestration.',
    normalizationLevel: '3NF (Third Normal Form)',
    coordinates: { x: 790, y: 50 },
    columns: [
      { name: 'appointment_id', type: 'UUID', isPrimaryKey: true, isNullable: false, defaultValue: 'gen_random_uuid()', description: 'Surrogate primary key for encounter.' },
      { name: 'appointment_code', type: 'VARCHAR(25)', isUnique: true, isNullable: false, description: 'Encounter tracking code (e.g. APT-2026-0498).' },
      { name: 'patient_id', type: 'UUID', isForeignKey: true, isNullable: false, foreignKeyRef: { table: 'patients', column: 'patient_id', onDelete: 'RESTRICT' }, description: 'FK to patient receiving clinical service.' },
      { name: 'doctor_staff_id', type: 'UUID', isForeignKey: true, isNullable: false, foreignKeyRef: { table: 'staff_users', column: 'staff_id', onDelete: 'RESTRICT' }, description: 'FK to attending medical doctor.' },
      { name: 'booked_by_staff_id', type: 'UUID', isForeignKey: true, isNullable: true, foreignKeyRef: { table: 'staff_users', column: 'staff_id', onDelete: 'SET NULL' }, description: 'FK to receptionist or triage nurse who scheduled encounter.' },
      { name: 'appointment_type', type: 'appointment_type_enum', isNullable: false, description: 'Enums: consultation, follow_up, emergency, routine_checkup, specialist_referral.' },
      { name: 'scheduled_start_time', type: 'TIMESTAMPTZ', isNullable: false, description: 'Slot start timestamp.' },
      { name: 'scheduled_end_time', type: 'TIMESTAMPTZ', isNullable: false, description: 'Slot end timestamp.' },
      { name: 'status', type: 'appointment_status_enum', isNullable: false, defaultValue: "'scheduled'", description: 'Enums: scheduled, checked_in, in_consultation, completed, cancelled, no_show.' },
      { name: 'chief_complaint', type: 'TEXT', isNullable: true, description: 'Preliminary patient symptoms presented during intake.' },
      { name: 'cancellation_reason', type: 'TEXT', isNullable: true, description: 'Mandatory clinical or administrative justification if appointment is aborted.' },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Booking creation audit log.' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Status change audit log.' }
    ],
    constraints: [
      { name: 'pk_appointments', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (appointment_id)', description: 'Primary key.' },
      { name: 'uq_appointment_code', type: 'UNIQUE', definition: 'UNIQUE (appointment_code)', description: 'Unique human-readable appointment reference.' },
      { name: 'fk_appointments_patient', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE RESTRICT', description: 'Ensures appointments always link to an existing patient.' },
      { name: 'fk_appointments_doctor', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (doctor_staff_id) REFERENCES staff_users(staff_id) ON DELETE RESTRICT', description: 'Ensures doctor is valid staff member.' },
      { name: 'chk_appointment_time_order', type: 'CHECK', definition: 'CHECK (scheduled_end_time > scheduled_start_time)', description: 'Guarantees appointment end time strictly succeeds start time.' }
    ],
    indexes: [
      { name: 'idx_appointments_doctor_schedule', columns: ['doctor_staff_id', 'scheduled_start_time', 'scheduled_end_time'], type: 'Composite', rationale: 'Prevents double-booking and powers doctor daily timetable rendering.' },
      { name: 'idx_appointments_patient_date', columns: ['patient_id', 'scheduled_start_time'], type: 'Composite', rationale: 'Fast medical history encounter timeline queries.' },
      { name: 'idx_appointments_status', columns: ['status', 'scheduled_start_time'], type: 'Composite', rationale: 'Powers active waiting room queue and triage monitoring boards.' }
    ]
  },
  {
    id: 'billing_invoices',
    tableName: 'billing_invoices',
    displayName: 'Billing Invoices Header',
    category: 'billing',
    description: 'Fiscal ledger invoice header tracking overall clinical service billing, patient co-pay portions, HMO underwritten liabilities, payments, and unpaid balances.',
    normalizationLevel: '3NF (Third Normal Form)',
    coordinates: { x: 420, y: 520 },
    columns: [
      { name: 'invoice_id', type: 'UUID', isPrimaryKey: true, isNullable: false, defaultValue: 'gen_random_uuid()', description: 'Surrogate primary key for invoice ledger record.' },
      { name: 'invoice_number', type: 'VARCHAR(30)', isUnique: true, isNullable: false, description: 'Formal financial document series (e.g. INV-2026-10492).' },
      { name: 'patient_id', type: 'UUID', isForeignKey: true, isNullable: false, foreignKeyRef: { table: 'patients', column: 'patient_id', onDelete: 'RESTRICT' }, description: 'FK to patient receiving billed medical services.' },
      { name: 'appointment_id', type: 'UUID', isForeignKey: true, isNullable: true, foreignKeyRef: { table: 'appointments', column: 'appointment_id', onDelete: 'SET NULL' }, description: 'FK linking invoice to clinical encounter.' },
      { name: 'generated_by_staff_id', type: 'UUID', isForeignKey: true, isNullable: false, foreignKeyRef: { table: 'staff_users', column: 'staff_id', onDelete: 'RESTRICT' }, description: 'FK to billing officer or desk operator who finalized charges.' },
      { name: 'issue_date', type: 'TIMESTAMPTZ', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Official billing invoice generation timestamp.' },
      { name: 'due_date', type: 'TIMESTAMPTZ', isNullable: false, description: 'Payment maturity deadline.' },
      { name: 'subtotal_amount', type: 'NUMERIC(12,2)', isNullable: false, defaultValue: '0.00', description: 'Gross sum of all line items prior to adjustments.' },
      { name: 'discount_amount', type: 'NUMERIC(12,2)', isNullable: false, defaultValue: '0.00', description: 'Authorized institutional discount or waiver.' },
      { name: 'tax_amount', type: 'NUMERIC(12,2)', isNullable: false, defaultValue: '0.00', description: 'Statutory medical goods and service tax.' },
      { name: 'total_amount', type: 'NUMERIC(12,2)', isNullable: false, description: 'Final payable gross liability: subtotal - discount + tax.' },
      { name: 'patient_payable_amount', type: 'NUMERIC(12,2)', isNullable: false, description: 'Net portion directly payable by patient (out-of-pocket or deductible co-pay).' },
      { name: 'hmo_payable_amount', type: 'NUMERIC(12,2)', isNullable: false, defaultValue: '0.00', description: 'Portion submitted to HMO for corporate adjudication.' },
      { name: 'amount_paid', type: 'NUMERIC(12,2)', isNullable: false, defaultValue: '0.00', description: 'Cumulative cleared funds credited across all payment channels.' },
      { name: 'balance_due', type: 'NUMERIC(12,2)', isNullable: false, description: 'Remaining outstanding debt: total_amount - amount_paid.' },
      { name: 'payment_status', type: 'invoice_status_enum', isNullable: false, defaultValue: "'unpaid'", description: 'Enums: unpaid, partially_paid, fully_paid, waived, disputed.' },
      { name: 'notes', type: 'TEXT', isNullable: true, description: 'Accounting annotations or clinical justification notes.' },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'System record creation time.' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Last settlement or balance update time.' }
    ],
    constraints: [
      { name: 'pk_billing_invoices', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (invoice_id)', description: 'Primary key.' },
      { name: 'uq_invoice_number', type: 'UNIQUE', definition: 'UNIQUE (invoice_number)', description: 'Enforces sequential fiscal uniqueness.' },
      { name: 'fk_invoices_patient', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE RESTRICT', description: 'Prohibits orphaned financial records.' },
      { name: 'chk_amounts_non_negative', type: 'CHECK', definition: 'CHECK (subtotal_amount >= 0 AND discount_amount >= 0 AND total_amount >= 0 AND amount_paid >= 0 AND balance_due >= 0)', description: 'Prevents negative ledger balances.' },
      { name: 'chk_total_liability_split', type: 'CHECK', definition: 'CHECK (patient_payable_amount + hmo_payable_amount = total_amount)', description: 'Guarantees 100% of invoice total is explicitly accounted between patient and insurer.' },
      { name: 'chk_amount_paid_within_total', type: 'CHECK', definition: 'CHECK (amount_paid <= total_amount)', description: 'Prevents untracked overpayments on the invoice entity (overages require credit memos).' }
    ],
    indexes: [
      { name: 'idx_invoices_patient_status', columns: ['patient_id', 'payment_status'], type: 'Composite', rationale: 'Rapid checking of patient outstanding balances at checkout.' },
      { name: 'idx_invoices_due_date_unpaid', columns: ['due_date', 'payment_status'], type: 'Composite', condition: "payment_status != 'fully_paid'", rationale: 'Debt collection aging and overdue accounts receivable reports.' },
      { name: 'idx_invoices_issue_date', columns: ['issue_date'], type: 'B-tree', rationale: 'Financial period closing and daily revenue ledger tally.' }
    ]
  },
  {
    id: 'invoice_items',
    tableName: 'invoice_items',
    displayName: 'Invoice Line Items',
    category: 'billing',
    description: 'Normalized line-item detail recording every individual billable procedure, lab test, medication dispensation, or bed night to satisfy 1NF/2NF/3NF.',
    normalizationLevel: '3NF (Third Normal Form)',
    coordinates: { x: 420, y: 1040 },
    columns: [
      { name: 'item_id', type: 'UUID', isPrimaryKey: true, isNullable: false, defaultValue: 'gen_random_uuid()', description: 'Surrogate primary key for line item.' },
      { name: 'invoice_id', type: 'UUID', isForeignKey: true, isNullable: false, foreignKeyRef: { table: 'billing_invoices', column: 'invoice_id', onDelete: 'CASCADE' }, description: 'FK to parent billing invoice header.' },
      { name: 'service_category', type: 'service_category_enum', isNullable: false, description: 'Enums: consultation, laboratory, pharmacy, radiology, procedure, admission_bed, nursing_care.' },
      { name: 'item_code', type: 'VARCHAR(30)', isNullable: false, description: 'Standard clinical tariff catalog code (e.g. CPT-99213, LAB-CBC-01).' },
      { name: 'description', type: 'VARCHAR(255)', isNullable: false, description: 'Line item service description shown on patient bill.' },
      { name: 'quantity', type: 'NUMERIC(8,2)', isNullable: false, defaultValue: '1.00', description: 'Units consumed (e.g. 1 consultation, 10 tablets).' },
      { name: 'unit_price', type: 'NUMERIC(10,2)', isNullable: false, description: 'Catalog tariff rate per unit.' },
      { name: 'total_line_amount', type: 'NUMERIC(12,2)', isNullable: false, description: 'Calculated line total: quantity * unit_price.' },
      { name: 'is_hmo_covered', type: 'BOOLEAN', isNullable: false, defaultValue: 'false', description: 'Flag whether this specific tariff item is approved under payer formulary.' },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Line item insertion time.' }
    ],
    constraints: [
      { name: 'pk_invoice_items', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (item_id)', description: 'Primary key.' },
      { name: 'fk_invoice_items_header', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (invoice_id) REFERENCES billing_invoices(invoice_id) ON DELETE CASCADE', description: 'Cascade deletion if an unfinalized invoice draft is cancelled.' },
      { name: 'chk_item_math', type: 'CHECK', definition: 'CHECK (quantity > 0 AND unit_price >= 0 AND total_line_amount = (quantity * unit_price))', description: 'Strict arithmetic integrity on every invoice line item.' }
    ],
    indexes: [
      { name: 'idx_invoice_items_invoice_id', columns: ['invoice_id'], type: 'B-tree', rationale: 'Instant retrieval of itemized breakdown for billing PDFs and receipt printouts.' },
      { name: 'idx_invoice_items_category', columns: ['service_category'], type: 'B-tree', rationale: 'Revenue attribution reporting across Pharmacy, Lab, Radiology.' }
    ]
  },
  {
    id: 'payments',
    tableName: 'payments',
    displayName: 'Multi-Channel Payments Ledger',
    category: 'payments',
    description: 'Strict immutable financial transactions supporting multi-channel payments (Physical Cash, POS card terminals, Online Payment Gateways, and Direct Bank Transfers) with audit verification fields.',
    normalizationLevel: 'BCNF (Boyce-Codd Normal Form)',
    coordinates: { x: 790, y: 520 },
    columns: [
      { name: 'payment_id', type: 'UUID', isPrimaryKey: true, isNullable: false, defaultValue: 'gen_random_uuid()', description: 'Cryptographic unique identifier for the financial transaction.' },
      { name: 'receipt_number', type: 'VARCHAR(35)', isUnique: true, isNullable: false, description: 'Official fiscal receipt sequence (e.g. REC-2026-90412).' },
      { name: 'invoice_id', type: 'UUID', isForeignKey: true, isNullable: false, foreignKeyRef: { table: 'billing_invoices', column: 'invoice_id', onDelete: 'RESTRICT' }, description: 'FK to invoice being credited.' },
      { name: 'patient_id', type: 'UUID', isForeignKey: true, isNullable: false, foreignKeyRef: { table: 'patients', column: 'patient_id', onDelete: 'RESTRICT' }, description: 'FK to paying patient entity.' },
      { name: 'cashier_staff_id', type: 'UUID', isForeignKey: true, isNullable: false, foreignKeyRef: { table: 'staff_users', column: 'staff_id', onDelete: 'RESTRICT' }, description: 'FK to teller / cashier who collected or reconciled the transaction.' },
      { name: 'payment_channel', type: 'payment_channel_enum', isNullable: false, description: 'Enums: cash, pos_terminal, gateway_transfer, direct_bank_transfer, cheque.' },
      { name: 'amount', type: 'NUMERIC(12,2)', isNullable: false, description: 'Actual monetary settlement amount received.' },
      { name: 'currency', type: 'VARCHAR(3)', isNullable: false, defaultValue: "'USD'", description: 'ISO 4217 3-letter currency code (e.g. USD, EUR, GBP, NGN).' },
      { name: 'payment_timestamp', type: 'TIMESTAMPTZ', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Exact point-in-time timestamp when payment was captured.' },
      { name: 'channel_status', type: 'payment_status_enum', isNullable: false, defaultValue: "'settled'", description: 'Enums: pending_clearing, settled, declined, refunded, chargeback.' },
      // Cash Drawer Audit Columns
      { name: 'cash_drawer_session_id', type: 'VARCHAR(50)', isNullable: true, description: 'Active cash drawer shift batch ID for end-of-day cash till balancing.' },
      { name: 'cash_tendered', type: 'NUMERIC(12,2)', isNullable: true, description: 'Physical cash presented by patient for change calculation.' },
      { name: 'change_returned', type: 'NUMERIC(12,2)', isNullable: true, description: 'Exact change dispensed back to patient.' },
      // POS Card Terminal Audit Columns
      { name: 'pos_terminal_id', type: 'VARCHAR(50)', isNullable: true, description: 'Hardware POS terminal serial number / merchant TID (e.g. POS-TID-8841).' },
      { name: 'pos_rrn', type: 'VARCHAR(50)', isNullable: true, description: 'Retrieval Reference Number from card processor switch.' },
      { name: 'pos_auth_code', type: 'VARCHAR(30)', isNullable: true, description: 'Bank authorization response code.' },
      { name: 'card_last_four', type: 'CHAR(4)', isNullable: true, description: 'PCI-DSS compliant masked card identifier (e.g. 4012).' },
      { name: 'card_type', type: 'VARCHAR(20)', isNullable: true, description: 'Card scheme: Visa, Mastercard, American Express, Verve.' },
      // Gateway & Webhook Audit Columns
      { name: 'gateway_provider', type: 'VARCHAR(50)', isNullable: true, description: 'Online gateway operator: Stripe, Paystack, Flutterwave, Adyen.' },
      { name: 'gateway_transaction_id', type: 'VARCHAR(100)', isNullable: true, description: 'External transaction reference from gateway (e.g. ch_3MtwLw2eZvKYlo2C).' },
      { name: 'gateway_session_id', type: 'VARCHAR(100)', isNullable: true, description: 'Checkout session ID for idempotency matching.' },
      { name: 'gateway_webhook_verified', type: 'BOOLEAN', isNullable: true, defaultValue: 'false', description: 'Cryptographic signature verification flag for asynchronous webhook event.' },
      // Bank Transfer / Cheque Audit Columns
      { name: 'bank_name', type: 'VARCHAR(100)', isNullable: true, description: 'Issuing bank for direct wires or physical cheques.' },
      { name: 'transfer_reference_number', type: 'VARCHAR(100)', isNullable: true, description: 'Central bank NIP / wire transaction session reference.' },
      // Reconciliation Audit Status
      { name: 'reconciliation_status', type: 'reconciliation_status_enum', isNullable: false, defaultValue: "'unreconciled'", description: 'Enums: unreconciled, reconciled, flagged_mismatch.' },
      { name: 'reconciled_at', type: 'TIMESTAMPTZ', isNullable: true, description: 'Timestamp when finance controller matched transaction against bank statements.' },
      { name: 'remarks', type: 'TEXT', isNullable: true, description: 'Cashier notes or transaction dispute reason.' },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Immutable log insertion time.' }
    ],
    constraints: [
      { name: 'pk_payments', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (payment_id)', description: 'Primary key.' },
      { name: 'uq_payment_receipt_number', type: 'UNIQUE', definition: 'UNIQUE (receipt_number)', description: 'Guarantees strictly unique fiscal receipt sequencing.' },
      { name: 'fk_payments_invoice', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (invoice_id) REFERENCES billing_invoices(invoice_id) ON DELETE RESTRICT', description: 'Prevents payment orphans; cannot delete billed invoice with active payments.' },
      { name: 'fk_payments_patient', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE RESTRICT', description: 'Payment must link to patient.' },
      { name: 'fk_payments_cashier', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (cashier_staff_id) REFERENCES staff_users(staff_id) ON DELETE RESTRICT', description: 'Guarantees cashier audit accountability.' },
      { name: 'chk_payment_positive', type: 'CHECK', definition: 'CHECK (amount > 0)', description: 'Payment amount must be strictly greater than zero.' },
      { name: 'chk_channel_integrity_cash', type: 'CHECK', definition: "CHECK (payment_channel != 'cash' OR cash_tendered >= amount)", description: 'When cash channel is selected, tendered amount must cover paid sum.' },
      { name: 'chk_channel_integrity_pos', type: 'CHECK', definition: "CHECK (payment_channel != 'pos_terminal' OR (pos_rrn IS NOT NULL AND pos_terminal_id IS NOT NULL))", description: 'POS card transactions require terminal ID and Retrieval Reference Number (RRN).' },
      { name: 'chk_channel_integrity_gateway', type: 'CHECK', definition: "CHECK (payment_channel != 'gateway_transfer' OR (gateway_provider IS NOT NULL AND gateway_transaction_id IS NOT NULL))", description: 'Gateway transfers require provider name and external transaction ID.' }
    ],
    indexes: [
      { name: 'idx_payments_invoice', columns: ['invoice_id'], type: 'B-tree', rationale: 'Fast aggregation of invoice payment history.' },
      { name: 'idx_payments_channel_timestamp', columns: ['payment_channel', 'payment_timestamp'], type: 'Composite', rationale: 'Multi-channel daily reconciliation and shift settlement balancing.' },
      { name: 'idx_payments_pos_rrn', columns: ['pos_rrn'], type: 'B-tree', condition: 'pos_rrn IS NOT NULL', rationale: 'Instant card payment dispute investigation.' },
      { name: 'idx_payments_gateway_tx', columns: ['gateway_transaction_id'], type: 'B-tree', condition: 'gateway_transaction_id IS NOT NULL', rationale: 'Webhook idempotency lookup to prevent duplicate payment crediting.' }
    ]
  },
  {
    id: 'hmo_claims',
    tableName: 'hmo_claims',
    displayName: 'HMO Claims Lifecycle Tracking',
    category: 'hmo',
    description: 'State machine tracking insurance claims submitted to HMOs, covering authorization codes, adjudication decisions, and status progression from submitted to paid.',
    normalizationLevel: '3NF (Third Normal Form)',
    coordinates: { x: 50, y: 1040 },
    columns: [
      { name: 'claim_id', type: 'UUID', isPrimaryKey: true, isNullable: false, defaultValue: 'gen_random_uuid()', description: 'Surrogate primary key for health insurance claim.' },
      { name: 'claim_reference_number', type: 'VARCHAR(35)', isUnique: true, isNullable: false, description: 'Unique institutional claim filing code (e.g. CLM-2026-00831).' },
      { name: 'invoice_id', type: 'UUID', isForeignKey: true, isNullable: false, foreignKeyRef: { table: 'billing_invoices', column: 'invoice_id', onDelete: 'RESTRICT' }, description: 'FK to billed hospital invoice containing claimable items.' },
      { name: 'patient_id', type: 'UUID', isForeignKey: true, isNullable: false, foreignKeyRef: { table: 'patients', column: 'patient_id', onDelete: 'RESTRICT' }, description: 'FK to insured patient.' },
      { name: 'hmo_provider_id', type: 'UUID', isForeignKey: true, isNullable: false, foreignKeyRef: { table: 'hmo_providers', column: 'provider_id', onDelete: 'RESTRICT' }, description: 'FK to target health maintenance underwriter.' },
      { name: 'policy_number', type: 'VARCHAR(100)', isNullable: false, description: 'Patient policy ID under this underwriter.' },
      { name: 'authorization_code', type: 'VARCHAR(100)', isNullable: true, description: 'Pre-authorization code issued by HMO desk before high-value treatment.' },
      { name: 'claimed_amount', type: 'NUMERIC(12,2)', isNullable: false, description: 'Original reimbursement figure requested by clinic.' },
      { name: 'approved_amount', type: 'NUMERIC(12,2)', isNullable: false, defaultValue: '0.00', description: 'Adjudicated amount agreed for payment by HMO auditor.' },
      { name: 'co_pay_amount', type: 'NUMERIC(12,2)', isNullable: false, defaultValue: '0.00', description: 'Patient co-insurance deductible required by HMO policy.' },
      { name: 'amount_settled', type: 'NUMERIC(12,2)', isNullable: false, defaultValue: '0.00', description: 'Actual monetary funds received via bank remittance from HMO.' },
      { name: 'claim_status', type: 'hmo_claim_status_enum', isNullable: false, defaultValue: "'draft'", description: 'State machine: draft -> submitted -> under_review -> query_issued -> approved -> partially_approved -> rejected -> disputed -> settled_paid.' },
      { name: 'submission_date', type: 'TIMESTAMPTZ', isNullable: true, description: 'Official dispatch timestamp to HMO claims portal.' },
      { name: 'adjudication_date', type: 'TIMESTAMPTZ', isNullable: true, description: 'Date insurer approved, rejected, or queried the claim.' },
      { name: 'settlement_date', type: 'TIMESTAMPTZ', isNullable: true, description: 'Date electronic funds transfer was executed by HMO.' },
      { name: 'settlement_batch_id', type: 'VARCHAR(100)', isNullable: true, description: 'Payer remittance advice / batch advice reference.' },
      { name: 'settlement_payment_id', type: 'UUID', isForeignKey: true, isNullable: true, foreignKeyRef: { table: 'payments', column: 'payment_id', onDelete: 'SET NULL' }, description: 'FK linking to the payment ledger entry credited when HMO wires funds.' },
      { name: 'rejection_reason', type: 'TEXT', isNullable: true, description: 'Formal insurer denial reason (e.g. Policy Lapsed, Non-Covered Tariff).' },
      { name: 'adjudicator_remarks', type: 'TEXT', isNullable: true, description: 'Notes or documentation queries from HMO medical assessor.' },
      { name: 'created_by_staff_id', type: 'UUID', isForeignKey: true, isNullable: false, foreignKeyRef: { table: 'staff_users', column: 'staff_id', onDelete: 'RESTRICT' }, description: 'FK to HMO desk officer who compiled the filing.' },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Claim record initialization.' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Claim status transition timestamp.' }
    ],
    constraints: [
      { name: 'pk_hmo_claims', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (claim_id)', description: 'Primary key.' },
      { name: 'uq_claim_ref', type: 'UNIQUE', definition: 'UNIQUE (claim_reference_number)', description: 'Guarantees unique claim tracking numbers.' },
      { name: 'fk_claims_invoice', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (invoice_id) REFERENCES billing_invoices(invoice_id) ON DELETE RESTRICT', description: 'Prevents deleting billed invoice while insurance claim is pending.' },
      { name: 'fk_claims_provider', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (hmo_provider_id) REFERENCES hmo_providers(provider_id) ON DELETE RESTRICT', description: 'Ensures claims only reference valid licensed HMOs.' },
      { name: 'chk_claimed_positive', type: 'CHECK', definition: 'CHECK (claimed_amount > 0)', description: 'Claim value must be positive.' },
      { name: 'chk_approved_le_claimed', type: 'CHECK', definition: 'CHECK (approved_amount <= claimed_amount)', description: 'Approved claim amount cannot exceed requested amount.' },
      { name: 'chk_settled_le_approved', type: 'CHECK', definition: 'CHECK (amount_settled <= approved_amount)', description: 'Settled disbursement cannot exceed approved figure.' }
    ],
    indexes: [
      { name: 'idx_claims_provider_status', columns: ['hmo_provider_id', 'claim_status'], type: 'Composite', rationale: 'Fast filtering of pending claims by insurance carrier for weekly follow-up.' },
      { name: 'idx_claims_invoice', columns: ['invoice_id'], type: 'B-tree', rationale: 'Lookup of insurance coverage status directly from patient billing chart.' },
      { name: 'idx_claims_submission_date', columns: ['submission_date'], type: 'B-tree', condition: 'submission_date IS NOT NULL', rationale: 'Claims turnaround SLA and accounts receivable aging tracking.' }
    ]
  },
  {
    id: 'hmo_claim_history',
    tableName: 'hmo_claim_history',
    displayName: 'HMO Claim State Audit Log',
    category: 'hmo',
    description: 'Append-only audit trail logging every state transition of a claim from draft to submitted, queried, approved, and settled, recording timestamp and staff actor.',
    normalizationLevel: '4NF (Fourth Normal Form / Audit Log)',
    coordinates: { x: 790, y: 1040 },
    columns: [
      { name: 'history_id', type: 'UUID', isPrimaryKey: true, isNullable: false, defaultValue: 'gen_random_uuid()', description: 'Surrogate primary key for audit entry.' },
      { name: 'claim_id', type: 'UUID', isForeignKey: true, isNullable: false, foreignKeyRef: { table: 'hmo_claims', column: 'claim_id', onDelete: 'CASCADE' }, description: 'FK to subject health insurance claim.' },
      { name: 'previous_status', type: 'VARCHAR(40)', isNullable: true, description: 'Prior state in the lifecycle state machine.' },
      { name: 'new_status', type: 'VARCHAR(40)', isNullable: false, description: 'State transitioned into.' },
      { name: 'changed_by_staff_id', type: 'UUID', isForeignKey: true, isNullable: true, foreignKeyRef: { table: 'staff_users', column: 'staff_id', onDelete: 'SET NULL' }, description: 'FK to staff officer or API webhook actor executing transition.' },
      { name: 'transition_notes', type: 'TEXT', isNullable: true, description: 'Detailed reason or adjudicator comments explaining the transition.' },
      { name: 'transition_timestamp', type: 'TIMESTAMPTZ', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Immutable timestamp of event occurrence.' }
    ],
    constraints: [
      { name: 'pk_hmo_claim_history', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (history_id)', description: 'Primary key.' },
      { name: 'fk_history_claim', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (claim_id) REFERENCES hmo_claims(claim_id) ON DELETE CASCADE', description: 'Cascade deletion if claim is purged in test environment.' }
    ],
    indexes: [
      { name: 'idx_claim_history_claim_time', columns: ['claim_id', 'transition_timestamp'], type: 'Composite', rationale: 'Fast sequential timeline rendering of a claim lifecycle.' }
    ]
  }
];

export const SCHEMA_RELATIONS: SchemaRelation[] = [
  { id: 'rel_patient_hmo', fromTable: 'patients', fromColumn: 'primary_hmo_provider_id', toTable: 'hmo_providers', toColumn: 'provider_id', type: 'many-to-one', onDelete: 'RESTRICT', label: 'Primary Insurer' },
  { id: 'rel_apt_patient', fromTable: 'appointments', fromColumn: 'patient_id', toTable: 'patients', toColumn: 'patient_id', type: 'many-to-one', onDelete: 'RESTRICT', label: 'Patient Appointment' },
  { id: 'rel_apt_doctor', fromTable: 'appointments', fromColumn: 'doctor_staff_id', toTable: 'staff_users', toColumn: 'staff_id', type: 'many-to-one', onDelete: 'RESTRICT', label: 'Attending Doctor' },
  { id: 'rel_inv_patient', fromTable: 'billing_invoices', fromColumn: 'patient_id', toTable: 'patients', toColumn: 'patient_id', type: 'many-to-one', onDelete: 'RESTRICT', label: 'Billed Patient' },
  { id: 'rel_inv_apt', fromTable: 'billing_invoices', fromColumn: 'appointment_id', toTable: 'appointments', toColumn: 'appointment_id', type: 'one-to-one', onDelete: 'SET NULL', label: 'Encounter Billing' },
  { id: 'rel_inv_staff', fromTable: 'billing_invoices', fromColumn: 'generated_by_staff_id', toTable: 'staff_users', toColumn: 'staff_id', type: 'many-to-one', onDelete: 'RESTRICT', label: 'Billing Officer' },
  { id: 'rel_item_inv', fromTable: 'invoice_items', fromColumn: 'invoice_id', toTable: 'billing_invoices', toColumn: 'invoice_id', type: 'many-to-one', onDelete: 'CASCADE', label: 'Invoice Line Item' },
  { id: 'rel_pay_inv', fromTable: 'payments', fromColumn: 'invoice_id', toTable: 'billing_invoices', toColumn: 'invoice_id', type: 'many-to-one', onDelete: 'RESTRICT', label: 'Invoice Payment Settlement' },
  { id: 'rel_pay_patient', fromTable: 'payments', fromColumn: 'patient_id', toTable: 'patients', toColumn: 'patient_id', type: 'many-to-one', onDelete: 'RESTRICT', label: 'Paying Patient' },
  { id: 'rel_pay_cashier', fromTable: 'payments', fromColumn: 'cashier_staff_id', toTable: 'staff_users', toColumn: 'staff_id', type: 'many-to-one', onDelete: 'RESTRICT', label: 'Collecting Cashier' },
  { id: 'rel_claim_inv', fromTable: 'hmo_claims', fromColumn: 'invoice_id', toTable: 'billing_invoices', toColumn: 'invoice_id', type: 'many-to-one', onDelete: 'RESTRICT', label: 'Claimed Invoice' },
  { id: 'rel_claim_patient', fromTable: 'hmo_claims', fromColumn: 'patient_id', toTable: 'patients', toColumn: 'patient_id', type: 'many-to-one', onDelete: 'RESTRICT', label: 'Claim Enrollee' },
  { id: 'rel_claim_provider', fromTable: 'hmo_claims', fromColumn: 'hmo_provider_id', toTable: 'hmo_providers', toColumn: 'provider_id', type: 'many-to-one', onDelete: 'RESTRICT', label: 'Target Insurer' },
  { id: 'rel_claim_history', fromTable: 'hmo_claim_history', fromColumn: 'claim_id', toTable: 'hmo_claims', toColumn: 'claim_id', type: 'many-to-one', onDelete: 'CASCADE', label: 'Claim Audit Trail' }
];
