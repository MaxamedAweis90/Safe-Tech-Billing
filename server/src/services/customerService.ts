import { Types } from 'mongoose';
import { Customer, ICustomer } from '../models/Customer';
import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { CreditNote } from '../models/CreditNote';
import { Quotation } from '../models/Quotation';
import { Receipt } from '../models/Receipt';
import { calculateDocumentTotals } from './mathService';

export interface CustomerInput {
  code?: number;
  name: string;
  attn?: string;
  phone: string;
  email?: string;
  tax_id?: string;
  address?: string;
  since?: string;
}

export interface CustomerTransaction {
  date: string;
  type: 'Quotation' | 'Invoice' | 'Payment' | 'Credit note' | 'Receipt';
  number: string;
  amount_milli: number;
  status: string;
  currency?: string;
  details?: string;
  ref_id?: string;
}

export interface CustomerStatementSummary {
  customer: ICustomer;
  total_invoiced_milli: number;
  total_paid_milli: number;
  total_credited_milli: number;
  outstanding_balance_milli: number;
  overdue_invoices_count: number;
  invoices_count: number;
  invoiced_milli: number;
  paid_milli: number;
  balance_milli: number;
  is_overdue: boolean;
  transactions: CustomerTransaction[];
}

/**
 * Creates a new customer ensuring code, name, and phone uniqueness.
 */
export const createCustomer = async (data: CustomerInput): Promise<ICustomer> => {
  if (!data.code) {
    const highestCustomer = await Customer.findOne().sort({ code: -1 });
    data.code = highestCustomer ? highestCustomer.code + 1 : 1001;
  }

  const existingCode = await Customer.findOne({ code: data.code });
  if (existingCode) {
    throw new Error(`Customer with code ${data.code} already exists`);
  }

  const existingNameOrPhone = await Customer.findOne({
    $or: [{ name: data.name }, { phone: data.phone }],
  });
  if (existingNameOrPhone) {
    if (existingNameOrPhone.name.toLowerCase() === data.name.toLowerCase()) {
      throw new Error(`Customer with name "${data.name}" already exists`);
    }
    throw new Error(`Customer with phone number "${data.phone}" already exists`);
  }

  const customer = new Customer({
    ...data,
    since: data.since || new Date().toISOString().split('T')[0],
  });

  return await customer.save();
};

/**
 * Retrieves a customer by ObjectId.
 */
export const getCustomerById = async (id: string | Types.ObjectId): Promise<ICustomer | null> => {
  return await Customer.findById(id);
};

/**
 * Retrieves a customer by unique code.
 */
export const getCustomerByCode = async (code: number): Promise<ICustomer | null> => {
  return await Customer.findOne({ code });
};

/**
 * Updates customer details while validating uniqueness constraints.
 */
export const updateCustomer = async (
  id: string | Types.ObjectId,
  data: Partial<CustomerInput>
): Promise<ICustomer | null> => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new Error('Customer not found');
  }

  if (data.code !== undefined && data.code !== customer.code) {
    const existingCode = await Customer.findOne({ code: data.code, _id: { $ne: id } });
    if (existingCode) {
      throw new Error(`Customer with code ${data.code} already exists`);
    }
  }

  if (data.name && data.name !== customer.name) {
    const existingName = await Customer.findOne({ name: data.name, _id: { $ne: id } });
    if (existingName) {
      throw new Error(`Customer with name "${data.name}" already exists`);
    }
  }

  if (data.phone && data.phone !== customer.phone) {
    const existingPhone = await Customer.findOne({ phone: data.phone, _id: { $ne: id } });
    if (existingPhone) {
      throw new Error(`Customer with phone "${data.phone}" already exists`);
    }
  }

  Object.assign(customer, data);
  return await customer.save();
};

/**
 * Deletes customer if no linked financial documents exist.
 */
export const deleteCustomer = async (id: string | Types.ObjectId): Promise<boolean> => {
  const hasInvoices = await Invoice.exists({ customer_id: id });
  if (hasInvoices) {
    throw new Error('Cannot delete customer with existing invoices');
  }

  const hasQuotes = await Quotation.exists({ customer_id: id });
  if (hasQuotes) {
    throw new Error('Cannot delete customer with existing quotations');
  }

  const result = await Customer.findByIdAndDelete(id);
  return result !== null;
};

