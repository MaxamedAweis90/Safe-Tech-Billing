import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { quotationKeys, invoiceKeys, trashKeys } from '../lib/queryClient';
import { toast } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { deleteMockQuotation } from '../lib/mockData';

export interface QuotationLineItem {
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

export interface QuotationData {
  _id?: string;
  id?: string;
  number: string;
  customer_id: string;
  customerName?: string;
  date: string;
  expiry: string;
  currency: string;
  terms?: string;
  notes?: string;
  state: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  reject_reason?: string;
  invoice_id?: string;
  invoiceNumber?: string;
  items: QuotationLineItem[];
  subtotal_milli?: number;
  disc_total_milli?: number;
  tax_total_milli?: number;
  total_milli?: number;
  created_at?: string;
}

export interface QuotationFilters {
  q?: string;
  status?: string;
  limit?: number;
  skip?: number;
}

/**
 * Hook to fetch paginated or filtered quotations list.
 */
export function useQuotations(params?: QuotationFilters) {
  return useQuery({
    queryKey: quotationKeys.list(params),
    queryFn: async () => {
      const res = await api.get('/quotations', { params });
      return res.data as {
        success: boolean;
        quotations: QuotationData[];
        total: number;
        limit: number;
        skip: number;
      };
    },
  });
}

/**
 * Hook to fetch quotation detail by ID.
 */
export function useQuotationDetail(id?: string | null) {
  return useQuery({
    queryKey: quotationKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Quotation ID is required');
      const res = await api.get(`/quotations/${id}`);
      return res.data as {
        success: boolean;
        quotation: QuotationData;
      };
    },
    enabled: Boolean(id),
  });
}

/**
 * Mutation hook to create or update a quotation draft/record.
 */
export function useSaveQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<QuotationData> & { id?: string }) => {
      if (payload.id) {
        const res = await api.put(`/quotations/${payload.id}`, payload);
        return res.data as { success: boolean; quotation: QuotationData };
      }
      const res = await api.post('/quotations', payload);
      return res.data as { success: boolean; quotation: QuotationData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      if (data.quotation.id || data.quotation._id) {
        queryClient.invalidateQueries({
          queryKey: quotationKeys.detail(data.quotation.id || data.quotation._id!),
        });
      }
      toast(`Quotation ${data.quotation.number || 'Draft'} saved.`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to save quotation', true);
    },
  });
}

/**
 * Mutation hook to accept a quotation.
 */
export function useAcceptQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/quotations/${id}/accept`);
      return res.data as { success: boolean; quotation: QuotationData };
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(id) });
      toast(`Quotation ${data.quotation.number} accepted.`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to mark quotation as accepted', true);
    },
  });
}

/**
 * Mutation hook to reject a quotation with a reason.
 */
export function useRejectQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.post(`/quotations/${id}/reject`, { reason });
      return res.data as { success: boolean; quotation: QuotationData };
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(id) });
      toast(`Quotation ${data.quotation.number} marked as rejected.`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to reject quotation', true);
    },
  });
}

/**
 * Mutation hook to convert an accepted quotation into an invoice draft.
 */
export function useConvertQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/quotations/${id}/convert`);
      return res.data as {
        success: boolean;
        quotation: QuotationData;
        invoice: { id: string; number?: string };
      };
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      toast(`Quotation ${data.quotation.number} converted to invoice draft.`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to convert quotation', true);
    },
  });
}

/**
 * Mutation hook to send a quotation (marks sent and snapshots state).
 */
export function useSendQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/quotations/${id}/send`);
      return res.data as { success: boolean; quotation: QuotationData };
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(id) });
      toast(`Quotation ${data.quotation.number} marked as sent.`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to send quotation', true);
    },
  });
}

/**
 * Mutation hook to duplicate an existing quotation as a draft copy.
 */
export function useDuplicateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/quotations/${id}/duplicate`);
      return res.data as { success: boolean; quotation: QuotationData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      toast(`Quotation ${data.quotation.number} created as a draft copy.`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to duplicate quotation', true);
    },
  });
}

/**
 * Mutation hook to delete a draft quotation.
 */
export function useDeleteQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const isDemo = Boolean(useAuthStore.getState().user?.isDemo);
      if (isDemo && !/^[0-9a-fA-F]{24}$/.test(id)) {
        deleteMockQuotation(id);
        return { success: true, message: 'Draft quotation moved to trash.' };
      }
      try {
        const res = await api.delete(`/quotations/${id}`);
        return res.data as { success: boolean; message?: string };
      } catch (err: any) {
        if (isDemo) {
          deleteMockQuotation(id);
          return { success: true, message: 'Draft quotation moved to trash.' };
        }
        throw err;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      toast(data?.message || 'Draft quotation moved to trash.');
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to delete quotation', true);
    },
  });
}

