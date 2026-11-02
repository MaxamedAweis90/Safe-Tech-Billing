/**
 * Safe Tech Billing — Frontend formatting utilities.
 * Preserves strict integer milli-unit financial precision.
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  SOS: 'Sh.So. ',
  KES: 'KSh ',
  EUR: '€',
  GBP: '£',
  UGX: 'USh ',
  TZS: 'TSh ',
};

/**
 * Converts milli-units (e.g. 1500000) into a formatted currency string (e.g. "$1,500.00").
 */
export function formatMoney(milli: number = 0, currencyCode: string = 'USD'): string {
  const symbol = CURRENCY_SYMBOLS[currencyCode] || `${currencyCode} `;
  const val = milli / 1000;
  return `${symbol}${val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Converts a float or numeric string into integer milli-units.
 */
export function toMilli(val: number | string): number {
  if (typeof val === 'string') {
    val = parseFloat(val.replace(/,/g, '')) || 0;
  }
  return Math.round(val * 1000);
}

/**
 * Converts milli-units to standard float.
 */
export function fromMilli(milli: number = 0): number {
  return milli / 1000;
}

/**
 * Formats an ISO date string into standard human readable date (e.g. "12 Oct 2026").
 */
export function formatDate(isoStr?: string): string {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr + (isoStr.length === 10 ? 'T00:00:00Z' : ''));
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return isoStr;
  }
}

/**
 * Long date format matching prototype `fmtLong(d)` (e.g. "31 October 2026")
 */
export function fmtLong(isoStr?: string): string {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr + (isoStr.length === 10 ? 'T00:00:00Z' : ''));
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return isoStr;
  }
}

/**
 * Short date format matching prototype `fmtD(d)` (e.g. "31 Oct 2026")
 */
export function fmtD(isoStr?: string): string {
  return formatDate(isoStr);
}

/**
 * Formats a percentage value (e.g. 18 -> "18%").
 */
export function formatPercent(pct: number = 0): string {
  return `${pct}%`;
}

/**
 * Plain number format with currency decimal precision (no currency symbol).
 */
export function plain(m: number, code: string = 'USD'): string {
  const decimals = code === 'SOS' ? 0 : 2;
  return (m / 1000).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Unit price string format preserving up to 3 decimals if millicents exist.
 */
export function priceStr(m: number): string {
  return (m % 10)
    ? (m / 1000).toFixed(3)
    : (m / 1000).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

/**
 * Rounds to nearest cent (nearest 10 milli-units).
 */
export const r10 = (x: number): number => Math.round(x / 10) * 10;

export interface CalcLineItem {
  qty: number | string;
  price: number;
  disc?: number | string;
  taxRate?: number | string;
}

/**
 * Exact prototype integer-milli calculation for a single line item.
 */
export function lineCalc(it: CalcLineItem) {
  const qm = Math.round((+it.qty || 0) * 1000);
  const gross = r10((qm * (it.price || 0)) / 1000);
  const disc = r10((gross * Math.round((+(it.disc ?? 0) || 0) * 100)) / 10000);
  const tax = r10(((gross - disc) * Math.round((+(it.taxRate ?? 0) || 0) * 100)) / 10000);
  return { gross, disc, tax, total: gross - disc + tax };
}

/**
 * Aggregates all line items on a document using prototype integer math.
 */
export function totalsOf(doc: { items: CalcLineItem[] }) {
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
 * Adds n days to an ISO YYYY-MM-DD date.
 */
export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Calculates number of days between two ISO YYYY-MM-DD dates.
 */
export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime()) / 864e5
  );
}

/**
 * Sequence number formatter with token replacement.
 */
export function fmtNumber(fmt: string, seq: number, date?: string): string {
  const todayStr = '2026-10-31';
  const y = (date || todayStr).slice(0, 4);
  const m = (date || todayStr).slice(5, 7);
  return fmt
    .replace(/\{SEQ(\d?)\}/g, (_, w) => (w ? String(seq).padStart(+w, '0') : String(seq)))
    .replace('{YYYY}', y)
    .replace('{YY}', y.slice(2))
    .replace('{MM}', m);
}

/**
 * Resolves quotation status taking expiry into account.
 */
export function qStatus(q: { state: string; expiry?: string; expiry_date?: string }, todayStr = '2026-10-31'): string {
  const exp = q.expiry || q.expiry_date || '';
  if ((q.state === 'draft' || q.state === 'sent') && exp && exp < todayStr) {
    return 'expired';
  }
  return q.state;
}


