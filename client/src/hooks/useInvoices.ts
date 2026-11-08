import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { invoiceKeys, trashKeys } from '../lib/queryClient';
import { toast } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { deleteMockInvoice } from '../lib/mockData';

export interface InvoiceLineItem {
  desc: string;
  qty: number;
  price_milli: number;
  disc_pct?: number;
  tax_rate?: number;
  tax_name?: string;
  gross_milli?: number;
  disc_milli?: number;
  tax_milli?: number;
  total_milli?: number;
}

export interface InvoiceData {
  _id?: string;
  id?: string;
  number: string;
  customer_id: string;
  customerName?: string;
  quote_id?: string;
  date: string;
  due: string;
  terms_days: number;
  currency: string;
  terms?: string;
  notes?: string;
  state: 'draft' | 'issued' | 'cancelled';
  status?: 'draft' | 'sent' | 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  sent_at?: string;
  issued_at?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  items: InvoiceLineItem[];
  total_milli?: number;
  paid_milli?: number;
  credited_milli?: number;
  balance_milli?: number;
  created_at?: string;
}

export interface InvoiceFilters {
  q?: string;
  status?: string;
  customer_id?: string;
  limit?: number;
  skip?: number;
}

export interface InvoiceDetailResponse {
  success: boolean;
  invoice: InvoiceData;
  payments: any[];
  credit_notes: any[];
}

/**
 * Hook to fetch paginated or filtered invoices list.
 */
export function useInvoices(params?: InvoiceFilters) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: async () => {
      const res = await api.get('/invoices', { params });
      return res.data as {
        success: boolean;
        invoices: InvoiceData[];
        total: number;
        limit: number;
        skip: number;
      };
    },
  });
}

/**
 * Hook to fetch detailed invoice record with payments and credit notes.
 */
export function useInvoiceDetail(id?: string | null) {
  return useQuery({
    queryKey: invoiceKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Invoice ID is required');
      const res = await api.get(`/invoices/${id}`);
      return res.data as InvoiceDetailResponse;
    },
    enabled: Boolean(id),
  });
}

/**
 * Mutation hook to save draft invoice (create or update).
 */
export function useSaveInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<InvoiceData> & { id?: string }) => {
      if (payload.id) {
        const res = await api.put(`/invoices/${payload.id}`, payload);
        return res.data as { success: boolean; invoice: InvoiceData };
      }
      const res = await api.post('/invoices', payload);
      return res.data as { success: boolean; invoice: InvoiceData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      if (data.invoice.id || data.invoice._id) {
        queryClient.invalidateQueries({
          queryKey: invoiceKeys.detail(data.invoice.id || data.invoice._id!),
        });
      }
      toast(`Invoice ${data.invoice.number || 'Draft'} saved.`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to save invoice', true);
    },
  });
}

/**
 * Mutation hook to issue an invoice (locks and assigns sequential number).
 */
export function useIssueInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/invoices/${id}/issue`);
      return res.data as { success: boolean; invoice: InvoiceData };
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      toast(`Invoice ${data.invoice.number} issued and locked.`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to issue invoice', true);
    },
  });
}

/**
 * Mutation hook to cancel an invoice with mandatory audit reason.
 */
export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.post(`/invoices/${id}/cancel`, { reason });
      return res.data as { success: boolean; invoice: InvoiceData };
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      toast(`Invoice ${data.invoice.number} cancelled.`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to cancel invoice', true);
    },
  });
}

/**
 * Mutation hook to issue a credit note against an invoice.
 */
export function useCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      amount_milli,
      reason,
      date,
    }: {
      invoiceId: string;
      amount_milli: number;
      reason: string;
      date?: string;
    }) => {
      const res = await api.post(`/invoices/${invoiceId}/credit-note`, {
        amount_milli,
        reason,
        date,
      });
      return res.data as { success: boolean; credit_note: any; invoice: InvoiceData };
    },
    onSuccess: (data, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      toast(`Credit note ${data.credit_note?.number || ''} issued.`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to issue credit note', true);
    },
  });
}

/**
 * Mutation hook to mark an invoice as sent.
 */
export function useMarkInvoiceSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/invoices/${id}/mark-sent`);
      return res.data as { success: boolean; invoice: InvoiceData };
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      toast(`Invoice ${data.invoice.number} marked as sent.`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to mark invoice as sent', true);
    },
  });
}

/**
 * Mutation hook to delete a draft invoice.
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const isDemo = Boolean(useAuthStore.getState().user?.isDemo);
      if (isDemo && !/^[0-9a-fA-F]{24}$/.test(id)) {
        deleteMockInvoice(id);
        return { success: true, message: 'Draft invoice moved to trash.' };
      }
      try {
        const res = await api.delete(`/invoices/${id}`);
        return res.data as { success: boolean; message?: string };
      } catch (err: any) {
        if (isDemo) {
          deleteMockInvoice(id);
          return { success: true, message: 'Draft invoice moved to trash.' };
        }
        throw err;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      toast(data?.message || 'Draft invoice moved to trash.');
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to delete draft invoice', true);
    },
  });
}

/**
 * Hook to preview upcoming sequential number for a given document type.
 */
export function useNumberingPreview(type: string = 'invoice', date?: string) {
  return useQuery({
    queryKey: ['settings', 'numbering', 'preview', type, date],
    queryFn: async () => {
      const res = await api.get('/settings/numbering/preview', {
        params: { type, date },
      });
      return res.data as { success: boolean; preview: string; type: string };
    },
    staleTime: 10000,
  });
}
