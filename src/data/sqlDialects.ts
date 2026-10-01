export const POSTGRESQL_DDL = `-- ============================================================================
-- VIDIEMS ClinicLedger - Robust Relational Database Schema
-- Production Standard: PostgreSQL 15+ / 16+
-- Schema Architect: VIDIEMS Senior Systems & Database Architecture Team
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMERATED TYPES (DOMAIN INTEGRITY)
-- ============================================================================

CREATE TYPE staff_role_enum AS ENUM (
  'super_admin',
  'doctor',
  'nurse',
  'cashier',
  'billing_officer',
  'hmo_desk',
  'pharmacist',
  'lab_technician'
);

CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');

CREATE TYPE blood_group_enum AS ENUM (
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'
);

CREATE TYPE appointment_type_enum AS ENUM (
  'consultation',
  'follow_up',
  'emergency',
  'routine_checkup',
  'specialist_referral'
);

CREATE TYPE appointment_status_enum AS ENUM (
  'scheduled',
  'checked_in',
  'in_consultation',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE service_category_enum AS ENUM (
  'consultation',
  'laboratory',
  'pharmacy',
  'radiology',
  'procedure',
  'admission_bed',
  'nursing_care'
);

CREATE TYPE invoice_status_enum AS ENUM (
  'unpaid',
  'partially_paid',
  'fully_paid',
  'waived',
  'disputed'
);

CREATE TYPE payment_channel_enum AS ENUM (
  'cash',
  'pos_terminal',
  'gateway_transfer',
  'direct_bank_transfer',
  'cheque'
);

CREATE TYPE payment_status_enum AS ENUM (
  'pending_clearing',
  'settled',
  'declined',
  'refunded',
  'chargeback'
);

CREATE TYPE reconciliation_status_enum AS ENUM (
  'unreconciled',
  'reconciled',
  'flagged_mismatch'
);

CREATE TYPE hmo_claim_status_enum AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'query_issued',
  'approved',
  'partially_approved',
  'rejected',
  'disputed',
  'settled_paid'
);

-- ============================================================================
-- 2. STAFF_USERS TABLE
-- ============================================================================

CREATE TABLE staff_users (
  staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_code VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL,
  role staff_role_enum NOT NULL,
  department VARCHAR(100) NOT NULL,
  license_number VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_role_active ON staff_users(role, is_active);
CREATE UNIQUE INDEX idx_staff_email ON staff_users(email);

-- ============================================================================
-- 3. HMO_PROVIDERS TABLE
-- ============================================================================

CREATE TABLE hmo_providers (
  provider_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code VARCHAR(20) NOT NULL UNIQUE,
  provider_name VARCHAR(150) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(30) NOT NULL,
  claims_portal_url VARCHAR(255),
  reimbursement_terms_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_terms_days_positive CHECK (reimbursement_terms_days > 0)
);

CREATE INDEX idx_hmo_providers_active ON hmo_providers(is_active);

-- ============================================================================
-- 4. PATIENTS TABLE
-- ============================================================================

CREATE TABLE patients (
  patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mrn VARCHAR(30) NOT NULL UNIQUE, -- Medical Record Number
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender gender_enum NOT NULL,
  blood_group blood_group_enum,
  genotype VARCHAR(5),
  email VARCHAR(255),
  phone_number VARCHAR(30) NOT NULL,
  residential_address TEXT,
  emergency_contact_name VARCHAR(150) NOT NULL,
  emergency_contact_phone VARCHAR(30) NOT NULL,
  primary_hmo_provider_id UUID REFERENCES hmo_providers(provider_id) ON DELETE RESTRICT,
  hmo_policy_number VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_dob_past CHECK (date_of_birth <= CURRENT_DATE)
);

CREATE UNIQUE INDEX idx_patients_mrn ON patients(mrn);
CREATE INDEX idx_patients_phone ON patients(phone_number);
CREATE INDEX idx_patients_hmo_policy ON patients(primary_hmo_provider_id, hmo_policy_number);

-- ============================================================================
-- 5. APPOINTMENTS TABLE
-- ============================================================================

CREATE TABLE appointments (
  appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_code VARCHAR(25) NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE RESTRICT,
  doctor_staff_id UUID NOT NULL REFERENCES staff_users(staff_id) ON DELETE RESTRICT,
  booked_by_staff_id UUID REFERENCES staff_users(staff_id) ON DELETE SET NULL,
  appointment_type appointment_type_enum NOT NULL,
  scheduled_start_time TIMESTAMPTZ NOT NULL,
  scheduled_end_time TIMESTAMPTZ NOT NULL,
  status appointment_status_enum NOT NULL DEFAULT 'scheduled',
  chief_complaint TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_appointment_time_order CHECK (scheduled_end_time > scheduled_start_time)
);

CREATE INDEX idx_appointments_doctor_schedule ON appointments(doctor_staff_id, scheduled_start_time, scheduled_end_time);
CREATE INDEX idx_appointments_patient_date ON appointments(patient_id, scheduled_start_time);
CREATE INDEX idx_appointments_status ON appointments(status, scheduled_start_time);

-- ============================================================================
-- 6. BILLING_INVOICES TABLE (HEADER)
-- ============================================================================

CREATE TABLE billing_invoices (
  invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(30) NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE RESTRICT,
  appointment_id UUID REFERENCES appointments(appointment_id) ON DELETE SET NULL,
  generated_by_staff_id UUID NOT NULL REFERENCES staff_users(staff_id) ON DELETE RESTRICT,
  issue_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMPTZ NOT NULL,
  subtotal_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12,2) NOT NULL,
  patient_payable_amount NUMERIC(12,2) NOT NULL,
  hmo_payable_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  balance_due NUMERIC(12,2) NOT NULL,
  payment_status invoice_status_enum NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_invoices_amounts_positive CHECK (
    subtotal_amount >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND
    total_amount >= 0 AND amount_paid >= 0 AND balance_due >= 0
  ),
  CONSTRAINT chk_total_liability_split CHECK (
    patient_payable_amount + hmo_payable_amount = total_amount
  ),
  CONSTRAINT chk_amount_paid_within_total CHECK (
    amount_paid <= total_amount
  )
);

CREATE INDEX idx_invoices_patient_status ON billing_invoices(patient_id, payment_status);
CREATE INDEX idx_invoices_due_date_unpaid ON billing_invoices(due_date, payment_status) WHERE payment_status != 'fully_paid';
CREATE INDEX idx_invoices_issue_date ON billing_invoices(issue_date);

-- ============================================================================
-- 7. INVOICE_ITEMS TABLE (LINE DETAIL - 1NF/2NF/3NF)
-- ============================================================================

CREATE TABLE invoice_items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES billing_invoices(invoice_id) ON DELETE CASCADE,
  service_category service_category_enum NOT NULL,
  item_code VARCHAR(30) NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity NUMERIC(8,2) NOT NULL DEFAULT 1.00,
  unit_price NUMERIC(10,2) NOT NULL,
  total_line_amount NUMERIC(12,2) NOT NULL,
  is_hmo_covered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_item_math CHECK (
    quantity > 0 AND unit_price >= 0 AND total_line_amount = (quantity * unit_price)
  )
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_category ON invoice_items(service_category);

-- ============================================================================
-- 8. PAYMENTS TABLE (MULTI-CHANNEL LOGGING)
-- ============================================================================

CREATE TABLE payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(35) NOT NULL UNIQUE,
  invoice_id UUID NOT NULL REFERENCES billing_invoices(invoice_id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE RESTRICT,
  cashier_staff_id UUID NOT NULL REFERENCES staff_users(staff_id) ON DELETE RESTRICT,
  payment_channel payment_channel_enum NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  payment_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  channel_status payment_status_enum NOT NULL DEFAULT 'settled',
  
  -- Cash Channel Audit Columns
  cash_drawer_session_id VARCHAR(50),
  cash_tendered NUMERIC(12,2),
  change_returned NUMERIC(12,2),
  
  -- POS Card Terminal Audit Columns
  pos_terminal_id VARCHAR(50),
  pos_rrn VARCHAR(50), -- Retrieval Reference Number from Switch
  pos_auth_code VARCHAR(30),
  card_last_four CHAR(4),
  card_type VARCHAR(20),
  
  -- Online Payment Gateway & Webhook Audit Columns
  gateway_provider VARCHAR(50),
  gateway_transaction_id VARCHAR(100),
  gateway_session_id VARCHAR(100),
  gateway_webhook_verified BOOLEAN DEFAULT false,
  
  -- Bank Transfer / Cheque Audit Columns
  bank_name VARCHAR(100),
  transfer_reference_number VARCHAR(100),
  
  -- Finance Settlement & Reconciliation
  reconciliation_status reconciliation_status_enum NOT NULL DEFAULT 'unreconciled',
  reconciled_at TIMESTAMPTZ,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT chk_payment_amount_positive CHECK (amount > 0),
  CONSTRAINT chk_channel_integrity_cash CHECK (
    payment_channel != 'cash' OR (cash_tendered IS NOT NULL AND cash_tendered >= amount)
  ),
  CONSTRAINT chk_channel_integrity_pos CHECK (
    payment_channel != 'pos_terminal' OR (pos_rrn IS NOT NULL AND pos_terminal_id IS NOT NULL)
  ),
  CONSTRAINT chk_channel_integrity_gateway CHECK (
    payment_channel != 'gateway_transfer' OR (gateway_provider IS NOT NULL AND gateway_transaction_id IS NOT NULL)
  )
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_channel_timestamp ON payments(payment_channel, payment_timestamp);
CREATE INDEX idx_payments_pos_rrn ON payments(pos_rrn) WHERE pos_rrn IS NOT NULL;
CREATE INDEX idx_payments_gateway_tx ON payments(gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;

-- ============================================================================
-- 9. HMO_CLAIMS TABLE (STATUS TRACKING FROM SUBMITTED TO PAID)
-- ============================================================================

CREATE TABLE hmo_claims (
  claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_reference_number VARCHAR(35) NOT NULL UNIQUE,
  invoice_id UUID NOT NULL REFERENCES billing_invoices(invoice_id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE RESTRICT,
  hmo_provider_id UUID NOT NULL REFERENCES hmo_providers(provider_id) ON DELETE RESTRICT,
  policy_number VARCHAR(100) NOT NULL,
  authorization_code VARCHAR(100),
  claimed_amount NUMERIC(12,2) NOT NULL,
  approved_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  co_pay_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  amount_settled NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  claim_status hmo_claim_status_enum NOT NULL DEFAULT 'draft',
  submission_date TIMESTAMPTZ,
  adjudication_date TIMESTAMPTZ,
  settlement_date TIMESTAMPTZ,
  settlement_batch_id VARCHAR(100),
  settlement_payment_id UUID REFERENCES payments(payment_id) ON DELETE SET NULL,
  rejection_reason TEXT,
  adjudicator_remarks TEXT,
  created_by_staff_id UUID NOT NULL REFERENCES staff_users(staff_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_claimed_positive CHECK (claimed_amount > 0),
  CONSTRAINT chk_approved_le_claimed CHECK (approved_amount <= claimed_amount),
  CONSTRAINT chk_settled_le_approved CHECK (amount_settled <= approved_amount)
);

CREATE INDEX idx_claims_provider_status ON hmo_claims(hmo_provider_id, claim_status);
CREATE INDEX idx_claims_invoice ON hmo_claims(invoice_id);
CREATE INDEX idx_claims_submission_date ON hmo_claims(submission_date) WHERE submission_date IS NOT NULL;

-- ============================================================================
-- 10. HMO_CLAIM_HISTORY TABLE (IMMUTABLE AUDIT STATE TRANSITIONS)
-- ============================================================================

CREATE TABLE hmo_claim_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES hmo_claims(claim_id) ON DELETE CASCADE,
  previous_status VARCHAR(40),
  new_status VARCHAR(40) NOT NULL,
  changed_by_staff_id UUID REFERENCES staff_users(staff_id) ON DELETE SET NULL,
  transition_notes TEXT,
  transition_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_claim_history_claim_time ON hmo_claim_history(claim_id, transition_timestamp);

-- ============================================================================
-- 11. AUTOMATED LEDGER RECONCILIATION TRIGGERS
-- ============================================================================

-- Automatically update billing_invoices.amount_paid and balance_due on payment
CREATE OR REPLACE FUNCTION fn_update_invoice_payment_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_total_cleared NUMERIC(12,2);
  v_invoice_total NUMERIC(12,2);
BEGIN
  -- Aggregate all settled payments for this invoice
  SELECT COALESCE(SUM(amount), 0.00)
  INTO v_total_cleared
  FROM payments
  WHERE invoice_id = NEW.invoice_id AND channel_status = 'settled';

  SELECT total_amount
  INTO v_invoice_total
  FROM billing_invoices
  WHERE invoice_id = NEW.invoice_id;

  UPDATE billing_invoices
  SET amount_paid = v_total_cleared,
      balance_due = v_invoice_total - v_total_cleared,
      payment_status = CASE 
        WHEN (v_invoice_total - v_total_cleared) <= 0 THEN 'fully_paid'::invoice_status_enum
        WHEN v_total_cleared > 0 THEN 'partially_paid'::invoice_status_enum
        ELSE 'unpaid'::invoice_status_enum
      END,
      updated_at = CURRENT_TIMESTAMP
  WHERE invoice_id = NEW.invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_balance_sync
AFTER INSERT OR UPDATE OF amount, channel_status ON payments
FOR EACH ROW
EXECUTE FUNCTION fn_update_invoice_payment_balance();

-- Automatically append to hmo_claim_history when claim status changes
CREATE OR REPLACE FUNCTION fn_log_hmo_claim_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.claim_status IS DISTINCT FROM NEW.claim_status) THEN
    INSERT INTO hmo_claim_history (
      claim_id,
      previous_status,
      new_status,
      changed_by_staff_id,
      transition_notes,
      transition_timestamp
    ) VALUES (
      NEW.claim_id,
      OLD.claim_status::VARCHAR,
      NEW.claim_status::VARCHAR,
      NEW.created_by_staff_id,
      COALESCE(NEW.adjudicator_remarks, 'Status transitioned to ' || NEW.claim_status::VARCHAR),
      CURRENT_TIMESTAMP
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hmo_claims_state_log
AFTER UPDATE OF claim_status ON hmo_claims
FOR EACH ROW
EXECUTE FUNCTION fn_log_hmo_claim_transition();
`;

