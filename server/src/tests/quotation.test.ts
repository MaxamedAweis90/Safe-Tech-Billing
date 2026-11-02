import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Quotation } from '../models/Quotation';
import { Invoice } from '../models/Invoice';
import * as quotationService from '../services/quotationService';
import * as numberingService from '../services/numberingService';
import { Types } from 'mongoose';

describe('Quotation Lifecycle & Conversion Specifications — quotation.test.ts', () => {
  const quoteStore = new Map<string, any>();
  const invoiceStore = new Map<string, any>();
  let quoteCounter = 0;

  beforeEach(() => {
    quoteStore.clear();
    invoiceStore.clear();
    quoteCounter = 0;

    vi.spyOn(numberingService, 'getNextNumber').mockImplementation(async (kind: string) => {
      if (kind === 'quote') {
        quoteCounter++;
        return `QT-2026-${String(quoteCounter).padStart(4, '0')}`;
      }
      return '10451';
    });

    vi.spyOn(Quotation.prototype as any, 'save').mockImplementation(async function (this: any) {
      if (!this._id) this._id = new Types.ObjectId();
      quoteStore.set(this._id.toString(), this);
      return this;
    });

    vi.spyOn(Quotation as any, 'findById').mockImplementation(async (id: any) => {
      const doc = quoteStore.get(id.toString());
      return doc || null;
    });

    vi.spyOn(Quotation as any, 'findByIdAndDelete').mockImplementation(async (id: any) => {
      quoteStore.delete(id.toString());
      return true as any;
    });

    vi.spyOn(Invoice.prototype as any, 'save').mockImplementation(async function (this: any) {
      if (!this._id) this._id = new Types.ObjectId();
      invoiceStore.set(this._id.toString(), this);
      return this;
    });

    vi.spyOn(Invoice as any, 'findById').mockImplementation(async (id: any) => {
      const doc = invoiceStore.get(id.toString());
      return doc || null;
    });
  });

  it('creates a quotation in draft state with line items calculated', async () => {
    const customerId = new Types.ObjectId();
    const draft = await quotationService.createDraft({
      customer_id: customerId,
      date: '2026-11-02',
      expiry: '2026-11-16',
      items: [
        {
          desc: 'Network Switch',
          qty: 2,
          price_milli: 150000,
          disc_pct: 10,
          tax_rate: 5,
        },
      ],
    });

    expect(draft.state).toBe('draft');
    expect(draft.number).toBe('QT-2026-0001');
    expect(draft.items[0].gross_milli).toBe(300000);
    expect(draft.items[0].disc_milli).toBe(30000);
    expect(draft.items[0].tax_milli).toBe(13500);
    expect(draft.items[0].total_milli).toBe(283500);
  });

  it('progresses quotation lifecycle: draft -> sent -> accepted', async () => {
    const draft = await quotationService.createDraft({
      customer_id: new Types.ObjectId(),
      date: '2026-11-02',
      expiry: '2026-11-16',
      items: [{ desc: 'Support Contract', qty: 1, price_milli: 500000 }],
    });

    // Send
    const sent = await quotationService.markSent(draft._id);
    expect(sent.state).toBe('sent');

    // Accept
    const accepted = await quotationService.markAccepted(draft._id);
    expect(accepted.state).toBe('accepted');
  });

  it('rejects quotation with a mandatory reason', async () => {
    const draft = await quotationService.createDraft({
      customer_id: new Types.ObjectId(),
      date: '2026-11-02',
      expiry: '2026-11-16',
      items: [{ desc: 'Hardware Rack', qty: 1, price_milli: 200000 }],
    });

    await quotationService.markSent(draft._id);

    // Rejection without reason throws
    await expect(quotationService.markRejected(draft._id, '')).rejects.toThrow(
      'A rejection reason is required'
    );

    // Rejection with valid reason
    const rejected = await quotationService.markRejected(draft._id, 'Client budget constraints');
    expect(rejected.state).toBe('rejected');
    expect(rejected.reject_reason).toBe('Client budget constraints');
  });

  it('duplicates an existing quotation into a fresh draft with a new quote number', async () => {
    const draft = await quotationService.createDraft({
      customer_id: new Types.ObjectId(),
      date: '2026-11-02',
      expiry: '2026-11-16',
      items: [{ desc: 'Server Installation', qty: 1, price_milli: 400000 }],
    });

    const duplicate = await quotationService.duplicateQuote(draft._id);
    expect(duplicate.state).toBe('draft');
    expect(duplicate.number).toBe('QT-2026-0002');
    expect(duplicate._id.toString()).not.toBe(draft._id.toString());
    expect(duplicate.items[0].total_milli).toBe(draft.items[0].total_milli);
  });

  it('deletes draft quotation, but rejects deletion of non-draft or converted quotes', async () => {
    const draft = await quotationService.createDraft({
      customer_id: new Types.ObjectId(),
      date: '2026-11-02',
      expiry: '2026-11-16',
      items: [{ desc: 'Advisory Hours', qty: 5, price_milli: 100000 }],
    });

    // Can delete draft
    const deleted = await quotationService.deleteDraft(draft._id);
    expect(deleted).toBe(true);

    // Create another and accept it
    const draft2 = await quotationService.createDraft({
      customer_id: new Types.ObjectId(),
      date: '2026-11-02',
      expiry: '2026-11-16',
      items: [{ desc: 'Advisory Hours', qty: 5, price_milli: 100000 }],
    });
    await quotationService.markSent(draft2._id);
    await quotationService.markAccepted(draft2._id);

    // Cannot delete accepted quote
    await expect(quotationService.deleteDraft(draft2._id)).rejects.toThrow(
      'Only draft quotations can be deleted'
    );
  });

  it('converts accepted quotation to draft invoice with frozen line items & bidirectional link', async () => {
    const draft = await quotationService.createDraft({
      customer_id: new Types.ObjectId(),
      date: '2026-11-02',
      expiry: '2026-11-16',
      items: [
        {
          desc: '10x Cat6 Cables',
          qty: 10,
          price_milli: 5000,
          disc_pct: 0,
          tax_rate: 5,
        },
      ],
    });

    await quotationService.markSent(draft._id);
    await quotationService.markAccepted(draft._id);

    const invoice = await quotationService.convertToInvoice(draft._id);

    expect(invoice.state).toBe('draft');
    expect(invoice.number).toBeNull();
    expect(invoice.quote_id?.toString()).toBe(draft._id.toString());
    expect(invoice.items.length).toBe(1);
    expect(invoice.items[0].desc).toBe('10x Cat6 Cables');
    expect(invoice.items[0].total_milli).toBe(draft.items[0].total_milli);

    // Verify quote updated with bidirectional link
    const updatedQuote = await Quotation.findById(draft._id);
    expect(updatedQuote?.invoice_id?.toString()).toBe(invoice._id.toString());

    // Idempotent test: calling again returns the existing invoice
    const idempotentInvoice = await quotationService.convertToInvoice(draft._id);
    expect(idempotentInvoice._id.toString()).toBe(invoice._id.toString());
  });
});
