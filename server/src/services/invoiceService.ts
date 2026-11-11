import { Types } from 'mongoose';
import { Invoice, IInvoice, InvoiceState } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { CreditNote } from '../models/CreditNote';
import { Customer } from '../models/Customer';
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
  companyId?: string | Types.ObjectId | null;
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
  const filtered = (items || []).filter(
    (item) => item && (item.desc?.trim() || Number(item.price_milli) > 0)
  );

  const targetList = filtered.length > 0 ? filtered : [{ desc: 'Item', qty: 1, price_milli: 0 }];

  return targetList.map((item) => {
    const qty = Math.max(0.001, Number(item.qty) || 1);
    const priceMilli = Math.round(Number(item.price_milli) || 0);
    const discPct = Math.min(100, Math.max(0, Number(item.disc_pct) || 0));
    const taxRate = Math.min(100, Math.max(0, Number(item.tax_rate) || 0));

    const calc = calculateLineItem(qty, priceMilli, discPct, taxRate);

    return {
      desc: item.desc ? item.desc.trim() : 'Item',
      qty,
      price_milli: priceMilli,
      disc_pct: discPct,
      tax_rate: taxRate,
      tax_name: item.tax_name ? item.tax_name.trim() : '',
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

const ALLOWED_TERMS_DAYS = [0, 7, 15, 30, 45, 60];

/**
 * Creates a draft invoice. Number remains null until formally issued.
 */
export const createDraft = async (data: CreateInvoiceInput): Promise<IInvoice> => {
  const rawTermsDays = Number(data.terms_days);
  const termsDays = ALLOWED_TERMS_DAYS.includes(rawTermsDays) ? rawTermsDays : 30;
  const due = data.due || computeDueDate(data.date, termsDays);
  const items = mapAndCalculateInvoiceItems(data.items);

  let custId = data.customer_id;
  const companyScope: Record<string, unknown> = data.companyId
    ? { companyId: data.companyId }
    : { companyId: null };

  if (!Types.ObjectId.isValid(custId)) {
    const codeNum = parseInt(String(custId).replace(/\D/g, ''), 10);
    const existing = await Customer.findOne(
      codeNum ? { ...companyScope, code: codeNum } : companyScope
    );
    if (existing) {
      custId = existing._id;
    } else {
      const highest = await Customer.findOne(companyScope).sort({ code: -1 });
      const nextCode = highest ? highest.code + 1 : 1001;
      const newCust = await Customer.create({
        ...companyScope,
        code: nextCode,
        name: 'Default Customer',
        phone: '+252 61 000 0000',
        address: 'Mogadishu, Somalia',
        since: new Date().toISOString().split('T')[0],
      });
      custId = newCust._id;
    }
  }

  const invoice = new Invoice({
    companyId: data.companyId || null,
    number: null,
    customer_id: custId,
    quote_id: data.quote_id && Types.ObjectId.isValid(data.quote_id) ? data.quote_id : null,
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

  if (data.customer_id) {
    if (Types.ObjectId.isValid(data.customer_id)) {
      invoice.customer_id = new Types.ObjectId(data.customer_id);
    } else {
      const companyScope: Record<string, unknown> = invoice.companyId
        ? { companyId: invoice.companyId }
        : { companyId: null };
      const codeNum = parseInt(String(data.customer_id).replace(/\D/g, ''), 10);
      if (codeNum) {
        const existing = await Customer.findOne({ ...companyScope, code: codeNum });
        if (existing) invoice.customer_id = existing._id;
      }
    }
  }
  if (data.date) invoice.date = data.date;
  if (data.terms_days !== undefined) {
    const raw = Number(data.terms_days);
    invoice.terms_days = ALLOWED_TERMS_DAYS.includes(raw) ? raw : invoice.terms_days || 30;
  }
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

  const number = await getNextNumber('invoice', invoice.date, (invoice as any).companyId);
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
export const deleteDraft = async (
  id: string | Types.ObjectId,
  userId?: string | Types.ObjectId | null,
  tenantCompanyId?: string | Types.ObjectId | null
): Promise<boolean> => {
  const invoice = await Invoice.findById(id);
  if (!invoice || invoice.isDeleted) throw new Error('Invoice not found');

  if (tenantCompanyId !== undefined) {
    const expectedCompanyId = tenantCompanyId ? String(tenantCompanyId) : null;
    const actualCompanyId = invoice.companyId ? String(invoice.companyId) : null;
    if (expectedCompanyId !== actualCompanyId) {
      throw new Error('Invoice not found');
    }
  }

  if (invoice.state !== 'draft') {
    throw new Error(`Cannot delete invoice in "${invoice.state}" state. Only drafts can be deleted.`);
  }

  invoice.isDeleted = true;
  invoice.deletedAt = new Date();
  invoice.deletedBy = userId && Types.ObjectId.isValid(String(userId)) ? new Types.ObjectId(userId) : null;
  await invoice.save();
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
    Payment.find({ invoice_id: invoiceId, isDeleted: { $ne: true } }),
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

