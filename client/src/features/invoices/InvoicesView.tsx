import React, { useState } from 'react';
import { Icon } from '../../components/icons';
import { Badge } from '../../components/ui/Badge';
import { InvoiceEditor } from './InvoiceEditor';
import { InvoiceDetailView } from './InvoiceDetailView';
import {
  MOCK_INVOICES,
  TODAY,
  invFin,
  invStatus,
  getInvoiceById,
  getCustomerById,
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
  const { can } = useAuthStore();
  const { selectedRecordId, setSelectedRecord } = useNavStore();

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

    const activeInvoice = getInvoiceById(selectedRecordId);
    if (activeInvoice) {
      if (activeInvoice.state === 'draft') {
        return (
          <InvoiceEditor
            invoiceId={activeInvoice.id}
            onBack={() => setSelectedRecord('invoices', null)}
            onIssued={(inv) => setSelectedRecord('invoices', inv.id)}
          />
        );
      }
      return (
        <InvoiceDetailView
          invoiceId={activeInvoice.id}
          onBack={() => setSelectedRecord('invoices', null)}
          onNavigateReceipt={(receiptId) => setSelectedRecord('receipts', receiptId)}
          onNavigateCustomer={(customerId) => setSelectedRecord('customers', customerId)}
          onNavigateQuote={(quoteId) => setSelectedRecord('quotations', quoteId)}
        />
      );
    }
  }

  // Calculate live counts matching prototype line 622
  const counts: Record<string, number> = { all: MOCK_INVOICES.length };
  MOCK_INVOICES.forEach((i) => {
    const s = invStatus(i);
    counts[s] = (counts[s] || 0) + 1;
  });

  // Filter and sort rows matching prototype line 624:
  // Drafts float to top, followed by descending issue date
  const filteredRows = MOCK_INVOICES
    .filter((i) => filter === 'all' || invStatus(i) === filter)
    .filter((i) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const cust = getCustomerById(i.customerId);
      const custName = cust ? cust.name : (i.customerName || '');
      const numOrDraft = i.number || 'draft';
      return `${numOrDraft} ${custName}`.toLowerCase().includes(term);
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
                  {f === 'all' ? MOCK_INVOICES.length : counts[f] || 0}
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
              {filteredRows.length > 0 ? (
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
                    <div className="empty">No invoices match this filter.</div>
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
