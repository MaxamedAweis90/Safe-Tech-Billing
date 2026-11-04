import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { reportKeys } from '../lib/queryClient';

export interface ReportQueryParams {
  tab: string;
  range?: string;
  from?: string;
  to?: string;
  customerId?: string;
  group?: string;
}

/**
 * Universal reports fetching hook supporting all reporting tabs:
 * - revenue
 * - outstanding (aging buckets)
 * - payments (by payment rail)
 * - conversion (quotation conversion metrics)
 * - summary
 */
export function useReports(
  tab: string = 'revenue',
  range?: string,
  from?: string,
  to?: string,
  customerId?: string,
  group?: string
) {
  const params = { range, from, to, customerId, group };

  return useQuery({
    queryKey: reportKeys.tab(tab, params),
    queryFn: async () => {
      // Map tab names to server endpoint paths
      const endpoint =
        tab === 'aging' || tab === 'outstanding'
          ? '/reports/outstanding'
          : tab === 'payments'
          ? '/reports/payments'
          : tab === 'conversion'
          ? '/reports/conversion'
          : tab === 'paidunpaid'
          ? '/reports/paidunpaid'
          : tab === 'summary'
          ? '/reports/summary'
          : '/reports/revenue';

      const res = await api.get(endpoint, {
        params: {
          range,
          from,
          to,
          customer_id: customerId,
          group,
        },
      });

      return res.data;
    },
    enabled: Boolean(tab),
  });
}

/**
 * Convenience hook for executive summary metrics.
 */
export function useReportSummary() {
  return useQuery({
    queryKey: reportKeys.summary(),
    queryFn: async () => {
      const res = await api.get('/reports/summary');
      return res.data;
    },
  });
}

