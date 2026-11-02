/**
 * Safe Tech Billing — Central Mock Data Store & Calculation Engine
 * Strictly aligned with `./plan/Safe Tech Billing (3).html` seed data & financial math.
 */

export const TODAY = '2026-10-31';

export interface MockCustomer {
  id: string;
  code: number;
  name: string;
  attn: string;
  phone: string;
  email: string;
  currency: string;
}

export interface MockQuote {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  date: string;
  expiry_date: string;
  state: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  total_milli: number;
  currency: string;
  invoiceId?: string;
  invoiceNumber?: string;
}

export interface MockInvoice {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  date: string;
  due_date: string;
  state: 'draft' | 'issued' | 'cancelled';
  status: 'draft' | 'sent' | 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  total_milli: number;
  paid_milli: number;
  balance_milli: number;
  currency: string;
  daysLate?: number;
  quoteId?: string;
  cancelReason?: string;
}

export interface MockReceipt {
  id: string;
  number: string;
  date: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  method: string;
  reference: string;
  amount_milli: number;
  balanceAfter_milli: number;
  currency: string;
}

export interface MockPayment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  amount_milli: number;
  method: string;
  reference: string;
  currency: string;
  receiptId: string;
}

export const MOCK_CUSTOMERS: MockCustomer[] = [
  {
    id: 'c38',
    code: 1001,
    name: 'Acme Global Ltd',
    attn: 'James Wilson',
    phone: '+254 712 345 678',
    email: 'accounts@acmeglobal.com',
    currency: 'USD',
  },
  {
    id: 'c39',
    code: 1002,
    name: 'Nairobi Water Works',
    attn: 'Eng. Peter Mwangi',
    phone: '+254 722 987 654',
    email: 'billing@nairobiwater.co.ke',
    currency: 'USD',
  },
  {
    id: 'c40',
    code: 1003,
    name: 'Apex Logistics Inc',
    attn: 'Grace Ochieng',
    phone: '+254 733 456 789',
    email: 'procurement@apexlogistics.com',
    currency: 'USD',
  },
  {
    id: 'c41',
    code: 1004,
    name: 'Zenith Holdings Ltd',
    attn: 'David Kimani',
    phone: '+254 701 112 233',
    email: 'finance@zenith.co.ke',
    currency: 'USD',
  },
  {
    id: 'c42',
    code: 1005,
    name: 'Coast Builders',
    attn: 'Fatuma Abdi',
    phone: '+254 711 223 344',
    email: 'info@coastbuilders.co.ke',
    currency: 'USD',
  },
  {
    id: 'c43',
    code: 1006,
    name: 'Lido Seaside Hotel',
    attn: 'General Manager',
    phone: '+252 61 640 7788',
    email: 'gm@lidoseaside.example',
    currency: 'USD',
  },
  {
    id: 'c44',
    code: 1007,
    name: 'Waaberi Primary School',
    attn: 'Head Teacher',
    phone: '+252 61 905 1132',
    email: 'office@waaberischool.example',
    currency: 'USD',
  },
  {
    id: 'c45',
    code: 1008,
    name: 'Benadir Engineering Works',
    attn: 'Eng. Mahad Osman',
    phone: '+252 61 287 6604',
    email: 'mahad@benadireng.example',
    currency: 'USD',
  },
];

