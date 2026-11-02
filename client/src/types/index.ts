/**
 * Safe Tech Billing — Client Domain Types
 * Matches server database schemas and calculation specifications.
 */

export type UserRole = 'admin' | 'accountant' | 'sales' | 'viewer';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'cheque';

export interface CustomerSnapshot {
  name: string;
  attn?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Customer {
  _id: string;
  code: number;
  name: string;
  attn?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed / aggregated
  balance_milli?: number;
  invoice_count?: number;
}

export interface LineItem {
  desc: string;
  qty: number;
  price_milli: number;
  disc_pct: number;
  tax_rate: number;
  tax_name?: string;
  gross_milli: number;
  disc_milli: number;
  tax_milli: number;
  total_milli: number;
}

export interface Quotation {
  _id: string;
  number: string;
  customerId: string | Customer;
  customer_snapshot: CustomerSnapshot;
  date: string;
  expiry_date: string;
  status: QuotationStatus;
  currency: string;
  items: LineItem[];
  subtotal_milli: number;
  disc_total_milli: number;
  tax_total_milli: number;
  total_milli: number;
  notes?: string;
  converted_to_invoice_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  _id: string;
  number: string;
  quotationId?: string;
  customerId: string | Customer;
  customer_snapshot: CustomerSnapshot;
  date: string;
  due_date: string;
  status: InvoiceStatus;
  currency: string;
  items: LineItem[];
  subtotal_milli: number;
  disc_total_milli: number;
  tax_total_milli: number;
  total_milli: number;
  paid_milli: number;
  balance_milli: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  _id: string;
  receipt_number: string;
  invoiceId: string | Invoice;
  customerId: string | Customer;
  amount_milli: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  _id: string;
  receipt_number: string;
  paymentId: string | Payment;
  invoiceId: string | Invoice;
  customerId: string | Customer;
  amount_milli: number;
  date: string;
  created_at: string;
}

export interface CreditNote {
  _id: string;
  credit_note_number: string;
  invoiceId: string | Invoice;
  customerId: string | Customer;
  amount_milli: number;
  reason: string;
  date: string;
  created_by?: string;
  created_at: string;
}

export interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
  swift_code?: string;
  branch?: string;
}

export interface MobileMoneyDetails {
  provider: string;
  account_number: string;
  account_name: string;
}

export interface CompanySettings {
  name: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_id?: string;
  bank_details?: BankDetails;
  mobile_money?: MobileMoneyDetails;
  signatory?: string;
  logo?: string;
  stamp?: string;
  signature?: string;
  default_currency: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  user_id?: string;
  user_name?: string;
  role?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface DashboardStats {
  invoiced_milli: number;
  received_milli: number;
  outstanding_milli: number;
  overdue_milli: number;
  collection_rate: number;
  open_quotes_count: number;
  overdue_invoices_count: number;
  monthly_trend: {
    month: string;
    invoiced: number;
    received: number;
  }[];
  recent_activity: {
    date: string;
    kind: 'Invoice' | 'Payment' | 'Quotation';
    ref: string;
    customer: string;
    amount_milli: number;
    currency: string;
    status: string;
    link: string;
  }[];
}

export type NavTab =
  | 'dashboard'
  | 'quotations'
  | 'invoices'
  | 'receipts'
  | 'customers'
  | 'reports'
  | 'settings'
  | 'audit'
  | 'blueprint';

