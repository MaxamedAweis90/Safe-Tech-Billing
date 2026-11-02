import React, { useState } from 'react';
import { Icon } from '../../components/icons';
import { QuoteEditor } from './QuoteEditor';
import {
  MOCK_QUOTES,
  MOCK_INVOICES,
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
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { can } = useAuthStore();
  const { selectedRecordId, setSelectedRecord } = useNavStore();

  // If a quotation is selected or "new" requested, render the QuoteEditor
  if (selectedRecordId) {
    return (
      <QuoteEditor
        quoteId={selectedRecordId}
        onBack={() => setSelectedRecord('quotations', null)}
        onNavigateInvoice={(invId) => setSelectedRecord('invoices', invId)}
      />
    );
  }

  // Calculate live counts by derived status matching prototype lines 614-615
  const counts: Record<string, number> = { all: MOCK_QUOTES.length };
  MOCK_QUOTES.forEach((q) => {
    const s = qStatus(q);
    counts[s] = (counts[s] || 0) + 1;
  });

  // Filter and sort rows matching prototype line 616
  const filteredRows = MOCK_QUOTES.filter(
    (q) => filter === 'all' || qStatus(q) === filter
  )
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
              onClick={() => setSelectedRecord('quotations', 'new')}
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
                  {f === 'all' ? MOCK_QUOTES.length : counts[f] || 0}
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
              {filteredRows.length > 0 ? (
                filteredRows.map((q) => {
                  const s = qStatus(q);
                  const inv = q.invoiceId
                    ? MOCK_INVOICES.find((i) => i.id === q.invoiceId)
                    : undefined;
                  const totals = totalsOf({ items: q.items });

                  return (
                    <tr
                      key={q.id}
                      className="link"
                      onClick={() => setSelectedRecord('quotations', q.id)}
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
                              setSelectedRecord('invoices', inv.id);
                            }}
                          >
                            {inv.number || 'Draft'}
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
                    <div className="empty">No quotations match this filter.</div>
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
