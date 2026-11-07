import { QueryClient } from '@tanstack/react-query';

/**
 * Production-grade TanStack Query Client configuration.
 * Configured with retry: 1, refetchOnWindowFocus: false, staleTime: 30000ms.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Central Query Key Factory matching specification:
 * - authKeys: ['auth'], ['auth', 'me']
 * - customerKeys: ['customers'], ['customers', id], ['customers', id, 'statement']
 * - quotationKeys: ['quotations'], ['quotations', id]
 * - invoiceKeys: ['invoices'], ['invoices', id]
 * - receiptKeys: ['receipts'], ['receipts', id]
 * - reportKeys: ['reports', tab, params]
 * - settingKeys: ['settings', 'company'], ['settings', 'numbering']
 * - auditKeys: ['audit']
 */

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => ['dashboard', 'summary'] as const,
};

export const authKeys = {
  all: ['auth'] as const,
  me: () => ['auth', 'me'] as const,
};

export const customerKeys = {
  all: ['customers'] as const,
  list: (params?: Record<string, any>) => ['customers', params] as const,
  detail: (id: string) => ['customers', id] as const,
  statement: (id: string) => ['customers', id, 'statement'] as const,
};

export const quotationKeys = {
  all: ['quotations'] as const,
  list: (params?: Record<string, any>) => ['quotations', params] as const,
  detail: (id: string) => ['quotations', id] as const,
};

export const invoiceKeys = {
  all: ['invoices'] as const,
  list: (params?: Record<string, any>) => ['invoices', params] as const,
  detail: (id: string) => ['invoices', id] as const,
};

export const receiptKeys = {
  all: ['receipts'] as const,
  list: (params?: Record<string, any>) => ['receipts', params] as const,
  detail: (id: string) => ['receipts', id] as const,
};

export const reportKeys = {
  all: ['reports'] as const,
  tab: (tab: string, params?: Record<string, any>) => ['reports', tab, params] as const,
  summary: () => ['reports', 'summary'] as const,
  revenue: (params?: Record<string, any>) => ['reports', 'revenue', params] as const,
  outstanding: (params?: Record<string, any>) => ['reports', 'outstanding', params] as const,
  payments: (params?: Record<string, any>) => ['reports', 'payments', params] as const,
  conversion: (params?: Record<string, any>) => ['reports', 'conversion', params] as const,
};

export const settingKeys = {
  all: ['settings'] as const,
  company: () => ['settings', 'company'] as const,
  numbering: () => ['settings', 'numbering'] as const,
  currencies: () => ['settings', 'currencies'] as const,
  taxRates: () => ['settings', 'tax-rates'] as const,
};

export const auditKeys = {
  all: ['audit'] as const,
  list: (params?: Record<string, any>) => ['audit', params] as const,
};

export const trashKeys = {
  all: ['trash'] as const,
  list: (params?: Record<string, any>) => ['trash', params] as const,
};

export default queryClient;
