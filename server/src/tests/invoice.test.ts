import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { CreditNote } from '../models/CreditNote';
import * as invoiceService from '../services/invoiceService';
import * as paymentService from '../services/paymentService';
import * as numberingService from '../services/numberingService';
import { Types } from 'mongoose';

describe('Invoice Lifecycle & Credit Note Specifications — invoice.test.ts', () => {
  const invoiceStore = new Map<string, any>();
  const paymentStore = new Map<string, any>();
  const creditStore = new Map<string, any>();
  let invoiceCounter = 10450;
  let creditCounter = 0;

  beforeEach(() => {
    invoiceStore.clear();
    paymentStore.clear();
    creditStore.clear();
    invoiceCounter = 10450;
    creditCounter = 0;

    vi.spyOn(numberingService, 'getNextNumber').mockImplementation(async (kind: string) => {
      if (kind === 'invoice') {
        invoiceCounter++;
        return String(invoiceCounter);
      }
      if (kind === 'credit') {
        creditCounter++;
        return `CN-${String(creditCounter).padStart(4, '0')}`;
      }
      return 'RC-00001';
    });

    vi.spyOn(Invoice.prototype as any, 'save').mockImplementation(async function (this: any) {
      if (!this._id) this._id = new Types.ObjectId();
      invoiceStore.set(this._id.toString(), this);
      return this;
    });

    vi.spyOn(Invoice as any, 'findById').mockImplementation(async (id: any) => {
      return invoiceStore.get(id.toString()) || null;
    });

    vi.spyOn(Invoice as any, 'findByIdAndDelete').mockImplementation(async (id: any) => {
      invoiceStore.delete(id.toString());
      return true as any;
    });

    vi.spyOn(Payment as any, 'find').mockImplementation(async (query: any) => {
      const invId = query?.invoice_id?.toString();
      return Array.from(paymentStore.values()).filter(
        (p) => p.invoice_id?.toString() === invId
      );
    });

    vi.spyOn(Payment as any, 'countDocuments').mockImplementation(async (query: any) => {
      const invId = query?.invoice_id?.toString();
      return Array.from(paymentStore.values()).filter(
        (p) => p.invoice_id?.toString() === invId
      ).length;
    });

    vi.spyOn(CreditNote.prototype as any, 'save').mockImplementation(async function (this: any) {
      if (!this._id) this._id = new Types.ObjectId();
      creditStore.set(this._id.toString(), this);
      return this;
    });

    vi.spyOn(CreditNote as any, 'find').mockImplementation(async (query: any) => {
      const invId = query?.invoice_id?.toString();
      return Array.from(creditStore.values()).filter(
        (c) => c.invoice_id?.toString() === invId
      );
    });
  });

  it('creates draft invoice with null number and computed totals', async () => {
    const draft = await invoiceService.createDraft({
      customer_id: new Types.ObjectId(),
      date: '2026-11-02',
      terms_days: 30,
      items: [
        {
          desc: 'IT Infrastructure Audit',
          qty: 1,
          price_milli: 1500000, // $1500.00
          disc_pct: 0,
          tax_rate: 0,
        },
      ],
    });

    expect(draft.state).toBe('draft');
    expect(draft.number).toBeNull();
    expect(draft.due).toBe('2026-12-02');
    expect(draft.items[0].total_milli).toBe(1500000);
  });

  it('updates draft invoice but rejects updates once issued', async () => {
    const draft = await invoiceService.createDraft({
      customer_id: new Types.ObjectId(),
      date: '2026-11-02',
      items: [{ desc: 'Item A', qty: 1, price_milli: 100000 }],
    });

    // Update draft succeeds
    const updated = await invoiceService.updateDraft(draft._id, {
      notes: 'Updated terms applicable',
    });
    expect(updated.notes).toBe('Updated terms applicable');

    // Issue invoice
    await invoiceService.issueInvoice(draft._id);

    // Update issued invoice must throw
    await expect(
      invoiceService.updateDraft(draft._id, { notes: 'Should fail' })
    ).rejects.toThrow('Only drafts are editable');
  });

  it('issues invoice: assigns sequential counter number, locks content, and timestamps issued_at', async () => {
    const draft = await invoiceService.createDraft({
      customer_id: new Types.ObjectId(),
      date: '2026-11-02',
      items: [{ desc: 'Cisco Router', qty: 1, price_milli: 850000 }],
    });

    const issued = await invoiceService.issueInvoice(draft._id);
    expect(issued.state).toBe('issued');
    expect(issued.number).toBe('10451');
    expect(issued.issued_at).toBeDefined();

    // Re-issuing must throw
    await expect(invoiceService.issueInvoice(draft._id)).rejects.toThrow(
      'Invoice has already been transitioned to "issued"'
    );
  });

  it('cancels issued invoice with mandatory reason and forbids cancellation if payments exist', async () => {
    const draft = await invoiceService.createDraft({
      customer_id: new Types.ObjectId(),
      date: '2026-11-02',
      items: [{ desc: 'Service Fee', qty: 1, price_milli: 300000 }],
    });
    const issued = await invoiceService.issueInvoice(draft._id);

    // Missing reason throws
    await expect(invoiceService.cancelInvoice(issued._id, '')).rejects.toThrow(
      'A cancellation reason is strictly required'
    );

    // Simulate payment recorded
    paymentStore.set('p1', {
      _id: new Types.ObjectId(),
      invoice_id: issued._id,
      amount_milli: 100000,
    });

    // Cancellation with recorded payment throws
    await expect(
      invoiceService.cancelInvoice(issued._id, 'Client asked for cancellation')
    ).rejects.toThrow('Cannot cancel an invoice with recorded payments');

    // Remove payment to test valid cancellation
    paymentStore.clear();
    const cancelled = await invoiceService.cancelInvoice(
      issued._id,
      'Client duplicate order request'
    );
    expect(cancelled.state).toBe('cancelled');
    expect(cancelled.cancel_reason).toBe('Client duplicate order request');
    expect(cancelled.cancelled_at).toBeDefined();
  });

  it('issues credit note and asserts credit amount cannot exceed remaining balance', async () => {
    const draft = await invoiceService.createDraft({
      customer_id: new Types.ObjectId(),
      date: '2026-11-02',
      items: [{ desc: 'Software License', qty: 1, price_milli: 500000 }],
    });
    const issued = await invoiceService.issueInvoice(draft._id);

    // Attempting credit note exceeding balance ($500.00 = 500000 milli)
    await expect(
      paymentService.issueCreditNote(issued._id, {
        amount_milli: 600000, // Exceeds balance
        reason: 'Goodwill discount',
        date: '2026-11-03',
      })
    ).rejects.toThrow('cannot exceed remaining invoice balance');

    // Valid credit note within balance
    const creditNote = await paymentService.issueCreditNote(issued._id, {
      amount_milli: 200000, // $200.00 credit
      reason: 'Billing price adjustment',
      date: '2026-11-03',
    });

    expect(creditNote.number).toBe('CN-0001');
    expect(creditNote.amount_milli).toBe(200000);
    expect(creditNote.reason).toBe('Billing price adjustment');

    // Recheck financials
    const fin = await invoiceService.getInvoiceFinancials(issued._id);
    expect(fin.credited_milli).toBe(200000);
    expect(fin.balance_milli).toBe(300000);
  });
});
