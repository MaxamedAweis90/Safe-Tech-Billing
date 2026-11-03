import React, { useState } from 'react';
import { Icon } from '../../components/icons';
import {
  getInvoiceById,
  getCustomerById,
  getQuoteById,
  invFin,
  invStatus,
  markInvoiceSent,
  cancelInvoice,
  issueCreditNote,
  getPaymentsForInvoice,
  getCreditNotesForInvoice,
  getReceiptsForInvoice,
  getAuditEventsForRef,
  COMPANY_SETTINGS,
} from '../../lib/mockData';
import {
  fmtD,
  fmtLong,
  daysBetween,
  formatMoney,
  toMilli,
} from '../../lib/formatters';
import { useAuthStore } from '../../store/useAuthStore';
import { confirmBox, toast, openModal, closeModal } from '../../store/useUIStore';
import { PaymentModalContent } from '../dashboard/PaymentModal';
import { DocumentScaleWrapper, DocumentSheet } from '../documents';

export interface InvoiceDetailViewProps {
  invoiceId: string;
  onBack: () => void;
  onNavigateReceipt?: (receiptId: string) => void;
  onNavigateCustomer?: (customerId: string) => void;
  onNavigateQuote?: (quoteId: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  unpaid: 'Unpaid',
  partial: 'Partially paid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

const METHOD_LABELS: Record<string, string> = {
  bank: 'Bank transfer',
  mobile: 'Mobile money',
  cash: 'Cash',
  card: 'Credit / debit card',
};

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoiceId,
  onBack,
  onNavigateReceipt,
  onNavigateCustomer,
  onNavigateQuote,
}) => {
  const { can } = useAuthStore();
  const [, setTick] = useState(0); // For forcing re-render after mutations
  const triggerUpdate = () => setTick((t) => t + 1);

  const inv = getInvoiceById(invoiceId);

  if (!inv) {
    return (
      <div className="panel">
        <div className="empty">
          Invoice not found. It may have been removed or deleted.{' '}
          <a
            href="#invoices"
            onClick={(e) => {
              e.preventDefault();
              onBack();
            }}
          >
            Back to invoices
          </a>
        </div>
      </div>
    );
  }

  const f = invFin(inv);
  const s = invStatus(inv);
  const c = getCustomerById(inv.customerId);
  const pays = getPaymentsForInvoice(inv.id);
  const cns = getCreditNotesForInvoice(inv.id);
  const receipts = getReceiptsForInvoice(inv.id);
  const auditEvents = getAuditEventsForRef(inv.number);
  const q = inv.quoteId ? getQuoteById(inv.quoteId) : undefined;

  const pct = f.total
    ? Math.min(100, Math.round(((f.paid + f.credit) / f.total) * 100))
    : 0;

  const dueDate = inv.due || inv.due_date || '';
  const isOverdue = s === 'overdue';
  const overdueDays = isOverdue && dueDate ? daysBetween(dueDate, '2026-10-31') : 0;

  // Workflow steps
  const flowSteps = [
    { label: 'Quotation', done: Boolean(inv.quoteId) },
    { label: 'Invoice', done: true },
    { label: 'Payment', done: f.paid > 0 },
    { label: 'Receipt', done: receipts.length > 0 },
  ];

  // Actions
  const handleMarkSent = () => {
    if (!can('invoices')) return;
    markInvoiceSent(inv.id);
    toast(`Invoice ${inv.number} marked as sent`);
    triggerUpdate();
  };

  const handleCancel = async () => {
    if (!can('invoices')) return;
    if (pays.length > 0 || cns.length > 0) {
      toast('Cannot cancel an invoice with payments or credit notes.', true);
      return;
    }

    const res = await confirmBox({
      title: `Cancel invoice ${inv.number}?`,
      text: "The invoice keeps its number and stays visible, marked Cancelled. This can't be undone.",
      ok: 'Cancel invoice',
      danger: true,
      reason: 'Reason for cancelling *',
    });

    if (typeof res === 'string' && res.trim()) {
      cancelInvoice(inv.id, res.trim());
      toast(`Invoice ${inv.number} cancelled`);
      triggerUpdate();
    }
  };

  const openCreditModal = () => {
    if (!can('invoices')) return;
    let amtInput = '';
    let reasonInput = '';

    openModal({
      title: `Credit note for invoice ${inv.number}`,
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
            A credit note reduces what the customer owes without editing the issued
            invoice. Up to <b>{formatMoney(f.balance, inv.currency)}</b> can be credited.
          </p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="cnAmt">Amount</label>
              <input
                id="cnAmt"
                className="inp"
                inputMode="decimal"
                placeholder="0.00"
                onChange={(e) => (amtInput = e.target.value)}
              />
            </div>
            <div className="field wide">
              <label htmlFor="cnReason">Reason *</label>
              <textarea
                id="cnReason"
                className="inp"
                rows={2}
                placeholder="e.g. 2 units returned damaged"
                onChange={(e) => (reasonInput = e.target.value)}
              />
            </div>
          </div>
        </div>
      ),
      foot: (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={closeModal}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              const a = toMilli(amtInput);
              const why = reasonInput.trim();
              if (!(a > 0)) {
                toast('Enter an amount greater than zero.', true);
                return;
              }
              if (a > f.balance) {
                toast("A credit note can't exceed the outstanding balance.", true);
                return;
              }
              if (!why) {
                toast(
                  'Give a reason; it is printed on the credit note and kept in the audit trail.',
                  true
                );
                return;
              }
              const cn = issueCreditNote(inv.id, a, why);
              closeModal();
              toast(`${cn.number} issued`);
              triggerUpdate();
            }}
          >
            Issue credit note
          </button>
        </div>
      ),
    });
  };

  const openRecordPaymentModal = () => {
    if (!can('payments')) return;
    openModal({
      title: 'Record payment',
      body: (
        <PaymentModalContent
          initialInvoiceId={inv.id}
          onSuccess={(receipt) => {
            closeModal();
            toast(`Receipt ${receipt.number} issued`);
            triggerUpdate();
            if (onNavigateReceipt) {
              onNavigateReceipt(receipt.id);
            }
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const handleShare = () => {
    const co = COMPANY_SETTINGS;
    const cust = c;
    const cur = inv.currency;
    const text = `Dear ${cust?.attn && cust.attn !== 'N/A' ? cust.attn : cust?.name || 'Customer'},\n\nPlease find invoice ${inv.number} dated ${fmtLong(inv.date)} for ${formatMoney(f.total, cur)}. Balance due: ${formatMoney(f.balance, cur)} by ${fmtLong(dueDate)}.\n\nPay to ${co.bankName}, account ${co.accountNo} (${co.accountName})${co.mobileMoney ? ', or ' + co.mobileMoney : ''}. Please quote ${inv.number} as the reference.\n\nThank you for your business,\n${co.name}\n${co.phone}`;

    let msg = text;
    let markSentAfter = true;

    openModal({
      title: `Share invoice ${inv.number}`,
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Customer</label>
            <div style={{ fontWeight: 600 }}>{cust?.name}</div>
            <div
              style={{
                display: 'flex',
                gap: '6px 16px',
                flexWrap: 'wrap',
                fontSize: 13,
                color: 'var(--muted)',
              }}
            >
              <span>
                Phone:{' '}
                <span style={{ userSelect: 'all', color: 'var(--ink)' }}>
                  {cust?.phone || 'none on file'}
                </span>
              </span>
              <span>
                Email:{' '}
                <span style={{ userSelect: 'all', color: 'var(--ink)' }}>
                  {cust?.email || 'none on file'}
                </span>
              </span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="shTxt">Message</label>
            <textarea
              id="shTxt"
              className="inp"
              rows={8}
              defaultValue={text}
              onChange={(e) => (msg = e.target.value)}
            />
            <span className="hint">
              Edit the message if you like, then copy it into WhatsApp, email or SMS.
            </span>
          </div>

          {!inv.sentAt && can('invoices') && (
            <label
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                defaultChecked={markSentAfter}
                onChange={(e) => (markSentAfter = e.target.checked)}
              />
              Mark as sent after sharing
            </label>
          )}
        </div>
      ),
      foot: (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={closeModal}>
            Close
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(msg);
                toast('Invoice summary copied to clipboard');
              }
              if (markSentAfter && !inv.sentAt && can('invoices')) {
                markInvoiceSent(inv.id);
                triggerUpdate();
              }
              closeModal();
            }}
          >
            <Icon name="copy" />
            Copy message
          </button>
        </div>
      ),
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="crumb">
            <a
              href="#invoices"
              onClick={(e) => {
                e.preventDefault();
                onBack();
              }}
            >
              Invoices
            </a>{' '}
            / {inv.number}
          </div>
          <h1>
            Invoice {inv.number} <span className={`chip c-${s}`}>{STATUS_LABELS[s]}</span>
          </h1>
          <p>
            {c ? (
              <a
                href={`#customer-${c.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigateCustomer) onNavigateCustomer(c.id);
                }}
              >
                {c.name}
              </a>
            ) : (
              inv.customerName
            )}{' '}
            · issued {fmtD(inv.date)} · due {fmtD(dueDate)}
            {isOverdue && (
              <>
                {' '}
                · <b style={{ color: 'var(--bad)' }}>{overdueDays} days overdue</b>
              </>
            )}
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="actions">
          <button type="button" className="btn" onClick={handlePrint}>
            <Icon name="down" />
            Print / PDF
          </button>

          <button type="button" className="btn" onClick={handleShare}>
            <Icon name="send" />
            Share
          </button>

          {inv.state === 'issued' && (
            <>
              {can('invoices') && !inv.sentAt && f.balance > 0 && (
                <button type="button" className="btn" onClick={handleMarkSent}>
                  Mark as sent
                </button>
              )}

              {can('invoices') && f.balance > 0 && (
                <button type="button" className="btn" onClick={openCreditModal}>
                  Credit note
                </button>
              )}

              {can('invoices') && !pays.length && !cns.length && (
                <button type="button" className="btn danger" onClick={handleCancel}>
                  Cancel invoice
                </button>
              )}

              {can('payments') && f.balance > 0 && (
                <button
                  type="button"
                  className="btn primary"
                  onClick={openRecordPaymentModal}
                >
                  <Icon name="cash" />
                  Record payment
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stepper Workflow */}
      <div className="flow" aria-label="Workflow">
        {flowSteps.map((step, idx) => (
          <React.Fragment key={step.label}>
            {idx > 0 && <em>→</em>}
            <span
              style={
                step.done
                  ? {}
                  : { background: 'var(--neutral-soft)', color: 'var(--faint)' }
              }
            >
              {step.done ? '✓ ' : ''}
              {step.label}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Cancelled Banner */}
      {inv.state === 'cancelled' && (
        <div className="lock-note warn">
          <Icon name="info" />
          <span>
            Cancelled {fmtD(inv.cancelledAt || inv.date)}. Reason:{' '}
            {inv.cancelReason || 'Order cancelled'}
          </span>
        </div>
      )}

      {/* Detail Layout: Sheet on Left, Sticky Sidebar on Right */}
      <div className="detail">
        {/* Printable Scaled A4 Sheet Canvas */}
        <DocumentScaleWrapper>
          <DocumentSheet kind="invoice" document={inv} />
        </DocumentScaleWrapper>

        {/* Sticky Sidebar */}
        <aside className="sticky-side">
          {/* Balance & Progress Card */}
          <section className="panel">
            <div className="panel-head">
              <h2>Balance</h2>
              <span className="sub num">{pct}% settled</span>
            </div>
            <div
              className="panel-body"
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div className="progress">
                <i style={{ width: `${pct}%` }} />
              </div>
              <dl className="kv">
                <dt>Invoice total</dt>
                <dd className="font-mono">{formatMoney(f.total, inv.currency)}</dd>
                <dt>Payments</dt>
                <dd className="font-mono">{formatMoney(f.paid, inv.currency)}</dd>
                {f.credit > 0 && (
                  <>
                    <dt>Credit notes</dt>
                    <dd className="font-mono">
                      −{formatMoney(f.credit, inv.currency)}
                    </dd>
                  </>
                )}
                <dt style={{ color: 'var(--ink)', fontWeight: 600 }}>Balance due</dt>
                <dd
                  className="font-mono"
                  style={{
                    fontWeight: 600,
                    fontSize: 16,
                    color: isOverdue ? 'var(--bad)' : undefined,
                  }}
                >
                  {formatMoney(f.balance, inv.currency)}
                </dd>
              </dl>
            </div>
          </section>

          {/* Payments & Receipts Ledger Card */}
          <section className="panel">
            <div className="panel-head">
              <h2>Payments &amp; receipts</h2>
            </div>
            {pays.length > 0 || cns.length > 0 ? (
              <div className="tbl-wrap">
                <table className="tbl">
                  <tbody>
                    {pays.map((p) => {
                      const r = receipts.find((x) => x.id === p.receiptId);
                      return (
                        <tr
                          key={p.id}
                          className="link"
                          onClick={() => {
                            if (r && onNavigateReceipt) {
                              onNavigateReceipt(r.id);
                            }
                          }}
                        >
                          <td>
                            <div className="mono font-semibold" style={{ color: 'var(--accent)' }}>
                              {r ? r.number : p.receiptId}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                              {fmtD(p.date)} · {METHOD_LABELS[p.method] || p.method}
                            </div>
                          </td>
                          <td
                            className="r strong font-mono"
                            style={{ color: 'var(--ok)' }}
                          >
                            +{formatMoney(p.amount_milli, inv.currency)}
                          </td>
                        </tr>
                      );
                    })}
                    {cns.map((cn) => (
                      <tr key={cn.id}>
                        <td>
                          <div className="mono font-semibold">{cn.number}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {fmtD(cn.date)} · {cn.reason}
                          </div>
                        </td>
                        <td className="r strong font-mono">
                          −{formatMoney(cn.amount, inv.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty" style={{ padding: 20 }}>
                No payments yet.
              </div>
            )}
          </section>

          {/* Converted from Quotation Card */}
          {q && (
            <section className="panel">
              <div className="panel-body" style={{ fontSize: 13 }}>
                Converted from quotation{' '}
                <a
                  href={`#quote-${q.id}`}
                  className="mono font-semibold"
                  style={{ color: 'var(--accent)' }}
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigateQuote) onNavigateQuote(q.id);
                  }}
                >
                  {q.number}
                </a>
              </div>
            </section>
          )}

          {/* Audit History Timeline Card */}
          <section className="panel">
            <div className="panel-head">
              <h2>Audit history</h2>
            </div>
            <div className="panel-body">
              {auditEvents.length > 0 ? (
                <ul className="timeline">
                  {auditEvents.map((a, i) => (
                    <li key={i}>
                      <div>
                        <b>{a.action}</b>{' '}
                        {a.ref !== inv.number && (
                          <span style={{ color: 'var(--muted)' }}>{a.ref}</span>
                        )}
                        <small>
                          {a.user} · {fmtD(new Date(a.ts).toISOString().slice(0, 10))}
                        </small>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
                  No activity yet.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
};
