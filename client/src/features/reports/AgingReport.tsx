import React, { useEffect, useMemo } from 'react';
import { SkeletonBox } from 'skullet/react';
import {
  MOCK_INVOICES,
  getCustomerById,
  invFin,
  invStatus,
  toBase,
  TODAY,
} from '../../lib/mockData';
import { fmtD, formatMoney, milliStr, daysBetween } from '../../lib/formatters';
import { useNavStore } from '../../store/useNavStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useReports } from '../../hooks/useReports';

export interface AgingReportProps {
  to: string;
  cust: string;
  onUpdateCSV: (matrix: (string | number)[][]) => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  unpaid: 'Unpaid',
  partial: 'Partially paid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  issued: 'Issued',
};

export const AgingReport: React.FC<AgingReportProps> = ({
  to,
  cust,
  onUpdateCSV,
}) => {
  const { setSelectedRecord } = useNavStore();
  const { user } = useAuthStore();
  const isDemo = user?.isDemo === true;
  const { data: apiData, isLoading } = useReports(
    'outstanding',
    undefined,
    undefined,
    to,
    cust === 'all' ? undefined : cust
  );

  const cOk = (id: string) => cust === 'all' || id === cust;

  const { openInvoices, agingBuckets } = useMemo(() => {
    if (apiData?.buckets) {
      const b = apiData.buckets;
      const invs = (apiData.invoices || []).map((i: any) => {
        const custObj = i.customer;
        const custName = typeof custObj === 'object' ? custObj?.name : 'Customer';
        const custId = typeof custObj === 'object' ? custObj?._id || custObj?.id : custObj;

        return {
          id: i.invoice_id || i._id || i.id,
          number: i.number,
          customerId: custId,
          customerName: custName,
          due: i.due,
          due_date: i.due,
          daysOverdue: i.days_overdue ?? 0,
          balance: i.balance_milli ?? 0,
          total: i.total_milli ?? 0,
          status: i.days_overdue > 0 ? 'overdue' : 'unpaid',
          currency: 'USD',
        };
      });

      const buckets = [
        { l: 'Current', amt: b.current ?? 0, n: invs.filter((i: any) => i.daysOverdue <= 0).length },
        { l: '1–30 days', amt: b.d1_30 ?? 0, n: invs.filter((i: any) => i.daysOverdue >= 1 && i.daysOverdue <= 30).length },
        { l: '31–60 days', amt: b.d31_60 ?? 0, n: invs.filter((i: any) => i.daysOverdue >= 31 && i.daysOverdue <= 60).length },
        { l: '61–90 days', amt: b.d61_90 ?? 0, n: invs.filter((i: any) => i.daysOverdue >= 61 && i.daysOverdue <= 90).length },
        { l: '90+ days', amt: (b.d60_plus ?? 0) + (b.d90_plus ?? 0), n: invs.filter((i: any) => i.daysOverdue >= 91).length },
      ];

      return { openInvoices: invs, agingBuckets: buckets };
    }

    if (!isDemo) {
      return { openInvoices: [], agingBuckets: [] };
    }

    // Mock fallback strictly for Demo Mode
    const open = MOCK_INVOICES.filter(
      (i) =>
        i.state === 'issued' &&
        invFin(i).balance > 0 &&
        cOk(i.customerId) &&
        i.date <= to
    ).map((i) => {
      const dueDate = i.due || i.due_date || '';
      const d = daysBetween(dueDate, TODAY);
      const fin = invFin(i);
      const c = getCustomerById(i.customerId);

      return {
        id: i.id,
        number: i.number,
        customerId: i.customerId,
        customerName: c?.name || i.customerName,
        due: dueDate,
        due_date: dueDate,
        daysOverdue: Math.max(0, d),
        balance: fin.balance,
        total: fin.total,
        status: invStatus(i),
        currency: i.currency,
      };
    });

    const B: [string, number, number][] = [
      ['Current', -1e9, 0],
      ['1–30 days', 1, 30],
      ['31–60 days', 31, 60],
      ['61–90 days', 61, 90],
      ['90+ days', 91, 1e9],
    ];

    const buckets = B.map(([l, a, b]) => {
      const list = open.filter((i) => {
        const d = daysBetween(i.due, TODAY);
        return d >= a && d <= b;
      });
      return {
        l,
        amt: list.reduce((s, i) => s + toBase(i.balance, i.currency), 0),
        n: list.length,
      };
    });

    return { openInvoices: open, agingBuckets: buckets };
  }, [apiData, to, cust, isDemo]);

  // Construct CSV matrix matching prototype line 911
  const csv = useMemo(() => {
    return [
      ['Invoice', 'Customer', 'Due', 'Days overdue', 'Balance'],
      ...openInvoices.map((i: any) => [
        i.number,
        i.customerName,
        i.due,
        i.daysOverdue,
        milliStr(i.balance),
      ]),
    ];
  }, [openInvoices]);

  useEffect(() => {
    onUpdateCSV(csv);
  }, [csv, onUpdateCSV]);

  const sortedInvoices = useMemo(() => {
    return [...openInvoices].sort((a, b) =>
      (a.due || '').localeCompare(b.due || '')
    );
  }, [openInvoices]);

  return (
    <>
      <div className="panel-body">
        <div className="kpis">
          {isLoading && agingBuckets.every((b) => b.amt === 0) ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="kpi" style={{ boxShadow: 'none' }}>
                <SkeletonBox width={80} height={14} />
                <SkeletonBox width={100} height={24} />
                <SkeletonBox width={60} height={12} />
              </div>
            ))
          ) : (
            agingBuckets.map((a, i) => (
              <div
                key={a.l}
                className={`kpi ${i > 0 && a.amt > 0 ? 'alert' : ''}`}
                style={{ boxShadow: 'none' }}
              >
                <span className="k-label">{a.l}</span>
                <span className="k-value">{formatMoney(a.amt, 'USD')}</span>
                <span className="k-meta">
                  {a.n} {a.n === 1 ? 'invoice' : 'invoices'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Due date</th>
              <th className="r">Days overdue</th>
              <th>Status</th>
              <th className="r">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && sortedInvoices.length === 0 ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={`skel-${idx}`}>
                  <td><SkeletonBox width={80} height={18} /></td>
                  <td><SkeletonBox width={150} height={18} /></td>
                  <td><SkeletonBox width={90} height={18} /></td>
                  <td className="r"><SkeletonBox width={40} height={18} /></td>
                  <td><SkeletonBox width={60} height={18} /></td>
                  <td className="r"><SkeletonBox width={80} height={18} /></td>
                </tr>
              ))
            ) : sortedInvoices.length > 0 ? (
              sortedInvoices.map((i) => {
                const s = i.status || 'unpaid';
                return (
                  <tr
                    key={i.id}
                    className="link"
                    data-href={`#invoice-${i.id}`}
                    onClick={() => setSelectedRecord('invoices', i.id)}
                  >
                    <td className="mono">{i.number}</td>
                    <td>{i.customerName}</td>
                    <td className="muted">{fmtD(i.due)}</td>
                    <td
                      className="r"
                      style={
                        i.daysOverdue > 0
                          ? { color: 'var(--bad)', fontWeight: 600 }
                          : undefined
                      }
                    >
                      {i.daysOverdue > 0 ? `${i.daysOverdue}d` : '—'}
                    </td>
                    <td>
                      <span className={`chip c-${s}`}>
                        {STATUS_LABELS[s] || s}
                      </span>
                    </td>
                    <td className="r strong">
                      {formatMoney(i.balance, i.currency || 'USD')}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="empty">
                    No outstanding invoices for this selection.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
