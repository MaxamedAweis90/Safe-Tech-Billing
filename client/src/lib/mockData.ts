/**
 * Safe Tech Billing — Central Mock Data Store & Calculation Engine
 * Strictly aligned with `./plan/Safe Tech Billing (3).html` seed data & financial math.
 */

import { totalsOf, addDays, fmtNumber, qStatus, formatMoney } from './formatters';
import { PROTOTYPE_LOGO, PROTOTYPE_STAMP } from '../features/documents/brandingAssets';
import { useAuthStore, ROLES } from '../store/useAuthStore';

const realDateStr = new Date().toISOString().slice(0, 10);
export const TODAY = realDateStr > '2026-10-31' ? realDateStr : '2026-10-31';

export const CATALOG_ITEMS: [string, number][] = [
  ['Premium Office Tissue Holder', 11500],
  ['Modern Desk Bin', 19500],
  ['Gaming Head Phones', 27500],
  ['Office Door Signs', 27500],
  ['Vaccination Record Cards', 250],
  ['DVD Holder Pockets', 150],
  ['Noteable Stickers', 1300],
  ['Hard-Disk 512 SSD', 43000],
  ['Hard Disk Drive Mounting Bracket', 16500],
  ['A-Tech 12 GB RAM Compatible', 37500],
  ['Laptop Core i5, 14-inch', 420000],
  ['Installation & setup (per hour)', 15000],
  ['CCTV Camera 4MP', 65000],
  ['Network cabling (per point)', 25000],
  ['Wireless Router AC1200', 45000],
  ['UPS 1200VA', 110000],
  ['HP LaserJet Toner 85A', 38000],
  ['A4 Paper Ream', 4500],
  ['Annual IT Support Contract', 1200000],
];

export const TAX_RATES = [
  { id: 'none', name: 'No tax', rate: 0 },
  { id: 'st5', name: 'Sales tax 5%', rate: 5 },
  { id: 'svc10', name: 'Service tax 10%', rate: 10 },
];

export const QUOTE_TERMS =
  'Prices are valid for 30 days from the quotation date.\nDelivery within 7 working days of order confirmation.\n50% deposit required for orders above $1,000.';

export const INVOICE_TERMS =
  'Make all checks payable to SAFE TECH SOLUTIONS.\nPlease quote the invoice number as your payment reference.';

export interface MockCustomer {
  id: string;
  code: number;
  name: string;
  attn: string;
  address?: string;
  phone: string;
  email: string;
  currency: string;
  taxId?: string;
  since?: string;
}

export interface MockQuoteItem {
  desc: string;
  qty: number;
  price: number;
  disc: number;
  taxRate: number;
  taxName: string;
}

export interface MockQuote {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  date: string;
  expiry: string;
  expiry_date?: string;
  state: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  currency: string;
  items: MockQuoteItem[];
  terms: string;
  notes?: string;
  total_milli: number;
  invoiceId?: string;
  invoiceNumber?: string;
  rejectReason?: string;
  createdAt?: string;
}

export interface SystemCurrency {
  code: string;
  symbol: string;
  decimals: number;
  rate: number;
}

export interface SystemTax {
  id: string;
  name: string;
  rate: number;
}

export interface SystemSettings {
  company: {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    taxId: string;
    bankName: string;
    accountName: string;
    accountNo: string;
    mobileMoney: string;
    signatory: string;
    logo: string;
    stamp: string;
    signature: string;
  };
  currencies: SystemCurrency[];
  defaultCurrency: string;
  numbering: {
    quote: string;
    invoice: string;
    receipt: string;
    credit: string;
  };
  seq: {
    quote: number;
    invoice: number;
    receipt: number;
    credit: number;
  };
  taxes: SystemTax[];
  quoteTerms: string;
  invoiceTerms: string;
}

export const COMPANY_SETTINGS = {
  name: 'SAFE TECH SOLUTIONS',
  tagline: 'Innovator in Electronics',
  address: 'Bakara Howlwadag, Mogadishu, Banadir 252',
  phone: '+252 61 4 324 507',
  email: 'info@sayftek.com',
  website: 'www.sayftek.com',
  taxId: '',
  bankName: 'SALAAM SOMALI BANK',
  accountName: 'SAFE TECH SOLUTIONS',
  accountNo: '33354053',
  mobileMoney: 'EVC Plus: +252 61 4 324 507',
  signatory: 'Authorized Signatory',
  logo: PROTOTYPE_LOGO,
  stamp: PROTOTYPE_STAMP,
  signature: '',
};

export const SYSTEM_SETTINGS: SystemSettings = {
  company: COMPANY_SETTINGS,
  currencies: [
    { code: 'USD', symbol: '$', decimals: 2, rate: 1 },
    { code: 'SOS', symbol: 'Sh.So.', decimals: 0, rate: 571 },
  ],
  defaultCurrency: 'USD',
  numbering: {
    quote: 'QT-{YYYY}-{SEQ4}',
    invoice: '{SEQ}',
    receipt: 'RC-{SEQ5}',
    credit: 'CN-{SEQ4}',
  },
  seq: {
    quote: 10,
    invoice: 10471,
    receipt: 12,
    credit: 1,
  },
  taxes: [
    { id: 'none', name: 'No tax', rate: 0 },
    { id: 'st5', name: 'Sales tax 5%', rate: 5 },
    { id: 'svc10', name: 'Service tax 10%', rate: 10 },
  ],
  quoteTerms: QUOTE_TERMS,
  invoiceTerms: INVOICE_TERMS,
};

export const INVOICE_TERMS_PRESETS: [number, string][] = [
  [0, 'Due on receipt'],
  [7, 'Net 7'],
  [15, 'Net 15'],
  [30, 'Net 30'],
  [45, 'Net 45'],
  [60, 'Net 60'],
];

export interface MockInvoice {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  date: string;
  due: string;
  due_date?: string;
  termsDays?: number;
  state: 'draft' | 'issued' | 'cancelled';
  status: 'draft' | 'sent' | 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  items: MockQuoteItem[];
  terms: string;
  notes?: string;
  currency: string;
  total_milli: number;
  paid_milli: number;
  credited_milli?: number;
  balance_milli: number;
  daysLate?: number;
  quoteId?: string;
  sentAt?: string | null;
  issuedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
}

