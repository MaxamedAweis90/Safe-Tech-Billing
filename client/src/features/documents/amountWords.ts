/**
 * Safe Tech Billing — Legal Spelled-out Amount Engine
 * Strictly matching prototype `words(n)` and `amountWords(m, code)`.
 */

export function words(n: number): string {
  const a = [
    '',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];
  const t = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];

  const h = (x: number): string => {
    let s = '';
    if (x >= 100) {
      s += a[Math.floor(x / 100)] + ' hundred';
      x %= 100;
      if (x) s += ' ';
    }
    if (x >= 20) {
      s += t[Math.floor(x / 10)];
      if (x % 10) s += '-' + a[x % 10];
    } else if (x) {
      s += a[x];
    }
    return s;
  };

  if (n === 0) return 'zero';
  const out: string[] = [];
  const sc: [string, number][] = [
    ['billion', 1e9],
    ['million', 1e6],
    ['thousand', 1e3],
  ];

  for (const [w, v] of sc) {
    if (n >= v) {
      out.push(h(Math.floor(n / v)) + ' ' + w);
      n %= v;
    }
  }
  if (n) out.push(h(n));
  return out.join(' ');
}

/**
 * Converts integer milli-units into legal English words representation.
 * Examples:
 * 12500000 USD -> "Twelve thousand five hundred dollars only"
 * 4850000 USD -> "Four thousand eight hundred fifty dollars only"
 * 12450 SOS -> "Twelve shillings only"
 */
export function amountWords(milli: number, code: string = 'USD'): string {
  const whole = Math.floor(milli / 1000);
  const cents = Math.round((milli % 1000) / 10);
  const isUSD = code === 'USD';
  const isSOS = code === 'SOS';
  const unit = isUSD
    ? ['dollar', 'dollars', 'cent', 'cents']
    : isSOS
    ? ['shilling', 'shillings', '', '']
    : [code, code, '', ''];

  let s = words(whole) + ' ' + (whole === 1 ? unit[0] : unit[1]);
  const hasDecimals = code !== 'SOS';
  if (hasDecimals && cents && unit[2]) {
    s += ' and ' + words(cents) + ' ' + (cents === 1 ? unit[2] : unit[3]);
  }
  return s.charAt(0).toUpperCase() + s.slice(1) + ' only';
}

