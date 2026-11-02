import { Types } from 'mongoose';
import { Invoice, IInvoice, InvoiceState } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { CreditNote } from '../models/CreditNote';
import { IDocumentItem } from '../models/DocumentItem';
import { calculateLineItem, calculateDocumentTotals } from './mathService';
import { getNextNumber } from './numberingService';

export type DerivedInvoiceStatus =
  | 'draft'
  | 'sent'
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export interface InvoiceFinancials {
  invoice: IInvoice;
  total_milli: number;
  paid_milli: number;
  credited_milli: number;
  balance_milli: number;
  status: DerivedInvoiceStatus;
}

export interface CreateInvoiceInput {
  customer_id: string | Types.ObjectId;
  quote_id?: string | Types.ObjectId | null;
  date: string;
  due?: string;
  terms_days?: number;
  currency?: string;
  terms?: string;
  notes?: string;
  items: Array<{
    desc: string;
    qty: number;
    price_milli: number;
    disc_pct?: number;
    tax_rate?: number;
    tax_name?: string;
  }>;
}

const mapAndCalculateInvoiceItems = (items: CreateInvoiceInput['items']): IDocumentItem[] => {
  return items.map((item) => {
    const calc = calculateLineItem(
      item.qty,
      item.price_milli,
      item.disc_pct || 0,
      item.tax_rate || 0
    );

    return {
      desc: item.desc,
      qty: item.qty,
      price_milli: item.price_milli,
      disc_pct: item.disc_pct || 0,
      tax_rate: item.tax_rate || 0,
      tax_name: item.tax_name || '',
      gross_milli: calc.gross_milli,
      disc_milli: calc.disc_milli,
      tax_milli: calc.tax_milli,
      total_milli: calc.total_milli,
    };
  });
};

const computeDueDate = (dateStr: string, termsDays: number): string => {
  const baseDate = new Date(dateStr);
  const targetDate = isNaN(baseDate.getTime()) ? new Date() : baseDate;
  targetDate.setDate(targetDate.getDate() + termsDays);
  return targetDate.toISOString().split('T')[0];
};

/**
 * Creates a draft invoice. Number remains null until formally issued.
 */
export const createDraft = async (data: CreateInvoiceInput): Promise<IInvoice> => {
  const termsDays = data.terms_days ?? 30;
  const due = data.due || computeDueDate(data.date, termsDays);
  const items = mapAndCalculateInvoiceItems(data.items);

  const invoice = new Invoice({
    number: null,
    customer_id: data.customer_id,
    quote_id: data.quote_id || null,
    date: data.date,
    due,
    terms_days: termsDays,
    currency: data.currency || 'USD',
    terms: data.terms || '',
    notes: data.notes || '',
    state: 'draft',
    items,
  });

  return await invoice.save();
};

/**
 * Updates an existing draft invoice. Modification rejected once issued or cancelled.
 */
export const updateDraft = async (
  id: string | Types.ObjectId,
  data: Partial<CreateInvoiceInput>
): Promise<IInvoice> => {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new Error('Invoice not found');

  if (invoice.state !== 'draft') {
    throw new Error(`Cannot modify invoice in "${invoice.state}" state. Only drafts are editable.`);
  }

  if (data.items) {
    invoice.items = mapAndCalculateInvoiceItems(data.items);
  }

  if (data.customer_id) invoice.customer_id = new Types.ObjectId(data.customer_id);
  if (data.date) invoice.date = data.date;
  if (data.terms_days !== undefined) invoice.terms_days = data.terms_days;
  if (data.due) {
    invoice.due = data.due;
  } else if (data.date || data.terms_days !== undefined) {
    invoice.due = computeDueDate(invoice.date, invoice.terms_days);
  }
  if (data.currency) invoice.currency = data.currency;
  if (data.terms !== undefined) invoice.terms = data.terms;
  if (data.notes !== undefined) invoice.notes = data.notes;

  return await invoice.save();
};

/**
 * Formally issues an invoice, assigning sequential number and locking content against edits.
 */
export const issueInvoice = async (id: string | Types.ObjectId): Promise<IInvoice> => {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new Error('Invoice not found');

  if (invoice.state !== 'draft') {
    throw new Error(`Invoice has already been transitioned to "${invoice.state}"`);
  }

  const number = await getNextNumber('invoice', invoice.date);
  invoice.number = number;
  invoice.state = 'issued';
  invoice.issued_at = new Date();

  return await invoice.save();
};

/**
 * Marks invoice as sent to customer with timestamp.
 */
export const markSent = async (id: string | Types.ObjectId): Promise<IInvoice> => {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new Error('Invoice not found');

  if (invoice.state === 'cancelled') {
    throw new Error('Cannot mark cancelled invoice as sent');
  }

  invoice.sent_at = new Date();
  return await invoice.save();
};

/**
 * Formally cancels an issued invoice with mandatory reason.
 * Rejects cancellation if settled payments exist.
 */
export const cancelInvoice = async (
  id: string | Types.ObjectId,
  reason: string
): Promise<IInvoice> => {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new Error('Invoice not found');

  if (invoice.state !== 'issued') {
    throw new Error(`Only issued invoices can be cancelled. Current state: "${invoice.state}"`);
  }

  if (!reason || reason.trim() === '') {
    throw new Error('A cancellation reason is strictly required');
  }

  // Financial invariant: cannot cancel an invoice with recorded payments
  const paymentsCount = await Payment.countDocuments({ invoice_id: id });
  if (paymentsCount > 0) {
    throw new Error('Cannot cancel an invoice with recorded payments. Issue a Credit Note instead.');
  }

  invoice.state = 'cancelled';
  invoice.cancelled_at = new Date();
  invoice.cancel_reason = reason.trim();

  return await invoice.save();
};

/**
 * Deletes a draft invoice. Issued or cancelled invoices cannot be deleted.
 */
export const deleteDraft = async (id: string | Types.ObjectId): Promise<boolean> => {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new Error('Invoice not found');

  if (invoice.state !== 'draft') {
    throw new Error(`Cannot delete invoice in "${invoice.state}" state. Only drafts can be deleted.`);
  }

  await Invoice.findByIdAndDelete(id);
  return true;
};

/**
 * Computes live financial state and derived lifecycle status of an invoice.
 */
export const getInvoiceFinancials = async (
  invoiceId: string | Types.ObjectId
): Promise<InvoiceFinancials> => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  const totals = calculateDocumentTotals(invoice.items);
  const total_milli = totals.total_milli;

  const [payments, creditNotes] = await Promise.all([
    Payment.find({ invoice_id: invoiceId }),
    CreditNote.find({ invoice_id: invoiceId }),
  ]);

  const paid_milli = payments.reduce((sum, p) => sum + p.amount_milli, 0);
  const credited_milli = creditNotes.reduce((sum, c) => sum + c.amount_milli, 0);
  const balance_milli = Math.max(0, total_milli - paid_milli - credited_milli);

  const todayStr = new Date().toISOString().split('T')[0];

  let status: DerivedInvoiceStatus;
  if (invoice.state === 'draft') {
    status = 'draft';
  } else if (invoice.state === 'cancelled') {
    status = 'cancelled';
  } else if (balance_milli === 0) {
    status = 'paid';
  } else if (paid_milli > 0) {
    status = 'partial';
  } else if (invoice.due < todayStr) {
    status = 'overdue';
  } else if (invoice.sent_at) {
    status = 'sent';
  } else {
    status = 'unpaid';
  }

  return {
    invoice,
    total_milli,
    paid_milli,
    credited_milli,
    balance_milli,
    status,
  };
};