export const MOCK_QUOTES: MockQuote[] = [
  {
    id: 'q1',
    number: 'QT-2026-0001',
    customerId: 'c39',
    customerName: 'Nairobi Water Works',
    date: '2026-05-02',
    expiry_date: '2026-06-01',
    state: 'accepted',
    total_milli: 4850000,
    currency: 'USD',
    invoiceId: 'i10457',
    invoiceNumber: '10457',
  },
  {
    id: 'q2',
    number: 'QT-2026-0002',
    customerId: 'c40',
    customerName: 'Apex Logistics Inc',
    date: '2026-05-14',
    expiry_date: '2026-06-13',
    state: 'accepted',
    total_milli: 2200000,
    currency: 'USD',
    invoiceId: 'i10458',
    invoiceNumber: '10458',
  },
  {
    id: 'q3',
    number: 'QT-2026-0003',
    customerId: 'c42',
    customerName: 'Coast Builders',
    date: '2026-06-15',
    expiry_date: '2026-07-15',
    state: 'accepted',
    total_milli: 590000,
    currency: 'USD',
    invoiceId: 'i10460',
    invoiceNumber: '10460',
  },
  {
    id: 'q4',
    number: 'QT-2026-0004',
    customerId: 'c45',
    customerName: 'Benadir Engineering Works',
    date: '2026-07-02',
    expiry_date: '2026-08-01',
    state: 'rejected',
    total_milli: 3800000,
    currency: 'USD',
  },
  {
    id: 'q5',
    number: 'QT-2026-0005',
    customerId: 'c43',
    customerName: 'Lido Seaside Hotel',
    date: '2026-07-18',
    expiry_date: '2026-08-17',
    state: 'accepted',
    total_milli: 926000,
    currency: 'USD',
    invoiceId: 'i10462',
    invoiceNumber: '10462',
  },
  {
    id: 'q6',
    number: 'QT-2026-0006',
    customerId: 'c41',
    customerName: 'Zenith Holdings Ltd',
    date: '2026-08-20',
    expiry_date: '2026-09-19',
    state: 'sent',
    total_milli: 680000,
    currency: 'USD',
  },
  {
    id: 'q7',
    number: 'QT-2026-0007',
    customerId: 'c43',
    customerName: 'Lido Seaside Hotel',
    date: '2026-10-15',
    expiry_date: '2026-11-14',
    state: 'accepted',
    total_milli: 690000,
    currency: 'USD',
    invoiceId: 'i10470',
    invoiceNumber: '10470',
  },
  {
    id: 'q8',
    number: 'QT-2026-0008',
    customerId: 'c45',
    customerName: 'Benadir Engineering Works',
    date: '2026-10-20',
    expiry_date: '2026-11-19',
    state: 'sent',
    total_milli: 1250000,
    currency: 'USD',
  },
  {
    id: 'q9',
    number: 'QT-2026-0009',
    customerId: 'c38',
    customerName: 'Acme Global Ltd',
    date: '2026-10-27',
    expiry_date: '2026-11-26',
    state: 'accepted',
    total_milli: 1450000,
    currency: 'USD',
  },
  {
    id: 'q10',
    number: 'QT-2026-0010',
    customerId: 'c44',
    customerName: 'Waaberi Primary School',
    date: '2026-10-31',
    expiry_date: '2026-11-30',
    state: 'draft',
    total_milli: 360000,
    currency: 'USD',
  },
];

