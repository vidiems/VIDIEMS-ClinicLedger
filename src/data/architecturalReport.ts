export interface ArchitectureSection {
  id: string;
  title: string;
  summary: string;
  badge: string;
  content: string[];
  keyDesignDecisions: {
    decision: string;
    rationale: string;
    anomalyPrevented: string;
  }[];
}

export const ARCHITECTURAL_REPORT: ArchitectureSection[] = [
  {
    id: 'normalization',
    title: 'Relational Normalization & Mathematical Integrity',
    badge: '3NF / BCNF Certified',
    summary: 'Strict formal normalization eliminating operational anomalies across clinical encounters, billing aggregates, line-item tariffs, and insurer reimbursements.',
    content: [
      'In designing VIDIEMS ClinicLedger, we applied Boyce-Codd Normal Form (BCNF) and Third Normal Form (3NF) across all entities to guarantee transactional consistency under heavy outpatient and emergency load.',
      '1NF compliance is enforced by decomposing composite clinical services into atomic attributes and guaranteeing no repeating column groups (e.g. eliminating anti-patterns like drug_1, drug_2 in invoices by establishing the dedicated invoice_items entity).',
      '2NF compliance ensures that every non-key attribute is fully functionally dependent on the primary key. In invoice_items, the composite tariff calculation is tied strictly to item_id, preventing partial functional dependencies on invoice header attributes.',
      '3NF and BCNF compliance removes transitive dependencies: for example, patient demographic data (name, DOB, genotype) is never duplicated across appointments or billing invoices; all downstream transactions reference patient_id via immutable foreign keys.'
    ],
    keyDesignDecisions: [
      {
        decision: 'Split Billing Invoices into Header (billing_invoices) and Line Items (invoice_items)',
        rationale: 'Clinical billing requires diverse service categories (pharmacy, lab, surgical suite, nursing) with differing tax rates, quantities, and HMO formulary approval flags.',
        anomalyPrevented: 'Insertion and Update Anomalies: Prevents row-level duplication of invoice metadata whenever a patient is prescribed multiple medications or lab diagnostics.'
      },
      {
        decision: 'Dedicated HMO Providers Catalog independent of Patient Registry',
        rationale: 'Patients frequently change corporate insurance plans or employers, and insurance terms (turnaround days, claims portal) apply uniformly across policyholders.',
        anomalyPrevented: 'Update Anomaly: Updating an HMO contract or claims portal endpoint requires changing only 1 row in hmo_providers rather than thousands of patient rows.'
      },
      {
        decision: 'Strict Check Constraint on Liability Allocation: patient_payable + hmo_payable = total_amount',
        rationale: 'Guarantees mathematically that 100% of the invoice gross liability is assigned without unallocated floating debt.',
        anomalyPrevented: 'Financial Leakage Anomaly: Prevents patient bills from having ambiguous payer liability.'
      }
    ]
  },
  {
    id: 'multi_channel_payments',
    title: 'Multi-Channel Payment Logging & Fiscal Reconciliation',
    badge: 'Multi-Channel Subledger',
    summary: 'Production-ready financial architecture capturing Cash, POS Terminals, Online Gateway Transfers, and Bank Wires with strict audit and idempotency safeguards.',
    content: [
      'Hospital billing environments handle heterogeneous payment methods simultaneously. A single patient bill may be settled using cash at the outpatient till, card swipe via an electronic POS terminal, or remote payment links via Stripe/Paystack.',
      'Rather than relying on loosely typed comment fields, the payments table features dedicated, audit-grade polymorphic columns constrained by conditional CHECK invariants.',
      'For Physical Cash: We require cash_drawer_session_id for cashier shift reconciliation, and enforce cash_tendered >= amount so change_returned can be audited for till shortages.',
      'For POS Card Terminals: We enforce pos_terminal_id, pos_rrn (Retrieval Reference Number), and pos_auth_code. The masked card_last_four maintains PCI-DSS compliance while allowing dispute settlement.',
      'For Online Payment Gateways: We capture gateway_provider, gateway_transaction_id, and gateway_webhook_verified. Webhook idempotency is guaranteed via unique B-tree indexing on external gateway IDs, preventing double-crediting if a webhook fires multiple times.'
    ],
    keyDesignDecisions: [
      {
        decision: 'Conditional CHECK constraints for Channel-Specific Audit Metadata',
        rationale: 'Enforces database-level validation: if payment_channel is "pos_terminal", pos_rrn and pos_terminal_id cannot be null; if "gateway_transfer", gateway_provider and transaction_id must be populated.',
        anomalyPrevented: 'Incomplete Audit Trail: Eliminates ghost card transactions where cashier records a payment without capturing the terminal transaction reference.'
      },
      {
        decision: 'Immutable Payment Transaction Append Pattern',
        rationale: 'Payments are never modified or deleted in-place. If an error occurs, an explicit reverse transaction (channel_status = "refunded" or "chargeback") is logged.',
        anomalyPrevented: 'Fraud & Audit Erasure: Preserves full forensic compliance with healthcare and accounting regulatory standards (HIPAA / GAAP / IFRS).'
      },
      {
        decision: 'Automated Invoice Balance Sync via PostgreSQL Trigger',
        rationale: 'Trigger trg_payments_balance_sync recalculates amount_paid and balance_due inside the same ACID transaction when a payment is inserted.',
        anomalyPrevented: 'Out-of-Sync Financial Balances: Guarantees application race conditions cannot leave invoice balance_due out of sync with actual settled payments.'
      }
    ]
  },
  {
    id: 'hmo_claims_lifecycle',
    title: 'HMO Claims State Machine & Settlement Tracking',
    badge: 'State Machine & Audit Log',
    summary: 'Complete lifecycle orchestration for health insurance claims from initial generation to pre-auth, review, approval, dispute, and final settlement remittance.',
    content: [
      'In private and public healthcare, insurance claims represent 40%–70% of total revenue. Claims suffer high failure rates if the lifecycle is not modeled as a formal deterministic finite state machine (FSM).',
      'The hmo_claims table models the lifecycle stages: draft -> submitted -> under_review -> query_issued -> approved / partially_approved / rejected / disputed -> settled_paid.',
      'Every claim maintains exact tracking of claimed_amount, approved_amount, co_pay_amount, and amount_settled, protected by strict hierarchy checks: approved_amount <= claimed_amount and amount_settled <= approved_amount.',
      'To provide 100% legal and operational transparency, an append-only hmo_claim_history table is coupled via the trg_hmo_claims_state_log trigger. Every time an HMO auditor queries, approves, or rejects a claim, an immutable audit event records previous_status, new_status, user actor, notes, and exact timestamp.'
    ],
    keyDesignDecisions: [
      {
        decision: 'Link Settlement Payment ID to Payments Ledger',
        rationale: 'When an HMO wires batch funds to the hospital bank account, a corresponding row in payments is recorded, and its payment_id is linked directly to settlement_payment_id.',
        anomalyPrevented: 'Orphaned Insurance Remittance: Provides 100% trace from bank statement credit down to individual patient encounter claims.'
      },
      {
        decision: 'Pre-Authorization Code Storage with Mandatory Indexing',
        rationale: 'High-value procedures (surgical, MRI, specialized oncology) require insurer authorization_code prior to treatment to guarantee payment.',
        anomalyPrevented: 'Unverified Clinical Expense: Ensures clinic billing officers can immediately verify pre-authorization status before service dispensing.'
      },
      {
        decision: 'Dedicated Claim Status History Table (4NF Audit Trail)',
        rationale: 'Disputes with HMOs often center on turnaround time SLA breaches. The history table records exactly when submissions and queries occurred.',
        anomalyPrevented: 'SLA Dispute Blame: Proves with cryptographic timestamps whether delay occurred on the hospital side or insurer adjudication desk.'
      }
    ]
  },
  {
    id: 'concurrency_integrity',
    title: 'Concurrency, Foreign Key Restraints & Indexing Topology',
    badge: 'Enterprise Hardening',
    summary: 'Relational referential safeguards, optimistic locking patterns, ACID isolation, and high-selectivity B-Tree indexing strategy.',
    content: [
      'VIDIEMS ClinicLedger enforces ON DELETE RESTRICT on all financial and clinical relationship foreign keys (patients, staff, invoices, payments, HMO claims). A patient record with outstanding debt or past consultations cannot be deleted.',
      'Cascading deletion (ON DELETE CASCADE) is strictly quarantined to parent-child line details (e.g. deleting an unissued draft invoice cascade-cleans invoice_items and deleting a test claim purges hmo_claim_history).',
      'Doctor appointment scheduling leverages composite B-tree indexing on (doctor_staff_id, scheduled_start_time, scheduled_end_time) coupled with check constraints to allow microsecond slot availability queries and prevent double-booking.',
      'Partial indexing (e.g., WHERE payment_status != "fully_paid" and WHERE pos_rrn IS NOT NULL) minimizes index storage bloat while delivering instant performance for accounts receivable aging and POS dispute lookup.'
    ],
    keyDesignDecisions: [
      {
        decision: 'ON DELETE RESTRICT on Master Patient and Staff Entities',
        rationale: 'Financial and clinical ledgers must remain forensically intact for statutory retention periods (typically 7–10 years).',
        anomalyPrevented: 'Dangling Foreign Key & Orphaned Financial Records: Prevents accidental staff or patient purge from breaking historical balances.'
      },
      {
        decision: 'Partial Indexes for Incomplete Transactions',
        rationale: '90%+ of historical invoices are fully paid; indexing only active unpaid invoices reduces index size by ~85% and keeps memory hot.',
        anomalyPrevented: 'Index Cache Thrashing: Optimizes database buffer pool hit ratio on large enterprise databases.'
      },
      {
        decision: 'Row-Level Concurrency Pattern: SELECT FOR UPDATE on Invoice Checkouts',
        rationale: 'When two cashiers simultaneously accept payment on a shared patient bill, SELECT ... FOR UPDATE serializes balance deductions.',
        anomalyPrevented: 'Lost Update Anomaly / Double Credit: Eliminates race condition where invoice balance is overwritten incorrectly.'
      }
    ]
  }
];
