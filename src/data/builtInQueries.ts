import { BuiltInQuery } from '../types/schema';

export const BUILT_IN_QUERIES: BuiltInQuery[] = [
  {
    id: 'query_multi_channel_recon',
    title: 'Daily Multi-Channel Payment Reconciliation Subledger',
    category: 'Financial',
    description: 'Summarizes payments collected across Cash, POS terminals, and Online Gateways for cashier shift balancing and bank deposit reconciliation.',
    tablesInvolved: ['payments', 'staff_users'],
    explanation: 'Aggregates collections by channel and cashier, computing settlement volume, transaction count, cash tendered vs change, and distinct card/terminal audit tags.',
    sql: `SELECT 
  p.payment_channel,
  p.channel_status,
  COUNT(p.payment_id) AS total_transactions,
  SUM(p.amount) AS total_amount_collected,
  COUNT(DISTINCT p.cashier_staff_id) AS active_cashiers,
  -- Cash drawer statistics
  SUM(p.cash_tendered) AS total_cash_tendered,
  SUM(p.change_returned) AS total_change_given,
  -- POS audit summary
  COUNT(p.pos_rrn) AS pos_card_swipes,
  -- Gateway transfer summary
  COUNT(p.gateway_transaction_id) AS gateway_webhooks_processed
FROM payments p
WHERE p.payment_timestamp >= CURRENT_DATE
GROUP BY p.payment_channel, p.channel_status
ORDER BY total_amount_collected DESC;`
  },
  {
    id: 'query_hmo_pipeline_aging',
    title: 'HMO Claims Aging Pipeline & Outstanding Receivables',
    category: 'HMO & Claims',
    description: 'Tracks insurance claims through the lifecycle stages (Submitted -> Under Review -> Approved -> Paid) with aging days and collection variance.',
    tablesInvolved: ['hmo_claims', 'hmo_providers', 'patients', 'billing_invoices'],
    explanation: 'Calculates the collection efficiency ratio (Approved / Claimed) and flags aged claims exceeding contractual reimbursement SLA terms.',
    sql: `SELECT 
  hp.provider_name,
  hc.claim_status,
  COUNT(hc.claim_id) AS claim_count,
  SUM(hc.claimed_amount) AS total_claimed,
  SUM(hc.approved_amount) AS total_approved,
  SUM(hc.amount_settled) AS total_settled_cash,
  ROUND(
    AVG(EXTRACT(DAY FROM (COALESCE(hc.adjudication_date, CURRENT_TIMESTAMP) - hc.submission_date))), 
    1
  ) AS avg_turnaround_days,
  hp.reimbursement_terms_days AS contractual_sla_days
FROM hmo_claims hc
JOIN hmo_providers hp ON hc.hmo_provider_id = hp.provider_id
GROUP BY hp.provider_id, hp.provider_name, hc.claim_status, hp.reimbursement_terms_days
ORDER BY total_claimed DESC;`
  },
  {
    id: 'query_patient_copay_liability',
    title: 'Patient Co-Pay vs HMO Liability Breakdown & Overdue Invoices',
    category: 'Financial',
    description: 'Breaks down patient debt into out-of-pocket co-payments and insurer claims with payment maturity status.',
    tablesInvolved: ['billing_invoices', 'patients', 'hmo_providers'],
    explanation: 'Isolates patient accounts receivable (A/R) where patient co-pay is overdue, distinguishing it from pending HMO corporate reimbursements.',
    sql: `SELECT 
  p.mrn,
  CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
  inv.invoice_number,
  inv.total_amount,
  inv.patient_payable_amount AS patient_copay_due,
  inv.hmo_payable_amount AS insurer_liability,
  inv.amount_paid,
  inv.balance_due,
  inv.payment_status,
  COALESCE(hp.provider_name, 'Self-Pay / Private') AS insurance_payer,
  CASE 
    WHEN inv.balance_due = 0 THEN 'Settled'
    WHEN inv.due_date < CURRENT_TIMESTAMP THEN 'OVERDUE'
    ELSE 'Current'
  END AS aging_category
FROM billing_invoices inv
JOIN patients p ON inv.patient_id = p.patient_id
LEFT JOIN hmo_providers hp ON p.primary_hmo_provider_id = hp.provider_id
ORDER BY inv.issue_date DESC;`
  },
  {
    id: 'query_doctor_encounter_revenue',
    title: 'Clinical Encounter Billing & Physician Productivity',
    category: 'Clinical',
    description: 'Correlates outpatient doctor consultations with downstream billable tariff items generated across lab, radiology, and pharmacy.',
    tablesInvolved: ['staff_users', 'appointments', 'billing_invoices', 'invoice_items'],
    explanation: 'Measures physician encounter volume, conversion to billed services, and revenue generation per clinical department.',
    sql: `SELECT 
  CONCAT(s.first_name, ' ', s.last_name) AS physician_name,
  s.department,
  COUNT(DISTINCT a.appointment_id) AS total_encounters,
  COUNT(DISTINCT inv.invoice_id) AS invoices_generated,
  COALESCE(SUM(inv.total_amount), 0.00) AS gross_clinical_revenue,
  COALESCE(SUM(inv.amount_paid), 0.00) AS total_collections_realized
FROM staff_users s
JOIN appointments a ON s.staff_id = a.doctor_staff_id
LEFT JOIN billing_invoices inv ON a.appointment_id = inv.appointment_id
WHERE s.role = 'doctor'
GROUP BY s.staff_id, s.first_name, s.last_name, s.department
ORDER BY gross_clinical_revenue DESC;`
  },
  {
    id: 'query_audit_integrity_check',
    title: 'Financial & Claims Subledger Forensic Invariant Check',
    category: 'Audit & Compliance',
    description: 'Forensic integrity audit verifying zero arithmetic discrepancies between invoice headers, line-item sums, and payment records.',
    tablesInvolved: ['billing_invoices', 'invoice_items', 'payments'],
    explanation: 'Essential database health audit query. Flags any invoice where line item totals do not match the header or where recorded amount_paid diverges from the sum of settled payment transactions.',
    sql: `SELECT 
  inv.invoice_id,
  inv.invoice_number,
  inv.total_amount AS header_total,
  COALESCE(SUM(DISTINCT items.total_line_amount), 0.00) AS line_items_sum,
  inv.amount_paid AS header_amount_paid,
  COALESCE(SUM(DISTINCT p.amount), 0.00) AS settled_payments_sum,
  CASE 
    WHEN inv.total_amount != COALESCE(SUM(DISTINCT items.total_line_amount), 0.00) THEN 'DISCREPANCY: Line item sum mismatch'
    WHEN inv.amount_paid != COALESCE(SUM(DISTINCT p.amount), 0.00) THEN 'DISCREPANCY: Payment ledger sum mismatch'
    ELSE 'VERIFIED: 100% Invariant Compliant'
  END AS audit_status
FROM billing_invoices inv
LEFT JOIN invoice_items items ON inv.invoice_id = items.invoice_id
LEFT JOIN payments p ON inv.invoice_id = p.invoice_id AND p.channel_status = 'settled'
GROUP BY inv.invoice_id, inv.invoice_number, inv.total_amount, inv.amount_paid;`
  }
];
