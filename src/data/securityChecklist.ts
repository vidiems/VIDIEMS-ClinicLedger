export interface SecurityMeasure {
  id: string;
  owaspCategory: string;
  owaspCode: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  nigerianRegulatoryContext: string; // NDPA 2023, CBN, NITDA
  healthAndFinancialImpact: string;
  threatScenario: string;
  checklistItems: {
    item: string;
    requirement: string;
    implementationSnippet?: string;
  }[];
  mitigationBlueprint: {
    language: string;
    description: string;
    code: string;
  };
}

export const OWASP_SECURITY_CHECKLIST: SecurityMeasure[] = [
  {
    id: 'a01-broken-access-control',
    owaspCode: 'A01:2021',
    owaspCategory: 'Broken Access Control',
    title: 'Strict RBAC, Least Privilege & BOLA/IDOR Prevention',
    severity: 'CRITICAL',
    nigerianRegulatoryContext: 'NDPA 2023 Section 24 & 34: Data controllers handling Sensitive Personal Data (health/financial data) must prevent unauthorized internal or third-party access; CBN Consumer Protection Framework mandates strict staff segregation of duties.',
    healthAndFinancialImpact: 'Prevents cashiers from reading patient clinical diagnoses/HIV status, and prevents physicians from arbitrarily manipulating invoice balances or issuing unauthorized refunds.',
    threatScenario: 'Broken Object-Level Authorization (BOLA/IDOR) where an authenticated user changes URL parameters (e.g. GET /api/patients/3333-1111/medical-records) to access charts of other patients or VIP enrollees.',
    checklistItems: [
      {
        item: 'Enforce Role-Based Access Control (RBAC) at Controller & Middleware Layer',
        requirement: 'Never rely on frontend route hiding. Every API endpoint must evaluate the authenticated JWT/session claim for specific granular permissions.'
      },
      {
        item: 'Prevent Insecure Direct Object References (IDOR / BOLA)',
        requirement: 'Validate that the querying patient owns the record (patient_id == session.patient_id) or that the staff user has an active encounter assigned to that patient.'
      },
      {
        item: 'Enforce Financial Segregation of Duties',
        requirement: 'Cashiers cannot modify tariff prices or waive debts; only designated Chief Financial Officers or Medical Directors can authorize write-offs.'
      },
      {
        item: 'Disable CORS Wildcards and Public S3/Cloud Storage Buckets',
        requirement: 'Patient ultrasound scans and lab reports must never reside in public buckets. Use short-lived presigned URLs (TTL <= 15 minutes) with mandatory authorization headers.'
      }
    ],
    mitigationBlueprint: {
      language: 'TypeScript / Express Middleware',
      description: 'Granular policy enforcement guard verifying role, tenant boundaries, and record ownership.',
      code: `// Middleware: Enforce Role and Encounter Ownership
export const requirePatientChartAccess = async (req: Request, res: Response, next: NextFunction) => {
  const { patientId } = req.params;
  const currentUser = req.user; // Authenticated staff or patient

  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Super admins and assigned medical doctors have clinical privileges
  if (currentUser.role === 'super_admin') return next();

  if (currentUser.role === 'doctor') {
    // Verify doctor has an active or past appointment with this patient
    const hasActiveEncounter = await db.query(
      'SELECT 1 FROM appointments WHERE doctor_staff_id = $1 AND patient_id = $2 LIMIT 1',
      [currentUser.staffId, patientId]
    );
    if (hasActiveEncounter.rowCount > 0) return next();
  }

  // Cashiers, Billing Officers, and Receptionists are strictly BLOCKED from clinical notes
  if (['cashier', 'billing_officer'].includes(currentUser.role)) {
    return res.status(403).json({ 
      error: 'NDPA 2023 Violation: Financial staff are restricted from clinical medical records.' 
    });
  }

  return res.status(403).json({ error: 'Access forbidden: Insufficient authorization' });
};`
    }
  },
  {
    id: 'a02-cryptographic-failures',
    owaspCode: 'A02:2021',
    owaspCategory: 'Cryptographic Failures',
    title: 'Data-at-Rest & In-Transit Encryption, Tokenization & Key Management',
    severity: 'CRITICAL',
    nigerianRegulatoryContext: 'NDPA 2023 Section 39: Security of Processing requires state-of-the-art encryption; CBN Regulatory Framework for Electronic Payments mandates PCI-DSS Level 1 compliance and prohibits storing unencrypted PAN or CVV.',
    healthAndFinancialImpact: 'A stolen database snapshot or leaked backup cannot expose clinical history, genotype, HIV status, or customer credit card details.',
    threatScenario: 'Man-in-the-Middle (MitM) eavesdropping on hospital Wi-Fi intercepting unencrypted HTTP traffic, or unencrypted database backups sold on underground markets.',
    checklistItems: [
      {
        item: 'TLS 1.3 Mandatory In-Transit Encryption',
        requirement: 'Enforce HTTPS everywhere with HTTP Strict Transport Security (HSTS, max-age=31536000, includeSubDomains). Reject insecure SSLv3, TLS 1.0, and TLS 1.1.'
      },
      {
        item: 'AES-256-GCM Field-Level Encryption for Sensitive Health Fields',
        requirement: 'Demographic identifiers, clinical notes, and genotype fields encrypted at rest using envelope encryption with Hardware Security Modules (HSM) or Cloud KMS.'
      },
      {
        item: 'PCI-DSS Cardholder Data Tokenization',
        requirement: 'Never store card primary account numbers (PAN), CVVs, or PINs. Only persist masked numbers (card_last_four) and processor retrieval references (pos_rrn).'
      },
      {
        item: 'Argon2id or Bcrypt with Salting for Staff Passwords',
        requirement: 'Never use MD5, SHA-1, or plain SHA-256 for passwords. Enforce minimum work factors (Argon2id m=65536, t=3, p=4 or Bcrypt cost >= 12).'
      }
    ],
    mitigationBlueprint: {
      language: 'TypeScript / Node.js Crypto',
      description: 'Authenticated AES-256-GCM field encryption for sensitive medical diagnoses.',
      code: `import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const MASTER_KEY = Buffer.from(process.env.ENCRYPTION_KEY_HEX!, 'hex'); // 32 bytes

export function encryptMedicalField(plaintext: string): { ciphertext: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12); // Recommended 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
  
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return { ciphertext, iv: iv.toString('hex'), tag };
}

export function decryptMedicalField(ciphertext: string, ivHex: string, tagHex: string): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}`
    }
  },
  {
    id: 'a03-injection-prevention',
    owaspCode: 'A03:2021',
    owaspCategory: 'Injection',
    title: 'SQL Injection Prevention & Strict Parameterization',
    severity: 'CRITICAL',
    nigerianRegulatoryContext: 'NDPA 2023 Section 39(1)(b): Controllers must guarantee confidentiality and data integrity; SQL injection leaks lead to massive regulatory fines (up to 2% of annual turnover or N10,000,000 under NDPA).',
    healthAndFinancialImpact: 'Prevents attackers from extracting entire patient directories, wiping medical charts, or tampering with billing invoices to erase unpaid debts.',
    threatScenario: 'An attacker inputs "1\' OR \'1\'=\'1" into the patient search or invoice lookup box, resulting in arbitrary SQL command execution on the relational database.',
    checklistItems: [
      {
        item: '100% Prepared Statements / Parameterized Queries',
        requirement: 'Strictly prohibit string concatenation or template literal string interpolation (e.g. `SELECT * FROM patients WHERE mrn = \'${mrn}\'`) in all database query paths.'
      },
      {
        item: 'Use Type-Safe ORMs with Strict Query Builders',
        requirement: 'Enforce Drizzle ORM, Prisma, or Kysely which automatically parameterize all values. Treat raw SQL as exceptional and require senior architect sign-off.'
      },
      {
        item: 'Database User Least Privilege Configuration',
        requirement: 'The web application database user (clinic_web_user) must only have SELECT, INSERT, UPDATE on application tables. Revoke DROP, ALTER, TRUNCATE, and GRANT permissions.'
      },
      {
        item: 'Strict Input Validation & Schema Sanitization',
        requirement: 'Validate all inputs against strict Zod or JSON schemas before query execution. Reject alphanumeric anomalies on clinical codes and UUIDs.'
      }
    ],
    mitigationBlueprint: {
      language: 'SQL & TypeScript (Parameterization)',
      description: 'Vulnerable query vs Secure Parameterized query demonstrating separation of code and data.',
      code: `// ❌ INSECURE: Vulnerable to SQL Injection
// An input of "MRN-101' OR '1'='1" dumps all patient records
const query = \`SELECT * FROM patients WHERE mrn = '\${userInput}'\`;

// ✅ SECURE: 100% Parameterized Prepared Statement
// The database engine compiles the query structure first; userInput is treated strictly as a scalar literal value
const secureQuery = 'SELECT * FROM patients WHERE mrn = $1 AND is_active = $2';
const result = await db.query(secureQuery, [userInput, true]);

// ✅ SECURE: Drizzle ORM Type-Safe Execution
const patient = await db.select()
  .from(patients)
  .where(eq(patients.mrn, userInput))
  .limit(1);`
    }
  },
  {
    id: 'a04-insecure-design',
    owaspCode: 'A04:2021',
    owaspCategory: 'Insecure Design',
    title: 'Financial Concurrency Control, Race Condition Prevention & Threat Modeling',
    severity: 'HIGH',
    nigerianRegulatoryContext: 'CBN Operational Guidelines on Payment Systems: Systems must prevent double-crediting, floating balances, and settlement discrepancies.',
    healthAndFinancialImpact: 'Prevents race conditions where concurrent cashiers submit split payments resulting in negative invoice balance_due or duplicate payment receipts.',
    threatScenario: 'Simultaneous API requests sent to /api/invoices/pay with identical amounts causing the invoice amount_paid to double-count while the balance falls below zero.',
    checklistItems: [
      {
        item: 'Database Row Locks for Financial Checkouts (SELECT FOR UPDATE)',
        requirement: 'Lock the invoice row in the database before calculating balances to serialize concurrent payment attempts.'
      },
      {
        item: 'Idempotency Keys on Payment Submissions',
        requirement: 'Require client-generated UUID idempotency keys on payment POST requests. If a cashier double-clicks, the second request returns the cached receipt.'
      },
      {
        item: 'Database Constraints as Defense-in-Depth',
        requirement: 'Enforce CHECK (balance_due >= 0) and CHECK (amount_paid <= total_amount) at the database engine level so software bugs cannot violate ledger physics.'
      },
      {
        item: 'HMO Claim State Machine Invariants',
        requirement: 'Enforce deterministic status transitions (e.g. cannot transition directly from "draft" to "settled_paid" without "approved").'
      }
    ],
    mitigationBlueprint: {
      language: 'PostgreSQL ACID Transaction',
      description: 'Row-level locking with SELECT FOR UPDATE preventing double-crediting.',
      code: `BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Lock the target billing invoice row exclusively against concurrent writes
SELECT total_amount, amount_paid, balance_due 
FROM billing_invoices 
WHERE invoice_id = '55555555-5555-4555-8555-111111111111'
FOR UPDATE;

-- Insert the verified payment transaction
INSERT INTO payments (
  payment_id, receipt_number, invoice_id, patient_id, cashier_staff_id, 
  payment_channel, amount, channel_status
) VALUES (
  gen_random_uuid(), 'REC-2026-9901', '55555555-5555-4555-8555-111111111111', 
  '33333333-3333-4333-8333-111111111111', '11111111-1111-4111-8111-333333333333', 
  'pos_terminal', 50.00, 'settled'
);

-- Recalculate invoice balance (or handled via trigger trg_payments_balance_sync)
UPDATE billing_invoices 
SET amount_paid = amount_paid + 50.00,
    balance_due = total_amount - (amount_paid + 50.00),
    payment_status = CASE WHEN (total_amount - (amount_paid + 50.00)) = 0 THEN 'fully_paid' ELSE 'partially_paid' END
WHERE invoice_id = '55555555-5555-4555-8555-111111111111';

COMMIT;`
    }
  },
  {
    id: 'a05-security-misconfiguration',
    owaspCode: 'A05:2021',
    owaspCategory: 'Security Misconfiguration',
    title: 'Hardened HTTP Headers, Error Suppression & Safe Defaults',
    severity: 'HIGH',
    nigerianRegulatoryContext: 'NITDA Information Technology Security Guidelines for Nigerian Enterprises: Requires removal of default administrative credentials and masking of system banners.',
    healthAndFinancialImpact: 'Prevents reconnaissance by malicious actors probing for framework versions, database vendor signatures, or default administrative portals.',
    threatScenario: 'Uncaught database errors returning raw PostgreSQL error messages with table schemas, internal IPs, and SQL syntax to the browser.',
    checklistItems: [
      {
        item: 'Mask Internal Error Stacks in Production API Responses',
        requirement: 'Return generic error messages with UUID correlation tracking codes (e.g. "Internal processing error [Ref: err_99a81]"). Never expose SQL strings or file paths.'
      },
      {
        item: 'Enforce Comprehensive HTTP Security Headers',
        requirement: 'Configure Content-Security-Policy (CSP), X-Frame-Options: DENY (clickjacking defense), X-Content-Type-Options: nosniff, and Referrer-Policy.'
      },
      {
        item: 'Secure Session Cookies',
        requirement: 'Set session cookies with HttpOnly (blocks XSS credential extraction), Secure (HTTPS only), and SameSite=Strict (CSRF defense).'
      },
      {
        item: 'Disable Server Signature Banners',
        requirement: 'Remove X-Powered-By: Express and Server: nginx/1.18 version banners from all HTTP responses.'
      }
    ],
    mitigationBlueprint: {
      language: 'TypeScript / Helmet Middleware',
      description: 'Production hardening with Helmet security headers and global error handler.',
      code: `import helmet from 'helmet';
import express from 'express';

const app = express();

// Configure defense-in-depth HTTP security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://api.paystack.co", "https://api.flutterwave.com"]
    }
  },
  frameguard: { action: 'deny' }, // Anti-Clickjacking
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true
}));

// Global Error Handler - Zero Information Leakage
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errorRef = crypto.randomUUID();
  console.error(\`[Error Ref: \${errorRef}]\`, err.stack); // Log internally to secure audit stream
  
  res.status(500).json({
    status: 'error',
    message: 'An internal processing error occurred.',
    incidentReference: errorRef // Patient or cashier quotes this to IT support
  });
});`
    }
  },
  {
    id: 'a06-vulnerable-components',
    owaspCode: 'A06:2021',
    owaspCategory: 'Vulnerable and Outdated Components',
    title: 'Software Composition Analysis (SCA) & Dependency Hardening',
    severity: 'MEDIUM',
    nigerianRegulatoryContext: 'NDPA 2023 Section 39: Standard of Care requires utilizing actively maintained software to prevent preventable zero-day exploits.',
    healthAndFinancialImpact: 'Guarantees third-party libraries (e.g., PDF generation, payment adapters) do not introduce remote code execution (RCE) vulnerabilities.',
    threatScenario: 'An outdated PDF generator library used to generate patient receipts contains a known Remote Code Execution vulnerability allowing server takeover.',
    checklistItems: [
      {
        item: 'Automated CI/CD Vulnerability Scanning (npm audit / Snyk)',
        requirement: 'Enforce zero High or Critical vulnerabilities in production deployments via automated GitHub Actions / GitLab CI pipeline breaks.'
      },
      {
        item: 'Pin Exact Dependency Versions with Lockfiles',
        requirement: 'Always commit package-lock.json and use npm ci in build pipelines to avoid unvetted patch injection.'
      },
      {
        item: 'Software Bill of Materials (SBOM) Generation',
        requirement: 'Maintain an inventory of all third-party dependencies for regulatory inspection and swift vulnerability response.'
      }
    ],
    mitigationBlueprint: {
      language: 'Shell / CI Configuration',
      description: 'Automated security gate in CI/CD pipeline.',
      code: `# Fail build if high or critical CVEs exist in dependencies
npm audit --audit-level=high

# Run automated software composition analysis
npx snyk test --severity-threshold=high`
    }
  },
  {
    id: 'a07-auth-failures',
    owaspCode: 'A07:2021',
    owaspCategory: 'Identification & Authentication Failures',
    title: 'Multi-Factor Authentication (MFA), Brute-Force Rate Limiting & Session Hygiene',
    severity: 'CRITICAL',
    nigerianRegulatoryContext: 'CBN CyberSecurity Framework for Financial Institutions: Mandatory Two-Factor Authentication (2FA) for payment authorized personnel; NDPA Section 24 credential protection.',
    healthAndFinancialImpact: 'Prevents credential stuffing attacks where compromised physician or cashier passwords lead to account takeover and fraud.',
    threatScenario: 'Automated botnet spraying passwords against hospital staff login endpoints until finding a reused or weak employee credential.',
    checklistItems: [
      {
        item: 'Mandatory Multi-Factor Authentication (MFA / TOTP) for Staff',
        requirement: 'Require Time-based One-Time Passwords (TOTP via Google Authenticator/hardware tokens) for all doctors, cashiers, and administrators.'
      },
      {
        item: 'Exponential Backoff & Rate Limiting on Login Endpoints',
        requirement: 'Limit failed attempts to 5 per 15 minutes per IP/username, followed by temporary account locking and alert generation.'
      },
      {
        item: 'Session Timeout & Immediate Invalidation on Privilege Revocation',
        requirement: 'Outpatient clinical sessions expire after 15 minutes of inactivity; token revocation lists (Redis blocklists) immediately terminate terminated staff.'
      }
    ],
    mitigationBlueprint: {
      language: 'TypeScript / Express Rate Limiter',
      description: 'Brute-force protection on clinic authentication endpoints.',
      code: `import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 failed login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many failed login attempts. Account temporarily locked for 15 minutes in compliance with CBN security standards.'
  }
});`
    }
  },
  {
    id: 'a08-software-data-integrity',
    owaspCode: 'A08:2021',
    owaspCategory: 'Software and Data Integrity Failures',
    title: 'Cryptographic Webhook Verification & CI/CD Pipeline Integrity',
    severity: 'HIGH',
    nigerianRegulatoryContext: 'CBN Guidelines for Web Payments: Mandatory cryptographic signature verification on asynchronous transaction webhooks to prevent ghost payments.',
    healthAndFinancialImpact: 'Prevents attackers from spoofing HTTP POST webhooks to mark invoices as "settled" without funds actually landing in the hospital bank account.',
    threatScenario: 'A fraudster sends a fake webhook to /api/webhooks/paystack with {"event": "charge.success", "amount": 50000} causing the clinic to release medications without payment.',
    checklistItems: [
      {
        item: 'HMAC-SHA512 / HMAC-SHA256 Webhook Signature Verification',
        requirement: 'Verify x-paystack-signature or x-flutterwave-signature using raw request body and secret key before processing any payment status update.'
      },
      {
        item: 'Replay Attack Protection via Timestamp & Nonce Checking',
        requirement: 'Reject webhooks older than 5 minutes or whose gateway transaction ID has already been recorded in the payments table.'
      },
      {
        item: 'Verify Software Deployments via Signed Commits & Git Tags',
        requirement: 'Require GPG signed commits and two-person review on any changes to billing, tariff calculations, or claim filing logic.'
      }
    ],
    mitigationBlueprint: {
      language: 'TypeScript / Node.js Webhook Guard',
      description: 'HMAC cryptographic signature validation for Paystack / Nigerian payment gateways.',
      code: `import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export const verifyPaymentWebhook = (req: Request, res: Response, next: NextFunction) => {
  const hash = req.headers['x-paystack-signature'] as string;
  const secret = process.env.PAYSTACK_SECRET_KEY!;

  if (!hash) {
    return res.status(401).json({ error: 'Missing webhook signature header' });
  }

  // Calculate HMAC using raw request payload buffer
  const calculatedHash = crypto
    .createHmac('sha512', secret)
    .update((req as any).rawBody)
    .digest('hex');

  // Constant-time comparison prevents timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(hash, 'utf8'),
    Buffer.from(calculatedHash, 'utf8')
  );

  if (!isValid) {
    return res.status(403).json({ error: 'Tampered webhook payload rejected' });
  }

  next();
};`
    }
  },
  {
    id: 'a09-logging-monitoring-failures',
    owaspCode: 'A09:2021',
    owaspCategory: 'Security Logging and Monitoring Failures',
    title: 'Tamper-Evident Audit Trails & 72-Hour NDPA Breach Incident Response',
    severity: 'HIGH',
    nigerianRegulatoryContext: 'NDPA 2023 Section 40: Mandatory 72-hour Data Breach Notification to the Nigeria Data Protection Commission (NDPC); CBN 7-year financial transaction audit retention mandate.',
    healthAndFinancialImpact: 'Ensures forensic evidence is preserved if a staff member snoops on medical files, and detects fraudulent billing alterations before money leaves the clinic.',
    threatScenario: 'An unauthorized employee downloads 5,000 patient records over the weekend with zero alerts generated until patients receive extortion notices.',
    checklistItems: [
      {
        item: 'Append-Only, Immutable Audit Logs for Medical Chart Access',
        requirement: 'Record timestamp, staff_id, patient_id, action (VIEW, EXPORT, EDIT), IP address, and user agent for every medical file interaction.'
      },
      {
        item: 'Real-Time Anomaly Detection & High-Volume Export Alarms',
        requirement: 'Trigger security alarms when an account views more than 20 distinct patient records in 5 minutes, or attempts unauthorized financial adjustments.'
      },
      {
        item: '72-Hour NDPA Data Breach Readiness Protocol',
        requirement: 'Automated forensic telemetry export to compile the affected Data Subject count, exposure window, and remediation actions for NDPC regulatory reporting.'
      },
      {
        item: 'Mask PII and Payment Secrets in Application Logs',
        requirement: 'Scrub passwords, card numbers, and authorization codes from log streams before writing to CloudWatch or Datadog.'
      }
    ],
    mitigationBlueprint: {
      language: 'SQL / PostgreSQL Audit Table',
      description: 'Forensic append-only audit trail with immutable write-only permissions.',
      code: `-- Dedicated Forensic Audit Log Table
CREATE TABLE clinical_audit_trail (
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_staff_id UUID NOT NULL REFERENCES staff_users(staff_id),
  target_patient_id UUID NOT NULL REFERENCES patients(patient_id),
  action_type VARCHAR(50) NOT NULL, -- 'CHART_VIEW', 'DIAGNOSIS_EDIT', 'EXPORT_PDF'
  ip_address INET NOT NULL,
  user_agent TEXT,
  record_diff JSONB -- For edits: captures { before: ..., after: ... }
);

-- Deny UPDATE and DELETE on audit trail to all application roles
REVOKE UPDATE, DELETE ON clinical_audit_trail FROM clinic_web_user;`
    }
  },
  {
    id: 'a10-ssrf',
    owaspCode: 'A10:2021',
    owaspCategory: 'Server-Side Request Forgery (SSRF)',
    title: 'HMO Clearinghouse URL Whitelisting & Internal IP Loopback Blocking',
    severity: 'MEDIUM',
    nigerianRegulatoryContext: 'NITDA Cloud Computing Policy: Protection of internal cloud infrastructure from traversal via external web integration adapters.',
    healthAndFinancialImpact: 'Prevents compromised HMO portal URLs from coercing the clinic server into scanning internal hospital network subnets (e.g. PACS imaging servers, lab diagnostic devices).',
    threatScenario: 'An administrator enters an HMO claims portal URL like http://169.254.169.254/latest/meta-data/ or http://10.0.0.5/admin causing the server to leak cloud IAM credentials or internal PACS scan images.',
    checklistItems: [
      {
        item: 'Strict URL Whitelisting for External HMO Claims Endpoints',
        requirement: 'Only allow outgoing HTTP requests to verified domain names (e.g. *.axa-health.com, *.reliancecare.org). Reject arbitrary user-supplied URLs.'
      },
      {
        item: 'Block Requests to RFC 1918 Private IP Subnets & Cloud Metadata',
        requirement: 'Enforce network-level egress filtering blocking 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.1, and 169.254.169.254.'
      },
      {
        item: 'Disable Following Unsafe HTTP 302 Redirects',
        requirement: 'Configure outgoing HTTP clients to validate target hostnames before following redirects to prevent rebinding attacks.'
      }
    ],
    mitigationBlueprint: {
      language: 'TypeScript / Safe Fetch Wrapper',
      description: 'Egress URL sanitizer blocking private IPs and verifying domain whitelist.',
      code: `import dns from 'dns/promises';
import { URL } from 'url';

const ALLOWED_HMO_DOMAINS = [
  'axa-health.portal',
  'edi.reliancecare.org',
  'gateway.hygeiahmo.com'
];

export async function validateHmoPortalUrl(inputUrl: string): Promise<boolean> {
  const parsed = new URL(inputUrl);

  // 1. Enforce HTTPS only
  if (parsed.protocol !== 'https:') return false;

  // 2. Domain Whitelist Verification
  const isWhitelisted = ALLOWED_HMO_DOMAINS.some(domain => 
    parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
  );
  if (!isWhitelisted) return false;

  // 3. Resolve DNS and verify IP is not RFC 1918 private or loopback
  const addresses = await dns.resolve4(parsed.hostname);
  for (const ip of addresses) {
    if (
      ip.startsWith('10.') || 
      ip.startsWith('192.168.') || 
      ip.startsWith('127.') || 
      ip.startsWith('169.254.')
    ) {
      return false; // Private internal IP rejected
    }
  }

  return true;
}`
    }
  }
];

