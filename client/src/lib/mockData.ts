/**
 * Safe Tech Billing — Central Mock Data Store
 * Powers search, live navigation badges, and domain views.
 */

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
];

export const MOCK_QUOTES: MockQuote[] = [
  {
    id: 'q1',
    number: 'QT-2026-0001',
    customerId: 'c38',
    customerName: 'Acme Global Ltd',
    date: '2026-10-15',
    expiry_date: '2026-11-15',
    state: 'accepted',
    total_milli: 12500000,
    currency: 'USD',
    invoiceNumber: 'INV-10457',
  },
  {
    id: 'q2',
    number: 'QT-2026-0002',
    customerId: 'c39',
    customerName: 'Nairobi Water Works',
    date: '2026-10-20',
    expiry_date: '2026-11-20',
    state: 'accepted',
    total_milli: 4850000,
    currency: 'USD',
    invoiceNumber: 'INV-10458',
  },
  {
    id: 'q3',
    number: 'QT-2026-0003',
    customerId: 'c40',
    customerName: 'Apex Logistics Inc',
    date: '2026-10-25',
    expiry_date: '2026-11-25',
    state: 'sent',
    total_milli: 3200000,
    currency: 'USD',
  },
  {
    id: 'q4',
    number: 'QT-2026-0004',
    customerId: 'c42',
    customerName: 'Coast Builders',
    date: '2026-10-28',
    expiry_date: '2026-11-28',
    state: 'draft',
    total_milli: 7100000,
    currency: 'USD',
  },
  {
    id: 'q5',
    number: 'QT-2026-0005',
    customerId: 'c41',
    customerName: 'Zenith Holdings Ltd',
    date: '2026-09-01',
    expiry_date: '2026-10-01',
    state: 'expired',
    total_milli: 1950000,
    currency: 'USD',
  },
];

export const MOCK_INVOICES: MockInvoice[] = [
  {
    id: 'i10456',
    number: '10456',
    customerId: 'c38',
    customerName: 'Acme Global Ltd',
    date: '2026-03-26',
    due_date: '2026-04-25',
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
    status: 'partial',
    total_milli: 4850000,
    paid_milli: 2000000,
    balance_milli: 2850000,
    currency: 'USD',
  },
  {
    id: 'i10458',
    number: '10458',
    customerId: 'c40',
    customerName: 'Apex Logistics Inc',
    date: '2026-05-19',
    due_date: '2026-06-03',
    state: 'issued',
    status: 'sent',
    total_milli: 2200000,
    paid_milli: 0,
    balance_milli: 2200000,
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
    daysLate: 24,
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
    daysLate: 5,
  },
];

export const MOCK_RECEIPTS: MockReceipt[] = [
  {
    id: 'r1',
    number: 'RCP-2026-0001',
    date: '2026-10-18',
    invoiceId: 'i10456',
    invoiceNumber: '10456',
    customerId: 'c38',
    customerName: 'Acme Global Ltd',
    method: 'Bank transfer',
    reference: 'SSB-TRX-558201',
    amount_milli: 12500000,
    balanceAfter_milli: 0,
    currency: 'USD',
  },
  {
    id: 'r2',
    number: 'RCP-2026-0002',
    date: '2026-10-22',
    invoiceId: 'i10457',
    invoiceNumber: '10457',
    customerId: 'c39',
    customerName: 'Nairobi Water Works',
    method: 'Mobile money',
    reference: 'EVC-74120556',
    amount_milli: 2000000,
    balanceAfter_milli: 2850000,
    currency: 'USD',
  },
];

/**
 * Computes live navigation counts matching prototype `navCounts()`
 */
export function computeNavCounts() {
  const openQ = MOCK_QUOTES.filter((q) => q.state === 'draft' || q.state === 'sent').length;
  const overdue = MOCK_INVOICES.filter((i) => i.status === 'overdue' && i.balance_milli > 0).length;
  return { openQ, overdue };
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