export interface MockCreditNote {
  id: string;
  number: string;
  invoiceId: string;
  amount: number;
  reason: string;
  date: string;
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
  paymentId?: string;
  amount?: number;
  balanceAfter?: number;
  invoiceTotal?: number;
  prevPaid?: number;
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
    name: 'Dr. SUMAIT Hospital - SIMAD University',
    attn: 'N/A',
    address: 'Wadadda Albarako, Hodan\nMogadishu, Banadir 252',
    phone: '252 613 939 999',
    email: '',
    currency: 'USD',
    taxId: '',
    since: '2024-03-01',
  },
  {
    id: 'c39',
    code: 1002,
    name: 'Hodan Medical Centre',
    attn: 'Procurement Office',
    address: 'Maka Al Mukarama Rd, Hodan\nMogadishu',
    phone: '252 61 550 1210',
    email: 'procurement@hodanmedical.example',
    currency: 'USD',
    taxId: 'TIN-118204',
    since: '2026-04-12',
  },
  {
    id: 'c40',
    code: 1003,
    name: 'Shabelle Logistics Ltd',
    attn: 'Ayaan Warsame',
    address: 'KM4 Junction, Wadajir\nMogadishu',
    phone: '252 61 770 3345',
    email: 'accounts@shabelle-logistics.example',
    currency: 'USD',
    taxId: 'TIN-207719',
    since: '2026-05-02',
  },
  {
    id: 'c41',
    code: 1004,
    name: 'Jazeera Coffee House',
    attn: 'Owner',
    address: 'Jazeera Beach Rd, Wadajir\nMogadishu',
    phone: '252 61 802 4417',
    email: 'hello@jazeeracoffee.example',
    currency: 'USD',
    taxId: '',
    since: '2026-05-20',
  },
  {
    id: 'c42',
    code: 1005,
    name: 'Bakaara Traders Co.',
    attn: 'Finance Dept.',
    address: 'Bakaara Market, Howlwadaag\nMogadishu',
    phone: '252 61 311 9020',
    email: 'finance@bakaaratraders.example',
    currency: 'USD',
    taxId: 'TIN-330051',
    since: '2026-06-01',
  },
  {
    id: 'c43',
    code: 1006,
    name: 'Lido Seaside Hotel',
    attn: 'General Manager',
    address: 'Lido Beach, Abdiaziz\nMogadishu',
    phone: '252 61 640 7788',
    email: 'gm@lidoseaside.example',
    currency: 'USD',
    taxId: 'TIN-441903',
    since: '2026-06-25',
  },
  {
    id: 'c44',
    code: 1007,
    name: 'Waaberi Primary School',
    attn: 'Head Teacher',
    address: 'Waaberi District\nMogadishu',
    phone: '252 61 905 1132',
    email: 'office@waaberischool.example',
    currency: 'USD',
    taxId: '',
    since: '2026-08-01',
  },
  {
    id: 'c45',
    code: 1008,
    name: 'Benadir Engineering Works',
    attn: 'Eng. Mahad Osman',
    address: 'Industrial Rd, Dayniile\nMogadishu',
    phone: '252 61 287 6604',
    email: 'mahad@benadireng.example',
    currency: 'USD',
    taxId: 'TIN-512276',
    since: '2026-06-28',
  },
];

