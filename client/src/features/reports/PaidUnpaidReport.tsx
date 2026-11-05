import React, { useEffect, useMemo } from 'react';
import { SkeletonBox } from 'skullet/react';
import { MOCK_INVOICES, invFin, invStatus, toBase } from '../../lib/mockData';
import { formatMoney, milliStr, totalsOf } from '../../lib/formatters';
import { useAuthStore } from '../../store/useAuthStore';
import { useReports } from '../../hooks/useReports';

export interface PaidUnpaidReportProps {
  from: string;
  to: string;
  cust: string;
  onUpdateCSV: (matrix: (string | number)[][]) => void;
}

export const PaidUnpaidReport: React.FC<PaidUnpaidReportProps> = ({
  from,
  to,
  cust,
  onUpdateCSV,
}) => {
  const { user } = useAuthStore();
  const isDemo = user?.isDemo === true;
  const { data: apiData, isLoading } = useReports(
    'paidunpaid',
    undefined,
    from,
    to,
    cust === 'all' ? undefined : cust
  );

  const inR = (d: string) => d >= from && d <= to;
  const cOk = (id: string) => cust === 'all' || id === cust;

  const { groups } = useMemo(() => {
    if (apiData?.invoices && apiData.invoices.length > 0) {
      const is = apiData.invoices;
      const grp = [
        {
          label: 'Paid',
          list: is.filter((i: any) => i.status === 'paid'),
        },
        {
          label: 'Partially paid',
          list: is.filter((i: any) => i.status === 'partial'),
        },
        {
          label: 'Unpaid (not yet due)',
          list: is.filter((i: any) => ['sent', 'unpaid'].includes(i.status)),
        },
        {
          label: 'Overdue',
          list: is.filter((i: any) => i.status === 'overdue'),
        },
      ];

      return {
        groups: grp.map((g) => ({
          label: g.label,
          count: g.list.length,
          invoiced: g.list.reduce((sum: number, i: any) => sum + (i.total_milli ?? 0), 0),
          collected: g.list.reduce((sum: number, i: any) => sum + (i.paid_milli ?? 0), 0),
          balance: g.list.reduce((sum: number, i: any) => sum + (i.balance_milli ?? 0), 0),
        })),
      };
    }

    if (!isDemo) {
      return { groups: [] };
    }

    // Mock fallback
    const is = MOCK_INVOICES.filter(
      (i) => i.state === 'issued' && inR(i.date) && cOk(i.customerId)
    );

    const grp = [
      { label: 'Paid', list: is.filter((i) => invStatus(i) === 'paid') },
      { label: 'Partially paid', list: is.filter((i) => invStatus(i) === 'partial') },
      {
        label: 'Unpaid (not yet due)',
        list: is.filter((i) => ['sent', 'unpaid'].includes(invStatus(i))),
      },
      { label: 'Overdue', list: is.filter((i) => invStatus(i) === 'overdue') },
    ];

    return {
      groups: grp.map((g) => ({
        label: g.label,
        count: g.list.length,
        invoiced: g.list.reduce(
          (a, i) => a + toBase(totalsOf({ items: i.items || [] }).total, i.currency),
          0
        ),
        collected: g.list.reduce(
          (a, i) => a + toBase(invFin(i).paid + invFin(i).credit, i.currency),
          0
        ),
        balance: g.list.reduce((a, i) => a + toBase(invFin(i).balance, i.currency), 0),
      })),
    };
  }, [apiData, from, to, cust]);

  // Construct CSV matrix matching prototype line 924
  const csv = useMemo(() => {
    return [
      ['Group', 'Invoices', 'Total', 'Paid', 'Balance'],
      ...groups.map((g) => [
        g.label,
        g.count,
        milliStr(g.invoiced),
        milliStr(g.collected),
        milliStr(g.balance),
      ]),
    ];
  }, [groups]);

  useEffect(() => {
    onUpdateCSV(csv);
  }, [csv, onUpdateCSV]);

  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>Group</th>
            <th className="r">Invoices</th>
            <th className="r">Invoiced</th>
            <th className="r">Collected</th>
            <th className="r">Balance</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && groups.every((g) => g.count === 0) ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <tr key={`skel-${idx}`}>
                <td><SkeletonBox width={140} height={18} /></td>
                <td className="r"><SkeletonBox width={40} height={18} /></td>
                <td className="r"><SkeletonBox width={80} height={18} /></td>
                <td className="r"><SkeletonBox width={80} height={18} /></td>
                <td className="r"><SkeletonBox width={80} height={18} /></td>
              </tr>
            ))
          ) : (
            groups.map((g) => (
              <tr key={g.label}>
                <td className="strong">{g.label}</td>
                <td className="r">{g.count}</td>
                <td className="r">{formatMoney(g.invoiced, 'USD')}</td>
                <td className="r">{formatMoney(g.collected, 'USD')}</td>
                <td className="r strong">{formatMoney(g.balance, 'USD')}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
