import React, { useState } from 'react';
import { SkeletonBox } from 'skullet/react';
import { useQueryClient } from '@tanstack/react-query';
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
  MockInvoice,
  TODAY,
} from '../../lib/mockData';
import {
  fmtD,
  daysBetween,
  formatMoney,
  toMilli,
} from '../../lib/formatters';
import { useAuthStore } from '../../store/useAuthStore';
import { confirmBox, toast, openModal, closeModal } from '../../store/useUIStore';
import { PaymentModalContent } from '../dashboard/PaymentModal';
import { DocumentScaleWrapper, DocumentSheet, downloadPdf } from '../documents';
import { openShareModal } from '../documents/ShareModal';
import {
  useInvoiceDetail,
  useMarkInvoiceSent,
  useCancelInvoice,
  useCreditNote,
} from '../../hooks/useInvoices';
import { useAuditLog } from '../../hooks/useAudit';
import { invoiceKeys, receiptKeys } from '../../lib/queryClient';

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

interface CreditNoteModalContentProps {
  invoiceId: string;
  balance: number;
  currency: string;
  onSuccess: (creditNoteNumber: string) => void;
  onCancel: () => void;
}

const CreditNoteModalContent: React.FC<CreditNoteModalContentProps> = ({
  invoiceId,
  balance,
  currency,
  onSuccess,
  onCancel,
}) => {
  const [amt, setAmt] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const creditNoteMutation = useCreditNote();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const a = toMilli(amt);
    const why = reason.trim();
    if (!(a > 0)) {
      toast('Enter an amount greater than zero.', true);
      return;
    }
    if (a > balance) {
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

    setIsSubmitting(true);
    try {
      const res = await creditNoteMutation.mutateAsync({
        invoiceId,
        amount_milli: a,
        reason: why,
        date: TODAY,
      });
      onSuccess(res.credit_note?.number || '');
    } catch {
      const cn = issueCreditNote(invoiceId, a, why);
      onSuccess(cn.number);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
        A credit note reduces what the customer owes without editing the issued invoice. Up to{' '}
        <b>{formatMoney(balance, currency)}</b> can be credited.
      </p>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="cnAmt">Amount</label>
          <input
            id="cnAmt"
            className="inp"
            inputMode="decimal"
            placeholder="0.00"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            autoFocus
          />
        </div>
        <div className="field wide">
          <label htmlFor="cnReason">Reason *</label>
          <textarea
            id="cnReason"
            className="inp"
            rows={2}
            placeholder="e.g. 2 units returned damaged"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" className="btn" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={isSubmitting}>
          {isSubmitting ? 'Issuing...' : 'Issue credit note'}
        </button>
      </div>
    </form>
  );
};

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoiceId,
  onBack,
  onNavigateReceipt,
  onNavigateCustomer,
  onNavigateQuote,
}) => {
  const { can, user } = useAuthStore();
  const isDemo = Boolean(user?.isDemo && (user?.email === 'demo@account.com' || user?.id === 'usr_demo_admin'));
  const queryClient = useQueryClient();
  const [, setTick] = useState(0); // For forcing re-render after local fallback mutations
  const triggerUpdate = () => setTick((t) => t + 1);

  // Live queries
  const { data: detailData, isLoading: detailLoading } = useInvoiceDetail(invoiceId);

  // Mutations
  const sendMutation = useMarkInvoiceSent();
  const cancelMutation = useCancelInvoice();

  const mockInv = isDemo ? getInvoiceById(invoiceId) : undefined;
  const liveInv = detailData?.invoice;

  // Audit logs query for this invoice
  const invNumber = liveInv?.number || mockInv?.number || '';
  const { data: auditData } = useAuditLog(invNumber ? { ref: invNumber } : undefined);

  if (!liveInv && !mockInv) {
    if (detailLoading) {
      return (
        <div className="panel" style={{ padding: 32 }}>
          <SkeletonBox width="50%" height={28} />
          <div style={{ marginTop: 16 }}>
            <SkeletonBox width="100%" height={260} />
          </div>
        </div>
      );
    }
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

  // Synthesize invoice object
  const custObj: any = liveInv?.customer_id;
  const custId = typeof custObj === 'object' ? custObj?._id || custObj?.id : custObj;
  const custName = liveInv?.customerName || (typeof custObj === 'object' ? custObj?.name : undefined);
  const quoteObj: any = liveInv?.quote_id;
  const quoteId = typeof quoteObj === 'object' ? quoteObj?._id || quoteObj?.id : quoteObj;
  const quoteNumber = typeof quoteObj === 'object' ? quoteObj?.number : undefined;

  const inv: MockInvoice = liveInv
    ? {
        id: liveInv._id || liveInv.id || invoiceId,
        number: liveInv.number,
        customerId: custId || (isDemo ? mockInv?.customerId : '') || '',
        customerName: custName || (isDemo ? mockInv?.customerName : '') || 'Customer',
        quoteId: quoteId || (isDemo ? mockInv?.quoteId : undefined),
        date: liveInv.date,
        due: liveInv.due || (liveInv as any).due_date || (isDemo ? mockInv?.due : '') || '',
        due_date: liveInv.due || (liveInv as any).due_date || (isDemo ? mockInv?.due_date : '') || '',
        termsDays: liveInv.terms_days ?? (isDemo ? mockInv?.termsDays : 30) ?? 30,
        state: liveInv.state,
        status: (liveInv.status as any) || (isDemo ? mockInv?.status : 'draft') || 'draft',
        currency: liveInv.currency || 'USD',
        items: (liveInv.items || []).map((it: any) => ({
          desc: it.desc,
          qty: it.qty,
          price: it.price_milli ?? it.price ?? 0,
          disc: it.disc_pct ?? it.disc ?? 0,
          taxRate: it.tax_rate ?? it.taxRate ?? 0,
          taxName: it.tax_name ?? it.taxName ?? '',
        })),
        terms: liveInv.terms || (isDemo ? mockInv?.terms : '') || '',
        notes: liveInv.notes || (isDemo ? mockInv?.notes : '') || '',
        total_milli: liveInv.total_milli ?? (isDemo ? mockInv?.total_milli : 0) ?? 0,
        paid_milli: liveInv.paid_milli ?? (isDemo ? mockInv?.paid_milli : 0) ?? 0,
        credited_milli: liveInv.credited_milli ?? (isDemo ? (mockInv as any)?.credited_milli : 0) ?? 0,
        balance_milli: liveInv.balance_milli ?? (isDemo ? mockInv?.balance_milli : 0) ?? 0,
        sentAt: liveInv.sent_at || (isDemo ? mockInv?.sentAt : undefined),
        cancelledAt: liveInv.cancelled_at || (isDemo ? mockInv?.cancelledAt : undefined),
        cancelReason: liveInv.cancel_reason || (isDemo ? mockInv?.cancelReason : undefined),
      }
    : (isDemo && mockInv ? mockInv : (null as any));

  const f = liveInv
    ? {
        total: liveInv.total_milli ?? invFin(inv).total,
        paid: liveInv.paid_milli ?? invFin(inv).paid,
        credit: liveInv.credited_milli ?? invFin(inv).credit,
        balance: liveInv.balance_milli ?? invFin(inv).balance,
        overdue: liveInv.status === 'overdue',
      }
    : {
        ...invFin(inv),
        overdue: invStatus(inv) === 'overdue',
      };

  const s = (liveInv?.status as string) || invStatus(inv);

  const c = (custObj && typeof custObj === 'object')
    ? {
        id: custObj._id || custObj.id,
        name: custObj.name,
        code: custObj.code,
        phone: custObj.phone || '',
        address: custObj.address || '',
      }
    : getCustomerById(inv.customerId);

  const pays = detailData?.payments
    ? detailData.payments.map((p: any) => {
        const rObj = p.receipt_id;
        const rId = typeof rObj === 'object' ? rObj?._id || rObj?.id : rObj;
        const rNum = typeof rObj === 'object' ? rObj?.number : undefined;
        return {
          id: p._id || p.id,
          invoiceId: inv.id,
          receiptId: rId || p.receiptId,
          receiptNumber: rNum,
          amount_milli: p.amount_milli,
          date: p.date,
          method: p.method,
          reference: p.reference,
        };
      })
    : getPaymentsForInvoice(inv.id);

  const cns = detailData?.credit_notes
    ? detailData.credit_notes.map((cn: any) => ({
        id: cn._id || cn.id,
        number: cn.number,
        invoiceId: inv.id,
        date: cn.date,
        amount: cn.amount_milli,
        reason: cn.reason,
      }))
    : getCreditNotesForInvoice(inv.id);

  const receipts = getReceiptsForInvoice(inv.id);

  const auditEvents = (auditData?.logs && auditData.logs.length > 0)
    ? auditData.logs.map((a) => ({
        ts: a.ts,
        action: a.action,
        ref: a.ref,
        user: a.user_name || (a as any).user || 'User',
      }))
    : getAuditEventsForRef(inv.number);

  const q = inv.quoteId ? (getQuoteById(inv.quoteId) || (quoteNumber ? { id: inv.quoteId, number: quoteNumber } : undefined)) : undefined;

  const pct = f.total
    ? Math.min(100, Math.round(((f.paid + f.credit) / f.total) * 100))
    : 0;

  const dueDate = inv.due || inv.due_date || '';
  const isOverdue = s === 'overdue';
  const overdueDays = isOverdue && dueDate ? daysBetween(dueDate, TODAY) : 0;

  // Workflow steps
  const flowSteps = [
    { label: 'Quotation', done: Boolean(inv.quoteId) },
    { label: 'Invoice', done: true },
    { label: 'Payment', done: f.paid > 0 },
    { label: 'Receipt', done: receipts.length > 0 || pays.some((p: any) => p.receiptId || p.receiptNumber) },
  ];

  // Actions
  const handleMarkSent = async () => {
    if (!can('invoices')) return;
    try {
      await sendMutation.mutateAsync(inv.id);
    } catch {
      markInvoiceSent(inv.id);
      toast(`Invoice ${inv.number} marked as sent`);
      triggerUpdate();
    }
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
      try {
        await cancelMutation.mutateAsync({ id: inv.id, reason: res.trim() });
      } catch {
        cancelInvoice(inv.id, res.trim());
        toast(`Invoice ${inv.number} cancelled`);
        triggerUpdate();
      }
    }
  };

  const openCreditModal = () => {
    if (!can('invoices')) return;

    openModal({
      title: `Credit note for invoice ${inv.number}`,
      body: (
        <CreditNoteModalContent
          invoiceId={inv.id}
          balance={f.balance}
          currency={inv.currency}
          onSuccess={(cnNumber) => {
            closeModal();
            queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
            queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(inv.id) });
            toast(`Credit note ${cnNumber} issued`);
            triggerUpdate();
          }}
          onCancel={closeModal}
        />
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
            queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
            queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(inv.id) });
            queryClient.invalidateQueries({ queryKey: receiptKeys.all });
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
    openShareModal('invoice', inv, () => {
      triggerUpdate();
    });
  };

  const handleDownloadPdf = (btn?: HTMLElement | null) => {
    downloadPdf('invoice', inv, btn);
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
          {inv.state !== 'draft' && (
            <button
              type="button"
              className="btn dl-btn"
              onClick={(e) => handleDownloadPdf(e.currentTarget)}
            >
              <Icon name="down" />
              Download PDF
            </button>
          )}

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
                    {pays.map((p: any) => {
                      const r = receipts.find((x) => x.id === p.receiptId);
                      const recNumber = r ? r.number : (p.receiptNumber || p.receiptId || 'Receipt');
                      const targetReceiptId = r ? r.id : (p.receiptId || p.id);
                      return (
                        <tr
                          key={p.id}
                          className="link"
                          onClick={() => {
                            if (targetReceiptId && onNavigateReceipt) {
                              onNavigateReceipt(targetReceiptId);
                            }
                          }}
                        >
                          <td>
                            <div className="mono font-semibold" style={{ color: 'var(--accent)' }}>
                              {recNumber}
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