export const MOCK_INVOICES: MockInvoice[] = [
  {
    id: 'i10456',
    number: '10456',
    customerId: 'c38',
    customerName: 'Acme Global Ltd',
    date: '2024-03-26',
    due_date: '2024-04-25',
    state: 'issued',
    status: 'paid',
    total_milli: 12500000,
    paid_milli: 12500000,
    balance_milli: 0,
    currency: 'USD',
  },
  {
    id: 'i10457',
    number: '10457',
    customerId: 'c39',
    customerName: 'Nairobi Water Works',
    date: '2026-05-06',
    due_date: '2026-06-05',
    state: 'issued',
    status: 'paid',
    total_milli: 4850000,
    paid_milli: 4850000,
    balance_milli: 0,
    currency: 'USD',
    quoteId: 'q1',
  },
  {
    id: 'i10458',
    number: '10458',
    customerId: 'c40',
    customerName: 'Apex Logistics Inc',
    date: '2026-05-19',
    due_date: '2026-06-03',
    state: 'issued',
    status: 'paid',
    total_milli: 2200000,
    paid_milli: 2200000,
    balance_milli: 0,
    currency: 'USD',
    quoteId: 'q2',
  },
  {
    id: 'i10459',
    number: '10459',
    customerId: 'c41',
    customerName: 'Zenith Holdings Ltd',
    date: '2026-06-03',
    due_date: '2026-07-03',
    state: 'issued',
    status: 'paid',
    total_milli: 1970000,
    paid_milli: 1970000,
    balance_milli: 0,
    currency: 'USD',
  },
  {
    id: 'i10460',
    number: '10460',
    customerId: 'c42',
    customerName: 'Coast Builders',
    date: '2026-06-21',
    due_date: '2026-07-21',
    state: 'issued',
    status: 'paid',
    total_milli: 590000,
    paid_milli: 590000,
    balance_milli: 0,
    currency: 'USD',
    quoteId: 'q3',
  },
  {
    id: 'i10461',
    number: '10461',
    customerId: 'c38',
    customerName: 'Acme Global Ltd',
    date: '2026-07-08',
    due_date: '2026-08-07',
    state: 'issued',
    status: 'paid',
    total_milli: 1200000,
    paid_milli: 1200000,
    balance_milli: 0,
    currency: 'USD',
  },
  {
    id: 'i10462',
    number: '10462',
    customerId: 'c43',
    customerName: 'Lido Seaside Hotel',
    date: '2026-07-22',
    due_date: '2026-08-06',
    state: 'issued',
    status: 'paid',
    total_milli: 926000,
    paid_milli: 926000,
    balance_milli: 0,
    currency: 'USD',
    quoteId: 'q5',
  },
  {
    id: 'i10463',
    number: '10463',
    customerId: 'c39',
    customerName: 'Nairobi Water Works',
    date: '2026-08-10',
    due_date: '2026-09-09',
    state: 'issued',
    status: 'partial',
    total_milli: 915000,
    paid_milli: 400000,
    balance_milli: 515000,
    currency: 'USD',
  },
  {
    id: 'i10464',
    number: '10464',
    customerId: 'c44',
    customerName: 'Waaberi Primary School',
    date: '2026-08-27',
    due_date: '2026-09-26',
    state: 'issued',
    status: 'paid',
    total_milli: 305000,
    paid_milli: 305000,
    balance_milli: 0,
    currency: 'USD',
  },
  {
    id: 'i10465',
    number: '10465',
    customerId: 'c40',
    customerName: 'Apex Logistics Inc',
    date: '2026-09-09',
    due_date: '2026-10-09',
    state: 'issued',
    status: 'paid',
    total_milli: 278000,
    paid_milli: 269000,
    balance_milli: 0,
    currency: 'USD',
  },
  {
    id: 'i10466',
    number: '10466',
    customerId: 'c41',
    customerName: 'Zenith Holdings Ltd',
    date: '2026-09-24',
    due_date: '2026-10-09',
    state: 'issued',
    status: 'overdue',
    total_milli: 850000,
    paid_milli: 0,
    balance_milli: 850000,
    currency: 'USD',
    daysLate: 22,
  },
  {
    id: 'i10467',
    number: '10467',
    customerId: 'c42',
    customerName: 'Coast Builders',
    date: '2026-10-05',
    due_date: '2026-11-04',
    state: 'issued',
    status: 'partial',
    total_milli: 1680000,
    paid_milli: 1000000,
    balance_milli: 680000,
    currency: 'USD',
  },
  {
    id: 'i10468',
    number: '10468',
    customerId: 'c38',
    customerName: 'Acme Global Ltd',
    date: '2026-10-14',
    due_date: '2026-10-28',
    state: 'issued',
    status: 'overdue',
    total_milli: 1450000,
    paid_milli: 0,
    balance_milli: 1450000,
    currency: 'USD',
    daysLate: 3,
  },
  {
    id: 'i10469',
    number: '10469',
    customerId: 'c40',
    customerName: 'Apex Logistics Inc',
    date: '2026-10-18',
    due_date: '2026-11-17',
    state: 'cancelled',
    status: 'cancelled',
    total_milli: 420000,
    paid_milli: 0,
    balance_milli: 0,
    currency: 'USD',
    cancelReason: 'Customer changed the order; replaced by quotation request.',
  },
  {
    id: 'i10470',
    number: '10470',
    customerId: 'c43',
    customerName: 'Lido Seaside Hotel',
    date: '2026-10-22',
    due_date: '2026-11-21',
    state: 'issued',
    status: 'paid',
    total_milli: 690000,
    paid_milli: 690000,
    balance_milli: 0,
    currency: 'USD',
    quoteId: 'q7',
  },
  {
    id: 'i10471',
    number: '10471',
    customerId: 'c44',
    customerName: 'Waaberi Primary School',
    date: '2026-10-28',
    due_date: '2026-11-12',
    state: 'issued',
    status: 'unpaid',
    total_milli: 489000,
    paid_milli: 0,
    balance_milli: 489000,
    currency: 'USD',
  },
  {
    id: 'idraft1',
    number: '',
    customerId: 'c39',
    customerName: 'Nairobi Water Works',
    date: '2026-10-30',
    due_date: '2026-11-29',
    state: 'draft',
    status: 'draft',
    total_milli: 360000,
    paid_milli: 0,
    balance_milli: 0,
    currency: 'USD',
  },
];

