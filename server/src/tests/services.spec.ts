import { describe, it, expect } from 'vitest';
import {
  toMilli,
  milliStr,
  roundToCents,
  calculateLineItem,
  calculateDocumentTotals,
  amountToWords,
} from '../services/mathService';
import { formatNumber } from '../services/numberingService';

describe('Financial Math Engine Specifications', () => {
  it('toMilli converts floats and strings into integer thousandths', () => {
    expect(toMilli(150.0)).toBe(150000);
    expect(toMilli('10.55')).toBe(10550);
    expect(toMilli(0.001)).toBe(1);
    expect(toMilli(0)).toBe(0);
  });

  it('milliStr formats integer milli-units to decimal strings', () => {
    expect(milliStr(150000)).toBe('150.00');
    expect(milliStr(10550)).toBe('10.55');
    expect(milliStr(0)).toBe('0.00');
  });

  it('roundToCents rounds milli-units to nearest 10 (cent level)', () => {
    expect(roundToCents(150005)).toBe(150010);
    expect(roundToCents(150004)).toBe(150000);
    expect(roundToCents(150000)).toBe(150000);
  });

  it('calculateLineItem calculates exact integer arithmetic per spec', () => {
    // 2 units at $150.00 (150000 milli), 10% discount, 5% tax
    // gross = 2 * 150000 = 300000
    // disc = roundToCents(300000 * 1000 / 10000) = roundToCents(30000) = 30000
    // taxable = 300000 - 30000 = 270000
    // tax = roundToCents(270000 * 500 / 10000) = roundToCents(13500) = 13500
    // total = 300000 - 30000 + 13500 = 283500 ($283.50)
    const result = calculateLineItem(2, 150000, 10, 5);

    expect(result.gross_milli).toBe(300000);
    expect(result.disc_milli).toBe(30000);
    expect(result.tax_milli).toBe(13500);
    expect(result.total_milli).toBe(283500);
  });

  it('calculateDocumentTotals aggregates line items', () => {
    const items = [
      { gross_milli: 100000, disc_milli: 10000, tax_milli: 4500, total_milli: 94500 },
      { gross_milli: 200000, disc_milli: 0, tax_milli: 10000, total_milli: 210000 },
    ];

    const totals = calculateDocumentTotals(items);
    expect(totals.subtotal_milli).toBe(300000);
    expect(totals.disc_total_milli).toBe(10000);
    expect(totals.tax_total_milli).toBe(14500);
    expect(totals.total_milli).toBe(304500);
  });

  it('amountToWords converts milli-units into legal formal English', () => {
    expect(amountToWords(1500000, 'USD')).toBe(
      'One thousand five hundred dollars and zero cents only'
    );
    expect(amountToWords(12550, 'USD')).toBe('Twelve dollars and fifty-five cents only');
    expect(amountToWords(1000, 'USD')).toBe('One dollar and zero cents only');
    expect(amountToWords(10, 'USD')).toBe('Zero dollars and one cent only');
  });
});

describe('Numbering Formatting Specifications', () => {
  it('interpolates {SEQ}, {SEQ4}, {SEQ5}, {YYYY}, {YY}, {MM}', () => {
    const date = '2026-11-02T00:00:00Z';

    expect(formatNumber('QT-{YYYY}-{SEQ4}', 1, date)).toBe('QT-2026-0001');
    expect(formatNumber('{SEQ}', 10457, date)).toBe('10457');
    expect(formatNumber('RC-{SEQ5}', 5, date)).toBe('RC-00005');
    expect(formatNumber('CN-{YY}{MM}-{SEQ4}', 42, date)).toBe('CN-2611-0042');
  });
});

