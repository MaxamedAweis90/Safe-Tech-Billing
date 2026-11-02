import { IDocumentItem } from '../models/DocumentItem';

/**
 * Converts a float or numeric string into integer thousandths (milli-units).
 * e.g., 10.50 -> 10500, "150.25" -> 150250.
 */
export const toMilli = (val: number | string): number => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return 0;
  return Math.round(num * 1000);
};

/**
 * Formats an integer milli-unit value into a decimal string.
 * e.g., 150000 -> "150.00"
 */
export const milliStr = (milli: number, decimals: number = 2): string => {
  if (isNaN(milli)) return (0).toFixed(decimals);
  return (milli / 1000).toFixed(decimals);
};

/**
 * Rounds an integer milli-unit amount to the nearest cent (10 milli-units).
 * Math.round(milli / 10) * 10
 */
export const roundToCents = (milli: number): number => {
  return Math.round(milli / 10) * 10;
};

export interface LineItemCalculation {
  gross_milli: number;
  disc_milli: number;
  tax_milli: number;
  total_milli: number;
}

/**
 * Calculates line item monetary values strictly using integer arithmetic standards:
 * - Line Gross: roundToCents(Math.round(qty * 1000) * priceMilli / 1000)
 * - Line Discount: roundToCents(gross_milli * Math.round(discPct * 100) / 10000)
 * - Line Tax: roundToCents((gross_milli - disc_milli) * Math.round(taxRate * 100) / 10000)
 * - Line Total: gross_milli - disc_milli + tax_milli
 */
export const calculateLineItem = (
  qty: number,
  priceMilli: number,
  discPct: number,
  taxRate: number
): LineItemCalculation => {
  const safeQty = Math.max(0, qty);
  const safePrice = Math.max(0, priceMilli);
  const safeDiscPct = Math.min(100, Math.max(0, discPct));
  const safeTaxRate = Math.min(100, Math.max(0, taxRate));

  const gross_milli = roundToCents((Math.round(safeQty * 1000) * safePrice) / 1000);
  const disc_milli = roundToCents((gross_milli * Math.round(safeDiscPct * 100)) / 10000);
  const taxable_milli = Math.max(0, gross_milli - disc_milli);
  const tax_milli = roundToCents((taxable_milli * Math.round(safeTaxRate * 100)) / 10000);
  const total_milli = gross_milli - disc_milli + tax_milli;

  return {
    gross_milli,
    disc_milli,
    tax_milli,
    total_milli,
  };
};

export interface DocumentTotals {
  subtotal_milli: number;
  disc_total_milli: number;
  tax_total_milli: number;
  total_milli: number;
}

/**
 * Aggregates document totals across all line items.
 */
export const calculateDocumentTotals = (
  items: Array<Pick<IDocumentItem, 'gross_milli' | 'disc_milli' | 'tax_milli' | 'total_milli'>>
): DocumentTotals => {
  return items.reduce<DocumentTotals>(
    (acc, item) => ({
      subtotal_milli: acc.subtotal_milli + (item.gross_milli || 0),
      disc_total_milli: acc.disc_total_milli + (item.disc_milli || 0),
      tax_total_milli: acc.tax_total_milli + (item.tax_milli || 0),
      total_milli: acc.total_milli + (item.total_milli || 0),
    }),
    {
      subtotal_milli: 0,
      disc_total_milli: 0,
      tax_total_milli: 0,
      total_milli: 0,
    }
  );
};

// Words conversion dictionary
const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

const convertLessThanOneThousand = (num: number): string => {
  let str = '';
  if (num >= 100) {
    str += ONES[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 20) {
    str += TENS[Math.floor(num / 10)];
    if (num % 10 > 0) {
      str += '-' + ONES[num % 10];
    }
    str += ' ';
  } else if (num > 0) {
    str += ONES[num] + ' ';
  }
  return str.trim();
};

const numberToWordsInteger = (num: number): string => {
  if (num === 0) return 'Zero';
  if (num < 0) return 'Negative ' + numberToWordsInteger(Math.abs(num));

  const scales = [
    { value: 1_000_000_000, name: 'Billion' },
    { value: 1_000_000, name: 'Million' },
    { value: 1_000, name: 'Thousand' },
    { value: 1, name: '' },
  ];

  let words = '';
  let remainder = num;

  for (const scale of scales) {
    const quotient = Math.floor(remainder / scale.value);
    remainder %= scale.value;

    if (quotient > 0) {
      const scaleWords = convertLessThanOneThousand(quotient);
      words += scaleWords + (scale.name ? ' ' + scale.name + ' ' : ' ');
    }
  }

  return words.trim();
};

interface CurrencyUnitNames {
  singular: string;
  plural: string;
  centSingular: string;
  centPlural: string;
}

const CURRENCY_MAP: Record<string, CurrencyUnitNames> = {
  USD: { singular: 'dollar', plural: 'dollars', centSingular: 'cent', centPlural: 'cents' },
  EUR: { singular: 'euro', plural: 'euros', centSingular: 'cent', centPlural: 'cents' },
  GBP: { singular: 'pound', plural: 'pounds', centSingular: 'penny', centPlural: 'pence' },
  SOS: { singular: 'shilling', plural: 'shillings', centSingular: 'cent', centPlural: 'cents' },
};

/**
 * Generates formal English legal amount text from integer milli-units.
 * e.g., 1500000 -> "One thousand five hundred dollars and zero cents only"
 */
export const amountToWords = (milli: number, currencyCode: string = 'USD'): string => {
  const code = (currencyCode || 'USD').toUpperCase();
  const currencyInfo = CURRENCY_MAP[code] || {
    singular: `${code} unit`,
    plural: `${code} units`,
    centSingular: 'cent',
    centPlural: 'cents',
  };

  const roundedMilli = roundToCents(Math.max(0, milli));
  const mainUnits = Math.floor(roundedMilli / 1000);
  const cents = Math.round((roundedMilli % 1000) / 10);

  const rawMainWords = numberToWordsInteger(mainUnits).toLowerCase();
  const mainWords = rawMainWords.charAt(0).toUpperCase() + rawMainWords.slice(1);
  const mainUnitWord = mainUnits === 1 ? currencyInfo.singular : currencyInfo.plural;

  const centsWords = cents === 0 ? 'zero' : numberToWordsInteger(cents).toLowerCase();
  const centUnitWord = cents === 1 ? currencyInfo.centSingular : currencyInfo.centPlural;

  return `${mainWords} ${mainUnitWord} and ${centsWords} ${centUnitWord} only`;
};