export const MOCK_PAYMENTS: MockPayment[] = [
  {
    id: 'p1',
    invoiceId: 'i10457',
    invoiceNumber: '10457',
    customerId: 'c39',
    customerName: 'Nairobi Water Works',
    date: '2026-05-28',
    amount_milli: 4850000,
    method: 'bank',
    reference: 'SSB-TRX-558201',
    currency: 'USD',
    receiptId: 'r1',
  },
  {
    id: 'p2',
    invoiceId: 'i10458',
    invoiceNumber: '10458',
    customerId: 'c40',
    customerName: 'Apex Logistics Inc',
    date: '2026-06-02',
    amount_milli: 2200000,
    method: 'mobile',
    reference: 'EVC-74120556',
    currency: 'USD',
    receiptId: 'r2',
  },
  {
    id: 'p3',
    invoiceId: 'i10459',
    invoiceNumber: '10459',
    customerId: 'c41',
    customerName: 'Zenith Holdings Ltd',
    date: '2026-06-10',
    amount_milli: 1970000,
    method: 'cash',
    reference: 'CASH-REC-10459',
    currency: 'USD',
    receiptId: 'r3',
  },
  {
    id: 'p4',
    invoiceId: 'i10460',
    invoiceNumber: '10460',
    customerId: 'c42',
    customerName: 'Coast Builders',
    date: '2026-07-05',
    amount_milli: 300000,
    method: 'bank',
    reference: 'SSB-TRX-560977',
    currency: 'USD',
    receiptId: 'r4',
  },
  {
    id: 'p5',
    invoiceId: 'i10460',
    invoiceNumber: '10460',
    customerId: 'c42',
    customerName: 'Coast Builders',
    date: '2026-07-30',
    amount_milli: 290000,
    method: 'bank',
    reference: 'SSB-TRX-563114',
    currency: 'USD',
    receiptId: 'r5',
  },
  {
    id: 'p6',
    invoiceId: 'i10461',
    invoiceNumber: '10461',
    customerId: 'c38',
    customerName: 'Acme Global Ltd',
    date: '2026-07-31',
    amount_milli: 1200000,
    method: 'bank',
    reference: 'SSB-TRX-563402',
    currency: 'USD',
    receiptId: 'r6',
  },
  {
    id: 'p7',
    invoiceId: 'i10462',
    invoiceNumber: '10462',
    customerId: 'c43',
    customerName: 'Lido Seaside Hotel',
    date: '2026-08-04',
    amount_milli: 926000,
    method: 'card',
    reference: 'POS-0088123',
    currency: 'USD',
    receiptId: 'r7',
  },
  {
    id: 'p8',
    invoiceId: 'i10463',
    invoiceNumber: '10463',
    customerId: 'c39',
    customerName: 'Nairobi Water Works',
    date: '2026-08-25',
    amount_milli: 400000,
    method: 'mobile',
    reference: 'EVC-75510932',
    currency: 'USD',
    receiptId: 'r8',
  },
  {
    id: 'p9',
    invoiceId: 'i10464',
    invoiceNumber: '10464',
    customerId: 'c44',
    customerName: 'Waaberi Primary School',
    date: '2026-09-15',
    amount_milli: 305000,
    method: 'mobile',
    reference: 'EVC-76002281',
    currency: 'USD',
    receiptId: 'r9',
  },
  {
    id: 'p10',
    invoiceId: 'i10465',
    invoiceNumber: '10465',
    customerId: 'c40',
    customerName: 'Apex Logistics Inc',
    date: '2026-10-02',
    amount_milli: 269000,
    method: 'bank',
    reference: 'SSB-TRX-569930',
    currency: 'USD',
    receiptId: 'r10',
  },
  {
    id: 'p11',
    invoiceId: 'i10467',
    invoiceNumber: '10467',
    customerId: 'c42',
    customerName: 'Coast Builders',
    date: '2026-10-20',
    amount_milli: 1000000,
    method: 'bank',
    reference: 'SSB-TRX-571206',
    currency: 'USD',
    receiptId: 'r11',
  },
  {
    id: 'p12',
    invoiceId: 'i10470',
    invoiceNumber: '10470',
    customerId: 'c43',
    customerName: 'Lido Seaside Hotel',
    date: '2026-10-29',
    amount_milli: 690000,
    method: 'mobile',
    reference: 'EVC-77219005',
    currency: 'USD',
    receiptId: 'r12',
  },
];