/**
 * Lists customers with optional search and pagination.
 */
export const listCustomers = async (
  filter: Record<string, unknown> = {},
  options: { sort?: Record<string, 1 | -1>; limit?: number; skip?: number } = {}
): Promise<{ customers: ICustomer[]; total: number }> => {
  const sort = options.sort || { name: 1 };
  const limit = options.limit || 50;
  const skip = options.skip || 0;

  const [customers, total] = await Promise.all([
    Customer.find(filter).sort(sort).skip(skip).limit(limit),
    Customer.countDocuments(filter),
  ]);

  return { customers, total };
};

/**
 * Computes live financial statement metrics for a customer.
 */
export const getCustomerStatement = async (
  customerId: string | Types.ObjectId
): Promise<CustomerStatementSummary> => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new Error('Customer not found');
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const invoices = await Invoice.find({
    customer_id: customer._id,
    state: { $ne: 'cancelled' },
  });

  const invoiceIds = invoices.map((inv) => inv._id);

  const [payments, creditNotes, quotations, receipts] = await Promise.all([
    Payment.find({ invoice_id: { $in: invoiceIds } }),
    CreditNote.find({ invoice_id: { $in: invoiceIds } }),
    Quotation.find({ customer_id: customer._id }).sort({ date: -1 }),
    Receipt.find({ customer_id: customer._id }).sort({ date: -1 }),
  ]);

  let total_invoiced_milli = 0;
  let overdue_invoices_count = 0;

  for (const inv of invoices) {
    const invTotals = calculateDocumentTotals(inv.items);
    total_invoiced_milli += invTotals.total_milli;

    const invPayments = payments
      .filter((p) => p.invoice_id.toString() === inv._id.toString())
      .reduce((sum, p) => sum + p.amount_milli, 0);

    const invCredits = creditNotes
      .filter((c) => c.invoice_id.toString() === inv._id.toString())
      .reduce((sum, c) => sum + c.amount_milli, 0);

    const remaining = Math.max(0, invTotals.total_milli - invPayments - invCredits);

    if (remaining > 0 && inv.due < todayStr && inv.state === 'issued') {
      overdue_invoices_count += 1;
    }
  }

  const total_paid_milli = payments.reduce((sum, p) => sum + p.amount_milli, 0);
  const total_credited_milli = creditNotes.reduce((sum, c) => sum + c.amount_milli, 0);
  const outstanding_balance_milli = Math.max(0, total_invoiced_milli - total_paid_milli - total_credited_milli);

  // Assemble transactions stream across all 4 document types
  const transactions: CustomerTransaction[] = [
    ...quotations.map((q) => ({
      date: q.date,
      type: 'Quotation' as const,
      number: q.number || 'Draft',
      amount_milli: calculateDocumentTotals(q.items).total_milli,
      status: q.state,
      currency: q.currency || 'USD',
      ref_id: q._id.toString(),
    })),
    ...invoices.filter((i) => i.state !== 'draft').map((i) => ({
      date: i.date,
      type: 'Invoice' as const,
      number: i.number || 'Draft',
      amount_milli: calculateDocumentTotals(i.items).total_milli,
      status: i.state,
      currency: i.currency || 'USD',
      ref_id: i._id.toString(),
    })),
    ...receipts.map((r) => ({
      date: r.date,
      type: 'Receipt' as const,
      number: r.number,
      amount_milli: r.amount_milli,
      status: r.method,
      currency: 'USD',
      ref_id: r._id.toString(),
    })),
    ...creditNotes.map((cn) => ({
      date: cn.date,
      type: 'Credit note' as const,
      number: cn.number,
      amount_milli: cn.amount_milli,
      status: cn.reason,
      currency: 'USD',
      ref_id: cn.invoice_id.toString(),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return {
    customer,
    total_invoiced_milli,
    total_paid_milli,
    total_credited_milli,
    outstanding_balance_milli,
    overdue_invoices_count,
    invoices_count: invoices.length,
    invoiced_milli: total_invoiced_milli,
    paid_milli: total_paid_milli,
    balance_milli: outstanding_balance_milli,
    is_overdue: overdue_invoices_count > 0,
    transactions,
  };
};

