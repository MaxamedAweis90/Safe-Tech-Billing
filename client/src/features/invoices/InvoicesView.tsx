import React, { useState } from 'react';
import { SkeletonBox } from 'skullet/react';
import { Icon } from '../../components/icons';
import { Badge } from '../../components/ui/Badge';
import { InvoiceEditor } from './InvoiceEditor';
import { InvoiceDetailView } from './InvoiceDetailView';
import { useInvoices } from '../../hooks/useInvoices';
import {
  MOCK_INVOICES,
  TODAY,
  invFin,
  invStatus,
  getInvoiceById,
  getCustomerById,
  MockInvoice,
} from '../../lib/mockData';
import { fmtD, daysBetween, formatMoney } from '../../lib/formatters';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';

const STATUS_LABELS: Record<string, string> = {
  all: 'All',
  draft: 'Draft',
  sent: 'Sent',
  unpaid: 'Unpaid',
  partial: 'Partially paid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

const FILTER_SEGMENTS = [
  'all',
  'draft',
  'sent',
  'unpaid',
  'partial',
  'paid',
  'overdue',
  'cancelled',
];

export const InvoicesView: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { can, user } = useAuthStore();
  const { selectedRecordId, setSelectedRecord } = useNavStore();

  const isDemo = Boolean(user?.isDemo && (user?.email === 'demo@account.com' || user?.id === 'usr_demo_admin'));

  // Query live invoices from backend Express API
  const {
    data: apiData,
    isLoading,
    isError,
    refetch,
  } = useInvoices({
    status: filter === 'all' ? undefined : filter,
    q: searchTerm.trim() || undefined,
  });

  // If "new" is requested or an invoice is selected, determine whether to render Editor or Detail
  if (selectedRecordId) {
    if (selectedRecordId === 'new') {
      return (
        <InvoiceEditor
          invoiceId="new"
          onBack={() => setSelectedRecord('invoices', null)}
          onIssued={(inv) => setSelectedRecord('invoices', inv.id)}
        />
      );
    }

    // Determine state from live data or mock data
    const liveMatch = apiData?.invoices?.find(
      (i: any) => i._id === selectedRecordId || i.id === selectedRecordId
    );
    const mockMatch = isDemo ? getInvoiceById(selectedRecordId) : undefined;
    const isDraft = (liveMatch?.state || mockMatch?.state) === 'draft';

    if (isDraft) {
      return (
        <InvoiceEditor
          invoiceId={selectedRecordId}
          onBack={() => setSelectedRecord('invoices', null)}
          onIssued={(inv) => setSelectedRecord('invoices', inv.id)}
        />
      );
    }

    return (
      <InvoiceDetailView
        invoiceId={selectedRecordId}
        onBack={() => setSelectedRecord('invoices', null)}
        onNavigateReceipt={(receiptId) => setSelectedRecord('receipts', receiptId)}
        onNavigateCustomer={(customerId) => setSelectedRecord('customers', customerId)}
        onNavigateQuote={(quoteId) => setSelectedRecord('quotations', quoteId)}
      />
    );
  }

  // Fallback to prototype mock data strictly if in Demo Mode
  const hasLiveInvoices = Boolean(apiData?.invoices && apiData.invoices.length > 0);

  // Normalize invoices from API or mock (live data strictly isolated for real accounts)
  const liveRows: MockInvoice[] = hasLiveInvoices && apiData
    ? apiData.invoices.map((i: any) => {
        const custObj = i.customer_id;
        const custName =
          i.customerName ||
          (typeof custObj === 'object' ? custObj?.name : undefined) ||
          'Customer';

        return {
          id: i._id || i.id,
          number: i.number || '',
          customerId: typeof custObj === 'object' ? custObj?._id || custObj?.id : custObj,
          customerName: custName,
          date: i.date,
          due: i.due,
          termsDays: i.terms_days || 30,
          state: i.state,
          status: i.status || 'unpaid',
          currency: i.currency || 'USD',
          total_milli: i.total_milli || 0,
          paid_milli: i.paid_milli || 0,
          balance_milli: i.balance_milli || 0,
          items: (i.items || []).map((it: any) => ({
            desc: it.desc,
            qty: it.qty,
            price: it.price_milli ?? it.price ?? 0,
            disc: it.disc_pct ?? it.disc ?? 0,
            taxRate: it.tax_rate ?? it.taxRate ?? 0,
            taxName: it.tax_name ?? it.taxName ?? '',
          })),
        } as MockInvoice;
      })
    : isDemo
    ? MOCK_INVOICES
    : [];

  // Compute live filter segment counts
  const allList = liveRows;
  const counts: Record<string, number> = { all: allList.length };
  allList.forEach((i) => {
    const s = invStatus(i);
    counts[s] = (counts[s] || 0) + 1;
  });

  // Filter and sort display rows
  const filteredRows = liveRows
    .filter((i) => filter === 'all' || invStatus(i) === filter)
    .filter((i) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const numOrDraft = i.number || 'draft';
      return `${numOrDraft} ${i.customerName || ''}`.toLowerCase().includes(term);
    })
    .sort(
      (a, b) =>
        (a.state === 'draft' ? -1 : 0) - (b.state === 'draft' ? -1 : 0) ||
        b.date.localeCompare(a.date)
    );

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Invoices</h1>
          <p>
            Issued invoices are locked. Corrections go through credit notes or cancellation, and every change is logged.
          </p>
        </div>
        <div className="actions">
          {can('invoices') && (
            <button
              className="btn primary"
              onClick={() => setSelectedRecord('invoices', 'new')}
            >
              <Icon name="plus" size={15} />
              New invoice
            </button>
          )}
        </div>
      </div>

      {/* Main Panel with Filter Bar & Invoices Table */}
      <section className="panel">
        <div className="filters">
          {/* Segmented Filter Pills */}
          <div className="seg" data-seg="invoices">
            {FILTER_SEGMENTS.map((f) => (
              <button
                key={f}
                type="button"
                className={filter === f ? 'on' : ''}
                onClick={() => setFilter(f)}
              >
                {STATUS_LABELS[f]}{' '}
                <span className="num" style={{ opacity: 0.6 }}>
                  {f === 'all' ? counts.all : counts[f] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Real-time Search Box */}
          <input
            className="inp"
            style={{ flex: 1, minWidth: 160, maxWidth: 280 }}
            placeholder="Filter by number or customer"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Ledger Table */}
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Due</th>
                <th>Status</th>
                <th className="r">Total</th>
                <th className="r">Paid</th>
                <th className="r">Balance</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td>
                      <SkeletonBox height={14} width={80} />
                    </td>
                    <td>
                      <SkeletonBox height={14} width={160} />
                    </td>
                    <td>
                      <SkeletonBox height={14} width={75} />
                    </td>
                    <td>
                      <SkeletonBox height={14} width={75} />
                    </td>
                    <td>
                      <SkeletonBox height={18} width={70} radius={999} />
                    </td>
                    <td className="r">
                      <SkeletonBox height={14} width={70} style={{ marginLeft: 'auto' }} />
                    </td>
                    <td className="r">
                      <SkeletonBox height={14} width={60} style={{ marginLeft: 'auto' }} />
                    </td>
                    <td className="r">
                      <SkeletonBox height={14} width={70} style={{ marginLeft: 'auto' }} />
                    </td>
                  </tr>
                ))
              ) : filteredRows.length > 0 ? (
                filteredRows.map((i) => {
                  const s = invStatus(i);
                  const f = invFin(i);
                  const late = s === 'overdue' ? daysBetween(i.due, TODAY) : 0;
                  const cust = getCustomerById(i.customerId);
                  const custName = cust ? cust.name : (i.customerName || '—');

                  return (
                    <tr
                      key={i.id}
                      className="link"
                      onClick={() => setSelectedRecord('invoices', i.id)}
                    >
                      <td className="mono strong">
                        {i.number ? i.number : <span className="muted">Draft</span>}
                      </td>
                      <td>{custName}</td>
                      <td className="muted">{fmtD(i.date)}</td>
                      <td className="muted">
                        {fmtD(i.due)}
                        {late > 0 ? (
                          <div style={{ color: 'var(--bad)', fontSize: 11.5 }}>
                            {late} days late
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <Badge variant={s as any}>{s}</Badge>
                      </td>
                      <td className="r font-mono">
                        {formatMoney(f.total, i.currency)}
                      </td>
                      <td className="r muted font-mono">
                        {f.paid ? formatMoney(f.paid, i.currency) : '—'}
                      </td>
                      <td
                        className="r strong font-mono"
                        style={{
                          color:
                            f.balance > 0 && s === 'overdue'
                              ? 'var(--bad)'
                              : undefined,
                        }}
                      >
                        {i.state === 'issued' ? formatMoney(f.balance, i.currency) : '—'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">
                      {isError ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span>Failed to fetch invoices from server.</span>
                          <button
                            type="button"
                            className="btn sm"
                            onClick={() => refetch()}
                            style={{ alignSelf: 'center' }}
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        'No invoices match this filter.'
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};
