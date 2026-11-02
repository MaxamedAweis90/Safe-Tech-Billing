import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { Receipt } from '../models/Receipt';
import { CreditNote } from '../models/CreditNote';
import * as invoiceService from '../services/invoiceService';
import * as paymentService from '../services/paymentService';
import * as numberingService from '../services/numberingService';
import { Types } from 'mongoose';

describe('Payment & Atomic Receipt Specifications — payment.test.ts', () => {
  const invoiceStore = new Map<string, any>();
  const paymentStore = new Map<string, any>();
  const receiptStore = new Map<string, any>();
  let receiptSeq = 0;

  beforeEach(() => {
    invoiceStore.clear();
    paymentStore.clear();
    receiptStore.clear();
    receiptSeq = 0;

    vi.spyOn(numberingService, 'getNextNumber').mockImplementation(async (kind: string) => {
      if (kind === 'receipt') {
        receiptSeq++;
        return `RC-${String(receiptSeq).padStart(5, '0')}`;
      }
      return '10451';
    });

    vi.spyOn(Invoice as any, 'findById').mockImplementation(async (id: any) => {
      return invoiceStore.get(id.toString()) || null;
    });

    vi.spyOn(CreditNote as any, 'find').mockImplementation(async () => []);

    vi.spyOn(Payment as any, 'find').mockImplementation(async (query: any) => {
      const invId = query?.invoice_id?.toString();
      return Array.from(paymentStore.values()).filter(
        (p) => !invId || p.invoice_id?.toString() === invId
      );
    });

    vi.spyOn(Payment as any, 'findOne').mockImplementation(async (query: any) => {
      const { method, reference } = query;
      return (
        Array.from(paymentStore.values()).find(
          (p) => p.method === method && p.reference === reference
        ) || null
      );
    });

    vi.spyOn(Payment.prototype as any, 'save').mockImplementation(async function (this: any) {
      if (!this._id) this._id = new Types.ObjectId();
      paymentStore.set(this._id.toString(), this);
      return this;
    });

    vi.spyOn(Receipt.prototype as any, 'save').mockImplementation(async function (this: any) {
      if (!this._id) this._id = new Types.ObjectId();
      receiptStore.set(this._id.toString(), this);
      return this;
    });
  });

  const setupIssuedInvoice = (totalMilli: number) => {
    const invId = new Types.ObjectId();
    const custId = new Types.ObjectId();
    const invoice = {
      _id: invId,
      number: '10451',
      customer_id: custId,
      date: '2026-11-02',
      due: '2026-12-02',
      currency: 'USD',
      state: 'issued',
      items: [
        {
          desc: 'Telecom Fiber Link',
          qty: 1,
          price_milli: totalMilli,
          disc_pct: 0,
          tax_rate: 0,
          gross_milli: totalMilli,
          disc_milli: 0,
          tax_milli: 0,
          total_milli: totalMilli,
        },
      ],
    };
    invoiceStore.set(invId.toString(), invoice);
    return invoice;
  };

  it('records payment and atomically issues linked receipt with snapshot metrics', async () => {
    const invoice = setupIssuedInvoice(1000000); // $1000.00

    const result = await paymentService.recordPayment(invoice._id, {
      amount_milli: 400000, // $400.00
      method: 'bank',
      reference: 'SSB-TRX-101',
      date: '2026-11-02',
    });

    expect(result.payment).toBeDefined();
    expect(result.receipt).toBeDefined();
    expect(result.payment.amount_milli).toBe(400000);
    expect(result.receipt.number).toBe('RC-00001');
    expect(result.receipt.balance_after_milli).toBe(600000); // Remaining $600.00
    expect(result.receipt.prev_paid_milli).toBe(0);
    expect(result.receipt.invoice_total_milli).toBe(1000000);
    expect(result.payment.receipt_id.toString()).toBe(result.receipt._id.toString());
  });

  it('rejects overpayments that exceed remaining invoice balance', async () => {
    const invoice = setupIssuedInvoice(500000); // $500.00

    // Attempting $500.01 (500010 milli)
    await expect(
      paymentService.recordPayment(invoice._id, {
        amount_milli: 500010,
        method: 'cash',
        date: '2026-11-02',
      })
    ).rejects.toThrow('exceeds remaining invoice balance');
  });

  it('rejects duplicate transaction reference for non-cash payment methods', async () => {
    const invoice = setupIssuedInvoice(1000000);

    // First payment with reference
    await paymentService.recordPayment(invoice._id, {
      amount_milli: 200000,
      method: 'mobile',
      reference: 'EVC-998877',
      date: '2026-11-02',
    });

    // Duplicate reference with same method throws
    await expect(
      paymentService.recordPayment(invoice._id, {
        amount_milli: 200000,
        method: 'mobile',
        reference: 'EVC-998877',
        date: '2026-11-02',
      })
    ).rejects.toThrow('Duplicate transaction reference "EVC-998877" detected');
  });

  it('accurately recalculates remaining balance and derived status across multiple settlements', async () => {
    const invoice = setupIssuedInvoice(1000000); // $1000.00

    // Payment 1: $300.00
    await paymentService.recordPayment(invoice._id, {
      amount_milli: 300000,
      method: 'cash',
      date: '2026-11-02',
    });

    let fin = await invoiceService.getInvoiceFinancials(invoice._id);
    expect(fin.paid_milli).toBe(300000);
    expect(fin.balance_milli).toBe(700000);
    expect(fin.status).toBe('partial');

    // Payment 2: $700.00 (settles entire invoice)
    const result2 = await paymentService.recordPayment(invoice._id, {
      amount_milli: 700000,
      method: 'bank',
      reference: 'WIRE-FINAL',
      date: '2026-11-03',
    });

    expect(result2.receipt.prev_paid_milli).toBe(300000);
    expect(result2.receipt.balance_after_milli).toBe(0);

    fin = await invoiceService.getInvoiceFinancials(invoice._id);
    expect(fin.paid_milli).toBe(1000000);
    expect(fin.balance_milli).toBe(0);
    expect(fin.status).toBe('paid');
  });
});
