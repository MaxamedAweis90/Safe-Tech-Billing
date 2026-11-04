import { Customer } from '../models/Customer';
import { NumberSequence } from '../models/NumberSequence';
import { Currency } from '../models/Currency';
import { TaxRate } from '../models/TaxRate';

export const seedDefaultData = async (force: boolean = false): Promise<void> => {
  try {
    if (force) {
      await Promise.all([
        NumberSequence.deleteMany({}),
        Currency.deleteMany({}),
        TaxRate.deleteMany({}),
        Customer.deleteMany({}),
      ]);
    }
    // 1. Number Sequences
    const seqCount = await NumberSequence.countDocuments();
    if (seqCount === 0) {
      await NumberSequence.create([
        { kind: 'quote', format: 'QT-{YYYY}-{SEQ4}', current_seq: 10 },
        { kind: 'invoice', format: '{SEQ}', current_seq: 10471 },
        { kind: 'receipt', format: 'RC-{SEQ5}', current_seq: 12 },
        { kind: 'credit', format: 'CN-{SEQ4}', current_seq: 1 },
      ]);
    }

    // 2. Currencies
    const curCount = await Currency.countDocuments();
    if (curCount === 0) {
      await Currency.create([
        { code: 'USD', symbol: '$', decimals: 2, rate_per_usd: 1 },
        { code: 'SOS', symbol: 'Sh.So.', decimals: 0, rate_per_usd: 26000 },
      ]);
    }

    // 3. Tax Rates
    const taxCount = await TaxRate.countDocuments();
    if (taxCount === 0) {
      await TaxRate.create([
        { id: 'none', name: 'No tax', rate: 0 },
        { id: 'st5', name: 'Sales tax 5%', rate: 5 },
        { id: 'svc10', name: 'Service tax 10%', rate: 10 },
      ]);
    }

    // 4. Customers
    const custCount = await Customer.countDocuments();
    if (custCount === 0) {
      await Customer.create([
        {
          code: 1001,
          name: 'Dr. SUMAIT Hospital - SIMAD University',
          attn: 'Procurement',
          phone: '252 613 939 999',
          email: 'procurement@sumait.edu.so',
          address: 'Wadadda Albarako, Hodan\nMogadishu, Banadir 252',
          since: '2024-03-01',
        },
        {
          code: 1002,
          name: 'Hodan Medical Centre',
          attn: 'Procurement Office',
          phone: '252 61 550 1210',
          email: 'procurement@hodanmedical.example',
          address: 'Maka Al Mukarama Rd, Hodan\nMogadishu',
          since: '2026-04-12',
        },
        {
          code: 1003,
          name: 'Shabelle Logistics Ltd',
          attn: 'Ayaan Warsame',
          phone: '252 61 770 3345',
          email: 'accounts@shabelle-logistics.example',
          address: 'KM4 Junction, Wadajir\nMogadishu',
          since: '2026-05-02',
        },
        {
          code: 1004,
          name: 'Jazeera Coffee House',
          attn: 'Liban Hashi',
          phone: '252 61 880 4421',
          email: 'admin@jazeeracoffee.example',
          address: 'Airport Road, Wadajir\nMogadishu',
          since: '2026-06-10',
        },
        {
          code: 1005,
          name: 'Bakaara Traders Co.',
          attn: 'Warsame Duale',
          phone: '252 61 220 7789',
          email: 'sales@bakaaratraders.example',
          address: 'Bakaara Market, Howlwadag\nMogadishu',
          since: '2026-06-15',
        },
        {
          code: 1006,
          name: 'Lido Seaside Hotel',
          attn: 'Safiya Barre',
          phone: '252 61 990 1122',
          email: 'finance@lidoseaside.example',
          address: 'Lido Beach Road, Abdiaziz\nMogadishu',
          since: '2026-07-01',
        },
        {
          code: 1007,
          name: 'Waaberi Primary School',
          attn: 'Headmaster Office',
          phone: '252 61 330 8855',
          email: 'info@waaberiprimary.example',
          address: '21 October Rd, Waaberi\nMogadishu',
          since: '2026-08-14',
        },
        {
          code: 1008,
          name: 'Benadir Engineering Works',
          attn: 'Engineer Hassan',
          phone: '252 61 440 9966',
          email: 'hassan@benadireng.example',
          address: 'Industrial Zone, Dayniile\nMogadishu',
          since: '2026-09-05',
        },
      ]);
      console.log('[Database] Seeded 8 default prototype customers.');
    }
  } catch (err) {
    console.warn('[Database] Seed default baseline skipped or errored:', err);
  }
};