export const NIGERIA_COMPLIANCE_STANDARDS = [
  {
    code: 'NDPA 2023',
    name: 'Nigeria Data Protection Act (2023)',
    governingBody: 'Nigeria Data Protection Commission (NDPC)',
    keyMandates: [
      'Classification of health and financial records as "Sensitive Personal Data" (Section 30).',
      'Mandatory Data Protection Impact Assessment (DPIA) before deploying clinical systems (Section 28).',
      'Strict 72-hour breach notification to the NDPC and affected patients (Section 40).',
      'Designation of a certified Data Protection Officer (DPO) (Section 32).',
      'Data Subject Rights: Right of access, rectification, portability, and erasure (Sections 34-38).'
    ]
  },
  {
    code: 'CBN Payment Framework',
    name: 'Central Bank of Nigeria Regulatory Framework for Payment Systems',
    governingBody: 'Central Bank of Nigeria (CBN)',
    keyMandates: [
      'PCI-DSS Compliance for POS terminal operators and merchants.',
      'Mandatory Multi-Factor Authentication (2FA) on financial authorization portals.',
      'Cryptographic webhook validation for instant transfers (NIBSS Instant Payments / NIP).',
      'Daily end-of-day electronic reconciliation and dispute resolution within 72 hours.',
      'Prohibition of storing raw cardholder data (PAN, CVV) on local merchant servers.'
    ]
  },
  {
    code: 'NITDA Cybersecurity Guidelines',
    name: 'NITDA Information Technology Security Guidelines',
    governingBody: 'National Information Technology Development Agency',
    keyMandates: [
      'Local data residency preference for core sovereign patient registries.',
      'Annual third-party security audits and penetration testing.',
      'Incident management reporting within 24 hours of compromise detection.'
    ]
  }
];
