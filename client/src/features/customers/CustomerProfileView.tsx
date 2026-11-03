import React, { useState } from 'react';
import {
  getCustomerById,
  custFin,
  MOCK_QUOTES,
  MOCK_INVOICES,
  MOCK_RECEIPTS,
  MOCK_CREDITS,
  getInvoiceById,
} from '../../lib/mockData';
import { fmtD, formatMoney, qStatus, totalsOf } from '../../lib/formatters';
import { invStatus } from '../../lib/mockData';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { IconPlus } from '../../components/icons';
import { openCustomerModal } from './CustomerModal';

export interface CustomerProfileViewProps {
  customerId: string;
  onBack: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  unpaid: 'Unpaid',
  partial: 'Partially paid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
};

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank transfer',
  mobile: 'Mobile money',
  card: 'Card',
};

interface HistItem {
  d: string;
  t: string;
  n: string;
  statusNode: React.ReactNode;
  amountNode: React.ReactNode;
  onClick: () => void;
}

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  customerId,
  onBack,
}) => {
  const [, setRefreshKey] = useState(0);
  const { can } = useAuthStore();
  const { setSelectedRecord, setPrefillCustomerId } = useNavStore();

  const c = getCustomerById(customerId);

  if (!c) {
    return (
      <div className="page-head">
        <div>
          <div className="crumb">
            <a
              href="#customers"
              onClick={(e) => {
                e.preventDefault();
                onBack();
              }}
            >
              Customers
            </a>{' '}
            / Not found
          </div>
          <h1>Customer not found</h1>
          <p>Customer #{customerId} does not exist.</p>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={onBack}>
            Back to customers
          </button>
        </div>
      </div>
    );
  }

  const f = custFin(c.id);

  // Initials badge e.g. "SIMAD University" -> "SU", "Dr. SUMAIT" -> "DS"
  const ini = c.name
    .replace(/^Dr\.\s*/, '')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const customerReceipts = MOCK_RECEIPTS.filter((r) => r.customerId === c.id);

  // Cross-document unified transaction history stream
  const hist: HistItem[] = [
    // Quotations
    ...MOCK_QUOTES.filter((q) => q.customerId === c.id).map((q) => {
      const s = qStatus(q);
      const total = totalsOf({ items: q.items || [] }).total;
      return {
        d: q.date,
        t: 'Quotation',
        n: q.number,
        statusNode: <span className={`chip c-${s}`}>{STATUS_LABELS[s] || s}</span>,
        amountNode: formatMoney(total, q.currency),
        onClick: () => setSelectedRecord('quotations', q.id),
      };
    }),
    // Invoices (non-draft)
    ...MOCK_INVOICES.filter((i) => i.customerId === c.id && i.state !== 'draft').map((i) => {
      const s = invStatus(i);
      const total = totalsOf({ items: i.items || [] }).total;
      return {
        d: i.date,
        t: 'Invoice',
        n: i.number,
        statusNode: <span className={`chip c-${s}`}>{STATUS_LABELS[s] || s}</span>,
        amountNode: formatMoney(total, i.currency),
        onClick: () => setSelectedRecord('invoices', i.id),
      };
    }),
    // Receipts
    ...customerReceipts.map((r) => ({
      d: r.date,
      t: 'Receipt',
      n: r.number,
      statusNode: (
        <span className="muted" style={{ color: 'var(--muted)' }}>
          {METHOD_LABELS[r.method] || r.method}
        </span>
      ),
      amountNode: (
        <span style={{ color: 'var(--ok)' }}>
          +{formatMoney(r.amount_milli, r.currency)}
        </span>
      ),
      onClick: () => setSelectedRecord('receipts', r.id),
    })),
    // Credit notes
    ...MOCK_CREDITS.filter((cn) => {
      const inv = getInvoiceById(cn.invoiceId);
      return inv && inv.customerId === c.id;
    }).map((cn) => {
      const inv = getInvoiceById(cn.invoiceId)!;
      return {
        d: cn.date,
        t: 'Credit note',
        n: cn.number,
        statusNode: <span style={{ color: 'var(--muted)' }}>on {inv.number}</span>,
        amountNode: `−${formatMoney(cn.amount, inv.currency)}`,
        onClick: () => setSelectedRecord('invoices', cn.invoiceId),
      };
    }),
  ].sort((a, b) => b.d.localeCompare(a.d));

  const handleNewQuote = () => {
    setPrefillCustomerId(c.id);
    setSelectedRecord('quotations', 'new');
  };

  const handleNewInvoice = () => {
    setPrefillCustomerId(c.id);
    setSelectedRecord('invoices', 'new');
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="crumb">
            <a
              href="#customers"
              onClick={(e) => {
                e.preventDefault();
                onBack();
              }}
            >
              Customers
            </a>{' '}
            / {c.code}
          </div>
          <div className="cust-head">
            <div className="cust-badge">{ini}</div>
            <div>
              <h1>{c.name}</h1>
              <p>
                Customer ID {c.code}
                {c.taxId ? ` · TIN ${c.taxId}` : ''}
                {c.since ? ` · on file since ${fmtD(c.since)}` : ''}
              </p>
            </div>
          </div>
        </div>
        <div className="actions">
          {can('customers') && (
            <button
              type="button"
              className="btn"
              data-act="edit-customer"
              data-id={c.id}
              onClick={() =>
                openCustomerModal(c.id, () => setRefreshKey((k) => k + 1))
              }
            >
              Edit details
            </button>
          )}
          {can('quotes') && (
            <button
              type="button"
              className="btn"
              onClick={handleNewQuote}
              data-prefill={c.id}
            >
              <IconPlus size={15} />
              Quotation
            </button>
          )}
          {can('invoices') && (
            <button
              type="button"
              className="btn primary"
              onClick={handleNewInvoice}
              data-prefill={c.id}
            >
              <IconPlus size={15} />
              Invoice
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpis">
        <div className="kpi">
          <span className="k-label">Total invoiced</span>
          <span className="k-value">{formatMoney(f.invoiced, 'USD')}</span>
          <span className="k-meta">
            {f.count} {f.count === 1 ? 'invoice' : 'invoices'}
          </span>
        </div>
        <div className="kpi">
          <span className="k-label">Payments received</span>
          <span className="k-value">{formatMoney(f.paid, 'USD')}</span>
          <span className="k-meta">
            {customerReceipts.length}{' '}
            {customerReceipts.length === 1 ? 'receipt' : 'receipts'}
          </span>
        </div>
        <div className={`kpi ${f.overdue ? 'alert' : ''}`}>
          <span className="k-label">Outstanding balance</span>
          <span className="k-value">{formatMoney(f.bal, 'USD')}</span>
          <span className="k-meta">
            {f.overdue ? 'Includes overdue invoices' : 'Nothing overdue'}
          </span>
        </div>
      </div>

      {/* Main Detail Content Grid */}
      <div className="detail">
        {/* Transaction History Table */}
        <section className="panel">
          <div className="panel-head">
            <h2>Transaction history</h2>
            <span className="sub">
              {hist.length} {hist.length === 1 ? 'record' : 'records'}
            </span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Number</th>
                  <th>Status</th>
                  <th className="r">Amount</th>
                </tr>
              </thead>
              <tbody>
                {hist.length > 0 ? (
                  hist.map((h, idx) => (
                    <tr
                      key={`${h.t}-${h.n}-${idx}`}
                      className="link"
                      onClick={h.onClick}
                    >
                      <td className="muted">{fmtD(h.d)}</td>
                      <td>{h.t}</td>
                      <td className="mono">{h.n}</td>
                      <td>{h.statusNode}</td>
                      <td className="r strong">{h.amountNode}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty">No transactions yet.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Contact Info Sidebar */}
        <aside className="panel">
          <div className="panel-head">
            <h2>Contact</h2>
          </div>
          <div className="panel-body">
            <dl className="kv" style={{ gridTemplateColumns: 'auto 1fr' }}>
              <dt>Attention</dt>
              <dd>{c.attn || '—'}</dd>
              <dt>Phone</dt>
              <dd>{c.phone || '—'}</dd>
              <dt>Email</dt>
              <dd style={{ wordBreak: 'break-all' }}>{c.email || '—'}</dd>
              <dt>Address</dt>
              <dd style={{ whiteSpace: 'pre-line' }}>{c.address || '—'}</dd>
              <dt>Tax ID</dt>
              <dd>{c.taxId || '—'}</dd>
            </dl>
          </div>
        </aside>
      </div>
    </>
  );
};