export const MOCK_RECEIPTS: MockReceipt[] = [
  {
    id: 'r1',
    number: 'RC-00001',
    date: '2026-05-28',
    invoiceId: 'i10457',
    invoiceNumber: '10457',
    customerId: 'c39',
    customerName: 'Nairobi Water Works',
    method: 'bank',
    reference: 'SSB-TRX-558201',
    amount_milli: 4850000,
    balanceAfter_milli: 0,
    currency: 'USD',
  },
  {
    id: 'r2',
    number: 'RC-00002',
    date: '2026-06-02',
    invoiceId: 'i10458',
    invoiceNumber: '10458',
    customerId: 'c40',
    customerName: 'Apex Logistics Inc',
    method: 'mobile',
    reference: 'EVC-74120556',
    amount_milli: 2200000,
    balanceAfter_milli: 0,
    currency: 'USD',
  },
  {
    id: 'r3',
    number: 'RC-00003',
    date: '2026-06-10',
    invoiceId: 'i10459',
    invoiceNumber: '10459',
    customerId: 'c41',
    customerName: 'Zenith Holdings Ltd',
    method: 'cash',
    reference: 'CASH-REC-10459',
    amount_milli: 1970000,
    balanceAfter_milli: 0,
    currency: 'USD',
  },
  {
    id: 'r4',
    number: 'RC-00004',
    date: '2026-07-05',
    invoiceId: 'i10460',
    invoiceNumber: '10460',
    customerId: 'c42',
    customerName: 'Coast Builders',
    method: 'bank',
    reference: 'SSB-TRX-560977',
    amount_milli: 300000,
    balanceAfter_milli: 290000,
    currency: 'USD',
  },
  {
    id: 'r5',
    number: 'RC-00005',
    date: '2026-07-30',
    invoiceId: 'i10460',
    invoiceNumber: '10460',
    customerId: 'c42',
    customerName: 'Coast Builders',
    method: 'bank',
    reference: 'SSB-TRX-563114',
    amount_milli: 290000,
    balanceAfter_milli: 0,
    currency: 'USD',
  },
  {
    id: 'r6',
    number: 'RC-00006',
    date: '2026-07-31',
    invoiceId: 'i10461',
    invoiceNumber: '10461',
    customerId: 'c38',
    customerName: 'Acme Global Ltd',
    method: 'bank',
    reference: 'SSB-TRX-563402',
    amount_milli: 1200000,
    balanceAfter_milli: 0,
    currency: 'USD',
  },
  {
    id: 'r7',
    number: 'RC-00007',
    date: '2026-08-04',
    invoiceId: 'i10462',
    invoiceNumber: '10462',
    customerId: 'c43',
    customerName: 'Lido Seaside Hotel',
    method: 'card',
    reference: 'POS-0088123',
    amount_milli: 926000,
    balanceAfter_milli: 0,
    currency: 'USD',
  },
  {
    id: 'r8',
    number: 'RC-00008',
    date: '2026-08-25',
    invoiceId: 'i10463',
    invoiceNumber: '10463',
    customerId: 'c39',
    customerName: 'Nairobi Water Works',
    method: 'mobile',
    reference: 'EVC-75510932',
    amount_milli: 400000,
    balanceAfter_milli: 515000,
    currency: 'USD',
  },
  {
    id: 'r9',
    number: 'RC-00009',
    date: '2026-09-15',
    invoiceId: 'i10464',
    invoiceNumber: '10464',
    customerId: 'c44',
    customerName: 'Waaberi Primary School',
    method: 'mobile',
    reference: 'EVC-76002281',
    amount_milli: 305000,
    balanceAfter_milli: 0,
    currency: 'USD',
  },
  {
    id: 'r10',
    number: 'RC-00010',
    date: '2026-10-02',
    invoiceId: 'i10465',
    invoiceNumber: '10465',
    customerId: 'c40',
    customerName: 'Apex Logistics Inc',
    method: 'bank',
    reference: 'SSB-TRX-569930',
    amount_milli: 269000,
    balanceAfter_milli: 0,
    currency: 'USD',
  },
  {
    id: 'r11',
    number: 'RC-00011',
    date: '2026-10-20',
    invoiceId: 'i10467',
    invoiceNumber: '10467',
    customerId: 'c42',
    customerName: 'Coast Builders',
    method: 'bank',
    reference: 'SSB-TRX-571206',
    amount_milli: 1000000,
    balanceAfter_milli: 680000,
    currency: 'USD',
  },
  {
    id: 'r12',
    number: 'RC-00012',
    date: '2026-10-29',
    invoiceId: 'i10470',
    invoiceNumber: '10470',
    customerId: 'c43',
    customerName: 'Lido Seaside Hotel',
    method: 'mobile',
    reference: 'EVC-77219005',
    amount_milli: 690000,
    balanceAfter_milli: 0,
    currency: 'USD',
  },
];

