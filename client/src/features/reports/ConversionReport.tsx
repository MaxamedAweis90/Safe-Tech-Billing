import React, { useEffect, useMemo } from 'react';
import { SkeletonBox } from 'skullet/react';
import {
  MOCK_QUOTES,
  getCustomerById,
  getInvoiceById,
  toBase,
} from '../../lib/mockData';
import { fmtD, formatMoney, milliStr, qStatus, totalsOf } from '../../lib/formatters';
import { useNavStore } from '../../store/useNavStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useReports } from '../../hooks/useReports';

export interface ConversionReportProps {
  from: string;
  to: string;
  cust: string;
  onUpdateCSV: (matrix: (string | number)[][]) => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
};

export const ConversionReport: React.FC<ConversionReportProps> = ({
  from,
  to,
  cust,
  onUpdateCSV,
}) => {
  const { setSelectedRecord } = useNavStore();
  const { user } = useAuthStore();
  const isDemo = user?.isDemo === true;
  const { data: apiData, isLoading } = useReports(
    'conversion',
    undefined,
    from,
    to,
    cust === 'all' ? undefined : cust
  );

  const inR = (d: string) => d >= from && d <= to;
  const cOk = (id: string) => cust === 'all' || id === cust;

  const { quotes, stats } = useMemo(() => {
    // If backend returns conversion payload:
    if (apiData?.conversion) {
      const conv = apiData.conversion;
      const qs = (apiData.quotes || []).map((q: any) => ({
        id: q._id || q.id,
        number: q.number,
        customerId: typeof q.customer_id === 'object' ? q.customer_id?._id : q.customer_id,
        customerName: typeof q.customer_id === 'object' ? q.customer_id?.name : q.customerName || 'Customer',
        date: q.date,
        state: q.state,
        total_milli: q.total_milli ?? 0,
        invoiceId: q.invoice_id,
        invoiceNumber: q.invoice_number,
        currency: q.currency || 'USD',
      }));

      // If quotes list is populated:
      if (qs.length > 0) {
        return {
          quotes: qs,
          stats: {
            totalQuoted: conv.total_quotes,
            totalQuotedVal: qs.reduce((acc: number, q: any) => acc + q.total_milli, 0),
            winRate: Math.round(conv.conversion_rate_pct ?? 0),
            acceptedCount: conv.accepted_quotes ?? 0,
            decidedCount: conv.total_quotes,
            convertedCount: conv.converted_to_invoices ?? 0,
            convertedVal: 0,
            openCount: Math.max(0, conv.total_quotes - conv.accepted_quotes),
            openVal: 0,
          },
        };
      }

      if (!isDemo) {
        return {
          quotes: [],
          stats: {
            totalQuoted: 0,
            totalQuotedVal: 0,
            winRate: 0,
            acceptedCount: 0,
            decidedCount: 0,
            convertedCount: 0,
            convertedVal: 0,
            openCount: 0,
            openVal: 0,
          },
        };
      }
    }

    if (!isDemo) {
      return {
        quotes: [],
        stats: {
          totalQuoted: 0,
          totalQuotedVal: 0,
          winRate: 0,
          acceptedCount: 0,
          decidedCount: 0,
          convertedCount: 0,
          convertedVal: 0,
          openCount: 0,
          openVal: 0,
        },
      };
    }

    // Fallback to local mock data
    const qs = MOCK_QUOTES.filter((q) => inR(q.date) && cOk(q.customerId)).map((q) => {
      const tot = totalsOf({ items: q.items || [] }).total;
      const c = getCustomerById(q.customerId);
      const inv = q.invoiceId ? getInvoiceById(q.invoiceId) : undefined;
      return {
        id: q.id,
        number: q.number,
        customerId: q.customerId,
        customerName: c?.name || q.customerName,
        date: q.date,
        state: qStatus(q),
        total_milli: tot,
        invoiceId: q.invoiceId,
        invoiceNumber: inv?.number,
        currency: q.currency,
      };
    });

    const cnt = (s: string) => qs.filter((q) => q.state === s);
    const acc = cnt('accepted');
    const conv = qs.filter((q) => q.invoiceId);
    const decided = acc.length + cnt('rejected').length + cnt('expired').length;
    const valueCalc = (list: any[]) =>
      list.reduce((a, q) => a + toBase(q.total_milli, q.currency), 0);

    const winRate = decided ? Math.round((acc.length / decided) * 100) : 0;
    const openQuotes = [...cnt('sent'), ...cnt('draft')];

    return {
      quotes: qs,
      stats: {
        totalQuoted: qs.length,
        totalQuotedVal: valueCalc(qs),
        winRate,
        acceptedCount: acc.length,
        decidedCount: decided,
        convertedCount: conv.length,
        convertedVal: valueCalc(conv),
        openCount: openQuotes.length,
        openVal: valueCalc(openQuotes),
      },
    };
  }, [apiData, from, to, cust]);

  // Construct CSV matrix matching prototype line 920
  const csv = useMemo(() => {
    return [
      ['Quotation', 'Customer', 'Date', 'Status', 'Total', 'Invoice'],
      ...quotes.map((q: any) => [
        q.number,
        q.customerName,
        q.date,
        STATUS_LABELS[q.state] || q.state,
        milliStr(q.total_milli),
        q.invoiceNumber || (q.invoiceId ? 'Draft' : ''),
      ]),
    ];
  }, [quotes]);

  useEffect(() => {
    onUpdateCSV(csv);
  }, [csv, onUpdateCSV]);

  const sortedQuotes = useMemo(() => {
    return [...quotes].sort((a, b) => b.date.localeCompare(a.date));
  }, [quotes]);

  return (
    <>
      <div className="panel-body">
        <div className="kpis">
          {isLoading && stats.totalQuoted === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="kpi" style={{ boxShadow: 'none' }}>
                <SkeletonBox width={80} height={14} />
                <SkeletonBox width={100} height={24} />
                <SkeletonBox width={60} height={12} />
              </div>
            ))
          ) : (
            <>
              <div className="kpi" style={{ boxShadow: 'none' }}>
                <span className="k-label">Win rate</span>
                <span className="k-value" style={{ fontSize: 24, color: 'var(--ok)' }}>
                  {stats.winRate}%
                </span>
                <span className="k-meta">
                  {stats.acceptedCount} of {stats.decidedCount} decided
                </span>
              </div>
              <div className="kpi" style={{ boxShadow: 'none' }}>
                <span className="k-label">Converted to invoice</span>
                <span className="k-value" style={{ fontSize: 20 }}>
                  {stats.convertedCount}
                </span>
                <span className="k-meta">
                  {stats.convertedVal > 0 ? formatMoney(stats.convertedVal, 'USD') : 'Active conversion'}
                </span>
              </div>
              <div className="kpi" style={{ boxShadow: 'none' }}>
                <span className="k-label">Open pipeline</span>
                <span className="k-value" style={{ fontSize: 20 }}>
                  {stats.openCount}
                </span>
                <span className="k-meta">
                  {stats.openVal > 0 ? formatMoney(stats.openVal, 'USD') : 'Pending quotes'}
                </span>
              </div>
              <div className="kpi" style={{ boxShadow: 'none' }}>
                <span className="k-label">Total quoted</span>
                <span className="k-value" style={{ fontSize: 20 }}>
                  {stats.totalQuoted}
                </span>
                <span className="k-meta">
                  {formatMoney(stats.totalQuotedVal, 'USD')}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Quotation</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th className="r">Amount</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && sortedQuotes.length === 0 ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={`skel-${idx}`}>
                  <td><SkeletonBox width={80} height={18} /></td>
                  <td><SkeletonBox width={140} height={18} /></td>
                  <td><SkeletonBox width={90} height={18} /></td>
                  <td><SkeletonBox width={60} height={18} /></td>
                  <td className="r"><SkeletonBox width={70} height={18} /></td>
                  <td><SkeletonBox width={70} height={18} /></td>
                </tr>
              ))
            ) : sortedQuotes.length > 0 ? (
              sortedQuotes.map((q) => (
                <tr
                  key={q.id}
                  className="link"
                  data-href={`#quote-${q.id}`}
                  onClick={() => setSelectedRecord('quotations', q.id)}
                >
                  <td className="mono">{q.number}</td>
                  <td>{q.customerName}</td>
                  <td className="muted">{fmtD(q.date)}</td>
                  <td>
                    <span className={`chip c-${q.state}`}>
                      {STATUS_LABELS[q.state] || q.state}
                    </span>
                  </td>
                  <td className="r strong">
                    {formatMoney(q.total_milli, q.currency || 'USD')}
                  </td>
                  <td>
                    {q.invoiceId ? (
                      <span
                        className="mono link-subtle"
                        style={{ color: 'var(--accent)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord('invoices', q.invoiceId);
                        }}
                      >
                        {q.invoiceNumber || 'Invoice'}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="empty">No quotations in this period.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
