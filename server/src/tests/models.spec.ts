import { describe, it, expect } from 'vitest';
import {
  DocumentItemSchema,
  Company,
  User,
  Customer,
  NumberSequence,
  Quotation,
  Invoice,
  Payment,
  Receipt,
  CreditNote,
  Currency,
  TaxRate,
  AuditLog,
} from '../models';

describe('Domain Models Schema Assertions', () => {
  it('should validate DocumentItem integer milli-units constraint', () => {
    const item = {
      desc: 'IT Equipment',
      qty: 2,
      price_milli: 150000,
      disc_pct: 0,
      tax_rate: 5,
      tax_name: 'Sales Tax 5%',
      gross_milli: 300000,
      disc_milli: 0,
      tax_milli: 15000,
      total_milli: 315000,
    };

    // Instantiate model with line item schema
    const quotation = new Quotation({
      number: 'QT-2026-0001',
      customer_id: '507f191e810c19729de860ea',
      date: '2026-11-02',
      expiry: '2026-11-16',
      state: 'draft',
      items: [item],
    });

    const err = quotation.validateSync();
    expect(err).toBeUndefined();
  });

  it('should reject non-integer milli-units in DocumentItem', () => {
    const quotation = new Quotation({
      number: 'QT-2026-0002',
      customer_id: '507f191e810c19729de860ea',
      date: '2026-11-02',
      expiry: '2026-11-16',
      items: [
        {
          desc: 'Invalid Fractional Milli',
          qty: 1,
          price_milli: 150.55, // Non-integer
          disc_pct: 0,
          tax_rate: 0,
          gross_milli: 150.55,
          disc_milli: 0,
          tax_milli: 0,
          total_milli: 150.55,
        },
      ],
    });

    const err = quotation.validateSync();
    expect(err).toBeDefined();
    expect(err?.errors['items.0.price_milli']).toBeDefined();
  });

  it('should enforce user role enum restriction', () => {
    const user = new User({
      name: 'Test Officer',
      email: 'test@safetech.so',
      password_hash: 'hash123',
      role: 'superadmin' as unknown as UserRole,
    });

    const err = user.validateSync();
    expect(err).toBeDefined();
    expect(err?.errors['role']).toBeDefined();
  });

  it('should enforce AuditLog immutability against save modifications', async () => {
    const log = new AuditLog({
      user_name: 'Admin',
      role: 'admin',
      action: 'Issued invoice',
      ref: 'INV-1001',
    });

    // Mark as not new to simulate updating an existing document
    log.isNew = false;
    await expect(log.save()).rejects.toThrow('Audit logs are append-only and strictly immutable');
  });

  it('should enforce Payment method and amount validators', () => {
    const payment = new Payment({
      invoice_id: '507f191e810c19729de860ea',
      receipt_id: '507f191e810c19729de860eb',
      date: '2026-11-02',
      amount_milli: -500, // Invalid negative
      method: 'cash',
    });

    const err = payment.validateSync();
    expect(err).toBeDefined();
    expect(err?.errors['amount_milli']).toBeDefined();
  });
});