let nextReceiptSeq = 13;

export function toBase(amount_milli: number, currency = 'USD'): number {
  if (currency === 'SOS') {
    return Math.round(amount_milli / 571);
  }
  return amount_milli;
}

export function niceStep(x: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  const n = x / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

export function lastMonths(n: number, fromDate = TODAY): string[] {
  const out: string[] = [];
  const d = new Date(fromDate + 'T00:00:00Z');
  d.setUTCDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setUTCMonth(x.getUTCMonth() - i);
    out.push(x.toISOString().slice(0, 7));
  }
  return out;
}

/**
 * Computes live navigation counts matching prototype `navCounts()`
 */
export function computeNavCounts() {
  const openQ = MOCK_QUOTES.filter((q) => q.state === 'draft' || q.state === 'sent').length;
  const overdue = MOCK_INVOICES.filter((i) => i.status === 'overdue' && i.balance_milli > 0).length;
  return { openQ, overdue };
}

/**
 * Computes live dashboard financial metrics matching prototype `vDashboard()`
 */
export function computeDashboardKPIs() {
  const issued = MOCK_INVOICES.filter((i) => i.state !== 'draft' && i.state !== 'cancelled');
  const received = MOCK_PAYMENTS.reduce((sum, p) => sum + toBase(p.amount_milli, p.currency), 0);
  const outstanding = issued.reduce((sum, i) => sum + toBase(i.balance_milli, i.currency), 0);
  const overdue = issued.filter((i) => i.status === 'overdue' && i.balance_milli > 0);
  const overdueAmt = overdue.reduce((sum, i) => sum + toBase(i.balance_milli, i.currency), 0);

  const currentMonthKey = TODAY.slice(0, 7);
  const thisMonth = MOCK_PAYMENTS
    .filter((p) => p.date.slice(0, 7) === currentMonthKey)
    .reduce((sum, p) => sum + toBase(p.amount_milli, p.currency), 0);

  const accepted = MOCK_QUOTES.filter((q) => q.state === 'accepted').length;
  const decided = MOCK_QUOTES.filter((q) => ['accepted', 'rejected', 'expired'].includes(q.state)).length;
  const winRate = decided ? Math.round((accepted / decided) * 100) : 0;

  const draftCount = MOCK_INVOICES.filter((i) => i.state === 'draft').length;
  const cancelledCount = MOCK_INVOICES.filter((i) => i.state === 'cancelled').length;
  const openInvoicesCount = issued.filter((i) => i.balance_milli > 0).length;

  return {
    totalQuotes: MOCK_QUOTES.length,
    winRate,
    issuedInvoices: issued.length,
    draftCount,
    cancelledCount,
    received,
    thisMonth,
    outstanding,
    openInvoicesCount,
    overdueAmt,
    overdueCount: overdue.length,
  };
}

