import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import {
  trashKeys,
  quotationKeys,
  invoiceKeys,
  receiptKeys,
  customerKeys,
  auditKeys,
  dashboardKeys,
} from '../lib/queryClient';
import { toast } from '../store/useUIStore';
import { TrashedItem, TrashCounts } from '../types';

export interface TrashFilterParams {
  type?: string;
  q?: string;
  limit?: number;
  skip?: number;
}

export interface TrashResponse {
  success: boolean;
  items: TrashedItem[];
  counts: TrashCounts;
  total: number;
  limit: number;
  skip: number;
}

/**
 * Hook to query all soft-deleted records belonging to the company.
 */
export function useTrash(params?: TrashFilterParams) {
  return useQuery({
    queryKey: trashKeys.list(params),
    queryFn: async () => {
      const res = await api.get('/trash', { params });
      return res.data as TrashResponse;
    },
  });
}

/**
 * Mutation hook to restore a trashed item back to active records.
 */
export function useRestoreTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      const res = await api.post(`/trash/${type}/${id}/restore`);
      return res.data as { success: boolean; message: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: receiptKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: auditKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      toast(data.message || 'Item restored successfully.');
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to restore item', true);
    },
  });
}

/**
 * Mutation hook to permanently purge a trashed item.
 */
export function usePurgeTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      const res = await api.delete(`/trash/${type}/${id}/purge`);
      return res.data as { success: boolean; message: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      queryClient.invalidateQueries({ queryKey: auditKeys.all });
      toast(data.message || 'Item permanently deleted.');
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to delete item', true);
    },
  });
}

/**
 * Mutation hook to empty all items in trash.
 */
export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.delete('/trash/empty');
      return res.data as { success: boolean; message: string; count: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      queryClient.invalidateQueries({ queryKey: auditKeys.all });
      toast(data.message || 'Trash emptied successfully.');
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to empty trash', true);
    },
  });
}

