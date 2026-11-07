import React from 'react';
import { SkeletonBox } from 'skullet/react';
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
import { useCustomerDetail, useDeleteCustomer } from '../../hooks/useCustomers';
import { confirmBox } from '../../store/useUIStore';
import { Icon } from '../../components/icons';

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
  issued: 'Issued',
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
  const { can, role, user } = useAuthStore();
  const isDemo = Boolean(user?.isDemo && (user?.email === 'demo@account.com' || user?.id === 'usr_demo_admin'));
  const deleteCustomerMutation = useDeleteCustomer();
  const { setSelectedRecord, setPrefillCustomerId } = useNavStore();

  const { data: detailData, isLoading } = useCustomerDetail(customerId);

  const mockCust = isDemo ? getCustomerById(customerId) : undefined;
  const liveCust = detailData?.data?.customer || (detailData as any)?.customer;
  const liveStmt = detailData?.data;

  if (isLoading && !mockCust && !liveCust) {
    return (
      <div className="panel" style={{ padding: 32 }}>
        <SkeletonBox width="40%" height={32} />
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <SkeletonBox height={90} />
          <SkeletonBox height={90} />
          <SkeletonBox height={90} />
        </div>
        <div style={{ marginTop: 24 }}>
          <SkeletonBox height={260} />
        </div>
      </div>
    );
  }

  const c = liveCust
    ? {
        id: liveCust._id || liveCust.id || customerId,
        code: liveCust.code,
        name: liveCust.name,
        attn: liveCust.attn || '',
        phone: liveCust.phone || '',
        email: liveCust.email || '',
        taxId: liveCust.tax_id || '',
        address: liveCust.address || '',
        since: liveCust.since || '',
      }
    : (isDemo ? mockCust : undefined);

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

  // Initials badge e.g. "SIMAD University" -> "SU", "Dr. SUMAIT" -> "DS"
  const ini = c.name
    .replace(/^Dr\.\s*/, '')
    .split(/\s+/)
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Financial metrics: live statement preferred, fallback to mockFin strictly in demo
  const mockF = isDemo ? custFin(c.id) : { invoiced: 0, paid: 0, credit: 0, bal: 0, overdue: false, count: 0 };
  const invoicedMilli = liveStmt?.total_invoiced_milli ?? liveStmt?.invoiced_milli ?? mockF.invoiced;
  const paidMilli = liveStmt?.total_paid_milli ?? liveStmt?.paid_milli ?? mockF.paid;
  const balanceMilli = liveStmt?.outstanding_balance_milli ?? liveStmt?.balance_milli ?? mockF.bal;
  const isOverdue = liveStmt ? Boolean((liveStmt.overdue_invoices_count ?? 0) > 0 || liveStmt.is_overdue) : mockF.overdue;
  const invoiceCount = liveStmt?.invoices_count ?? mockF.count;

  // Cross-document unified transaction history stream
  let hist: HistItem[] = [];

  if (liveStmt?.transactions && liveStmt.transactions.length > 0) {
    hist = liveStmt.transactions.map((tx: any) => {
      let statusNode: React.ReactNode = <span className="muted">{tx.status}</span>;
      let amountNode: React.ReactNode = formatMoney(tx.amount_milli, tx.currency || 'USD');
      let onClick = () => {};

      if (tx.type === 'Quotation') {
        const s = tx.status || 'draft';
        statusNode = <span className={`chip c-${s}`}>{STATUS_LABELS[s] || s}</span>;
        onClick = () => setSelectedRecord('quotations', tx.ref_id || tx.number);
      } else if (tx.type === 'Invoice') {
        const s = tx.status || 'issued';
        statusNode = <span className={`chip c-${s}`}>{STATUS_LABELS[s] || s}</span>;
        onClick = () => setSelectedRecord('invoices', tx.ref_id || tx.number);
      } else if (tx.type === 'Receipt') {
        statusNode = <span className="muted">{METHOD_LABELS[tx.status] || tx.status}</span>;
        amountNode = (
          <span style={{ color: 'var(--ok)' }}>
            +{formatMoney(tx.amount_milli, tx.currency || 'USD')}
          </span>
        );
        onClick = () => setSelectedRecord('receipts', tx.ref_id || tx.number);
      } else if (tx.type === 'Credit Note' || tx.type === 'Credit note') {
        statusNode = <span style={{ color: 'var(--muted)' }}>{tx.status || 'Credit'}</span>;
        amountNode = `−${formatMoney(tx.amount_milli, tx.currency || 'USD')}`;
        onClick = () => setSelectedRecord('invoices', tx.ref_id);
      }

      return {
        d: tx.date,
        t: tx.type,
        n: tx.number,
        statusNode,
        amountNode,
        onClick,
      };
    });
  } else if (isDemo) {
    // Mock transactions fallback strictly for Demo Mode
    const customerReceipts = MOCK_RECEIPTS.filter((r) => r.customerId === c.id);
    hist = [
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
  } else {
    hist = [];
  }

  const handleNewQuote = () => {
    setPrefillCustomerId(c.id);
    setSelectedRecord('quotations', 'new');
  };

  const handleNewInvoice = () => {
    setPrefillCustomerId(c.id);
    setSelectedRecord('invoices', 'new');
  };

  const handleDeleteCustomer = async () => {
    const confirmed = await confirmBox({
      title: `Move ${c.name} to trash?`,
      text: 'This customer will be moved to your company trash bin. You can restore or permanently delete them from the Trash view.',
      ok: 'Move to trash',
      danger: true,
    });

    if (confirmed) {
      try {
        await deleteCustomerMutation.mutateAsync(c.id);
        onBack();
      } catch {
        // error toast handled in mutation
      }
    }
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
              onClick={() => openCustomerModal(c.id)}
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
          {role === 'admin' && (
            <button
              type="button"
              className="btn danger"
              onClick={handleDeleteCustomer}
              disabled={deleteCustomerMutation.isPending}
            >
              <Icon name="trash" size={14} />
              <span>{deleteCustomerMutation.isPending ? 'Deleting…' : 'Delete'}</span>
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
          <span className="k-value">{formatMoney(invoicedMilli, 'USD')}</span>
          <span className="k-meta">
            {invoiceCount} {invoiceCount === 1 ? 'invoice' : 'invoices'}
          </span>
        </div>
        <div className="kpi">
          <span className="k-label">Payments received</span>
          <span className="k-value">{formatMoney(paidMilli, 'USD')}</span>
          <span className="k-meta">
            {hist.filter((h) => h.t === 'Receipt').length}{' '}
            {hist.filter((h) => h.t === 'Receipt').length === 1 ? 'receipt' : 'receipts'}
          </span>
        </div>
        <div className={`kpi ${isOverdue ? 'alert' : ''}`}>
          <span className="k-label">Outstanding balance</span>
          <span className="k-value">{formatMoney(balanceMilli, 'USD')}</span>
          <span className="k-meta">
            {isOverdue ? 'Includes overdue invoices' : 'Nothing overdue'}
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
