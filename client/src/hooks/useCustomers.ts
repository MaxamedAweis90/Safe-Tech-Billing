import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { customerKeys, trashKeys } from '../lib/queryClient';
import { toast } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { deleteMockCustomer } from '../lib/mockData';

export interface CustomerFilters {
  q?: string;
  sort?: string;
  limit?: number;
  skip?: number;
}

export interface CustomerData {
  _id?: string;
  id?: string;
  code: number;
  name: string;
  attn?: string;
  phone: string;
  email?: string;
  tax_id?: string;
  address?: string;
  since?: string;
  invoiced_milli?: number;
  paid_milli?: number;
  balance_milli?: number;
  is_overdue?: boolean;
}

export interface CustomerStatement {
  customer: CustomerData;
  invoiced_milli: number;
  paid_milli: number;
  balance_milli: number;
  is_overdue: boolean;
  total_invoiced_milli?: number;
  total_paid_milli?: number;
  outstanding_balance_milli?: number;
  overdue_invoices_count?: number;
  invoices_count?: number;
  transactions: Array<{
    date: string;
    type: 'Quotation' | 'Invoice' | 'Payment' | 'Credit Note' | 'Credit note';
    number: string;
    amount_milli: number;
    status: string;
    currency?: string;
    ref_id?: string;
    details?: string;
  }>;
}

/**
 * Hook to fetch paginated or filtered customers list.
 */
export function useCustomers(params?: CustomerFilters) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: async () => {
      const res = await api.get('/customers', { params });
      return res.data as {
        success: boolean;
        customers: CustomerData[];
        total: number;
        limit: number;
        skip: number;
      };
    },
  });
}

/**
 * Hook to fetch customer detail with full transaction statement.
 */
export function useCustomerDetail(id?: string | null) {
  return useQuery({
    queryKey: customerKeys.statement(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Customer ID is required');
      const res = await api.get(`/customers/${id}`);
      return res.data as {
        success: boolean;
        data: CustomerStatement;
      };
    },
    enabled: Boolean(id),
  });
}

/**
 * Mutation hook to create a new customer.
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<CustomerData>) => {
      const res = await api.post('/customers', payload);
      return res.data as { success: boolean; customer: CustomerData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast(`Customer ${data.customer.name} created successfully.`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to create customer', true);
    },
  });
}

/**
 * Mutation hook to update an existing customer.
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CustomerData> }) => {
      const res = await api.put(`/customers/${id}`, data);
      return res.data as { success: boolean; customer: CustomerData };
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.statement(id) });
      toast(`Customer ${data.customer.name} updated.`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to update customer', true);
    },
  });
}

/**
 * Mutation hook to delete (soft-delete / move to trash) a customer.
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const isDemo = Boolean(useAuthStore.getState().user?.isDemo);
      if (isDemo && !/^[0-9a-fA-F]{24}$/.test(id)) {
        deleteMockCustomer(id);
        return { success: true, message: 'Customer moved to trash.' };
      }
      try {
        const res = await api.delete(`/customers/${id}`);
        return res.data as { success: boolean; message: string };
      } catch (err: any) {
        if (isDemo) {
          deleteMockCustomer(id);
          return { success: true, message: 'Customer moved to trash.' };
        }
        throw err;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      toast(data.message || 'Customer moved to trash.');
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to delete customer', true);
    },
  });
}