/**
 * Computes 12-month rolling invoiced vs received revenue arrays
 */
export function compute12MonthRevenue() {
  const months = lastMonths(12, TODAY);
  const issued = MOCK_INVOICES.filter((i) => i.state !== 'draft' && i.state !== 'cancelled');

  const invoiced = months.map((m) =>
    issued
      .filter((i) => i.date.slice(0, 7) === m)
      .reduce((sum, i) => sum + toBase(i.total_milli, i.currency), 0)
  );

  const received = months.map((m) =>
    MOCK_PAYMENTS
      .filter((p) => p.date.slice(0, 7) === m)
      .reduce((sum, p) => sum + toBase(p.amount_milli, p.currency), 0)
  );

  return { months, invoiced, received };
}

/**
 * Computes invoice status breakdown for proportional stack bar
 */
export function computeInvoiceStatusDistribution() {
  const issued = MOCK_INVOICES.filter((i) => i.state !== 'draft' && i.state !== 'cancelled');
  const statuses = ['paid', 'partial', 'sent', 'unpaid', 'overdue'] as const;

  const statusLabels: Record<string, string> = {
    paid: 'Paid',
    partial: 'Partially paid',
    sent: 'Sent',
    unpaid: 'Unpaid',
    overdue: 'Overdue',
  };

  const colors: Record<string, string> = {
    paid: 'var(--ok)',
    partial: 'var(--warn)',
    sent: 'var(--info)',
    unpaid: 'var(--accent)',
    overdue: 'var(--bad)',
  };

  const byStatus = statuses
    .map((s) => {
      const list = issued.filter((i) => i.status === s);
      return {
        s,
        label: statusLabels[s],
        n: list.length,
        amt: list.reduce((sum, i) => sum + toBase(i.total_milli, i.currency), 0),
        color: colors[s],
      };
    })
    .filter((x) => x.n > 0);

  const totalN = byStatus.reduce((sum, x) => sum + x.n, 0) || 1;

  return { byStatus, totalN, totalIssued: issued.length };
}

export interface RecentTransactionItem {
  date: string;
  kind: 'Payment' | 'Invoice' | 'Quotation';
  ref: string;
  customerId: string;
  customerName: string;
  amt: number;
  cur: string;
  href: string;
  sub: string;
  isPayment: boolean;
  tab: 'receipts' | 'invoices' | 'quotations';
}

const METHOD_LABELS: Record<string, string> = {
  bank: 'Bank transfer',
  mobile: 'Mobile money',
  cash: 'Cash',
  card: 'Credit / debit card',
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  unpaid: 'Unpaid',
  partial: 'Partially paid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
};

/**
 * Combines Payments, Invoices, and Quotations into a single descending transaction feed
 */
export function getRecentTransactions(): RecentTransactionItem[] {
  const issued = MOCK_INVOICES.filter((i) => i.state !== 'draft' && i.state !== 'cancelled');

  const payments: RecentTransactionItem[] = MOCK_PAYMENTS.map((p) => ({
    date: p.date,
    kind: 'Payment',
    ref: p.invoiceNumber,
    customerId: p.customerId,
    customerName: p.customerName,
    amt: p.amount_milli,
    cur: p.currency,
    href: `#receipt-${p.receiptId}`,
    sub: METHOD_LABELS[p.method] || p.method,
    isPayment: true,
    tab: 'receipts',
  }));

  const invoices: RecentTransactionItem[] = issued.map((i) => ({
    date: i.date,
    kind: 'Invoice',
    ref: i.number,
    customerId: i.customerId,
    customerName: i.customerName,
    amt: i.total_milli,
    cur: i.currency,
    href: `#invoice-${i.id}`,
    sub: INVOICE_STATUS_LABELS[i.status] || i.status,
    isPayment: false,
    tab: 'invoices',
  }));

  const quotes: RecentTransactionItem[] = MOCK_QUOTES.filter((q) => q.state !== 'draft').map((q) => ({
    date: q.date,
    kind: 'Quotation',
    ref: q.number,
    customerId: q.customerId,
    customerName: q.customerName,
    amt: q.total_milli,
    cur: q.currency,
    href: `#quote-${q.id}`,
    sub: QUOTE_STATUS_LABELS[q.state] || q.state,
    isPayment: false,
    tab: 'quotations',
  }));

  return [...payments, ...invoices, ...quotes]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);
}

