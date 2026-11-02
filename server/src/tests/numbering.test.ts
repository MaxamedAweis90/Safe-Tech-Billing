import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatNumber, getNextNumber } from '../services/numberingService';
import { NumberSequence } from '../models/NumberSequence';

describe('Numbering Service Specifications — numbering.test.ts', () => {
  describe('Pattern Formatting Token Replacement', () => {
    const testDate = '2026-11-02T12:00:00.000Z';

    it('interpolates {SEQ} raw unpadded counter', () => {
      expect(formatNumber('INV-{SEQ}', 10457, testDate)).toBe('INV-10457');
      expect(formatNumber('{SEQ}', 42, testDate)).toBe('42');
    });

    it('interpolates {SEQ4} 4-digit zero padded counter', () => {
      expect(formatNumber('QT-{YYYY}-{SEQ4}', 1, testDate)).toBe('QT-2026-0001');
      expect(formatNumber('QT-{YYYY}-{SEQ4}', 9999, testDate)).toBe('QT-2026-9999');
      expect(formatNumber('CN-{SEQ4}', 15, testDate)).toBe('CN-0015');
    });

    it('interpolates {SEQ5} 5-digit zero padded counter', () => {
      expect(formatNumber('RC-{SEQ5}', 5, testDate)).toBe('RC-00005');
      expect(formatNumber('RC-{SEQ5}', 12345, testDate)).toBe('RC-12345');
    });

    it('interpolates {YYYY}, {YY}, and {MM} date tokens', () => {
      expect(formatNumber('DOC-{YYYY}-{MM}-{SEQ}', 7, testDate)).toBe('DOC-2026-11-7');
      expect(formatNumber('DOC-{YY}{MM}-{SEQ4}', 8, testDate)).toBe('DOC-2611-0008');
    });
  });

  describe('Atomic Sequence Incrementation & Concurrency', () => {
    let mockCounters: Record<string, number>;

    beforeEach(() => {
      mockCounters = {
        quote: 0,
        invoice: 10450,
        receipt: 0,
        credit: 0,
      };

      vi.spyOn(NumberSequence as any, 'findOneAndUpdate').mockImplementation(
        async (query: any, update: any) => {
          const kind = query.kind as string;
          if (!mockCounters[kind]) mockCounters[kind] = 0;
          mockCounters[kind] += update.$inc.current_seq;

          const defaultFormat =
            kind === 'quote'
              ? 'QT-{YYYY}-{SEQ4}'
              : kind === 'receipt'
              ? 'RC-{SEQ5}'
              : kind === 'credit'
              ? 'CN-{SEQ4}'
              : '{SEQ}';

          return {
            kind,
            format: defaultFormat,
            current_seq: mockCounters[kind],
          } as any;
        }
      );
    });

    it('atomically increments sequence without gaps or duplicates under rapid sequential calls', async () => {
      const callCount = 25;
      const promises = Array.from({ length: callCount }, () => getNextNumber('quote', '2026-11-02'));
      const results = await Promise.all(promises);

      // Verify all numbers are unique
      const uniqueSet = new Set(results);
      expect(uniqueSet.size).toBe(callCount);

      // Verify format and progression
      expect(results[0]).toBe('QT-2026-0001');
      expect(results[results.length - 1]).toBe(`QT-2026-00${callCount}`);
    });

    it('handles independent counters across document kinds', async () => {
      const quoteNum = await getNextNumber('quote', '2026-11-02');
      const invoiceNum = await getNextNumber('invoice', '2026-11-02');
      const receiptNum = await getNextNumber('receipt', '2026-11-02');
      const creditNum = await getNextNumber('credit', '2026-11-02');

      expect(quoteNum).toBe('QT-2026-0001');
      expect(invoiceNum).toBe('10451');
      expect(receiptNum).toBe('RC-00001');
      expect(creditNum).toBe('CN-0001');
    });
  });
});
