import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import {
  settingKeys,
  customerKeys,
  quotationKeys,
  invoiceKeys,
  receiptKeys,
  reportKeys,
  dashboardKeys,
  auditKeys,
} from '../lib/queryClient';
import { toast } from '../store/useUIStore';

export interface CompanyData {
  _id?: string;
  id?: string;
  name: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_id?: string;
  bank_name?: string;
  account_name?: string;
  account_no?: string;
  mobile_money?: string;
  signatory?: string;
  default_currency?: string;
  logo?: string;
  stamp?: string;
  signature?: string;
  quote_terms?: string;
  invoice_terms?: string;
}

export interface CurrencyData {
  _id?: string;
  code: string;
  symbol: string;
  decimals: number;
  rate_per_usd: number;
}

export interface TaxRateData {
  _id?: string;
  id: string;
  name: string;
  rate: number;
}

/**
 * Hook to fetch live company profile settings.
 */
export function useCompanySettings() {
  return useQuery({
    queryKey: settingKeys.company(),
    queryFn: async () => {
      const res = await api.get('/settings/company');
      return res.data as {
        success: boolean;
        company: CompanyData;
      };
    },
  });
}

/**
 * Mutation hook to update company profile settings.
 */
export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<CompanyData>) => {
      const res = await api.patch('/settings/company', payload);
      return res.data as { success: boolean; company: CompanyData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingKeys.company() });
      queryClient.invalidateQueries({ queryKey: settingKeys.all });
      queryClient.invalidateQueries({ queryKey: auditKeys.all });
      toast('Company settings saved successfully');
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to save company settings', true);
    },
  });
}

/**
 * Hook to fetch system supported currencies.
 */
export function useCurrencies() {
  return useQuery({
    queryKey: settingKeys.currencies(),
    queryFn: async () => {
      const res = await api.get('/settings/currencies');
      return res.data as {
        success: boolean;
        currencies: CurrencyData[];
      };
    },
  });
}

/**
 * Mutation hook to upsert currency.
 */
export function useUpsertCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<CurrencyData>) => {
      const res = await api.post('/settings/currencies', payload);
      return res.data as { success: boolean; currency: CurrencyData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingKeys.currencies() });
      toast('Currency updated');
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to save currency', true);
    },
  });
}

/**
 * Hook to fetch system tax rates.
 */
export function useTaxRates() {
  return useQuery({
    queryKey: settingKeys.taxRates(),
    queryFn: async () => {
      const res = await api.get('/settings/taxes');
      return res.data as {
        success: boolean;
        tax_rates: TaxRateData[];
      };
    },
  });
}

/**
 * Mutation hook to upsert tax rate.
 */
export function useUpsertTaxRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<TaxRateData>) => {
      const res = await api.post('/settings/taxes', payload);
      return res.data as { success: boolean; tax_rate: TaxRateData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingKeys.taxRates() });
      toast('Tax rate updated');
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to save tax rate', true);
    },
  });
}

/**
 * Mutation hook to reset demo sample data baseline.
 */
export function useResetSampleData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/settings/reset-sample-data');
      return res.data as { success: boolean; message: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: receiptKeys.all });
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: settingKeys.all });
      queryClient.invalidateQueries({ queryKey: auditKeys.all });
      toast('Sample data restored');
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to reset sample data', true);
    },
  });
}

