import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { auditKeys } from '../lib/queryClient';

export interface AuditLogItem {
  _id?: string;
  id?: string;
  ts: string;
  user_name: string;
  role: string;
  action: string;
  ref: string;
  detail?: string;
}

export interface AuditFilters {
  q?: string;
  user_name?: string;
  ref?: string;
  limit?: number;
  skip?: number;
}

export interface AuditResponse {
  success: boolean;
  logs: AuditLogItem[];
  total: number;
  limit: number;
  skip: number;
}

/**
 * Hook to fetch immutable audit trail feed.
 */
export function useAuditLog(params?: AuditFilters) {
  return useQuery<AuditResponse>({
    queryKey: auditKeys.list(params),
    queryFn: async () => {
      const res = await api.get('/audit', { params });
      return res.data as AuditResponse;
    },
  });
}

