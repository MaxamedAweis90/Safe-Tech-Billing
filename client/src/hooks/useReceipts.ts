import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { receiptKeys, invoiceKeys, customerKeys, reportKeys, dashboardKeys, trashKeys } from '../lib/queryClient';
import { toast } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { deleteMockReceipt } from '../lib/mockData';

export interface PaymentPayload {
  invoiceId: string;
  amount_milli: number;
  method: 'cash' | 'bank' | 'mobile' | 'card';
  reference?: string;
  date?: string;
  idempotencyKey?: string;
}

export interface ReceiptData {
  _id?: string;
  id?: string;
  number: string;
  payment_id: any;
  invoice_id: any;
  customer_id: any;
  date: string;
  amount_milli: number;
  method: string;
  reference?: string;
  balance_after_milli: number;
  prev_paid_milli: number;
  invoice_total_milli: number;
  currency: string;
  customerName?: string;
  invoiceNumber?: string;
}

export interface ReceiptFilters {
  q?: string;
  method?: string;
  customer_id?: string;
  limit?: number;
  skip?: number;
}

/**
 * Hook to fetch paginated or filtered receipts list.
 */
export function useReceipts(params?: ReceiptFilters) {
  return useQuery({
    queryKey: receiptKeys.list(params),
    queryFn: async () => {
      const res = await api.get('/receipts', { params });
      return res.data as {
        success: boolean;
        receipts: ReceiptData[];
        total: number;
        limit: number;
        skip: number;
      };
    },
  });
}

/**
 * Hook to fetch receipt detail by ID.
 */
export function useReceiptDetail(id?: string | null) {
  return useQuery({
    queryKey: receiptKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Receipt ID is required');
      const res = await api.get(`/receipts/${id}`);
      return res.data as {
        success: boolean;
        receipt: ReceiptData;
      };
    },
    enabled: Boolean(id),
  });
}

/**
 * Mutation hook to record a payment and atomically generate its receipt.
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, amount_milli, method, reference, date, idempotencyKey }: PaymentPayload) => {
      const headers: Record<string, string> = {};
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }
      const res = await api.post(
        `/invoices/${invoiceId}/payments`,
        {
          amount_milli,
          method,
          reference: reference || '',
          date,
        },
        { headers }
      );
      return res.data as {
        success: boolean;
        payment: any;
        receipt: ReceiptData;
      };
    },
    onSuccess: (data, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: receiptKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      toast(`Payment recorded. Receipt ${data.receipt.number} issued.`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to record payment', true);
    },
  });
}

/**
 * Mutation hook to delete (void / move to trash) a receipt.
 */
export function useDeleteReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiptId: string) => {
      const isDemo = Boolean(useAuthStore.getState().user?.isDemo);
      if (isDemo && !/^[0-9a-fA-F]{24}$/.test(receiptId)) {
        deleteMockReceipt(receiptId);
        return { success: true, message: 'Receipt deleted.' };
      }
      try {
        const res = await api.delete(`/receipts/${receiptId}`);
        return res.data as { success: boolean; message: string };
      } catch (err: any) {
        if (isDemo) {
          deleteMockReceipt(receiptId);
          return { success: true, message: 'Receipt deleted.' };
        }
        throw err;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: receiptKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      toast(data.message || 'Receipt deleted.');
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to delete receipt', true);
    },
  });
}

