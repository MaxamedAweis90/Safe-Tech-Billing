import React, { useEffect, useMemo } from 'react';
import { SkeletonBox } from 'skullet/react';
import {
  MOCK_PAYMENTS,
  MOCK_RECEIPTS,
  getInvoiceById,
  getCustomerById,
  toBase,
} from '../../lib/mockData';
import { fmtD, formatMoney, milliStr } from '../../lib/formatters';
import { useNavStore } from '../../store/useNavStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useReports } from '../../hooks/useReports';

export interface PaymentReportProps {
  from: string;
  to: string;
  cust: string;
  onUpdateCSV: (matrix: (string | number)[][]) => void;
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank transfer',
  mobile: 'Mobile money',
  card: 'Card',
};

const METHOD_KEYS = ['cash', 'bank', 'mobile', 'card'] as const;

export const PaymentReport: React.FC<PaymentReportProps> = ({
  from,
  to,
  cust,
  onUpdateCSV,
}) => {
  const { setSelectedRecord } = useNavStore();
  const { user } = useAuthStore();
  const isDemo = user?.isDemo === true;
  const { data: apiData, isLoading } = useReports(
    'payments',
    undefined,
    from,
    to,
    cust === 'all' ? undefined : cust
  );

  const inR = (d: string) => d >= from && d <= to;
  const cOk = (id: string) => cust === 'all' || id === cust;

  const { payments, byMethod } = useMemo(() => {
    if (apiData?.by_method) {
      const byM: Record<string, number> = {
        cash: apiData.by_method.cash?.total_milli ?? 0,
        bank: apiData.by_method.bank?.total_milli ?? 0,
        mobile: apiData.by_method.mobile?.total_milli ?? 0,
        card: apiData.by_method.card?.total_milli ?? 0,
      };

      // If backend populated payments list:
      const ps = (apiData.payments || []).map((p: any) => ({
        id: p._id || p.id,
        date: p.date,
        receiptId: p.receipt_id || p.receiptId,
        receiptNumber: p.receipt_number || p.receiptNumber || 'RC-Live',
        invoiceId: typeof p.invoice_id === 'object' ? p.invoice_id?._id : p.invoice_id,
        invoiceNumber: typeof p.invoice_id === 'object' ? p.invoice_id?.number : p.invoiceNumber || 'INV',
        customerId: typeof p.customer_id === 'object' ? p.customer_id?._id : p.customer_id,
        customerName: typeof p.customer_id === 'object' ? p.customer_id?.name : p.customerName || 'Customer',
        method: p.method,
        reference: p.reference || '',
        amount_milli: p.amount_milli,
        currency: p.currency || 'USD',
      }));

      // If backend has no payments list attached to report summary, fall back to matching mock list only in Demo Mode
      if (ps.length === 0) {
        if (!isDemo) {
          return { payments: [], byMethod: byM };
        }
        const mockPs = MOCK_PAYMENTS.filter((p) => {
          const inv = getInvoiceById(p.invoiceId);
          const customerId = inv?.customerId || p.customerId;
          return inR(p.date) && cOk(customerId);
        }).sort((a, b) => b.date.localeCompare(a.date));
        return { payments: mockPs, byMethod: byM };
      }

      return { payments: ps, byMethod: byM };
    }

    if (!isDemo) {
      return { payments: [], byMethod: {} };
    }

    // Local mock data calculation
    const ps = MOCK_PAYMENTS.filter((p) => {
      const inv = getInvoiceById(p.invoiceId);
      const customerId = inv?.customerId || p.customerId;
      return inR(p.date) && cOk(customerId);
    }).sort((a, b) => b.date.localeCompare(a.date));

    const byM: Record<string, number> = {};
    ps.forEach((p) => {
      const inv = getInvoiceById(p.invoiceId);
      const cur = inv?.currency || p.currency || 'USD';
      byM[p.method] = (byM[p.method] || 0) + toBase(p.amount_milli, cur);
    });

    return { payments: ps, byMethod: byM };
  }, [apiData, from, to, cust]);

  // Construct CSV matrix matching prototype line 915
  const csv = useMemo(() => {
    return [
      ['Date', 'Receipt', 'Invoice', 'Customer', 'Method', 'Reference', 'Amount'],
      ...payments.map((p: any) => {
        const r = MOCK_RECEIPTS.find((x) => x.id === p.receiptId);
        const i = getInvoiceById(p.invoiceId);
        const c = getCustomerById(i?.customerId || p.customerId);
        return [
          p.date,
          p.receiptNumber || r?.number || '',
          p.invoiceNumber || i?.number || '',
          p.customerName || c?.name || '',
          METHOD_LABELS[p.method] || p.method,
          p.reference || '',
          milliStr(p.amount_milli),
        ];
      }),
    ];
  }, [payments]);

  useEffect(() => {
    onUpdateCSV(csv);
  }, [csv, onUpdateCSV]);

  return (
    <>
      <div className="panel-body">
        <div className="kpis">
          {isLoading && Object.values(byMethod).every((v) => v === 0) ? (
            METHOD_KEYS.map((m) => (
              <div key={m} className="kpi" style={{ boxShadow: 'none' }}>
                <SkeletonBox width={80} height={14} />
                <SkeletonBox width={100} height={24} />
              </div>
            ))
          ) : (
            METHOD_KEYS.map((m) => (
              <div key={m} className="kpi" style={{ boxShadow: 'none' }}>
                <span className="k-label">{METHOD_LABELS[m]}</span>
                <span className="k-value" style={{ fontSize: 19 }}>
                  {formatMoney(byMethod[m] || 0, 'USD')}
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
              <th>Date</th>
              <th>Receipt</th>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Method</th>
              <th>Reference</th>
              <th className="r">Amount</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && payments.length === 0 ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={`skel-${idx}`}>
                  <td><SkeletonBox width={80} height={18} /></td>
                  <td><SkeletonBox width={70} height={18} /></td>
                  <td><SkeletonBox width={80} height={18} /></td>
                  <td><SkeletonBox width={140} height={18} /></td>
                  <td><SkeletonBox width={90} height={18} /></td>
                  <td><SkeletonBox width={100} height={18} /></td>
                  <td className="r"><SkeletonBox width={70} height={18} /></td>
                </tr>
              ))
            ) : payments.length > 0 ? (
              payments.map((p: any) => {
                const r = MOCK_RECEIPTS.find((x) => x.id === p.receiptId);
                const i = getInvoiceById(p.invoiceId);
                const c = getCustomerById(i?.customerId || p.customerId);
                const rNum = p.receiptNumber || r?.number || 'Receipt';
                const iNum = p.invoiceNumber || i?.number || 'Invoice';
                const cName = p.customerName || c?.name || 'Customer';

                return (
                  <tr
                    key={p.id}
                    className="link"
                    data-href={p.receiptId ? `#receipt-${p.receiptId}` : undefined}
                    onClick={() => {
                      if (p.receiptId) setSelectedRecord('receipts', p.receiptId);
                      else if (p.invoiceId) setSelectedRecord('invoices', p.invoiceId);
                    }}
                  >
                    <td className="muted">{fmtD(p.date)}</td>
                    <td className="mono">{rNum}</td>
                    <td className="mono">{iNum}</td>
                    <td>{cName}</td>
                    <td>{METHOD_LABELS[p.method] || p.method}</td>
                    <td className="mono muted">{p.reference || '—'}</td>
                    <td className="r strong" style={{ color: 'var(--ok)' }}>
                      +{formatMoney(p.amount_milli, p.currency || 'USD')}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7}>
                  <div className="empty">No payments in this period.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
