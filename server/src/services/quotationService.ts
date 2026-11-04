import { Types } from 'mongoose';
import { Quotation, IQuotation, QuotationState } from '../models/Quotation';
import { Invoice, IInvoice } from '../models/Invoice';
import { Customer } from '../models/Customer';
import { IDocumentItem } from '../models/DocumentItem';
import { calculateLineItem } from './mathService';
import { getNextNumber } from './numberingService';

export interface CreateQuotationInput {
  customer_id: string | Types.ObjectId;
  date: string;
  expiry: string;
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

const mapAndCalculateItems = (items: CreateQuotationInput['items']): IDocumentItem[] => {
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

/**
 * Creates a new draft quotation with auto-generated sequential quote number.
 */
export const createDraft = async (data: CreateQuotationInput): Promise<IQuotation> => {
  const number = await getNextNumber('quote', data.date);
  const items = mapAndCalculateItems(data.items);

  let custId = data.customer_id;
  if (!Types.ObjectId.isValid(custId)) {
    const codeNum = parseInt(String(custId).replace(/\D/g, ''), 10);
    const existing = await Customer.findOne(
      codeNum ? { $or: [{ code: codeNum }, { name: 'Dr. SUMAIT Hospital - SIMAD University' }] } : { name: 'Dr. SUMAIT Hospital - SIMAD University' }
    );
    if (existing) {
      custId = existing._id;
    } else {
      const newCust = await Customer.create({
        code: codeNum || 1001,
        name: 'Dr. SUMAIT Hospital - SIMAD University',
        phone: '252 613 939 999',
        address: 'Wadadda Albarako, Hodan\nMogadishu, Banadir 252',
        since: '2024-03-01',
      });
      custId = newCust._id;
    }
  }

  const quotation = new Quotation({
    number,
    customer_id: custId,
    date: data.date,
    expiry: data.expiry,
    currency: data.currency || 'USD',
    terms: data.terms || '',
    notes: data.notes || '',
    state: 'draft',
    items,
  });

  return await quotation.save();
};

/**
 * Updates an existing draft quotation. Modifications are rejected if not in draft state.
 */
export const updateDraft = async (
  id: string | Types.ObjectId,
  data: Partial<CreateQuotationInput>
): Promise<IQuotation> => {
  const quotation = await Quotation.findById(id);
  if (!quotation) {
    throw new Error('Quotation not found');
  }

  if (quotation.state !== 'draft') {
    throw new Error(`Cannot modify quotation in "${quotation.state}" state. Only drafts are editable.`);
  }

  if (data.items) {
    quotation.items = mapAndCalculateItems(data.items);
  }

  if (data.customer_id) quotation.customer_id = new Types.ObjectId(data.customer_id);
  if (data.date) quotation.date = data.date;
  if (data.expiry) quotation.expiry = data.expiry;
  if (data.currency) quotation.currency = data.currency;
  if (data.terms !== undefined) quotation.terms = data.terms;
  if (data.notes !== undefined) quotation.notes = data.notes;

  return await quotation.save();
};

/**
 * Transitions quotation state from draft to sent.
 */
export const markSent = async (id: string | Types.ObjectId): Promise<IQuotation> => {
  const quotation = await Quotation.findById(id);
  if (!quotation) throw new Error('Quotation not found');

  if (quotation.state !== 'draft') {
    throw new Error(`Cannot transition quotation from "${quotation.state}" to "sent"`);
  }

  quotation.state = 'sent';
  return await quotation.save();
};

/**
 * Transitions quotation state from sent to accepted.
 */
export const markAccepted = async (id: string | Types.ObjectId): Promise<IQuotation> => {
  const quotation = await Quotation.findById(id);
  if (!quotation) throw new Error('Quotation not found');

  if (quotation.state !== 'sent' && quotation.state !== 'draft') {
    throw new Error(`Cannot mark quotation as accepted from "${quotation.state}" state`);
  }

  quotation.state = 'accepted';
  return await quotation.save();
};

/**
 * Transitions quotation state to rejected with a mandatory reason.
 */
export const markRejected = async (
  id: string | Types.ObjectId,
  reason: string
): Promise<IQuotation> => {
  const quotation = await Quotation.findById(id);
  if (!quotation) throw new Error('Quotation not found');

  if (!reason || reason.trim() === '') {
    throw new Error('A rejection reason is required');
  }

  quotation.state = 'rejected';
  quotation.reject_reason = reason.trim();
  return await quotation.save();
};

/**
 * Duplicates an existing quotation into a new draft.
 */
export const duplicateQuote = async (id: string | Types.ObjectId): Promise<IQuotation> => {
  const source = await Quotation.findById(id);
  if (!source) throw new Error('Quotation not found');

  const today = new Date().toISOString().split('T')[0];
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 14);
  const expiry = expiryDate.toISOString().split('T')[0];

  const number = await getNextNumber('quote', today);

  const duplicate = new Quotation({
    number,
    customer_id: source.customer_id,
    date: today,
    expiry,
    currency: source.currency,
    terms: source.terms,
    notes: source.notes,
    state: 'draft',
    items: source.items.map((item) => ({ ...item })),
  });

  return await duplicate.save();
};

/**
 * Deletes a draft quotation. Non-drafts or already converted quotations cannot be deleted.
 */
export const deleteDraft = async (id: string | Types.ObjectId): Promise<boolean> => {
  const quotation = await Quotation.findById(id);
  if (!quotation) throw new Error('Quotation not found');

  if (quotation.state !== 'draft') {
    throw new Error('Only draft quotations can be deleted');
  }

  if (quotation.invoice_id) {
    throw new Error('Cannot delete quotation linked to an invoice');
  }

  await Quotation.findByIdAndDelete(id);
  return true;
};

/**
 * Idempotently converts an accepted quotation to a draft invoice with line items copied,
 * establishing a bidirectional link between quotation and invoice.
 */
export const convertToInvoice = async (quoteId: string | Types.ObjectId): Promise<IInvoice> => {
  const quotation = await Quotation.findById(quoteId);
  if (!quotation) throw new Error('Quotation not found');

  // Idempotency: Return existing invoice if already converted
  if (quotation.invoice_id) {
    const existingInvoice = await Invoice.findById(quotation.invoice_id);
    if (existingInvoice) {
      return existingInvoice;
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const termsDays = 30;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + termsDays);
  const due = dueDate.toISOString().split('T')[0];

  // Create draft invoice with frozen line item snapshots from the quote
  const invoice = new Invoice({
    number: null,
    customer_id: quotation.customer_id,
    quote_id: quotation._id,
    date: today,
    due,
    terms_days: termsDays,
    currency: quotation.currency,
    terms: quotation.terms,
    notes: quotation.notes,
    state: 'draft',
    items: quotation.items.map((it) => ({
      desc: it.desc,
      qty: it.qty,
      price_milli: it.price_milli,
      disc_pct: it.disc_pct,
      tax_rate: it.tax_rate,
      tax_name: it.tax_name,
      gross_milli: it.gross_milli,
      disc_milli: it.disc_milli,
      tax_milli: it.tax_milli,
      total_milli: it.total_milli,
    })),
  });

  const savedInvoice = await invoice.save();

  // Bi-directional link
  quotation.invoice_id = savedInvoice._id as Types.ObjectId;
  quotation.state = 'accepted';
  await quotation.save();

  return savedInvoice;
};

