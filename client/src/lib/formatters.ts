/**
 * Safe Tech Billing — Frontend formatting utilities.
 * Preserves strict integer milli-unit financial precision.
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
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
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoStr;
  }
}

/**
 * Formats a percentage value (e.g. 18 -> "18%").
 */
export function formatPercent(pct: number = 0): string {
  return `${pct}%`;
}

