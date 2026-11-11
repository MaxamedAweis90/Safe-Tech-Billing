import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonBox } from 'skullet/react';
import { Icon } from '../../components/icons';
import { QuoteEditor } from './QuoteEditor';
import { useQuotations } from '../../hooks/useQuotations';
import { useInvoices } from '../../hooks/useInvoices';
import {
  MOCK_QUOTES,
  MOCK_INVOICES,
  MockQuote,
} from '../../lib/mockData';
import { fmtD, qStatus, totalsOf, formatMoney } from '../../lib/formatters';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';

const STATUS_LABELS: Record<string, string> = {
  all: 'All',
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
};

const FILTER_SEGMENTS = ['all', 'draft', 'sent', 'accepted', 'rejected', 'expired'];

export const QuotationsView: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { can, user } = useAuthStore();
  const { selectedRecordId, setSelectedRecord } = useNavStore();

  const isDemo = Boolean(user?.isDemo && (user?.email === 'demo@account.com' || user?.id === 'usr_demo_admin'));

  // Query live quotations from Express API
  const {
    data: apiData,
    isLoading,
    isError,
    refetch,
  } = useQuotations({
    status: filter === 'all' ? undefined : filter,
    q: searchTerm.trim() || undefined,
  });

  // Query live invoices to match linked quote conversions
  const { data: invoicesApiData } = useInvoices();

  // If a quotation is selected or "new" requested, render the QuoteEditor
  if (selectedRecordId) {
    return (
      <QuoteEditor
        quoteId={selectedRecordId}
        onBack={() => {
          setSelectedRecord('quotations', null);
          navigate('/quotations');
        }}
        onNavigateInvoice={(invId) => {
          setSelectedRecord('invoices', invId);
          navigate(`/invoices/${invId}`);
        }}
      />
    );
  }

  // Fallback to prototype mock data strictly if in Demo Mode
  const hasLiveQuotations = Boolean(apiData?.quotations && apiData.quotations.length > 0);

  // Normalize API data to unified quotation objects (live data strictly isolated for real accounts)
  const liveRows: MockQuote[] = hasLiveQuotations && apiData
    ? apiData.quotations.map((q: any) => {
        const custName =
          q.customerName ||
          (typeof q.customer_id === 'object' ? q.customer_id?.name : undefined) ||
          'Customer';
        const total = q.totals?.total ?? q.total_milli ?? totalsOf({ items: q.items || [] }).total;
        return {
          id: q._id || q.id,
          number: q.number || 'Draft',
          customerId: typeof q.customer_id === 'object' ? q.customer_id?._id : q.customer_id,
          customerName: custName,
          date: q.date,
          expiry: q.expiry,
          state: q.state,
          currency: q.currency || 'USD',
          items: (q.items || []).map((it: any) => ({
            desc: it.desc,
            qty: it.qty,
            price: it.price_milli ?? it.price ?? 0,
            disc: it.disc_pct ?? it.disc ?? 0,
            taxRate: it.tax_rate ?? it.taxRate ?? 0,
            taxName: it.tax_name ?? it.taxName ?? '',
          })),
          total_milli: total,
          invoiceId: q.invoice_id || q.invoiceId,
          invoiceNumber: q.invoiceNumber,
        } as MockQuote;
      })
    : isDemo
    ? MOCK_QUOTES
    : [];

  // Compute live filter segment counts
  const allList = liveRows;
  const counts: Record<string, number> = { all: allList.length };
  allList.forEach((q) => {
    const s = qStatus(q);
    counts[s] = (counts[s] || 0) + 1;
  });

  // Filter and sort display rows
  const filteredRows = liveRows
    .filter((q) => filter === 'all' || qStatus(q) === filter)
    .filter((q) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        q.number.toLowerCase().includes(term) ||
        q.customerName.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number));

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Quotations</h1>
          <p>Price jobs, track decisions, and convert accepted quotations into invoices.</p>
        </div>
        <div className="actions">
          {can('quotes') && (
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setSelectedRecord('quotations', 'new');
                navigate('/quotations/new');
              }}
            >
              <Icon name="plus" />
              New quotation
            </button>
          )}
        </div>
      </div>

      {/* Main Panel with Filter Bar & Table */}
      <section className="panel">
        <div className="filters">
          {/* Segmented Filter Pills */}
          <div className="seg" data-seg="quotes">
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

          {/* Interactive Search Box */}
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
                <th>Number</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Valid until</th>
                <th>Status</th>
                <th>Invoice</th>
                <th className="r">Total</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td>
                      <SkeletonBox height={14} width={90} />
                    </td>
                    <td>
                      <SkeletonBox height={14} width={150} />
                    </td>
                    <td>
                      <SkeletonBox height={14} width={75} />
                    </td>
                    <td>
                      <SkeletonBox height={14} width={75} />
                    </td>
                    <td>
                      <SkeletonBox height={18} width={65} radius={999} />
                    </td>
                    <td>
                      <SkeletonBox height={14} width={60} />
                    </td>
                    <td className="r">
                      <SkeletonBox height={14} width={75} style={{ marginLeft: 'auto' }} />
                    </td>
                  </tr>
                ))
              ) : filteredRows.length > 0 ? (
                filteredRows.map((q) => {
                  const s = qStatus(q);

                  // Locate linked invoice from API or mock
                  const linkedInvId = q.invoiceId;
                  const inv = linkedInvId
                    ? (invoicesApiData?.invoices || (isDemo ? MOCK_INVOICES : [])).find(
                        (i: any) => i._id === linkedInvId || i.id === linkedInvId
                      )
                    : undefined;

                  const totals = totalsOf({ items: q.items });

                  return (
                    <tr
                      key={q.id}
                      className="link"
                      onClick={() => {
                        setSelectedRecord('quotations', q.id);
                        navigate(`/quotations/${q.id}`);
                      }}
                    >
                      <td className="mono strong" style={{ color: 'var(--accent)' }}>
                        {q.number}
                      </td>
                      <td>{q.customerName}</td>
                      <td className="muted">{fmtD(q.date)}</td>
                      <td className="muted">{fmtD(q.expiry)}</td>
                      <td>
                        <span className={`chip c-${s}`}>
                          {STATUS_LABELS[s] || s}
                        </span>
                      </td>
                      <td>
                        {inv ? (
                          <span
                            className="mono"
                            style={{ color: 'var(--accent)', cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const targetInvId = (inv as any)._id || (inv as any).id;
                              setSelectedRecord('invoices', targetInvId);
                              navigate(`/invoices/${targetInvId}`);
                            }}
                          >
                            {(inv as any).number || 'Draft'}
                          </span>
                        ) : s === 'accepted' ? (
                          <span
                            style={{
                              color: 'var(--warn)',
                              fontSize: 12.5,
                              fontWeight: 500,
                            }}
                          >
                            Ready to convert
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="r strong font-mono">
                        {formatMoney(totals.total, q.currency)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      {isError ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span>Failed to fetch quotations from server.</span>
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
                        'No quotations match this filter.'
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
