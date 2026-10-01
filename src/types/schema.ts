export type TableCategory = 
  | 'clinical'
  | 'staff'
  | 'billing'
  | 'payments'
  | 'hmo';

export interface ColumnDefinition {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  foreignKeyRef?: {
    table: string;
    column: string;
    onDelete?: string;
  };
  isNullable: boolean;
  defaultValue?: string;
  isUnique?: boolean;
  checkConstraint?: string;
  description: string;
}

export interface TableConstraint {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'CHECK' | 'UNIQUE';
  definition: string;
  description: string;
}

export interface TableIndex {
  name: string;
  columns: string[];
  isUnique?: boolean;
  type?: 'B-tree' | 'Partial' | 'Composite';
  condition?: string;
  rationale: string;
}

export interface SchemaTable {
  id: string;
  tableName: string;
  displayName: string;
  category: TableCategory;
  description: string;
  normalizationLevel: string;
  columns: ColumnDefinition[];
  constraints: TableConstraint[];
  indexes: TableIndex[];
  triggers?: {
    name: string;
    timing: 'BEFORE' | 'AFTER';
    event: 'INSERT' | 'UPDATE' | 'DELETE';
    purpose: string;
  }[];
  coordinates: { x: number; y: number };
}

export interface SchemaRelation {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one';
  onDelete: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'NO ACTION';
  label: string;
}

export interface BuiltInQuery {
  id: string;
  title: string;
  category: 'Financial' | 'HMO & Claims' | 'Clinical' | 'Audit & Compliance';
  description: string;
  sql: string;
  explanation: string;
  tablesInvolved: string[];
}

export interface ClaimRecord {
  claim_id: string;
  claim_reference_number: string;
  invoice_id: string;
  patient_id: string;
  hmo_provider_id: string;
  policy_number: string;
  authorization_code: string | null;
  claimed_amount: number;
  approved_amount: number;
  co_pay_amount: number;
  amount_settled: number;
  claim_status: 'draft' | 'submitted' | 'under_review' | 'query_issued' | 'approved' | 'partially_approved' | 'rejected' | 'disputed' | 'settled_paid';
  submission_date: string | null;
  adjudication_date: string | null;
  settlement_date: string | null;
  settlement_batch_id: string | null;
  settlement_payment_id: string | null;
  rejection_reason: string | null;
  adjudicator_remarks: string | null;
  created_by_staff_id: string;
  updated_at?: string;
}