export const MOCK_QUOTES: MockQuote[] = [
  {
    id: 'q1',
    number: 'QT-2026-0001',
    customerId: 'c39',
    customerName: 'Hodan Medical Centre',
    date: '2026-05-02',
    expiry: '2026-06-01',
    expiry_date: '2026-06-01',
    state: 'accepted',
    currency: 'USD',
    items: [
      { desc: 'Laptop Core i5, 14-inch', qty: 3, price: 420000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Installation & setup (per hour)', qty: 4, price: 15000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: QUOTE_TERMS,
    notes: '',
    total_milli: 1320000,
    invoiceId: 'i10457',
    invoiceNumber: '10457',
    createdAt: '2026-05-02',
  },
  {
    id: 'q2',
    number: 'QT-2026-0002',
    customerId: 'c40',
    customerName: 'Shabelle Logistics Ltd',
    date: '2026-05-14',
    expiry: '2026-06-13',
    expiry_date: '2026-06-13',
    state: 'accepted',
    currency: 'USD',
    items: [
      { desc: 'CCTV Camera 4MP', qty: 8, price: 65000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Network cabling (per point)', qty: 8, price: 25000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Installation & setup (per hour)', qty: 6, price: 15000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: QUOTE_TERMS,
    notes: '',
    total_milli: 810000,
    invoiceId: 'i10458',
    invoiceNumber: '10458',
    createdAt: '2026-05-14',
  },
  {
    id: 'q3',
    number: 'QT-2026-0003',
    customerId: 'c42',
    customerName: 'Bakaara Traders Co.',
    date: '2026-06-15',
    expiry: '2026-07-15',
    expiry_date: '2026-07-15',
    state: 'accepted',
    currency: 'USD',
    items: [
      { desc: 'UPS 1200VA', qty: 5, price: 110000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Wireless Router AC1200', qty: 2, price: 45000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: QUOTE_TERMS,
    notes: '',
    total_milli: 640000,
    invoiceId: 'i10460',
    invoiceNumber: '10460',
    createdAt: '2026-06-15',
  },
  {
    id: 'q4',
    number: 'QT-2026-0004',
    customerId: 'c45',
    customerName: 'Benadir Engineering Works',
    date: '2026-07-02',
    expiry: '2026-08-01',
    expiry_date: '2026-08-01',
    state: 'rejected',
    currency: 'USD',
    items: [
      { desc: 'Laptop Core i5, 14-inch', qty: 10, price: 420000, disc: 8, taxRate: 0, taxName: '' },
      { desc: 'Installation & setup (per hour)', qty: 12, price: 15000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: QUOTE_TERMS,
    notes: '',
    rejectReason: 'Competitor offered a lower total price and faster delivery schedule.',
    total_milli: 4044000,
    createdAt: '2026-07-02',
  },
  {
    id: 'q5',
    number: 'QT-2026-0005',
    customerId: 'c43',
    customerName: 'Lido Seaside Hotel',
    date: '2026-07-18',
    expiry: '2026-08-17',
    expiry_date: '2026-08-17',
    state: 'accepted',
    currency: 'USD',
    items: [
      { desc: 'Laptop Core i5, 14-inch', qty: 2, price: 420000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Hard-Disk 512 SSD', qty: 2, price: 43000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: QUOTE_TERMS,
    notes: '',
    total_milli: 926000,
    invoiceId: 'i10462',
    invoiceNumber: '10462',
    createdAt: '2026-07-18',
  },
  {
    id: 'q6',
    number: 'QT-2026-0006',
    customerId: 'c41',
    customerName: 'Jazeera Coffee House',
    date: '2026-08-20',
    expiry: '2026-09-19',
    expiry_date: '2026-09-19',
    state: 'sent',
    currency: 'USD',
    items: [
      { desc: 'UPS 1200VA', qty: 4, price: 110000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Installation & setup (per hour)', qty: 2, price: 15000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: QUOTE_TERMS,
    notes: '',
    total_milli: 470000,
    createdAt: '2026-08-20',
  },
  {
    id: 'q7',
    number: 'QT-2026-0007',
    customerId: 'c43',
    customerName: 'Lido Seaside Hotel',
    date: '2026-10-15',
    expiry: '2026-11-14',
    expiry_date: '2026-11-14',
    state: 'accepted',
    currency: 'USD',
    items: [
      { desc: 'Wireless Router AC1200', qty: 6, price: 45000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Network cabling (per point)', qty: 12, price: 25000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Installation & setup (per hour)', qty: 8, price: 15000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: QUOTE_TERMS,
    notes: '',
    total_milli: 690000,
    invoiceId: 'i10470',
    invoiceNumber: '10470',
    createdAt: '2026-10-15',
  },
  {
    id: 'q8',
    number: 'QT-2026-0008',
    customerId: 'c45',
    customerName: 'Benadir Engineering Works',
    date: '2026-10-20',
    expiry: '2026-11-19',
    expiry_date: '2026-11-19',
    state: 'sent',
    currency: 'USD',
    items: [
      { desc: 'CCTV Camera 4MP', qty: 16, price: 65000, disc: 5, taxRate: 0, taxName: '' },
      { desc: 'Network cabling (per point)', qty: 16, price: 25000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Installation & setup (per hour)', qty: 12, price: 15000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: QUOTE_TERMS,
    notes: '',
    total_milli: 1568000,
    createdAt: '2026-10-20',
  },
  {
    id: 'q9',
    number: 'QT-2026-0009',
    customerId: 'c38',
    customerName: 'Dr. SUMAIT Hospital - SIMAD University',
    date: '2026-10-27',
    expiry: '2026-11-26',
    expiry_date: '2026-11-26',
    state: 'accepted',
    currency: 'USD',
    items: [
      { desc: 'Annual IT Support Contract', qty: 1, price: 1200000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'HP LaserJet Toner 85A', qty: 5, price: 38000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: QUOTE_TERMS,
    notes: '',
    total_milli: 1390000,
    createdAt: '2026-10-27',
  },
  {
    id: 'q10',
    number: 'QT-2026-0010',
    customerId: 'c44',
    customerName: 'Waaberi Primary School',
    date: '2026-10-31',
    expiry: '2026-11-30',
    expiry_date: '2026-11-30',
    state: 'draft',
    currency: 'USD',
    items: [
      { desc: 'Wireless Router AC1200', qty: 2, price: 45000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Installation & setup (per hour)', qty: 2, price: 15000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: QUOTE_TERMS,
    notes: '',
    total_milli: 120000,
    createdAt: '2026-10-31',
  },
];

export const MOCK_CREDITS: MockCreditNote[] = [
  {
    id: 'cn1',
    number: 'CN-0001',
    invoiceId: 'i10465',
    amount: 9000,
    reason: '2 reams of A4 paper returned damaged',
    date: '2026-09-20',
  },
];

export const MOCK_INVOICES: MockInvoice[] = [
  {
    id: 'i10456',
    number: '10456',
    customerId: 'c38',
    customerName: 'Dr. SUMAIT Hospital - SIMAD University',
    date: '2024-03-26',
    due: '2024-04-25',
    due_date: '2024-04-25',
    termsDays: 30,
    state: 'issued',
    status: 'paid',
    items: [
      { desc: 'Premium Office Tissue Holder', qty: 2, price: 11500, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Modern Desk Bin', qty: 2, price: 19500, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Gaming Head Phones', qty: 1, price: 27500, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Office Door Signs', qty: 1, price: 27500, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Vaccination Record Cards', qty: 200, price: 250, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'DVD Holder Pockets', qty: 300, price: 150, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Noteable Stickers', qty: 45, price: 1300, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Hard-Disk 512 SSD', qty: 1, price: 43000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Hard Disk Drive Mounting Bracket', qty: 1, price: 16500, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'A-Tech 12 GB RAM Compatible', qty: 1, price: 37500, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 12500000,
    paid_milli: 12500000,
    balance_milli: 0,
    currency: 'USD',
    sentAt: null,
    issuedAt: '2024-03-26',
  },
  {
    id: 'i10457',
    number: '10457',
    customerId: 'c39',
    customerName: 'Hodan Medical Centre',
    date: '2026-05-06',
    due: '2026-06-05',
    due_date: '2026-06-05',
    termsDays: 30,
    state: 'issued',
    status: 'paid',
    items: [
      { desc: 'Laptop Core i5, 14-inch', qty: 3, price: 420000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Installation & setup (per hour)', qty: 4, price: 15000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 1320000,
    paid_milli: 1320000,
    balance_milli: 0,
    currency: 'USD',
    quoteId: 'q1',
    sentAt: '2026-05-06',
    issuedAt: '2026-05-06',
  },
  {
    id: 'i10458',
    number: '10458',
    customerId: 'c40',
    customerName: 'Shabelle Logistics Ltd',
    date: '2026-05-19',
    due: '2026-06-03',
    due_date: '2026-06-03',
    termsDays: 15,
    state: 'issued',
    status: 'paid',
    items: [
      { desc: 'CCTV Camera 4MP', qty: 8, price: 65000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Network cabling (per point)', qty: 8, price: 25000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Installation & setup (per hour)', qty: 6, price: 15000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 810000,
    paid_milli: 810000,
    balance_milli: 0,
    currency: 'USD',
    quoteId: 'q2',
    sentAt: '2026-05-19',
    issuedAt: '2026-05-19',
  },
  {
    id: 'i10459',
    number: '10459',
    customerId: 'c41',
    customerName: 'Jazeera Coffee House',
    date: '2026-06-03',
    due: '2026-07-03',
    due_date: '2026-07-03',
    termsDays: 30,
    state: 'issued',
    status: 'paid',
    items: [
      { desc: 'A4 Paper Ream', qty: 40, price: 4500, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'HP LaserJet Toner 85A', qty: 4, price: 38000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 332000,
    paid_milli: 332000,
    balance_milli: 0,
    currency: 'USD',
    sentAt: '2026-06-03',
    issuedAt: '2026-06-03',
  },
  {
    id: 'i10460',
    number: '10460',
    customerId: 'c42',
    customerName: 'Bakaara Traders Co.',
    date: '2026-06-21',
    due: '2026-07-21',
    due_date: '2026-07-21',
    termsDays: 30,
    state: 'issued',
    status: 'paid',
    items: [
      { desc: 'UPS 1200VA', qty: 5, price: 110000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Wireless Router AC1200', qty: 2, price: 45000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 640000,
    paid_milli: 640000,
    balance_milli: 0,
    currency: 'USD',
    quoteId: 'q3',
    sentAt: '2026-06-21',
    issuedAt: '2026-06-21',
  },
  {
    id: 'i10461',
    number: '10461',
    customerId: 'c38',
    customerName: 'Dr. SUMAIT Hospital - SIMAD University',
    date: '2026-07-08',
    due: '2026-08-07',
    due_date: '2026-08-07',
    termsDays: 30,
    state: 'issued',
    status: 'paid',
    items: [
      { desc: 'Annual IT Support Contract', qty: 1, price: 1200000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 1200000,
    paid_milli: 1200000,
    balance_milli: 0,
    currency: 'USD',
    sentAt: '2026-07-08',
    issuedAt: '2026-07-08',
  },
  {
    id: 'i10462',
    number: '10462',
    customerId: 'c43',
    customerName: 'Lido Seaside Hotel',
    date: '2026-07-22',
    due: '2026-08-06',
    due_date: '2026-08-06',
    termsDays: 15,
    state: 'issued',
    status: 'paid',
    items: [
      { desc: 'Laptop Core i5, 14-inch', qty: 2, price: 420000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Hard-Disk 512 SSD', qty: 2, price: 43000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 926000,
    paid_milli: 926000,
    balance_milli: 0,
    currency: 'USD',
    quoteId: 'q5',
    sentAt: '2026-07-22',
    issuedAt: '2026-07-22',
  },
  {
    id: 'i10463',
    number: '10463',
    customerId: 'c39',
    customerName: 'Hodan Medical Centre',
    date: '2026-08-10',
    due: '2026-09-09',
    due_date: '2026-09-09',
    termsDays: 30,
    state: 'issued',
    status: 'partial',
    items: [
      { desc: 'Network cabling (per point)', qty: 24, price: 25000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Wireless Router AC1200', qty: 3, price: 45000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Installation & setup (per hour)', qty: 10, price: 15000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 885000,
    paid_milli: 400000,
    balance_milli: 485000,
    currency: 'USD',
    sentAt: '2026-08-10',
    issuedAt: '2026-08-10',
  },
  {
    id: 'i10464',
    number: '10464',
    customerId: 'c44',
    customerName: 'Waaberi Primary School',
    date: '2026-08-27',
    due: '2026-09-26',
    due_date: '2026-09-26',
    termsDays: 30,
    state: 'issued',
    status: 'paid',
    items: [
      { desc: 'CCTV Camera 4MP', qty: 4, price: 65000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Installation & setup (per hour)', qty: 3, price: 15000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 305000,
    paid_milli: 305000,
    balance_milli: 0,
    currency: 'USD',
    sentAt: '2026-08-27',
    issuedAt: '2026-08-27',
  },
  {
    id: 'i10465',
    number: '10465',
    customerId: 'c40',
    customerName: 'Shabelle Logistics Ltd',
    date: '2026-09-09',
    due: '2026-10-09',
    due_date: '2026-10-09',
    termsDays: 30,
    state: 'issued',
    status: 'paid',
    items: [
      { desc: 'UPS 1200VA', qty: 2, price: 110000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'A4 Paper Ream', qty: 20, price: 4500, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 310000,
    paid_milli: 301000,
    balance_milli: 0,
    currency: 'USD',
    sentAt: '2026-09-09',
    issuedAt: '2026-09-09',
  },
  {
    id: 'i10466',
    number: '10466',
    customerId: 'c41',
    customerName: 'Jazeera Coffee House',
    date: '2026-09-24',
    due: '2026-10-09',
    due_date: '2026-10-09',
    termsDays: 15,
    state: 'issued',
    status: 'overdue',
    items: [
      { desc: 'HP LaserJet Toner 85A', qty: 6, price: 38000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Office Door Signs', qty: 6, price: 27500, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 393000,
    paid_milli: 0,
    balance_milli: 393000,
    currency: 'USD',
    daysLate: 22,
    sentAt: '2026-09-24',
    issuedAt: '2026-09-24',
  },
  {
    id: 'i10467',
    number: '10467',
    customerId: 'c42',
    customerName: 'Bakaara Traders Co.',
    date: '2026-10-05',
    due: '2026-11-04',
    due_date: '2026-11-04',
    termsDays: 30,
    state: 'issued',
    status: 'partial',
    items: [
      { desc: 'Laptop Core i5, 14-inch', qty: 4, price: 420000, disc: 5, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 1596000,
    paid_milli: 1000000,
    balance_milli: 596000,
    currency: 'USD',
    sentAt: '2026-10-05',
    issuedAt: '2026-10-05',
  },
  {
    id: 'i10468',
    number: '10468',
    customerId: 'c38',
    customerName: 'Dr. SUMAIT Hospital - SIMAD University',
    date: '2026-10-14',
    due: '2026-11-13',
    due_date: '2026-11-13',
    termsDays: 30,
    state: 'issued',
    status: 'overdue',
    items: [
      { desc: 'Vaccination Record Cards', qty: 500, price: 250, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Noteable Stickers', qty: 60, price: 1300, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Premium Office Tissue Holder', qty: 4, price: 11500, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 249000,
    paid_milli: 0,
    balance_milli: 249000,
    currency: 'USD',
    daysLate: 3,
    sentAt: '2026-10-14',
    issuedAt: '2026-10-14',
  },
  {
    id: 'i10469',
    number: '10469',
    customerId: 'c40',
    customerName: 'Shabelle Logistics Ltd',
    date: '2026-10-18',
    due: '2026-11-17',
    due_date: '2026-11-17',
    termsDays: 30,
    state: 'cancelled',
    status: 'cancelled',
    items: [
      { desc: 'Laptop Core i5, 14-inch', qty: 1, price: 420000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 420000,
    paid_milli: 0,
    balance_milli: 0,
    currency: 'USD',
    cancelReason: 'Customer changed the order; replaced by quotation request.',
    cancelledAt: '2026-10-19',
    sentAt: '2026-10-18',
    issuedAt: '2026-10-18',
  },
  {
    id: 'i10470',
    number: '10470',
    customerId: 'c43',
    customerName: 'Lido Seaside Hotel',
    date: '2026-10-22',
    due: '2026-11-21',
    due_date: '2026-11-21',
    termsDays: 30,
    state: 'issued',
    status: 'paid',
    items: [
      { desc: 'Wireless Router AC1200', qty: 6, price: 45000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Network cabling (per point)', qty: 12, price: 25000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Installation & setup (per hour)', qty: 8, price: 15000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 690000,
    paid_milli: 690000,
    balance_milli: 0,
    currency: 'USD',
    quoteId: 'q7',
    sentAt: '2026-10-22',
    issuedAt: '2026-10-22',
  },
  {
    id: 'i10471',
    number: '10471',
    customerId: 'c44',
    customerName: 'Waaberi Primary School',
    date: '2026-10-28',
    due: '2026-11-12',
    due_date: '2026-11-12',
    termsDays: 15,
    state: 'issued',
    status: 'unpaid',
    items: [
      { desc: 'CCTV Camera 4MP', qty: 6, price: 65000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Hard Disk Drive Mounting Bracket', qty: 6, price: 16500, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 489000,
    paid_milli: 0,
    balance_milli: 489000,
    currency: 'USD',
    sentAt: '2026-10-28',
    issuedAt: '2026-10-28',
  },
  {
    id: 'idraft1',
    number: '',
    customerId: 'c39',
    customerName: 'Hodan Medical Centre',
    date: '2026-10-30',
    due: '2026-11-29',
    due_date: '2026-11-29',
    termsDays: 30,
    state: 'draft',
    status: 'draft',
    items: [
      { desc: 'UPS 1200VA', qty: 3, price: 110000, disc: 0, taxRate: 0, taxName: '' },
      { desc: 'Installation & setup (per hour)', qty: 2, price: 15000, disc: 0, taxRate: 0, taxName: '' },
    ],
    terms: INVOICE_TERMS,
    notes: '',
    total_milli: 360000,
    paid_milli: 0,
    balance_milli: 0,
    currency: 'USD',
    sentAt: null,
    issuedAt: null,
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
  const openQ = MOCK_QUOTES.filter((q) => ['draft', 'sent'].includes(qStatus(q))).length;
  const overdue = MOCK_INVOICES.filter((i) => invStatus(i) === 'overdue').length;
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
  id: string;
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
    id: p.receiptId,
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
    id: i.id,
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
    id: q.id,
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
  const receiptNum = nextReceiptNumber(data.date || TODAY);

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

  const f = invFin(inv);
  const prevBalance = f.balance;
  const balanceAfter = Math.max(0, prevBalance - data.amount_milli);

  const receipt: MockReceipt = {
    id: rid,
    number: receiptNum,
    date: data.date,
    paymentId: pid,
    invoiceId: inv.id,
    invoiceNumber: inv.number,
    customerId: inv.customerId,
    customerName: inv.customerName,
    method: data.method,
    reference: data.reference,
    amount_milli: data.amount_milli,
    amount: data.amount_milli,
    balanceAfter_milli: balanceAfter,
    balanceAfter: balanceAfter,
    prevPaid: f.paid + f.credit,
    invoiceTotal: f.total,
    currency: inv.currency,
  };

  // Mutate state atomically
  inv.paid_milli = (inv.paid_milli || 0) + data.amount_milli;
  inv.balance_milli = balanceAfter;
  inv.status = balanceAfter <= 0 ? 'paid' : 'partial';

  MOCK_PAYMENTS.unshift(payment);
  MOCK_RECEIPTS.unshift(receipt);

  logAuditEvent(
    `Recorded payment ${formatMoney(data.amount_milli, inv.currency)}`,
    `${inv.number} → ${receiptNum}`,
    `${data.method} ${data.reference || ''}`.trim()
  );

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

/* ==========================================================================
   Quotation & Document Operations Store (Matching Prototype Logic)
   ========================================================================== */

export interface MockAuditEvent {
  ts: number;
  user: string;
  role: string;
  action: string;
  ref: string;
  detail?: string;
}

export const MOCK_AUDIT: MockAuditEvent[] = [
  { ts: new Date('2026-10-31T09:15:00Z').getTime(), user: 'Faadumo Nur', role: 'Sales Officer', action: 'Created quotation', ref: 'QT-2026-0010' },
  { ts: new Date('2026-10-27T14:30:00Z').getTime(), user: 'Faadumo Nur', role: 'Sales Officer', action: 'Customer accepted quotation', ref: 'QT-2026-0009' },
  { ts: new Date('2026-10-27T10:00:00Z').getTime(), user: 'Faadumo Nur', role: 'Sales Officer', action: 'Created quotation', ref: 'QT-2026-0009' },
  { ts: new Date('2026-10-20T11:45:00Z').getTime(), user: 'Faadumo Nur', role: 'Sales Officer', action: 'Sent quotation', ref: 'QT-2026-0008' },
  { ts: new Date('2026-10-20T08:30:00Z').getTime(), user: 'Faadumo Nur', role: 'Sales Officer', action: 'Created quotation', ref: 'QT-2026-0008' },
  { ts: new Date('2026-10-18T16:20:00Z').getTime(), user: 'Faadumo Nur', role: 'Sales Officer', action: 'Customer accepted quotation', ref: 'QT-2026-0007' },
  { ts: new Date('2026-10-15T09:00:00Z').getTime(), user: 'Faadumo Nur', role: 'Sales Officer', action: 'Created quotation', ref: 'QT-2026-0007' },
  { ts: new Date('2026-08-20T10:15:00Z').getTime(), user: 'Faadumo Nur', role: 'Sales Officer', action: 'Sent quotation', ref: 'QT-2026-0006' },
  { ts: new Date('2026-07-21T11:00:00Z').getTime(), user: 'Faadumo Nur', role: 'Sales Officer', action: 'Customer accepted quotation', ref: 'QT-2026-0005' },
  { ts: new Date('2026-07-05T15:00:00Z').getTime(), user: 'Faadumo Nur', role: 'Sales Officer', action: 'Customer rejected quotation', ref: 'QT-2026-0004' },
];

export function logAuditEvent(
  action: string,
  ref: string,
  detail = '',
  user?: string,
  role?: string
) {
  let resolvedUser = user;
  let resolvedRole = role;
  if (!resolvedUser || !resolvedRole) {
    try {
      const auth = useAuthStore.getState();
      const r = ROLES[auth.role];
      if (r) {
        resolvedUser = resolvedUser || r.user;
        resolvedRole = resolvedRole || r.label;
      }
    } catch {
      // fallback
    }
  }
  MOCK_AUDIT.unshift({
    ts: Date.now(),
    user: resolvedUser || 'Amina Yusuf',
    role: resolvedRole || 'Administrator',
    action,
    ref,
    detail,
  });
}

export function getAuditEventsForRef(ref: string): MockAuditEvent[] {
  return MOCK_AUDIT.filter(
    (a) => a.ref === ref || a.ref.startsWith(ref + ' ') || a.ref.includes(' ' + ref)
  ).slice(0, 8);
}

export function getQuoteById(id: string): MockQuote | undefined {
  return MOCK_QUOTES.find((q) => q.id === id);
}

export function getCustomerById(id: string): MockCustomer | undefined {
  return MOCK_CUSTOMERS.find((c) => c.id === id);
}

export function nextQuoteNumber(dateStr = TODAY): string {
  SYSTEM_SETTINGS.seq.quote++;
  return fmtNumber(SYSTEM_SETTINGS.numbering.quote, SYSTEM_SETTINGS.seq.quote, dateStr);
}

export function peekQuoteNumber(dateStr = TODAY): string {
  return fmtNumber(SYSTEM_SETTINGS.numbering.quote, SYSTEM_SETTINGS.seq.quote + 1, dateStr);
}

export function saveQuote(
  data: Partial<MockQuote> & { id?: string },
  markSent = false
): MockQuote {
  const cust = data.customerId ? getCustomerById(data.customerId) : undefined;
  const targetState = markSent ? 'sent' : data.state || 'draft';
  const totals = totalsOf({ items: data.items || [] });

  if (data.id && data.id !== 'new') {
    const existingIndex = MOCK_QUOTES.findIndex((q) => q.id === data.id);
    if (existingIndex >= 0) {
      const existing = MOCK_QUOTES[existingIndex];
      const updated: MockQuote = {
        ...existing,
        ...data,
        id: existing.id,
        number: existing.number,
        customerId: data.customerId || existing.customerId,
        customerName: cust ? cust.name : existing.customerName,
        date: data.date || existing.date,
        expiry: data.expiry || existing.expiry,
        expiry_date: data.expiry || existing.expiry,
        state: targetState as any,
        currency: data.currency || existing.currency,
        items: data.items ? JSON.parse(JSON.stringify(data.items)) : existing.items,
        terms: data.terms !== undefined ? data.terms : existing.terms,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        total_milli: totals.total,
      };
      MOCK_QUOTES[existingIndex] = updated;
      logAuditEvent(
        markSent ? 'Sent quotation' : 'Updated quotation',
        updated.number
      );
      return updated;
    }
  }

  // Create new quotation
  const newNum = nextQuoteNumber(data.date || TODAY);
  const newId = `q${SYSTEM_SETTINGS.seq.quote}`;
  const newQuote: MockQuote = {
    id: newId,
    number: newNum,
    customerId: data.customerId || '',
    customerName: cust ? cust.name : 'Unknown Customer',
    date: data.date || TODAY,
    expiry: data.expiry || addDays(data.date || TODAY, 30),
    expiry_date: data.expiry || addDays(data.date || TODAY, 30),
    state: targetState as any,
    currency: data.currency || 'USD',
    items: data.items ? JSON.parse(JSON.stringify(data.items)) : [],
    terms: data.terms || QUOTE_TERMS,
    notes: data.notes || '',
    total_milli: totals.total,
    createdAt: TODAY,
  };

  MOCK_QUOTES.unshift(newQuote);
  logAuditEvent('Created quotation', newQuote.number);
  if (markSent) {
    logAuditEvent('Sent quotation', newQuote.number);
  }
  return newQuote;
}

export function acceptQuote(id: string): MockQuote | undefined {
  const quote = getQuoteById(id);
  if (quote) {
    quote.state = 'accepted';
    logAuditEvent('Customer accepted quotation', quote.number);
  }
  return quote;
}

export function rejectQuote(id: string, reason: string): MockQuote | undefined {
  const quote = getQuoteById(id);
  if (quote) {
    quote.state = 'rejected';
    quote.rejectReason = reason;
    logAuditEvent('Customer rejected quotation', quote.number, reason);
  }
  return quote;
}

export function duplicateQuote(id: string): MockQuote | undefined {
  const quote = getQuoteById(id);
  if (!quote) return undefined;

  const newNum = nextQuoteNumber(TODAY);
  const newId = `q${SYSTEM_SETTINGS.seq.quote}`;
  const duplicate: MockQuote = {
    ...JSON.parse(JSON.stringify(quote)),
    id: newId,
    number: newNum,
    date: TODAY,
    expiry: addDays(TODAY, 30),
    expiry_date: addDays(TODAY, 30),
    state: 'draft',
    invoiceId: undefined,
    invoiceNumber: undefined,
    rejectReason: undefined,
    createdAt: TODAY,
  };

  MOCK_QUOTES.unshift(duplicate);
  logAuditEvent('Duplicated quotation', duplicate.number, 'from ' + quote.number);
  return duplicate;
}

export function deleteDraftQuote(id: string): boolean {
  const index = MOCK_QUOTES.findIndex((q) => q.id === id);
  if (index >= 0 && MOCK_QUOTES[index].state === 'draft') {
    const num = MOCK_QUOTES[index].number;
    MOCK_QUOTES.splice(index, 1);
    logAuditEvent('Deleted draft quotation', num);
    return true;
  }
  return false;
}

export function convertQuoteToInvoice(quoteId: string): {
  invoiceId: string;
  invoiceNumber: string;
} {
  const quote = getQuoteById(quoteId);
  if (!quote) throw new Error('Quotation not found');

  if (quote.invoiceId) {
    const existing = MOCK_INVOICES.find((i) => i.id === quote.invoiceId);
    return { invoiceId: quote.invoiceId, invoiceNumber: existing?.number || 'Draft' };
  }

  const nextSeq = MOCK_INVOICES.length + 10456;
  const newInvoiceId = `i${nextSeq}`;
  const newInvoice: MockInvoice = {
    id: newInvoiceId,
    number: '', // Draft invoices are unnumbered until issued in prototype
    customerId: quote.customerId,
    customerName: quote.customerName,
    date: TODAY,
    due: addDays(TODAY, 30),
    due_date: addDays(TODAY, 30),
    termsDays: 30,
    items: JSON.parse(JSON.stringify(quote.items)),
    terms: INVOICE_TERMS,
    notes: '',
    state: 'draft',
    status: 'draft',
    total_milli: quote.total_milli,
    paid_milli: 0,
    balance_milli: quote.total_milli,
    currency: quote.currency,
    quoteId: quote.id,
  };

  MOCK_INVOICES.unshift(newInvoice);
  quote.invoiceId = newInvoiceId;
  quote.invoiceNumber = '';
  logAuditEvent('Created invoice draft from quotation', quote.number);

  return { invoiceId: newInvoiceId, invoiceNumber: 'Draft' };
}

export function getInvoiceById(id: string): MockInvoice | undefined {
  return MOCK_INVOICES.find((i) => i.id === id);
}

export function getCreditNotesForInvoice(invoiceId: string): MockCreditNote[] {
  return MOCK_CREDITS.filter((c) => c.invoiceId === invoiceId);
}

export function getPaymentsForInvoice(invoiceId: string): MockPayment[] {
  return MOCK_PAYMENTS.filter((p) => p.invoiceId === invoiceId);
}

export function getReceiptsForInvoice(invoiceId: string): MockReceipt[] {
  return MOCK_RECEIPTS.filter((r) => r.invoiceId === invoiceId);
}

export function invFin(inv: MockInvoice) {
  const t = totalsOf({ items: inv.items || [] });
  const liveBalance = (inv as any).balance_milli;
  if (typeof liveBalance === 'number') {
    const livePaid = (inv as any).paid_milli ?? 0;
    const liveCredit = (inv as any).credited_milli ?? 0;
    return { ...t, paid: livePaid, credit: liveCredit, balance: liveBalance };
  }
  const paid = MOCK_PAYMENTS.filter((p) => p.invoiceId === inv.id).reduce(
    (a, p) => a + p.amount_milli,
    0
  );
  const credit = MOCK_CREDITS.filter((c) => c.invoiceId === inv.id).reduce(
    (a, c) => a + c.amount,
    0
  );
  const balance =
    inv.state === 'cancelled' || inv.state === 'draft'
      ? 0
      : Math.max(0, t.total - paid - credit);
  return { ...t, paid, credit, balance };
}

export function invStatus(
  inv: MockInvoice
): 'draft' | 'sent' | 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled' {
  if (inv.state === 'draft') return 'draft';
  if (inv.state === 'cancelled') return 'cancelled';
  const f = invFin(inv);
  if (f.balance <= 0) return 'paid';
  const dueDate = inv.due || inv.due_date || '';
  if (dueDate < TODAY) return 'overdue';
  if (f.paid > 0 || f.credit > 0) return 'partial';
  return inv.sentAt ? 'sent' : 'unpaid';
}

export function nextInvoiceNumber(dateStr = TODAY): string {
  SYSTEM_SETTINGS.seq.invoice++;
  return fmtNumber(SYSTEM_SETTINGS.numbering.invoice, SYSTEM_SETTINGS.seq.invoice, dateStr);
}

export function peekNextInvoiceNumber(dateStr = TODAY): string {
  return fmtNumber(SYSTEM_SETTINGS.numbering.invoice, SYSTEM_SETTINGS.seq.invoice + 1, dateStr);
}

export function nextReceiptNumber(dateStr = TODAY): string {
  SYSTEM_SETTINGS.seq.receipt++;
  return fmtNumber(SYSTEM_SETTINGS.numbering.receipt, SYSTEM_SETTINGS.seq.receipt, dateStr);
}

export function nextCreditNumber(dateStr = TODAY): string {
  SYSTEM_SETTINGS.seq.credit++;
  return fmtNumber(SYSTEM_SETTINGS.numbering.credit, SYSTEM_SETTINGS.seq.credit, dateStr);
}

export function persistInvoice(
  data: Partial<MockInvoice> & { id?: string },
  issue = false
): MockInvoice {
  const cust = data.customerId ? getCustomerById(data.customerId) : undefined;
  const totals = totalsOf({ items: data.items || [] });
  const dueDate =
    data.due || data.due_date || addDays(data.date || TODAY, data.termsDays ?? 30);

  if (data.id && data.id !== 'new') {
    const existingIndex = MOCK_INVOICES.findIndex((i) => i.id === data.id);
    if (existingIndex >= 0) {
      const existing = MOCK_INVOICES[existingIndex];
      const updated: MockInvoice = {
        ...existing,
        ...data,
        id: existing.id,
        customerId: data.customerId || existing.customerId,
        customerName: cust ? cust.name : existing.customerName,
        date: data.date || existing.date,
        due: dueDate,
        due_date: dueDate,
        termsDays: data.termsDays ?? existing.termsDays ?? 30,
        currency: data.currency || existing.currency,
        items: data.items ? JSON.parse(JSON.stringify(data.items)) : existing.items,
        terms: data.terms !== undefined ? data.terms : existing.terms,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        total_milli: totals.total,
        balance_milli: totals.total,
      };

      if (issue) {
        updated.state = 'issued';
        updated.number = nextInvoiceNumber(updated.date);
        updated.issuedAt = TODAY;
        updated.sentAt = updated.date;
        updated.status = invStatus(updated);
        logAuditEvent(
          'Issued invoice',
          updated.number,
          `${formatMoney(totals.total, updated.currency)}`
        );
        if (updated.quoteId) {
          const q = getQuoteById(updated.quoteId);
          if (q)
            logAuditEvent(
              'Converted quotation to invoice',
              `${q.number} → ${updated.number}`
            );
        }
      } else {
        logAuditEvent('Saved draft invoice', updated.customerName);
      }

      MOCK_INVOICES[existingIndex] = updated;
      return updated;
    }
  }

  // Create new invoice
  const nextSeq = MOCK_INVOICES.length + 10456;
  const newId = `i${nextSeq}`;
  const invNumber = issue ? nextInvoiceNumber(data.date || TODAY) : '';
  const newInvoice: MockInvoice = {
    id: newId,
    number: invNumber,
    customerId: data.customerId || '',
    customerName: cust ? cust.name : 'Unknown Customer',
    date: data.date || TODAY,
    due: dueDate,
    due_date: dueDate,
    termsDays: data.termsDays ?? 30,
    state: issue ? 'issued' : 'draft',
    status: issue ? 'unpaid' : 'draft',
    currency: data.currency || 'USD',
    items: data.items ? JSON.parse(JSON.stringify(data.items)) : [],
    terms: data.terms || INVOICE_TERMS,
    notes: data.notes || '',
    total_milli: totals.total,
    paid_milli: 0,
    balance_milli: totals.total,
    issuedAt: issue ? TODAY : undefined,
    sentAt: issue ? data.date || TODAY : null,
  };

  if (issue) {
    newInvoice.status = invStatus(newInvoice);
    logAuditEvent(
      'Issued invoice',
      newInvoice.number,
      `${formatMoney(totals.total, newInvoice.currency)}`
    );
  } else {
    logAuditEvent('Saved draft invoice', newInvoice.customerName);
  }

  MOCK_INVOICES.unshift(newInvoice);
  return newInvoice;
}

export function deleteDraftInvoice(id: string): boolean {
  const index = MOCK_INVOICES.findIndex((i) => i.id === id);
  if (index >= 0 && MOCK_INVOICES[index].state === 'draft') {
    const inv = MOCK_INVOICES[index];
    if (inv.quoteId) {
      const q = getQuoteById(inv.quoteId);
      if (q) q.invoiceId = undefined;
    }
    MOCK_INVOICES.splice(index, 1);
    logAuditEvent('Deleted draft invoice', inv.customerName);
    return true;
  }
  return false;
}

export function markInvoiceSent(id: string): MockInvoice | undefined {
  const inv = getInvoiceById(id);
  if (inv && inv.state === 'issued') {
    inv.sentAt = TODAY;
    inv.status = invStatus(inv);
    logAuditEvent('Marked invoice as sent', inv.number);
  }
  return inv;
}

export function cancelInvoice(id: string, reason: string): MockInvoice | undefined {
  const inv = getInvoiceById(id);
  if (inv && inv.state === 'issued') {
    inv.state = 'cancelled';
    inv.status = 'cancelled';
    inv.cancelReason = reason;
    inv.cancelledAt = TODAY;
    inv.balance_milli = 0;
    logAuditEvent('Cancelled invoice', inv.number, reason);
  }
  return inv;
}

export function issueCreditNote(
  invoiceId: string,
  amount: number,
  reason: string
): MockCreditNote {
  const inv = getInvoiceById(invoiceId);
  if (!inv) throw new Error('Invoice not found');
  const cnNumber = nextCreditNumber(TODAY);
  const creditNote: MockCreditNote = {
    id: `cn${SYSTEM_SETTINGS.seq.credit}`,
    number: cnNumber,
    invoiceId: inv.id,
    amount,
    reason,
    date: TODAY,
  };
  MOCK_CREDITS.push(creditNote);
  inv.balance_milli = invFin(inv).balance;
  inv.status = invStatus(inv);
  logAuditEvent(
    `Issued credit note ${formatMoney(amount, inv.currency)}`,
    `${cnNumber} on ${inv.number}`,
    reason
  );
  return creditNote;
}

export interface CustFinResult {
  invoiced: number;
  paid: number;
  bal: number;
  overdue: boolean;
  count: number;
}

export function custFin(cid: string): CustFinResult {
  const invs = MOCK_INVOICES.filter((i) => i.customerId === cid && i.state === 'issued');
  const invoiced = invs.reduce(
    (a, i) => a + toBase(totalsOf({ items: i.items || [] }).total, i.currency),
    0
  );
  const paid = MOCK_PAYMENTS.filter((p) => {
    const inv = getInvoiceById(p.invoiceId);
    return inv ? inv.customerId === cid : p.customerId === cid;
  }).reduce((a, p) => {
    const inv = getInvoiceById(p.invoiceId);
    const cur = (inv && inv.currency) || p.currency || 'USD';
    const amt = p.amount_milli ?? 0;
    return a + toBase(amt, cur);
  }, 0);
  const bal = invs.reduce((a, i) => a + toBase(invFin(i).balance, i.currency), 0);
  const overdue = invs.some((i) => invStatus(i) === 'overdue');
  return { invoiced, paid, bal, overdue, count: invs.length };
}

export function addCustomer(data: {
  name: string;
  attn?: string;
  phone: string;
  email?: string;
  taxId?: string;
  address?: string;
  since?: string;
}): MockCustomer {
  const maxCode = Math.max(...MOCK_CUSTOMERS.map((c) => c.code || 0), 1000);
  const code = maxCode + 1;
  const newCustomer: MockCustomer = {
    id: `c${code}`,
    code,
    name: data.name,
    attn: data.attn || '',
    phone: data.phone,
    email: data.email || '',
    currency: 'USD',
    taxId: data.taxId || '',
    address: data.address || '',
    since: data.since || TODAY,
  };
  MOCK_CUSTOMERS.push(newCustomer);
  logAuditEvent('Added customer', `${newCustomer.name} (${newCustomer.code})`);
  return newCustomer;
}

export function updateCustomer(
  id: string,
  data: {
    name: string;
    attn?: string;
    phone: string;
    email?: string;
    taxId?: string;
    address?: string;
  }
): MockCustomer | undefined {
  const customer = MOCK_CUSTOMERS.find((c) => c.id === id);
  if (!customer) return undefined;
  customer.name = data.name;
  if (data.attn !== undefined) customer.attn = data.attn;
  customer.phone = data.phone;
  if (data.email !== undefined) customer.email = data.email;
  if (data.taxId !== undefined) customer.taxId = data.taxId;
  if (data.address !== undefined) customer.address = data.address;
  logAuditEvent('Updated customer', customer.name);
  return customer;
}

const INITIAL_CUSTOMERS = JSON.parse(JSON.stringify(MOCK_CUSTOMERS));
const INITIAL_QUOTES = JSON.parse(JSON.stringify(MOCK_QUOTES));
const INITIAL_INVOICES = JSON.parse(JSON.stringify(MOCK_INVOICES));
const INITIAL_PAYMENTS = JSON.parse(JSON.stringify(MOCK_PAYMENTS));
const INITIAL_RECEIPTS = JSON.parse(JSON.stringify(MOCK_RECEIPTS));
const INITIAL_CREDITS = JSON.parse(JSON.stringify(MOCK_CREDITS));
const INITIAL_AUDIT = JSON.parse(JSON.stringify(MOCK_AUDIT));
const INITIAL_SETTINGS = JSON.parse(JSON.stringify(SYSTEM_SETTINGS));

export function resetSampleData(): void {
  MOCK_CUSTOMERS.length = 0;
  MOCK_CUSTOMERS.push(...JSON.parse(JSON.stringify(INITIAL_CUSTOMERS)));

  MOCK_QUOTES.length = 0;
  MOCK_QUOTES.push(...JSON.parse(JSON.stringify(INITIAL_QUOTES)));

  MOCK_INVOICES.length = 0;
  MOCK_INVOICES.push(...JSON.parse(JSON.stringify(INITIAL_INVOICES)));

  MOCK_PAYMENTS.length = 0;
  MOCK_PAYMENTS.push(...JSON.parse(JSON.stringify(INITIAL_PAYMENTS)));

  MOCK_RECEIPTS.length = 0;
  MOCK_RECEIPTS.push(...JSON.parse(JSON.stringify(INITIAL_RECEIPTS)));

  MOCK_CREDITS.length = 0;
  MOCK_CREDITS.push(...JSON.parse(JSON.stringify(INITIAL_CREDITS)));

  MOCK_AUDIT.length = 0;
  MOCK_AUDIT.push(...JSON.parse(JSON.stringify(INITIAL_AUDIT)));

  Object.assign(COMPANY_SETTINGS, JSON.parse(JSON.stringify(INITIAL_SETTINGS.company)));
  Object.assign(SYSTEM_SETTINGS, JSON.parse(JSON.stringify(INITIAL_SETTINGS)));

  logAuditEvent('Restored sample data', 'System', 'All records restored to original sample');
}