/**
 * Atomically records a payment and creates a corresponding receipt
 */
export function recordPayment(data: {
  invoiceId: string;
  amount_milli: number;
  date: string;
  method: string;
  reference: string;
}): MockReceipt {
  const inv = MOCK_INVOICES.find((i) => i.id === data.invoiceId);
  if (!inv) throw new Error('Invoice not found');

  const pid = `p_${Date.now()}`;
  const rid = `r_${Date.now()}`;
  const receiptNum = `RC-${String(nextReceiptSeq++).padStart(5, '0')}`;

  const payment: MockPayment = {
    id: pid,
    invoiceId: inv.id,
    invoiceNumber: inv.number,
    customerId: inv.customerId,
    customerName: inv.customerName,
    date: data.date,
    amount_milli: data.amount_milli,
    method: data.method,
    reference: data.reference,
    currency: inv.currency,
    receiptId: rid,
  };

  const prevBalance = inv.balance_milli;
  const balanceAfter = Math.max(0, prevBalance - data.amount_milli);

  const receipt: MockReceipt = {
    id: rid,
    number: receiptNum,
    date: data.date,
    invoiceId: inv.id,
    invoiceNumber: inv.number,
    customerId: inv.customerId,
    customerName: inv.customerName,
    method: data.method,
    reference: data.reference,
    amount_milli: data.amount_milli,
    balanceAfter_milli: balanceAfter,
    currency: inv.currency,
  };

  // Mutate state atomically
  inv.paid_milli += data.amount_milli;
  inv.balance_milli = balanceAfter;
  inv.status = balanceAfter <= 0 ? 'paid' : 'partial';

  MOCK_PAYMENTS.unshift(payment);
  MOCK_RECEIPTS.unshift(receipt);

  return receipt;
}

export interface SearchResultItem {
  id: string;
  tab: 'invoices' | 'quotations' | 'receipts' | 'customers';
  title: string;
  subtitle: string;
}

/**
 * Global Search query evaluator matching prototype lines 1024-1026
 */
export function searchAllRecords(query: string): SearchResultItem[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: SearchResultItem[] = [];

  // 1. Search Invoices
  for (const inv of MOCK_INVOICES) {
    if ((inv.number + ' ' + inv.customerName).toLowerCase().includes(q)) {
      results.push({
        id: inv.id,
        tab: 'invoices',
        title: `Invoice ${inv.number}`,
        subtitle: inv.customerName,
      });
    }
  }

  // 2. Search Quotations
  for (const quote of MOCK_QUOTES) {
    if ((quote.number + ' ' + quote.customerName).toLowerCase().includes(q)) {
      results.push({
        id: quote.id,
        tab: 'quotations',
        title: `Quotation ${quote.number}`,
        subtitle: quote.customerName,
      });
    }
  }

  // 3. Search Receipts
  for (const rec of MOCK_RECEIPTS) {
    if ((rec.number + ' ' + rec.reference + ' ' + rec.customerName).toLowerCase().includes(q)) {
      results.push({
        id: rec.id,
        tab: 'receipts',
        title: `Receipt ${rec.number}`,
        subtitle: `${rec.customerName} (${rec.method})`,
      });
    }
  }

  // 4. Search Customers
  for (const cust of MOCK_CUSTOMERS) {
    if ((cust.name + ' ' + cust.phone + ' ' + cust.code).toLowerCase().includes(q)) {
      results.push({
        id: cust.id,
        tab: 'customers',
        title: cust.name,
        subtitle: `Customer #${cust.code} · ${cust.phone}`,
      });
    }
  }

  return results.slice(0, 10);
}