export const MYSQL_DDL = `-- ============================================================================
-- VIDIEMS ClinicLedger - MySQL 8.0+ Dialect
-- ============================================================================

CREATE TABLE staff_users (
  staff_id CHAR(36) PRIMARY KEY,
  staff_code VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL,
  role ENUM('super_admin','doctor','nurse','cashier','billing_officer','hmo_desk','pharmacist','lab_technician') NOT NULL,
  department VARCHAR(100) NOT NULL,
  license_number VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_staff_role_active (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE hmo_providers (
  provider_id CHAR(36) PRIMARY KEY,
  provider_code VARCHAR(20) NOT NULL UNIQUE,
  provider_name VARCHAR(150) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(30) NOT NULL,
  claims_portal_url VARCHAR(255),
  reimbursement_terms_days INT NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_terms_days_positive CHECK (reimbursement_terms_days > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE patients (
  patient_id CHAR(36) PRIMARY KEY,
  mrn VARCHAR(30) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender ENUM('male','female','other') NOT NULL,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown'),
  genotype VARCHAR(5),
  email VARCHAR(255),
  phone_number VARCHAR(30) NOT NULL,
  residential_address TEXT,
  emergency_contact_name VARCHAR(150) NOT NULL,
  emergency_contact_phone VARCHAR(30) NOT NULL,
  primary_hmo_provider_id CHAR(36),
  hmo_policy_number VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_patients_hmo FOREIGN KEY (primary_hmo_provider_id) REFERENCES hmo_providers(provider_id) ON DELETE RESTRICT,
  INDEX idx_patients_phone (phone_number),
  INDEX idx_patients_hmo_policy (primary_hmo_provider_id, hmo_policy_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE appointments (
  appointment_id CHAR(36) PRIMARY KEY,
  appointment_code VARCHAR(25) NOT NULL UNIQUE,
  patient_id CHAR(36) NOT NULL,
  doctor_staff_id CHAR(36) NOT NULL,
  booked_by_staff_id CHAR(36),
  appointment_type ENUM('consultation','follow_up','emergency','routine_checkup','specialist_referral') NOT NULL,
  scheduled_start_time DATETIME NOT NULL,
  scheduled_end_time DATETIME NOT NULL,
  status ENUM('scheduled','checked_in','in_consultation','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
  chief_complaint TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE RESTRICT,
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_staff_id) REFERENCES staff_users(staff_id) ON DELETE RESTRICT,
  CONSTRAINT fk_appointments_booked_by FOREIGN KEY (booked_by_staff_id) REFERENCES staff_users(staff_id) ON DELETE SET NULL,
  CONSTRAINT chk_appointment_time_order CHECK (scheduled_end_time > scheduled_start_time),
  INDEX idx_doctor_schedule (doctor_staff_id, scheduled_start_time, scheduled_end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE billing_invoices (
  invoice_id CHAR(36) PRIMARY KEY,
  invoice_number VARCHAR(30) NOT NULL UNIQUE,
  patient_id CHAR(36) NOT NULL,
  appointment_id CHAR(36),
  generated_by_staff_id CHAR(36) NOT NULL,
  issue_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date DATETIME NOT NULL,
  subtotal_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL,
  patient_payable_amount DECIMAL(12,2) NOT NULL,
  hmo_payable_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  balance_due DECIMAL(12,2) NOT NULL,
  payment_status ENUM('unpaid','partially_paid','fully_paid','waived','disputed') NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoices_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE RESTRICT,
  CONSTRAINT fk_invoices_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
  CONSTRAINT fk_invoices_staff FOREIGN KEY (generated_by_staff_id) REFERENCES staff_users(staff_id) ON DELETE RESTRICT,
  CONSTRAINT chk_total_split CHECK (patient_payable_amount + hmo_payable_amount = total_amount),
  INDEX idx_invoices_patient_status (patient_id, payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invoice_items (
  item_id CHAR(36) PRIMARY KEY,
  invoice_id CHAR(36) NOT NULL,
  service_category ENUM('consultation','laboratory','pharmacy','radiology','procedure','admission_bed','nursing_care') NOT NULL,
  item_code VARCHAR(30) NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(8,2) NOT NULL DEFAULT 1.00,
  unit_price DECIMAL(10,2) NOT NULL,
  total_line_amount DECIMAL(12,2) NOT NULL,
  is_hmo_covered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_invoice FOREIGN KEY (invoice_id) REFERENCES billing_invoices(invoice_id) ON DELETE CASCADE,
  INDEX idx_invoice_items_invoice_id (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  payment_id CHAR(36) PRIMARY KEY,
  receipt_number VARCHAR(35) NOT NULL UNIQUE,
  invoice_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  cashier_staff_id CHAR(36) NOT NULL,
  payment_channel ENUM('cash','pos_terminal','gateway_transfer','direct_bank_transfer','cheque') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  payment_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  channel_status ENUM('pending_clearing','settled','declined','refunded','chargeback') NOT NULL DEFAULT 'settled',
  cash_drawer_session_id VARCHAR(50),
  cash_tendered DECIMAL(12,2),
  change_returned DECIMAL(12,2),
  pos_terminal_id VARCHAR(50),
  pos_rrn VARCHAR(50),
  pos_auth_code VARCHAR(30),
  card_last_four CHAR(4),
  card_type VARCHAR(20),
  gateway_provider VARCHAR(50),
  gateway_transaction_id VARCHAR(100),
  gateway_session_id VARCHAR(100),
  gateway_webhook_verified BOOLEAN DEFAULT FALSE,
  bank_name VARCHAR(100),
  transfer_reference_number VARCHAR(100),
  reconciliation_status ENUM('unreconciled','reconciled','flagged_mismatch') NOT NULL DEFAULT 'unreconciled',
  reconciled_at DATETIME,
  remarks TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES billing_invoices(invoice_id) ON DELETE RESTRICT,
  CONSTRAINT fk_payments_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE RESTRICT,
  CONSTRAINT fk_payments_cashier FOREIGN KEY (cashier_staff_id) REFERENCES staff_users(staff_id) ON DELETE RESTRICT,
  INDEX idx_payments_channel_time (payment_channel, payment_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE hmo_claims (
  claim_id CHAR(36) PRIMARY KEY,
  claim_reference_number VARCHAR(35) NOT NULL UNIQUE,
  invoice_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  hmo_provider_id CHAR(36) NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  authorization_code VARCHAR(100),
  claimed_amount DECIMAL(12,2) NOT NULL,
  approved_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  co_pay_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  amount_settled DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  claim_status ENUM('draft','submitted','under_review','query_issued','approved','partially_approved','rejected','disputed','settled_paid') NOT NULL DEFAULT 'draft',
  submission_date DATETIME,
  adjudication_date DATETIME,
  settlement_date DATETIME,
  settlement_batch_id VARCHAR(100),
  settlement_payment_id CHAR(36),
  rejection_reason TEXT,
  adjudicator_remarks TEXT,
  created_by_staff_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_claims_invoice FOREIGN KEY (invoice_id) REFERENCES billing_invoices(invoice_id) ON DELETE RESTRICT,
  CONSTRAINT fk_claims_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE RESTRICT,
  CONSTRAINT fk_claims_provider FOREIGN KEY (hmo_provider_id) REFERENCES hmo_providers(provider_id) ON DELETE RESTRICT,
  CONSTRAINT fk_claims_settlement_payment FOREIGN KEY (settlement_payment_id) REFERENCES payments(payment_id) ON DELETE SET NULL,
  INDEX idx_claims_provider_status (hmo_provider_id, claim_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE hmo_claim_history (
  history_id CHAR(36) PRIMARY KEY,
  claim_id CHAR(36) NOT NULL,
  previous_status VARCHAR(40),
  new_status VARCHAR(40) NOT NULL,
  changed_by_staff_id CHAR(36),
  transition_notes TEXT,
  transition_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_claim FOREIGN KEY (claim_id) REFERENCES hmo_claims(claim_id) ON DELETE CASCADE,
  INDEX idx_claim_history_time (claim_id, transition_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export const DRIZZLE_ORM_SCHEMA = `import { pgTable, uuid, varchar, text, boolean, numeric, integer, timestamp, date, pgEnum, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Enums
export const staffRoleEnum = pgEnum('staff_role_enum', [
  'super_admin', 'doctor', 'nurse', 'cashier', 'billing_officer', 'hmo_desk', 'pharmacist', 'lab_technician'
]);

export const genderEnum = pgEnum('gender_enum', ['male', 'female', 'other']);
export const bloodGroupEnum = pgEnum('blood_group_enum', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']);
export const appointmentTypeEnum = pgEnum('appointment_type_enum', ['consultation', 'follow_up', 'emergency', 'routine_checkup', 'specialist_referral']);
export const appointmentStatusEnum = pgEnum('appointment_status_enum', ['scheduled', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show']);
export const serviceCategoryEnum = pgEnum('service_category_enum', ['consultation', 'laboratory', 'pharmacy', 'radiology', 'procedure', 'admission_bed', 'nursing_care']);
export const invoiceStatusEnum = pgEnum('invoice_status_enum', ['unpaid', 'partially_paid', 'fully_paid', 'waived', 'disputed']);
export const paymentChannelEnum = pgEnum('payment_channel_enum', ['cash', 'pos_terminal', 'gateway_transfer', 'direct_bank_transfer', 'cheque']);
export const paymentStatusEnum = pgEnum('payment_status_enum', ['pending_clearing', 'settled', 'declined', 'refunded', 'chargeback']);
export const hmoClaimStatusEnum = pgEnum('hmo_claim_status_enum', ['draft', 'submitted', 'under_review', 'query_issued', 'approved', 'partially_approved', 'rejected', 'disputed', 'settled_paid']);

// Staff Users Table
export const staffUsers = pgTable('staff_users', {
  staffId: uuid('staff_id').defaultRandom().primaryKey(),
  staffCode: varchar('staff_code', { length: 20 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 30 }).notNull(),
  role: staffRoleEnum('role').notNull(),
  department: varchar('department', { length: 100 }).notNull(),
  licenseNumber: varchar('license_number', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// HMO Providers
export const hmoProviders = pgTable('hmo_providers', {
  providerId: uuid('provider_id').defaultRandom().primaryKey(),
  providerCode: varchar('provider_code', { length: 20 }).notNull().unique(),
  providerName: varchar('provider_name', { length: 150 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }).notNull(),
  contactPhone: varchar('contact_phone', { length: 30 }).notNull(),
  claimsPortalUrl: varchar('claims_portal_url', { length: 255 }),
  reimbursementTermsDays: integer('reimbursement_terms_days').default(30).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Patients
export const patients = pgTable('patients', {
  patientId: uuid('patient_id').defaultRandom().primaryKey(),
  mrn: varchar('mrn', { length: 30 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  gender: genderEnum('gender').notNull(),
  bloodGroup: bloodGroupEnum('blood_group'),
  genotype: varchar('genotype', { length: 5 }),
  email: varchar('email', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 30 }).notNull(),
  residentialAddress: text('residential_address'),
  emergencyContactName: varchar('emergency_contact_name', { length: 150 }).notNull(),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 30 }).notNull(),
  primaryHmoProviderId: uuid('primary_hmo_provider_id').references(() => hmoProviders.providerId),
  hmoPolicyNumber: varchar('hmo_policy_number', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Appointments
export const appointments = pgTable('appointments', {
  appointmentId: uuid('appointment_id').defaultRandom().primaryKey(),
  appointmentCode: varchar('appointment_code', { length: 25 }).notNull().unique(),
  patientId: uuid('patient_id').notNull().references(() => patients.patientId),
  doctorId: uuid('doctor_staff_id').notNull().references(() => staffUsers.staffId),
  bookedById: uuid('booked_by_staff_id').references(() => staffUsers.staffId),
  appointmentType: appointmentTypeEnum('appointment_type').notNull(),
  scheduledStartTime: timestamp('scheduled_start_time', { withTimezone: true }).notNull(),
  scheduledEndTime: timestamp('scheduled_end_time', { withTimezone: true }).notNull(),
  status: appointmentStatusEnum('status').default('scheduled').notNull(),
  chiefComplaint: text('chief_complaint'),
  cancellationReason: text('cancellation_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Billing Invoices
export const billingInvoices = pgTable('billing_invoices', {
  invoiceId: uuid('invoice_id').defaultRandom().primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 30 }).notNull().unique(),
  patientId: uuid('patient_id').notNull().references(() => patients.patientId),
  appointmentId: uuid('appointment_id').references(() => appointments.appointmentId),
  generatedByStaffId: uuid('generated_by_staff_id').notNull().references(() => staffUsers.staffId),
  issueDate: timestamp('issue_date', { withTimezone: true }).defaultNow().notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  subtotalAmount: numeric('subtotal_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  patientPayableAmount: numeric('patient_payable_amount', { precision: 12, scale: 2 }).notNull(),
  hmoPayableAmount: numeric('hmo_payable_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).default('0.00').notNull(),
  balanceDue: numeric('balance_due', { precision: 12, scale: 2 }).notNull(),
  paymentStatus: invoiceStatusEnum('payment_status').default('unpaid').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Invoice Items
export const invoiceItems = pgTable('invoice_items', {
  itemId: uuid('item_id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').notNull().references(() => billingInvoices.invoiceId, { onDelete: 'cascade' }),
  serviceCategory: serviceCategoryEnum('service_category').notNull(),
  itemCode: varchar('item_code', { length: 30 }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  quantity: numeric('quantity', { precision: 8, scale: 2 }).default('1.00').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalLineAmount: numeric('total_line_amount', { precision: 12, scale: 2 }).notNull(),
  isHmoCovered: boolean('is_hmo_covered').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Payments
export const payments = pgTable('payments', {
  paymentId: uuid('payment_id').defaultRandom().primaryKey(),
  receiptNumber: varchar('receipt_number', { length: 35 }).notNull().unique(),
  invoiceId: uuid('invoice_id').notNull().references(() => billingInvoices.invoiceId),
  patientId: uuid('patient_id').notNull().references(() => patients.patientId),
  cashierStaffId: uuid('cashier_staff_id').notNull().references(() => staffUsers.staffId),
  paymentChannel: paymentChannelEnum('payment_channel').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  paymentTimestamp: timestamp('payment_timestamp', { withTimezone: true }).defaultNow().notNull(),
  channelStatus: paymentStatusEnum('channel_status').default('settled').notNull(),
  
  // Multi-channel audit columns
  cashDrawerSessionId: varchar('cash_drawer_session_id', { length: 50 }),
  cashTendered: numeric('cash_tendered', { precision: 12, scale: 2 }),
  changeReturned: numeric('change_returned', { precision: 12, scale: 2 }),
  posTerminalId: varchar('pos_terminal_id', { length: 50 }),
  posRrn: varchar('pos_rrn', { length: 50 }),
  posAuthCode: varchar('pos_auth_code', { length: 30 }),
  cardLastFour: varchar('card_last_four', { length: 4 }),
  cardType: varchar('card_type', { length: 20 }),
  gatewayProvider: varchar('gateway_provider', { length: 50 }),
  gatewayTransactionId: varchar('gateway_transaction_id', { length: 100 }),
  gatewaySessionId: varchar('gateway_session_id', { length: 100 }),
  gatewayWebhookVerified: boolean('gateway_webhook_verified').default(false),
  bankName: varchar('bank_name', { length: 100 }),
  transferReferenceNumber: varchar('transfer_reference_number', { length: 100 }),
  reconciliationStatus: varchar('reconciliation_status', { length: 30 }).default('unreconciled').notNull(),
  reconciledAt: timestamp('reconciled_at', { withTimezone: true }),
  remarks: text('remarks'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// HMO Claims
export const hmoClaims = pgTable('hmo_claims', {
  claimId: uuid('claim_id').defaultRandom().primaryKey(),
  claimReferenceNumber: varchar('claim_reference_number', { length: 35 }).notNull().unique(),
  invoiceId: uuid('invoice_id').notNull().references(() => billingInvoices.invoiceId),
  patientId: uuid('patient_id').notNull().references(() => patients.patientId),
  hmoProviderId: uuid('hmo_provider_id').notNull().references(() => hmoProviders.providerId),
  policyNumber: varchar('policy_number', { length: 100 }).notNull(),
  authorizationCode: varchar('authorization_code', { length: 100 }),
  claimedAmount: numeric('claimed_amount', { precision: 12, scale: 2 }).notNull(),
  approvedAmount: numeric('approved_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  coPayAmount: numeric('co_pay_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  amountSettled: numeric('amount_settled', { precision: 12, scale: 2 }).default('0.00').notNull(),
  claimStatus: hmoClaimStatusEnum('claim_status').default('draft').notNull(),
  submissionDate: timestamp('submission_date', { withTimezone: true }),
  adjudicationDate: timestamp('adjudication_date', { withTimezone: true }),
  settlementDate: timestamp('settlement_date', { withTimezone: true }),
  settlementBatchId: varchar('settlement_batch_id', { length: 100 }),
  settlementPaymentId: uuid('settlement_payment_id').references(() => payments.paymentId),
  rejectionReason: text('rejection_reason'),
  adjudicatorRemarks: text('adjudicator_remarks'),
  createdByStaffId: uuid('created_by_staff_id').notNull().references(() => staffUsers.staffId),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// HMO Claim History
export const hmoClaimHistory = pgTable('hmo_claim_history', {
  historyId: uuid('history_id').defaultRandom().primaryKey(),
  claimId: uuid('claim_id').notNull().references(() => hmoClaims.claimId, { onDelete: 'cascade' }),
  previousStatus: varchar('previous_status', { length: 40 }),
  newStatus: varchar('new_status', { length: 40 }).notNull(),
  changedByStaffId: uuid('changed_by_staff_id').references(() => staffUsers.staffId),
  transitionNotes: text('transition_notes'),
  transitionTimestamp: timestamp('transition_timestamp', { withTimezone: true }).defaultNow().notNull(),
});
`;

export const PRISMA_SCHEMA = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum StaffRole {
  SUPER_ADMIN
  DOCTOR
  NURSE
  CASHIER
  BILLING_OFFICER
  HMO_DESK
  PHARMACIST
  LAB_TECHNICIAN
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum BloodGroup {
  A_POSITIVE
  A_NEGATIVE
  B_POSITIVE
  B_NEGATIVE
  AB_POSITIVE
  AB_NEGATIVE
  O_POSITIVE
  O_NEGATIVE
  UNKNOWN
}

enum AppointmentStatus {
  SCHEDULED
  CHECKED_IN
  IN_CONSULTATION
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum PaymentChannel {
  CASH
  POS_TERMINAL
  GATEWAY_TRANSFER
  DIRECT_BANK_TRANSFER
  CHEQUE
}

enum HmoClaimStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  QUERY_ISSUED
  APPROVED
  PARTIALLY_APPROVED
  REJECTED
  DISPUTED
  SETTLED_PAID
}

model StaffUser {
  staffId         String        @id @default(uuid()) @map("staff_id")
  staffCode       String        @unique @map("staff_code")
  firstName       String        @map("first_name")
  lastName        String        @map("last_name")
  email           String        @unique
  phone           String
  role            StaffRole
  department      String
  licenseNumber   String?       @map("license_number")
  isActive        Boolean       @default(true) @map("is_active")
  passwordHash    String        @map("password_hash")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  doctorAppointments  Appointment[]   @relation("DoctorAppointments")
  bookedAppointments  Appointment[]   @relation("BookedAppointments")
  invoicesGenerated   BillingInvoice[]
  paymentsProcessed   Payment[]
  claimsCreated       HmoClaim[]
  claimTransitions    HmoClaimHistory[]

  @@map("staff_users")
}

model HmoProvider {
  providerId             String     @id @default(uuid()) @map("provider_id")
  providerCode           String     @unique @map("provider_code")
  providerName           String     @map("provider_name")
  contactEmail           String     @map("contact_email")
  contactPhone           String     @map("contact_phone")
  claimsPortalUrl        String?    @map("claims_portal_url")
  reimbursementTermsDays Int        @default(30) @map("reimbursement_terms_days")
  isActive               Boolean    @default(true) @map("is_active")
  createdAt              DateTime   @default(now()) @map("created_at")

  patients               Patient[]
  claims                 HmoClaim[]

  @@map("hmo_providers")
}

model Patient {
  patientId             String         @id @default(uuid()) @map("patient_id")
  mrn                   String         @unique
  firstName             String         @map("first_name")
  lastName              String         @map("last_name")
  dateOfBirth           DateTime       @map("date_of_birth")
  gender                Gender
  bloodGroup            BloodGroup?    @map("blood_group")
  genotype              String?
  email                 String?
  phoneNumber           String         @map("phone_number")
  residentialAddress    String?        @map("residential_address")
  emergencyContactName  String         @map("emergency_contact_name")
  emergencyContactPhone String         @map("emergency_contact_phone")
  primaryHmoProviderId  String?        @map("primary_hmo_provider_id")
  hmoPolicyNumber       String?        @map("hmo_policy_number")
  createdAt             DateTime       @default(now()) @map("created_at")
  updatedAt             DateTime       @updatedAt @map("updated_at")

  hmoProvider           HmoProvider?   @relation(fields: [primaryHmoProviderId], references: [providerId], onDelete: Restrict)
  appointments          Appointment[]
  invoices              BillingInvoice[]
  payments              Payment[]
  claims                HmoClaim[]

  @@map("patients")
}

model Appointment {
  appointmentId       String            @id @default(uuid()) @map("appointment_id")
  appointmentCode     String            @unique @map("appointment_code")
  patientId           String            @map("patient_id")
  doctorStaffId       String            @map("doctor_staff_id")
  bookedByStaffId     String?           @map("booked_by_staff_id")
  appointmentType     String            @map("appointment_type")
  scheduledStartTime  DateTime          @map("scheduled_start_time")
  scheduledEndTime    DateTime          @map("scheduled_end_time")
  status              AppointmentStatus @default(SCHEDULED)
  chiefComplaint      String?           @map("chief_complaint")
  cancellationReason  String?           @map("cancellation_reason")
  createdAt           DateTime          @default(now()) @map("created_at")
  updatedAt           DateTime          @updatedAt @map("updated_at")

  patient             Patient           @relation(fields: [patientId], references: [patientId], onDelete: Restrict)
  doctor              StaffUser         @relation("DoctorAppointments", fields: [doctorStaffId], references: [staffId], onDelete: Restrict)
  bookedBy            StaffUser?        @relation("BookedAppointments", fields: [bookedByStaffId], references: [staffId], onDelete: SetNull)
  invoices            BillingInvoice[]

  @@map("appointments")
}

model BillingInvoice {
  invoiceId            String        @id @default(uuid()) @map("invoice_id")
  invoiceNumber        String        @unique @map("invoice_number")
  patientId            String        @map("patient_id")
  appointmentId        String?       @map("appointment_id")
  generatedByStaffId   String        @map("generated_by_staff_id")
  issueDate            DateTime      @default(now()) @map("issue_date")
  dueDate              DateTime      @map("due_date")
  subtotalAmount       Decimal       @default(0.00) @map("subtotal_amount") @db.Decimal(12, 2)
  discountAmount       Decimal       @default(0.00) @map("discount_amount") @db.Decimal(12, 2)
  taxAmount            Decimal       @default(0.00) @map("tax_amount") @db.Decimal(12, 2)
  totalAmount          Decimal       @map("total_amount") @db.Decimal(12, 2)
  patientPayableAmount Decimal       @map("patient_payable_amount") @db.Decimal(12, 2)
  hmoPayableAmount     Decimal       @default(0.00) @map("hmo_payable_amount") @db.Decimal(12, 2)
  amountPaid           Decimal       @default(0.00) @map("amount_paid") @db.Decimal(12, 2)
  balanceDue           Decimal       @map("balance_due") @db.Decimal(12, 2)
  paymentStatus        String        @default("unpaid") @map("payment_status")
  notes                String?
  createdAt            DateTime      @default(now()) @map("created_at")
  updatedAt            DateTime      @updatedAt @map("updated_at")

  patient              Patient       @relation(fields: [patientId], references: [patientId], onDelete: Restrict)
  appointment          Appointment?  @relation(fields: [appointmentId], references: [appointmentId], onDelete: SetNull)
  generatedBy          StaffUser     @relation(fields: [generatedByStaffId], references: [staffId], onDelete: Restrict)
  lineItems            InvoiceItem[]
  payments             Payment[]
  claims               HmoClaim[]

  @@map("billing_invoices")
}

model InvoiceItem {
  itemId           String         @id @default(uuid()) @map("item_id")
  invoiceId        String         @map("invoice_id")
  serviceCategory  String         @map("service_category")
  itemCode         String         @map("item_code")
  description      String
  quantity         Decimal        @default(1.00) @db.Decimal(8, 2)
  unitPrice        Decimal        @map("unit_price") @db.Decimal(10, 2)
  totalLineAmount  Decimal        @map("total_line_amount") @db.Decimal(12, 2)
  isHmoCovered     Boolean        @default(false) @map("is_hmo_covered")
  createdAt        DateTime       @default(now()) @map("created_at")

  invoice          BillingInvoice @relation(fields: [invoiceId], references: [invoiceId], onDelete: Cascade)

  @@map("invoice_items")
}

model Payment {
  paymentId              String         @id @default(uuid()) @map("payment_id")
  receiptNumber          String         @unique @map("receipt_number")
  invoiceId              String         @map("invoice_id")
  patientId              String         @map("patient_id")
  cashierStaffId         String         @map("cashier_staff_id")
  paymentChannel         PaymentChannel @map("payment_channel")
  amount                 Decimal        @db.Decimal(12, 2)
  currency               String         @default("USD")
  paymentTimestamp       DateTime       @default(now()) @map("payment_timestamp")
  channelStatus          String         @default("settled") @map("channel_status")
  cashDrawerSessionId    String?        @map("cash_drawer_session_id")
  cashTendered           Decimal?       @map("cash_tendered") @db.Decimal(12, 2)
  changeReturned         Decimal?       @map("change_returned") @db.Decimal(12, 2)
  posTerminalId          String?        @map("pos_terminal_id")
  posRrn                 String?        @map("pos_rrn")
  posAuthCode            String?        @map("pos_auth_code")
  cardLastFour           String?        @map("card_last_four")
  cardType               String?        @map("card_type")
  gatewayProvider        String?        @map("gateway_provider")
  gatewayTransactionId   String?        @map("gateway_transaction_id")
  gatewaySessionId       String?        @map("gateway_session_id")
  gatewayWebhookVerified Boolean?       @default(false) @map("gateway_webhook_verified")
  bankName               String?        @map("bank_name")
  transferReferenceNumber String?       @map("transfer_reference_number")
  reconciliationStatus   String         @default("unreconciled") @map("reconciliation_status")
  reconciledAt           DateTime?      @map("reconciled_at")
  remarks                String?
  createdAt              DateTime       @default(now()) @map("created_at")

  invoice                BillingInvoice @relation(fields: [invoiceId], references: [invoiceId], onDelete: Restrict)
  patient                Patient        @relation(fields: [patientId], references: [patientId], onDelete: Restrict)
  cashier                StaffUser      @relation(fields: [cashierStaffId], references: [staffId], onDelete: Restrict)
  hmoClaimsSettled       HmoClaim[]     @relation("SettlementPayment")

  @@map("payments")
}

model HmoClaim {
  claimId              String          @id @default(uuid()) @map("claim_id")
  claimReferenceNumber String          @unique @map("claim_reference_number")
  invoiceId            String          @map("invoice_id")
  patientId            String          @map("patient_id")
  hmoProviderId        String          @map("hmo_provider_id")
  policyNumber         String          @map("policy_number")
  authorizationCode    String?         @map("authorization_code")
  claimedAmount        Decimal         @map("claimed_amount") @db.Decimal(12, 2)
  approvedAmount       Decimal         @default(0.00) @map("approved_amount") @db.Decimal(12, 2)
  coPayAmount          Decimal         @default(0.00) @map("co_pay_amount") @db.Decimal(12, 2)
  amountSettled        Decimal         @default(0.00) @map("amount_settled") @db.Decimal(12, 2)
  claimStatus          HmoClaimStatus  @default(DRAFT) @map("claim_status")
  submissionDate       DateTime?       @map("submission_date")
  adjudicationDate     DateTime?       @map("adjudication_date")
  settlementDate       DateTime?       @map("settlement_date")
  settlementBatchId    String?         @map("settlement_batch_id")
  settlementPaymentId  String?         @map("settlement_payment_id")
  rejectionReason      String?         @map("rejection_reason")
  adjudicatorRemarks   String?         @map("adjudicator_remarks")
  createdByStaffId     String          @map("created_by_staff_id")
  createdAt            DateTime        @default(now()) @map("created_at")
  updatedAt            DateTime        @updatedAt @map("updated_at")

  invoice              BillingInvoice  @relation(fields: [invoiceId], references: [invoiceId], onDelete: Restrict)
  patient              Patient         @relation(fields: [patientId], references: [patientId], onDelete: Restrict)
  hmoProvider          HmoProvider     @relation(fields: [hmoProviderId], references: [providerId], onDelete: Restrict)
  createdBy            StaffUser       @relation(fields: [createdByStaffId], references: [staffId], onDelete: Restrict)
  settlementPayment    Payment?        @relation("SettlementPayment", fields: [settlementPaymentId], references: [paymentId], onDelete: SetNull)
  statusHistory        HmoClaimHistory[]

  @@map("hmo_claims")
}

model HmoClaimHistory {
  historyId           String    @id @default(uuid()) @map("history_id")
  claimId             String    @map("claim_id")
  previousStatus      String?   @map("previous_status")
  newStatus           String    @map("new_status")
  changedByStaffId    String?   @map("changed_by_staff_id")
  transitionNotes     String?   @map("transition_notes")
  transitionTimestamp DateTime  @default(now()) @map("transition_timestamp")

  claim               HmoClaim  @relation(fields: [claimId], references: [claimId], onDelete: Cascade)
  changedBy           StaffUser? @relation(fields: [changedByStaffId], references: [staffId], onDelete: SetNull)

  @@map("hmo_claim_history")
}
`;

export const DBML_SCHEMA = `// ============================================================================
// VIDIEMS ClinicLedger - DBML (Database Markup Language)
// Compatible with dbdocs.io and dbdiagram.io
// ============================================================================

Project vidiems_clinicledger {
  database_type: 'PostgreSQL'
  Note: 'VIDIEMS ClinicLedger Hospital Management System Relational Database Architecture'
}

Enum staff_role_enum {
  super_admin
  doctor
  nurse
  cashier
  billing_officer
  hmo_desk
  pharmacist
  lab_technician
}

Enum payment_channel_enum {
  cash
  pos_terminal
  gateway_transfer
  direct_bank_transfer
  cheque
}

Enum hmo_claim_status_enum {
  draft
  submitted
  under_review
  query_issued
  approved
  partially_approved
  rejected
  disputed
  settled_paid
}

Table staff_users {
  staff_id uuid [pk, default: \`gen_random_uuid()\`]
  staff_code varchar(20) [unique, not null]
  first_name varchar(100) [not null]
  last_name varchar(100) [not null]
  email varchar(255) [unique, not null]
  phone varchar(30) [not null]
  role staff_role_enum [not null]
  department varchar(100) [not null]
  license_number varchar(100)
  is_active boolean [not null, default: true]
  password_hash varchar(255) [not null]
  created_at timestamptz [default: \`CURRENT_TIMESTAMP\`]
  updated_at timestamptz [default: \`CURRENT_TIMESTAMP\`]
}

Table hmo_providers {
  provider_id uuid [pk, default: \`gen_random_uuid()\`]
  provider_code varchar(20) [unique, not null]
  provider_name varchar(150) [not null]
  contact_email varchar(255) [not null]
  contact_phone varchar(30) [not null]
  claims_portal_url varchar(255)
  reimbursement_terms_days int [not null, default: 30]
  is_active boolean [not null, default: true]
  created_at timestamptz [default: \`CURRENT_TIMESTAMP\`]
}

Table patients {
  patient_id uuid [pk, default: \`gen_random_uuid()\`]
  mrn varchar(30) [unique, not null, note: 'Medical Record Number']
  first_name varchar(100) [not null]
  last_name varchar(100) [not null]
  date_of_birth date [not null]
  gender varchar(10) [not null]
  blood_group varchar(10)
  genotype varchar(5)
  email varchar(255)
  phone_number varchar(30) [not null]
  residential_address text
  emergency_contact_name varchar(150) [not null]
  emergency_contact_phone varchar(30) [not null]
  primary_hmo_provider_id uuid [ref: > hmo_providers.provider_id]
  hmo_policy_number varchar(100)
  created_at timestamptz [default: \`CURRENT_TIMESTAMP\`]
  updated_at timestamptz [default: \`CURRENT_TIMESTAMP\`]
}

Table appointments {
  appointment_id uuid [pk, default: \`gen_random_uuid()\`]
  appointment_code varchar(25) [unique, not null]
  patient_id uuid [not null, ref: > patients.patient_id]
  doctor_staff_id uuid [not null, ref: > staff_users.staff_id]
  booked_by_staff_id uuid [ref: > staff_users.staff_id]
  appointment_type varchar(30) [not null]
  scheduled_start_time timestamptz [not null]
  scheduled_end_time timestamptz [not null]
  status varchar(20) [not null, default: 'scheduled']
  chief_complaint text
  cancellation_reason text
  created_at timestamptz [default: \`CURRENT_TIMESTAMP\`]
  updated_at timestamptz [default: \`CURRENT_TIMESTAMP\`]
}

Table billing_invoices {
  invoice_id uuid [pk, default: \`gen_random_uuid()\`]
  invoice_number varchar(30) [unique, not null]
  patient_id uuid [not null, ref: > patients.patient_id]
  appointment_id uuid [ref: - appointments.appointment_id]
  generated_by_staff_id uuid [not null, ref: > staff_users.staff_id]
  issue_date timestamptz [default: \`CURRENT_TIMESTAMP\`]
  due_date timestamptz [not null]
  subtotal_amount numeric(12,2) [not null, default: 0.00]
  discount_amount numeric(12,2) [not null, default: 0.00]
  tax_amount numeric(12,2) [not null, default: 0.00]
  total_amount numeric(12,2) [not null]
  patient_payable_amount numeric(12,2) [not null]
  hmo_payable_amount numeric(12,2) [not null, default: 0.00]
  amount_paid numeric(12,2) [not null, default: 0.00]
  balance_due numeric(12,2) [not null]
  payment_status varchar(20) [not null, default: 'unpaid']
  notes text
  created_at timestamptz [default: \`CURRENT_TIMESTAMP\`]
  updated_at timestamptz [default: \`CURRENT_TIMESTAMP\`]
}

Table invoice_items {
  item_id uuid [pk, default: \`gen_random_uuid()\`]
  invoice_id uuid [not null, ref: > billing_invoices.invoice_id]
  service_category varchar(30) [not null]
  item_code varchar(30) [not null]
  description varchar(255) [not null]
  quantity numeric(8,2) [not null, default: 1.00]
  unit_price numeric(10,2) [not null]
  total_line_amount numeric(12,2) [not null]
  is_hmo_covered boolean [not null, default: false]
  created_at timestamptz [default: \`CURRENT_TIMESTAMP\`]
}

Table payments {
  payment_id uuid [pk, default: \`gen_random_uuid()\`]
  receipt_number varchar(35) [unique, not null]
  invoice_id uuid [not null, ref: > billing_invoices.invoice_id]
  patient_id uuid [not null, ref: > patients.patient_id]
  cashier_staff_id uuid [not null, ref: > staff_users.staff_id]
  payment_channel payment_channel_enum [not null]
  amount numeric(12,2) [not null]
  currency varchar(3) [not null, default: 'USD']
  payment_timestamp timestamptz [default: \`CURRENT_TIMESTAMP\`]
  channel_status varchar(20) [default: 'settled']
  cash_drawer_session_id varchar(50)
  cash_tendered numeric(12,2)
  change_returned numeric(12,2)
  pos_terminal_id varchar(50)
  pos_rrn varchar(50)
  pos_auth_code varchar(30)
  card_last_four char(4)
  card_type varchar(20)
  gateway_provider varchar(50)
  gateway_transaction_id varchar(100)
  gateway_session_id varchar(100)
  gateway_webhook_verified boolean [default: false]
  bank_name varchar(100)
  transfer_reference_number varchar(100)
  reconciliation_status varchar(30) [default: 'unreconciled']
  reconciled_at timestamptz
  remarks text
  created_at timestamptz [default: \`CURRENT_TIMESTAMP\`]
}

Table hmo_claims {
  claim_id uuid [pk, default: \`gen_random_uuid()\`]
  claim_reference_number varchar(35) [unique, not null]
  invoice_id uuid [not null, ref: > billing_invoices.invoice_id]
  patient_id uuid [not null, ref: > patients.patient_id]
  hmo_provider_id uuid [not null, ref: > hmo_providers.provider_id]
  policy_number varchar(100) [not null]
  authorization_code varchar(100)
  claimed_amount numeric(12,2) [not null]
  approved_amount numeric(12,2) [default: 0.00]
  co_pay_amount numeric(12,2) [default: 0.00]
  amount_settled numeric(12,2) [default: 0.00]
  claim_status hmo_claim_status_enum [default: 'draft']
  submission_date timestamptz
  adjudication_date timestamptz
  settlement_date timestamptz
  settlement_batch_id varchar(100)
  settlement_payment_id uuid [ref: > payments.payment_id]
  rejection_reason text
  adjudicator_remarks text
  created_by_staff_id uuid [not null, ref: > staff_users.staff_id]
  created_at timestamptz [default: \`CURRENT_TIMESTAMP\`]
  updated_at timestamptz [default: \`CURRENT_TIMESTAMP\`]
}

Table hmo_claim_history {
  history_id uuid [pk, default: \`gen_random_uuid()\`]
  claim_id uuid [not null, ref: > hmo_claims.claim_id]
  previous_status varchar(40)
  new_status varchar(40) [not null]
  changed_by_staff_id uuid [ref: > staff_users.staff_id]
  transition_notes text
  transition_timestamp timestamptz [default: \`CURRENT_TIMESTAMP\`]
}
`;
