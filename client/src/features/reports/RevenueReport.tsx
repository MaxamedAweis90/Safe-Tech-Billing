import React, { useEffect, useMemo } from 'react';
import { SkeletonBox } from 'skullet/react';
import { MOCK_INVOICES, MOCK_PAYMENTS, getInvoiceById, toBase } from '../../lib/mockData';
import { fmtD, formatMoney, milliStr, totalsOf } from '../../lib/formatters';
import { useReports } from '../../hooks/useReports';

export interface RevenueReportProps {
  from: string;
  to: string;
  cust: string;
  group: 'day' | 'month' | 'year';
  onGroupChange: (group: 'day' | 'month' | 'year') => void;
  onUpdateCSV: (matrix: (string | number)[][]) => void;
}

export const RevenueReport: React.FC<RevenueReportProps> = ({
  from,
  to,
  cust,
  group,
  onGroupChange,
  onUpdateCSV,
}) => {
  const { data: apiData, isLoading } = useReports(
    'revenue',
    undefined,
    from,
    to,
    cust === 'all' ? undefined : cust,
    group
  );

  const inR = (d: string) => d >= from && d <= to;
  const cOk = (id: string) => cust === 'all' || id === cust;

  const keyf = useMemo(() => {
    switch (group) {
      case 'day':
        return (d: string) => d;
      case 'month':
        return (d: string) => d.slice(0, 7);
      case 'year':
        return (d: string) => d.slice(0, 4);
    }
  }, [group]);

  const lab = (k: string) => {
    if (group === 'day') return fmtD(k);
    if (group === 'month') {
      try {
        return new Date(k + '-01T00:00:00Z').toLocaleDateString('en-GB', {
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        });
      } catch {
        return k;
      }
    }
    return k;
  };

  const { keys, map, total } = useMemo(() => {
    if (apiData?.series && apiData.series.length > 0) {
      const bucketMap: Record<string, { inv: number; rec: number; n: number }> = {};
      const sortedKeys: string[] = [];

      for (const s of apiData.series) {
        const k = s.key || s.month;
        sortedKeys.push(k);
        bucketMap[k] = {
          inv: s.invoiced_milli ?? 0,
          rec: s.paid_milli ?? 0,
          n: s.count ?? 1,
        };
      }

      const grandTotal = {
        inv: apiData.total_invoiced_milli ?? 0,
        rec: apiData.total_paid_milli ?? 0,
      };

      return { keys: sortedKeys.reverse(), map: bucketMap, total: grandTotal };
    }

    // Fallback calculation using mock data
    const bucketMap: Record<string, { inv: number; rec: number; n: number }> = {};

    MOCK_INVOICES.filter(
      (i) => i.state === 'issued' && inR(i.date) && cOk(i.customerId)
    ).forEach((i) => {
      const k = keyf(i.date);
      if (!bucketMap[k]) bucketMap[k] = { inv: 0, rec: 0, n: 0 };
      const tot = totalsOf({ items: i.items || [] }).total;
      bucketMap[k].inv += toBase(tot, i.currency);
      bucketMap[k].n++;
    });

    MOCK_PAYMENTS.filter((p) => {
      const inv = getInvoiceById(p.invoiceId);
      const customerId = inv?.customerId || p.customerId;
      return inR(p.date) && cOk(customerId);
    }).forEach((p) => {
      const k = keyf(p.date);
      if (!bucketMap[k]) bucketMap[k] = { inv: 0, rec: 0, n: 0 };
      const inv = getInvoiceById(p.invoiceId);
      const cur = inv?.currency || p.currency || 'USD';
      bucketMap[k].rec += toBase(p.amount_milli, cur);
    });

    const sortedKeys = Object.keys(bucketMap).sort().reverse();
    const grandTotal = sortedKeys.reduce(
      (acc, k) => ({
        inv: acc.inv + bucketMap[k].inv,
        rec: acc.rec + bucketMap[k].rec,
      }),
      { inv: 0, rec: 0 }
    );

    return { keys: sortedKeys, map: bucketMap, total: grandTotal };
  }, [apiData, from, to, cust, keyf]);

  // Construct CSV matrix matching prototype line 906
  const csv = useMemo(() => {
    return [
      ['Period', 'Invoices', 'Invoiced', 'Received'],
      ...keys.map((k) => [
        lab(k),
        map[k].n,
        milliStr(map[k].inv),
        milliStr(map[k].rec),
      ]),
    ];
  }, [keys, map, group]);

  useEffect(() => {
    onUpdateCSV(csv);
  }, [csv, onUpdateCSV]);

  return (
    <>
      <div
        className="filters"
        style={{ borderBottom: 0, paddingBottom: 0 }}
      >
        <span style={{ color: 'var(--muted)', fontSize: 12.5 }}>Group by</span>
        <div className="seg" data-rep="group">
          {(['day', 'month', 'year'] as const).map((g) => (
            <button
              key={g}
              type="button"
              data-v={g}
              className={group === g ? 'on' : ''}
              onClick={() => onGroupChange(g)}
            >
              {g[0].toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Period</th>
              <th className="r">Invoices</th>
              <th className="r">Invoiced</th>
              <th className="r">Cash received</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && keys.length === 0 ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={`skel-${idx}`}>
                  <td><SkeletonBox width={120} height={18} /></td>
                  <td className="r"><SkeletonBox width={40} height={18} /></td>
                  <td className="r"><SkeletonBox width={90} height={18} /></td>
                  <td className="r"><SkeletonBox width={90} height={18} /></td>
                </tr>
              ))
            ) : keys.length > 0 ? (
              keys.map((k) => (
                <tr key={k}>
                  <td>{lab(k)}</td>
                  <td className="r">{map[k].n}</td>
                  <td className="r">{formatMoney(map[k].inv, 'USD')}</td>
                  <td className="r strong">{formatMoney(map[k].rec, 'USD')}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>
                  <div className="empty">No activity in this period.</div>
                </td>
              </tr>
            )}
          </tbody>
          {keys.length > 0 && (
            <tfoot>
              <tr>
                <td className="strong">Total</td>
                <td />
                <td className="r strong">{formatMoney(total.inv, 'USD')}</td>
                <td className="r strong">{formatMoney(total.rec, 'USD')}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </>
  );
};
