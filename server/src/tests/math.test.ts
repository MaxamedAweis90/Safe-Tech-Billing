import { describe, it, expect } from 'vitest';
import {
  toMilli,
  milliStr,
  roundToCents,
  calculateLineItem,
  calculateDocumentTotals,
  amountToWords,
} from '../services/mathService';

describe('Financial Math Engine — math.test.ts', () => {
  describe('Integer Milli-Unit Conversions & Formatting', () => {
    it('toMilli converts string and float numbers to exact integer thousandths', () => {
      expect(toMilli(150.0)).toBe(150000);
      expect(toMilli('150.00')).toBe(150000);
      expect(toMilli('10.55')).toBe(10550);
      expect(toMilli(0.001)).toBe(1);
      expect(toMilli(0)).toBe(0);
      expect(toMilli('0.005')).toBe(5);
    });

    it('milliStr formats integer milli-units to decimal strings', () => {
      expect(milliStr(150000)).toBe('150.00');
      expect(milliStr(10550)).toBe('10.55');
      expect(milliStr(0)).toBe('0.00');
      expect(milliStr(1234567)).toBe('1234.57');
    });

    it('roundToCents rounds milli-units to the nearest 10 milli-units (cent level)', () => {
      expect(roundToCents(150004)).toBe(150000);
      expect(roundToCents(150005)).toBe(150010);
      expect(roundToCents(150006)).toBe(150010);
      expect(roundToCents(100000)).toBe(100000);
    });
  });

  describe('Line Item Calculations & Decimal Invariants', () => {
    it('calculates line items with fractional quantities (3 decimal places)', () => {
      // 1.250 units at $80.00 (80000 milli), 0% disc, 0% tax
      // gross = roundToCents(Math.round(1.250 * 1000) * 80000 / 1000) = 100000
      const calc = calculateLineItem(1.25, 80000, 0, 0);
      expect(calc.gross_milli).toBe(100000);
      expect(calc.disc_milli).toBe(0);
      expect(calc.tax_milli).toBe(0);
      expect(calc.total_milli).toBe(100000);
    });

    it('calculates line items with percentage discount and sales tax', () => {
      // 5 units at $200.00 (200000 milli) = 1000000 gross
      // 10% disc = 100000 disc, taxable = 900000
      // 5% tax = 45000 tax
      // total = 945000
      const calc = calculateLineItem(5, 200000, 10, 5);
      expect(calc.gross_milli).toBe(1000000);
      expect(calc.disc_milli).toBe(100000);
      expect(calc.tax_milli).toBe(45000);
      expect(calc.total_milli).toBe(945000);
    });

    it('prevents standard IEEE-754 floating-point anomalies (e.g. 0.1 + 0.2)', () => {
      // In float math: 0.1 + 0.2 = 0.30000000000000004
      // In milli integer arithmetic:
      const a = toMilli(0.1); // 100
      const b = toMilli(0.2); // 200
      const sum = a + b; // 300
      expect(sum).toBe(300);
      expect(Number.isInteger(sum)).toBe(true);
      expect(milliStr(sum)).toBe('0.30');

      // Calculating 3 items of 0.10:
      const items = [
        calculateLineItem(1, toMilli(0.1), 0, 0),
        calculateLineItem(1, toMilli(0.2), 0, 0),
        calculateLineItem(1, toMilli(0.3), 0, 0),
      ];
      const totals = calculateDocumentTotals(items);
      expect(totals.total_milli).toBe(600); // Exactly $0.60
      expect(milliStr(totals.total_milli)).toBe('0.60');
    });
  });

  describe('Formal Legal Text Generation (amountToWords)', () => {
    it('converts round thousands to formal words', () => {
      expect(amountToWords(1500000, 'USD')).toBe(
        'One thousand five hundred dollars and zero cents only'
      );
    });

    it('converts dollars with cents to formal words', () => {
      expect(amountToWords(12550, 'USD')).toBe('Twelve dollars and fifty-five cents only');
      expect(amountToWords(100000, 'USD')).toBe('One hundred dollars and zero cents only');
    });

    it('handles singular dollar and singular cent edge cases', () => {
      expect(amountToWords(1000, 'USD')).toBe('One dollar and zero cents only');
      expect(amountToWords(10, 'USD')).toBe('Zero dollars and one cent only');
      expect(amountToWords(1010, 'USD')).toBe('One dollar and one cent only');
    });

    it('handles zero amount gracefully', () => {
      expect(amountToWords(0, 'USD')).toBe('Zero dollars and zero cents only');
    });

    it('supports alternate currencies such as SOS', () => {
      expect(amountToWords(26000000, 'SOS')).toBe(
        'Twenty-six thousand shillings and zero cents only'
      );
    });
  });
});

