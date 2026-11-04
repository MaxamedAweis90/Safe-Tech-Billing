import { create } from 'zustand';
import {
  COMPANY_SETTINGS,
  SYSTEM_SETTINGS,
  SystemCurrency,
  SystemTax,
  TAX_RATES,
  QUOTE_TERMS,
  INVOICE_TERMS,
} from '../lib/mockData';
import { DEFAULT_CURRENCIES } from '../lib/math';

export interface CompanyProfile {
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
}

export interface NumberingSettings {
  quote: string;
  invoice: string;
  receipt: string;
  credit: string;
}

export interface SequenceCounters {
  quote: number;
  invoice: number;
  receipt: number;
  credit: number;
}

interface SettingsState {
  company: CompanyProfile;
  currencies: SystemCurrency[];
  defaultCurrency: string;
  numbering: NumberingSettings;
  seq: SequenceCounters;
  taxes: SystemTax[];
  quoteTerms: string;
  invoiceTerms: string;

  // Actions
  setCompany: (company: Partial<CompanyProfile>) => void;
  updateCompanyField: (field: keyof CompanyProfile, value: string) => void;
  setCurrencies: (currencies: SystemCurrency[]) => void;
  addCurrency: (currency: SystemCurrency) => void;
  setDefaultCurrency: (currencyCode: string) => void;
  setTaxes: (taxes: SystemTax[]) => void;
  addTax: (tax: SystemTax) => void;
  setNumbering: (numbering: Partial<NumberingSettings>) => void;
  setSeq: (seq: Partial<SequenceCounters>) => void;
  setQuoteTerms: (terms: string) => void;
  setInvoiceTerms: (terms: string) => void;
  resetDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  company: { ...COMPANY_SETTINGS },
  currencies: [...DEFAULT_CURRENCIES],
  defaultCurrency: SYSTEM_SETTINGS.defaultCurrency || 'USD',
  numbering: { ...SYSTEM_SETTINGS.numbering },
  seq: { ...SYSTEM_SETTINGS.seq },
  taxes: [...TAX_RATES],
  quoteTerms: QUOTE_TERMS,
  invoiceTerms: INVOICE_TERMS,

  setCompany: (partial) =>
    set((state) => ({ company: { ...state.company, ...partial } })),

  updateCompanyField: (field, value) =>
    set((state) => ({ company: { ...state.company, [field]: value } })),

  setCurrencies: (currencies) => set({ currencies }),

  addCurrency: (currency) =>
    set((state) => ({
      currencies: state.currencies.some((c) => c.code === currency.code)
        ? state.currencies.map((c) => (c.code === currency.code ? currency : c))
        : [...state.currencies, currency],
    })),

  setDefaultCurrency: (defaultCurrency) => set({ defaultCurrency }),

  setTaxes: (taxes) => set({ taxes }),

  addTax: (tax) =>
    set((state) => ({
      taxes: state.taxes.some((t) => t.id === tax.id)
        ? state.taxes.map((t) => (t.id === tax.id ? tax : t))
        : [...state.taxes, tax],
    })),

  setNumbering: (numbering) =>
    set((state) => ({ numbering: { ...state.numbering, ...numbering } })),

  setSeq: (seq) =>
    set((state) => ({ seq: { ...state.seq, ...seq } })),

  setQuoteTerms: (quoteTerms) => set({ quoteTerms }),

  setInvoiceTerms: (invoiceTerms) => set({ invoiceTerms }),

  resetDefaults: () =>
    set({
      company: { ...COMPANY_SETTINGS },
      currencies: [...DEFAULT_CURRENCIES],
      defaultCurrency: 'USD',
      numbering: { ...SYSTEM_SETTINGS.numbering },
      seq: { ...SYSTEM_SETTINGS.seq },
      taxes: [...TAX_RATES],
      quoteTerms: QUOTE_TERMS,
      invoiceTerms: INVOICE_TERMS,
    }),
}));

export default useSettingsStore;
