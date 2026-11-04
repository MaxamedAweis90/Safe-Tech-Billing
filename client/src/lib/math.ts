/**
 * Safe Tech Billing — Exact Integer-Milli Financial Math Engine
 * Strictly matching prototype implementation (Safe Tech Billing (3).html lines 375-390).
 *
 * Invariant: All stored and calculated monetary values are represented as integer
 * thousandths of a unit (milli-units / cents: e.g. $10.00 = 10000).
 */

import { amountWords, words } from '../features/documents/amountWords';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  decimals: number;
  rate: number; // exchange rate against USD (1 USD = rate units)
}

export const DEFAULT_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', decimals: 2, rate: 1 },
  { code: 'SOS', symbol: 'Sh.So.', decimals: 0, rate: 26000 },
  { code: 'KES', symbol: 'KSh', decimals: 2, rate: 130 },
  { code: 'EUR', symbol: '€', decimals: 2, rate: 0.92 },
  { code: 'GBP', symbol: '£', decimals: 2, rate: 0.79 },
];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  SOS: 'Sh.So. ',
  KES: 'KSh ',
  EUR: '€',
  GBP: '£',
  UGX: 'USh ',
  TZS: 'TSh ',
};

export const CURRENCY_RATES: Record<string, number> = {
  USD: 1,
  SOS: 26000,
  KES: 130,
  EUR: 0.92,
  GBP: 0.79,
  UGX: 3700,
  TZS: 2600,
};

/**
 * Resolves currency configuration matching prototype `curOf(code)`.
 */
export function curOf(code?: string, customCurrencies?: CurrencyConfig[]): CurrencyConfig {
  const list = customCurrencies && customCurrencies.length ? customCurrencies : DEFAULT_CURRENCIES;
  return list.find((c) => c.code === code) || list[0];
}

/**
 * Rounds an integer milli-unit value to the nearest cent (nearest multiple of 10 milli-units).
 * Matching prototype `const r10 = x => Math.round(x / 10) * 10`.
 */
export const r10 = (x: number): number => Math.round(x / 10) * 10;

/**
 * Parses user input (string or number) into exact integer thousandths (milli-units).
 * Strictly validates decimal format and rejects malformed values by returning NaN.
 * Matching prototype `function toMilli(v)`.
 */
export function toMilli(v: string | number | null | undefined): number {
  const s = String(v ?? '').trim().replace(/,/g, '');
  if (!/^\d*(\.\d*)?$/.test(s) || s === '' || s === '.') {
    return NaN;
  }
  const [i, f = ''] = s.split('.');
  return Number(i || 0) * 1000 + Number((f + '000').slice(0, 3));
}

/**
 * Formats thousandths back to standard fixed decimal string representation (without currency symbol).
 * Matching prototype `function milliStr(m, dec = 2)`.
 * e.g., 1500000 -> "1500.00", -25000 -> "-25.00"
 */
export function milliStr(m: number, dec: number = 2): string {
  if (isNaN(m)) return (0).toFixed(dec);
  const neg = m < 0;
  const absM = Math.abs(m);
  const i = Math.floor(absM / 1000);
  const f = String(absM % 1000).padStart(3, '0');
  return (neg ? '-' : '') + i + (dec ? '.' + f.slice(0, dec) : '');
}

/**
 * Converts integer milli-units into standard localized float string without currency symbol.
 * Matching prototype `function plain(m, code)`.
 */
export function plain(m: number, code: string = 'USD'): string {
  const c = curOf(code);
  return (m / 1000).toLocaleString('en-US', {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  });
}

/**
 * Formats price value up to 3 decimals if fractional millicents exist.
 * Matching prototype `function priceStr(m)`.
 */
export function priceStr(m: number): string {
  return m % 10
    ? (m / 1000).toFixed(3)
    : (m / 1000).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

export interface LineItemInput {
  qty?: number | string;
  price?: number;
  disc?: number | string;
  taxRate?: number | string;
}

export interface LineItemResult {
  gross: number;
  disc: number;
  tax: number;
  total: number;
}

/**
 * Calculates line item amounts strictly using prototype integer arithmetic:
 *   qm = Math.round(qty * 1000)
 *   gross = r10(qm * price / 1000)
 *   disc = r10(gross * Math.round(disc * 100) / 10000)
 *   tax = r10((gross - disc) * Math.round(taxRate * 100) / 10000)
 *   total = gross - disc + tax
 */
export function lineCalc(it: LineItemInput): LineItemResult {
  const qm = Math.round((+it.qty! || 0) * 1000);
  const gross = r10((qm * (it.price || 0)) / 1000);
  const disc = r10((gross * Math.round((+(it.disc ?? 0) || 0) * 100)) / 10000);
  const tax = r10(((gross - disc) * Math.round((+(it.taxRate ?? 0) || 0) * 100)) / 10000);
  return { gross, disc, tax, total: gross - disc + tax };
}

export interface DocumentTotalsResult {
  sub: number;
  disc: number;
  tax: number;
  total: number;
}

/**
 * Aggregates document totals across all line items using prototype integer math.
 * Matching prototype `function totalsOf(doc)`.
 */
export function totalsOf(doc: { items?: LineItemInput[] }): DocumentTotalsResult {
  let sub = 0;
  let disc = 0;
  let tax = 0;
  for (const it of doc.items || []) {
    const c = lineCalc(it);
    sub += c.gross;
    disc += c.disc;
    tax += c.tax;
  }
  return { sub, disc, tax, total: sub - disc + tax };
}

/**
 * Converts foreign currency integer milli-units to base USD milli-units.
 * Matching prototype `function toBase(m, code)`.
 */
export function toBase(milliAmount: number, currencyCode: string = 'USD'): number {
  const c = curOf(currencyCode);
  return Math.round(milliAmount / (c.rate || 1));
}

/**
 * Formats integer milli-units into localized currency string with proper symbol.
 * Matching prototype `function money(m, code)`.
 * e.g., 1500000, "USD" -> "$1,500.00"
 *       12450000, "SOS" -> "Sh.So. 12,450"
 */
export function formatMoney(milliAmount: number = 0, currencyCode: string = 'USD'): string {
  const c = curOf(currencyCode);
  const val = (milliAmount / 1000).toLocaleString('en-US', {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  });
  return c.symbol + (c.symbol.length > 1 ? ' ' : '') + val;
}

// Re-export legal amount words
export { amountWords, words };

