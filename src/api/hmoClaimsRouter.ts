/**
 * @file hmoClaimsRouter.ts
 * @description Production Express REST API Router for HMO Claims Lifecycle & 30-Day Aging Analysis
 * @system VIDIEMS ClinicLedger Hospital Management Subledger
 * 
 * Endpoints:
 * 1. POST  /api/hmo/claims             - Submit new health insurance claim
 * 2. PATCH /api/hmo/claims/:id/status  - Transition claim lifecycle (Draft, Submitted, Queried, Paid)
 * 3. GET   /api/hmo/claims/aging-report - Aging analytics flagging claims unpaid after 30 days
 * 4. GET   /api/hmo/claims/:id          - Retrieve claim details with audit timeline
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool, PoolClient } from 'pg';
import crypto from 'crypto';

export interface HmoClaimsRouterOptions {
  pool: Pool;
  authMiddleware?: (req: Request, res: Response, next: NextFunction) => void;
}

export function createHmoClaimsRouter(options: HmoClaimsRouterOptions): Router {
  const router = Router();
  const pool = options.pool;
  const auth = options.authMiddleware || ((req, res, next) => next());

  // ==========================================================================
  // 1. POST /api/hmo/claims - SUBMIT NEW HMO CLAIM
  // ==========================================================================
  router.post('/api/hmo/claims', auth, async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
      const {
        invoiceId,
        patientId,
        hmoProviderId,
        policyNumber,
        authorizationCode,
        claimedAmount,
        coPayAmount = 0.00,
        status = 'submitted'
      } = req.body;

      // Validation
      if (!invoiceId || !patientId || !hmoProviderId || !policyNumber || !claimedAmount) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_FAILED',
          message: 'Missing required claim parameters: invoiceId, patientId, hmoProviderId, policyNumber, and claimedAmount are mandatory.'
        });
      }

      const claimedNum = parseFloat(claimedAmount);
      if (isNaN(claimedNum) || claimedNum <= 0) {
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_AMOUNT',
          message: 'Claimed amount must be a positive monetary figure.'
        });
      }

      await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;');

      // Verify invoice exists and has not already been claimed
      const invoiceCheck = await client.query(
        'SELECT invoice_id, total_amount, payment_status FROM billing_invoices WHERE invoice_id = $1 FOR UPDATE;',
        [invoiceId]
      );

      if (invoiceCheck.rowCount === 0) {
        await client.query('ROLLBACK;');
        return res.status(404).json({
          status: 'error',
          code: 'INVOICE_NOT_FOUND',
          message: `Invoice [${invoiceId}] does not exist.`
        });
      }

      // Check if active claim already exists for this invoice
      const existingClaim = await client.query(
        'SELECT claim_id, claim_reference_number, claim_status FROM hmo_claims WHERE invoice_id = $1 AND claim_status NOT IN (\'rejected\');',
        [invoiceId]
      );
      if (existingClaim.rowCount && existingClaim.rowCount > 0) {
        await client.query('ROLLBACK;');
        return res.status(409).json({
          status: 'error',
          code: 'DUPLICATE_CLAIM',
          message: `An active claim [${existingClaim.rows[0].claim_reference_number}] already exists for invoice [${invoiceId}] with status [${existingClaim.rows[0].claim_status}].`
        });
      }

      const claimId = crypto.randomUUID();
      const claimRefNumber = `CLM-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const staffId = (req as any).user?.userId || '11111111-1111-4111-8111-444444444444';
      const isSubmitted = status === 'submitted';

      // Insert HMO Claim Header
      await client.query(
        `INSERT INTO hmo_claims (
          claim_id, claim_reference_number, invoice_id, patient_id, hmo_provider_id,
          policy_number, authorization_code, claimed_amount, approved_amount, co_pay_amount,
          amount_settled, claim_status, submission_date, created_by_staff_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, 0.00, $9,
          0.00, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );`,
        [
          claimId,
          claimRefNumber,
          invoiceId,
          patientId,
          hmoProviderId,
          policyNumber,
          authorizationCode || null,
          claimedNum,
          parseFloat(coPayAmount) || 0.00,
          status,
          isSubmitted ? new Date().toISOString() : null,
          staffId
        ]
      );

      // Append Initial State to hmo_claim_history (Audit Trail)
      await client.query(
        `INSERT INTO hmo_claim_history (
          history_id, claim_id, previous_status, new_status, changed_by_staff_id,
          transition_notes, transition_timestamp
        ) VALUES ($1, $2, NULL, $3, $4, $5, CURRENT_TIMESTAMP);`,
        [
          crypto.randomUUID(),
          claimId,
          status,
          staffId,
          `Initial claim creation with status [${status}]. Claimed: $${claimedNum.toFixed(2)}.`
        ]
      );

      await client.query('COMMIT;');

      return res.status(201).json({
        status: 'success',
        message: 'HMO Claim initialized and submitted successfully.',
        data: {
          claimId,
          claimReferenceNumber: claimRefNumber,
          invoiceId,
          claimedAmount: claimedNum,
          claimStatus: status,
          submissionDate: isSubmitted ? new Date().toISOString() : null
        }
      });
    } catch (error: any) {
      await client.query('ROLLBACK;');
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      });
    } finally {
      client.release();
    }
  });

  // ==========================================================================
  // 2. PATCH /api/hmo/claims/:claimId/status - STATUS TRANSITIONS
  // ==========================================================================
  router.patch('/api/hmo/claims/:claimId/status', auth, async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
      const { claimId } = req.params;
      const {
        newStatus,
        adjudicatorRemarks,
        rejectionReason,
        approvedAmount,
        settlementBatchId,
        settlementPaymentId
      } = req.body;

      // Valid statuses: 'draft', 'submitted', 'under_review', 'query_issued', 'approved', 'rejected', 'settled_paid'
      const ALLOWED_STATUSES = ['draft', 'submitted', 'under_review', 'query_issued', 'approved', 'rejected', 'settled_paid'];
      if (!newStatus || !ALLOWED_STATUSES.includes(newStatus)) {
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_STATUS',
          message: `Invalid claim status [${newStatus}]. Must be one of: [${ALLOWED_STATUSES.join(', ')}].`
        });
      }

      await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;');

      // Fetch current claim with row lock
      const claimResult = await client.query(
        `SELECT 
          claim_id, claim_reference_number, invoice_id, claimed_amount, approved_amount, 
          amount_settled, claim_status, submission_date 
        FROM hmo_claims 
        WHERE claim_id = $1 
        FOR UPDATE;`,
        [claimId]
      );

      if (claimResult.rowCount === 0) {
        await client.query('ROLLBACK;');
        return res.status(404).json({
          status: 'error',
          code: 'CLAIM_NOT_FOUND',
          message: `Claim [${claimId}] not found.`
        });
      }

      const claim = claimResult.rows[0];
      const previousStatus = claim.claim_status;
      const claimedAmount = parseFloat(claim.claimed_amount);

      let updatedApprovedAmount = parseFloat(claim.approved_amount);
      let updatedAmountSettled = parseFloat(claim.amount_settled);
      let adjudicationDate = null;
      let settlementDate = null;
      const timestamp = new Date().toISOString();

      // State Transition Rule Enforcement
      if (newStatus === 'approved') {
        adjudicationDate = timestamp;
        updatedApprovedAmount = approvedAmount !== undefined ? parseFloat(approvedAmount) : claimedAmount;

        // Invariant: approvedAmount <= claimedAmount
        if (updatedApprovedAmount > claimedAmount) {
          await client.query('ROLLBACK;');
          return res.status(422).json({
            status: 'error',
            code: 'INVARIANT_BREACH',
            message: `Approved amount ($${updatedApprovedAmount.toFixed(2)}) cannot exceed claimed amount ($${claimedAmount.toFixed(2)}).`
          });
        }
      } else if (newStatus === 'query_issued') {
        if (!adjudicatorRemarks) {
          await client.query('ROLLBACK;');
          return res.status(400).json({
            status: 'error',
            code: 'MISSING_QUERY_REASON',
            message: 'Querying a claim requires adjudicator remarks detailing the inquiry.'
          });
        }
      } else if (newStatus === 'rejected') {
        adjudicationDate = timestamp;
        if (!rejectionReason) {
          await client.query('ROLLBACK;');
          return res.status(400).json({
            status: 'error',
            code: 'MISSING_REJECTION_REASON',
            message: 'Rejecting a claim requires an explicit rejection reason.'
          });
        }
      } else if (newStatus === 'settled_paid') {
        settlementDate = timestamp;
        adjudicationDate = adjudicationDate || timestamp;
        updatedAmountSettled = updatedApprovedAmount > 0 ? updatedApprovedAmount : claimedAmount;
        updatedApprovedAmount = updatedApprovedAmount > 0 ? updatedApprovedAmount : claimedAmount;
      }

      const staffId = (req as any).user?.userId || '11111111-1111-4111-8111-444444444444';

      // Update Claim Header
      await client.query(
        `UPDATE hmo_claims 
        SET claim_status = $1,
            approved_amount = $2,
            amount_settled = $3,
            adjudication_date = COALESCE($4, adjudication_date),
            settlement_date = COALESCE($5, settlement_date),
            settlement_batch_id = COALESCE($6, settlement_batch_id),
            settlement_payment_id = COALESCE($7, settlement_payment_id),
            rejection_reason = COALESCE($8, rejection_reason),
            adjudicator_remarks = COALESCE($9, adjudicator_remarks),
            updated_at = CURRENT_TIMESTAMP
        WHERE claim_id = $10;`,
        [
          newStatus,
          updatedApprovedAmount,
          updatedAmountSettled,
          adjudicationDate,
          settlementDate,
          settlementBatchId || null,
          settlementPaymentId || null,
          rejectionReason || null,
          adjudicatorRemarks || null,
          claimId
        ]
      );

      // Append Audit History Row
      const transitionNote = adjudicatorRemarks || rejectionReason || `Status shifted from [${previousStatus}] to [${newStatus}].`;
      await client.query(
        `INSERT INTO hmo_claim_history (
          history_id, claim_id, previous_status, new_status, changed_by_staff_id,
          transition_notes, transition_timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);`,
        [
          crypto.randomUUID(),
          claimId,
          previousStatus,
          newStatus,
          staffId,
          transitionNote
        ]
      );

      await client.query('COMMIT;');

      return res.status(200).json({
        status: 'success',
        message: `Claim [${claim.claim_reference_number}] transitioned from [${previousStatus}] to [${newStatus}].`,
        data: {
          claimId,
          claimReferenceNumber: claim.claim_reference_number,
          previousStatus,
          newStatus,
          claimedAmount,
          approvedAmount: updatedApprovedAmount,
          amountSettled: updatedAmountSettled,
          settlementDate
        }
      });
    } catch (error: any) {
      await client.query('ROLLBACK;');
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      });
    } finally {
      client.release();
    }
  });

  // ==========================================================================
  // 3. GET /api/hmo/claims/aging-report - 30-DAY UNPAID CLAIMS & AGING MATRIX
  // ==========================================================================
  router.get('/api/hmo/claims/aging-report', auth, async (req: Request, res: Response) => {
    try {
      const minAgingDays = parseInt(req.query.minAgingDays as string, 10) || 0;
      const providerId = req.query.providerId as string;

      // SQL Query: Aggregates claims into 4 aging bands: Current (0-30), Delinquent (31-60), Critical (61-90), Escalated (90+)
      const query = `
        SELECT 
          hp.provider_id,
          hp.provider_name,
          hp.provider_code,
          hp.reimbursement_terms_days AS contractual_sla_days,
          COUNT(hc.claim_id) AS total_active_claims,
          SUM(hc.claimed_amount) AS total_claimed_amount,
          SUM(hc.approved_amount) AS total_approved_amount,
          SUM(hc.amount_settled) AS total_settled_cash,
          -- 30-Day Overdue Metrics
          COUNT(CASE WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - hc.submission_date)) > 30 THEN 1 END) AS claims_over_30_days_count,
          COALESCE(SUM(CASE WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - hc.submission_date)) > 30 THEN hc.claimed_amount ELSE 0 END), 0.00) AS claims_over_30_days_amount,
          -- Aging Bands Breakdown
          COUNT(CASE WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - hc.submission_date)) BETWEEN 0 AND 30 THEN 1 END) AS bucket_0_to_30_days,
          COUNT(CASE WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - hc.submission_date)) BETWEEN 31 AND 60 THEN 1 END) AS bucket_31_to_60_days,
          COUNT(CASE WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - hc.submission_date)) BETWEEN 61 AND 90 THEN 1 END) AS bucket_61_to_90_days,
          COUNT(CASE WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - hc.submission_date)) > 90 THEN 1 END) AS bucket_90_plus_days,
          -- Maximum Aging Elapsed
          COALESCE(MAX(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - hc.submission_date))), 0) AS max_aging_days,
          -- Average Aging Elapsed
          ROUND(COALESCE(AVG(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - hc.submission_date))), 0), 1) AS avg_aging_days
        FROM hmo_claims hc
        JOIN hmo_providers hp ON hc.hmo_provider_id = hp.provider_id
        WHERE hc.claim_status NOT IN ('settled_paid', 'rejected')
          ${providerId ? 'AND hp.provider_id = $1' : ''}
        GROUP BY hp.provider_id, hp.provider_name, hp.provider_code, hp.reimbursement_terms_days
        HAVING COALESCE(MAX(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - hc.submission_date))), 0) >= ${minAgingDays}
        ORDER BY claims_over_30_days_amount DESC, total_claimed_amount DESC;
      `;

      const params = providerId ? [providerId] : [];
      const result = await pool.query(query, params);

      // Detailed Claims Breakdown Flagged > 30 Days
      const delinquentClaimsQuery = `
        SELECT 
          hc.claim_id,
          hc.claim_reference_number,
          hp.provider_name,
          p.mrn,
          CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
          hc.policy_number,
          hc.claimed_amount,
          hc.approved_amount,
          hc.claim_status,
          hc.submission_date,
          ROUND(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - hc.submission_date)), 0) AS aging_days,
          hp.reimbursement_terms_days,
          CASE 
            WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - hc.submission_date)) > hp.reimbursement_terms_days THEN true 
            ELSE false 
          END AS contractual_sla_breached
        FROM hmo_claims hc
        JOIN hmo_providers hp ON hc.hmo_provider_id = hp.provider_id
        JOIN patients p ON hc.patient_id = p.patient_id
        WHERE hc.claim_status NOT IN ('settled_paid', 'rejected')
          AND EXTRACT(DAY FROM (CURRENT_TIMESTAMP - hc.submission_date)) > 30
        ORDER BY aging_days DESC;
      `;

      const delinquentResult = await pool.query(delinquentClaimsQuery);

      const totalDelinquentAmount = result.rows.reduce(
        (sum, row) => sum + parseFloat(row.claims_over_30_days_amount || 0), 
        0
      );
      const totalDelinquentCount = result.rows.reduce(
        (sum, row) => sum + parseInt(row.claims_over_30_days_count || 0, 10), 
        0
      );

      return res.status(200).json({
        status: 'success',
        reportGeneratedAt: new Date().toISOString(),
        summary: {
          totalProvidersWithUnpaidClaims: result.rowCount,
          totalDelinquentClaimsOver30Days: totalDelinquentCount,
          totalOverdueReceivables30DaysPlus: Math.round(totalDelinquentAmount * 100) / 100,
          agingThresholdDays: 30
        },
        providerAgingSummary: result.rows.map(row => ({
          providerId: row.provider_id,
          providerName: row.provider_name,
          providerCode: row.provider_code,
          contractualSlaDays: parseInt(row.contractual_sla_days, 10),
          totalActiveClaims: parseInt(row.total_active_claims, 10),
          totalClaimedAmount: parseFloat(row.total_claimed_amount),
          totalApprovedAmount: parseFloat(row.total_approved_amount),
          claimsOver30DaysCount: parseInt(row.claims_over_30_days_count, 10),
          claimsOver30DaysAmount: parseFloat(row.claims_over_30_days_amount),
          agingBands: {
            current0To30Days: parseInt(row.bucket_0_to_30_days, 10),
            delinquent31To60Days: parseInt(row.bucket_31_to_60_days, 10),
            critical61To90Days: parseInt(row.bucket_61_to_90_days, 10),
            escalated90PlusDays: parseInt(row.bucket_90_plus_days, 10)
          },
          avgAgingDays: parseFloat(row.avg_aging_days),
          maxAgingDays: parseInt(row.max_aging_days, 10),
          hasSlaBreach: parseInt(row.max_aging_days, 10) > parseInt(row.contractual_sla_days, 10)
        })),
        flaggedOverdueClaims: delinquentResult.rows
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        code: 'AGING_REPORT_FAILED',
        message: error.message
      });
    }
  });

  // ==========================================================================
  // 4. GET /api/hmo/claims/:claimId - CLAIM DETAILS & AUDIT TIMELINE
  // ==========================================================================
  router.get('/api/hmo/claims/:claimId', auth, async (req: Request, res: Response) => {
    try {
      const { claimId } = req.params;

      const claimQuery = `
        SELECT 
          hc.*,
          hp.provider_name,
          hp.provider_code,
          hp.contact_email AS hmo_contact_email,
          hp.reimbursement_terms_days,
          p.mrn,
          p.first_name,
          p.last_name,
          p.phone_number,
          inv.invoice_number,
          inv.total_amount AS invoice_total,
          inv.payment_status AS invoice_payment_status,
          ROUND(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - hc.submission_date)), 0) AS elapsed_aging_days
        FROM hmo_claims hc
        JOIN hmo_providers hp ON hc.hmo_provider_id = hp.provider_id
        JOIN patients p ON hc.patient_id = p.patient_id
        JOIN billing_invoices inv ON hc.invoice_id = inv.invoice_id
        WHERE hc.claim_id = $1;
      `;

      const claimResult = await pool.query(claimQuery, [claimId]);
      if (claimResult.rowCount === 0) {
        return res.status(404).json({
          status: 'error',
          code: 'CLAIM_NOT_FOUND',
          message: `Claim [${claimId}] not found.`
        });
      }

      // Fetch sequential audit timeline from hmo_claim_history
      const historyQuery = `
        SELECT 
          h.history_id,
          h.previous_status,
          h.new_status,
          h.transition_notes,
          h.transition_timestamp,
          CONCAT(s.first_name, ' ', s.last_name) AS staff_name,
          s.role AS staff_role
        FROM hmo_claim_history h
        LEFT JOIN staff_users s ON h.changed_by_staff_id = s.staff_id
        WHERE h.claim_id = $1
        ORDER BY h.transition_timestamp ASC;
      `;

      const historyResult = await pool.query(historyQuery, [claimId]);

      return res.status(200).json({
        status: 'success',
        claim: claimResult.rows[0],
        auditTimeline: historyResult.rows
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      });
    }
  });

  return router;
}
