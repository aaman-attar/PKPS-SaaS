export type UserRole = 
  | 'SUPER_ADMIN' | 'SUPPORT_ADMIN'
  | 'PKPS_ADMIN' | 'SECRETARY' | 'MANAGER' | 'ACCOUNTANT'
  | 'LOAN_OFFICER' | 'CASHIER' | 'STAFF' | 'AUDITOR' | 'COMMITTEE'
  | 'FARMER';

export interface Tenant {
  id: string;
  code: string;
  name: string;
  registration_number: string;
  village: string;
  taluk: string;
  district: string;
  state: string;
  pincode: string;
  dccb_name: string;
  contact_number: string;
  email: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REJECTED';
  subscription_plan: string;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  mobile: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  tenant: Tenant | null;
  is_mfa_enabled: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Member {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  gender: string;
  dob?: string;
  mobile: string;
  email: string;
  address: string;
  village: string;
  taluk: string;
  district: string;
  state: string;
  pincode: string;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'CLOSED';
  enrollment_date: string;
  family_members?: any[];
  lands?: any[];
  assets?: any[];
}

export interface LoanProduct {
  id: string;
  code: string;
  name: string;
  interest_rate_pa: string;
  min_amount: string;
  max_amount: string;
  tenure_months: number;
  description: string;
  is_active: boolean;
}

export interface LoanApplication {
  id: string;
  application_number: string;
  member_number?: string;
  member_name?: string;
  product_name?: string;
  requested_amount: string;
  approved_amount?: string;
  purpose: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_VERIFICATION' | 'UNDER_ASSESSMENT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SANCTIONED' | 'DISBURSED' | 'CLOSED';
  applied_date: string;
}

export interface LoanAccount {
  id: string;
  account_number: string;
  member_number?: string;
  member_name?: string;
  sanctioned_amount: string;
  disbursed_amount: string;
  interest_rate_pa: string;
  outstanding_principal: string;
  outstanding_interest: string;
  overdue_amount: string;
  loan_status: 'CURRENT' | 'DUE' | 'OVERDUE' | 'PARTIALLY_PAID' | 'RECOVERY' | 'CLOSED';
  next_due_date?: string;
  repayments?: any[];
}

export interface ShareAccount {
  id: string;
  member_number?: string;
  member_name?: string;
  total_shares: number;
  share_unit_price: string;
  total_amount: string;
  transactions?: any[];
}

export interface SavingsAccount {
  id: string;
  account_number: string;
  member_number?: string;
  member_name?: string;
  current_balance: string;
  interest_rate_pa: string;
  status: string;
  opened_date: string;
  transactions?: any[];
}

export interface AccountHead {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  is_active: boolean;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  date: string;
  narration: string;
  posted_by_name?: string;
  lines: any[];
}

export interface AuditLog {
  id: string;
  username?: string;
  action: string;
  module: string;
  entity_name: string;
  entity_id: string;
  ip_address?: string;
  hash: string;
  previous_hash: string;
  timestamp: string;
}

export interface MembershipApplication {
  id: string;
  applicant?: User;
  tenant?: Tenant;
  first_name: string;
  last_name: string;
  father_name?: string;
  mobile: string;
  email?: string;
  aadhaar_number?: string;
  gender?: string;
  dob?: string;
  address?: string;
  village: string;
  taluk?: string;
  district?: string;
  state?: string;
  pincode?: string;
  land_survey_number?: string;
  land_area_acres?: string | number;
  utara_document?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  verified_by?: any;
  verified_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface DashboardMetrics {
  system_role: 'SUPER_ADMIN' | 'PKPS_STAFF' | 'FARMER';
  total_tenants?: number;
  active_tenants?: number;
  pending_tenants?: number;
  total_members?: number;
  total_loans_disbursed?: string | number;
  pkps_name?: string;
  pkps_code?: string;
  loan_outstanding?: string | number;
  overdue_amount?: string | number;
  total_savings_deposits?: string | number;
  total_share_capital?: string | number;
  pending_loan_applications?: number;
  member_number?: string;
  member_name?: string;
  shares_amount?: string | number;
  savings_balance?: string | number;
  active_loans_count?: number;
}

