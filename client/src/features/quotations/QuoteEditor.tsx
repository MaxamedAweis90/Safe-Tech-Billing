import React, { useState, useEffect } from 'react';
import { Icon } from '../../components/icons';
import { QuoteItemsTable } from './QuoteItemsTable';
import {
  MOCK_CUSTOMERS,
  MOCK_QUOTES,
  MockQuote,
  QUOTE_TERMS,
  TODAY,
  getQuoteById,
  getCustomerById,
  saveQuote,
  acceptQuote,
  rejectQuote,
  duplicateQuote,
  deleteDraftQuote,
  convertQuoteToInvoice,
  getAuditEventsForRef,
} from '../../lib/mockData';
import {
  fmtD,
  fmtLong,
  daysBetween,
  addDays,
  qStatus,
  totalsOf,
  formatMoney,
  priceStr,
  lineCalc,
} from '../../lib/formatters';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { confirmBox, toast, openModal, closeModal } from '../../store/useUIStore';
import { DocumentScaleWrapper, DocumentSheet } from '../documents';
import { openCustomerModal } from '../customers/CustomerModal';

export interface QuoteEditorProps {
  quoteId: string | null;
  onBack: () => void;
  onNavigateInvoice?: (invoiceId: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
};

export const QuoteEditor: React.FC<QuoteEditorProps> = ({
  quoteId,
  onBack,
  onNavigateInvoice,
}) => {
  const { can, role } = useAuthStore();
  const existingQuote = quoteId && quoteId !== 'new' ? getQuoteById(quoteId) : undefined;

  // Local form state
  const [doc, setDoc] = useState<MockQuote>(() => {
    if (existingQuote) {
      return JSON.parse(JSON.stringify(existingQuote));
    }
    const prefillId = useNavStore.getState().prefillCustomerId;
    const prefillCust = prefillId ? getCustomerById(prefillId) : null;
    if (prefillId) {
      useNavStore.getState().setPrefillCustomerId(null);
    }
    const targetCust = prefillCust || MOCK_CUSTOMERS[0];
    return {
      id: 'new',
      number: 'New',
      customerId: targetCust?.id || '',
      customerName: targetCust?.name || '',
      date: TODAY,
      expiry: addDays(TODAY, 30),
      state: 'draft',
      currency: 'USD',
      items: [{ desc: '', qty: 1, price: 0, disc: 0, taxRate: 0, taxName: '' }],
      terms: QUOTE_TERMS,
      notes: '',
      total_milli: 0,
      createdAt: TODAY,
    };
  });

  const [itemError, setItemError] = useState<string | null>(null);

  useEffect(() => {
    if (quoteId && quoteId !== 'new') {
      const q = getQuoteById(quoteId);
      if (q) setDoc(JSON.parse(JSON.stringify(q)));
    }
  }, [quoteId]);

  const isExisting = Boolean(existingQuote && doc.id !== 'new');
  const resolvedStatus = isExisting ? qStatus(doc, TODAY) : 'draft';
  const readOnly = !(can('quotes') && (!isExisting || doc.state === 'draft'));

  const selectedCustomer = getCustomerById(doc.customerId);
  const totals = totalsOf({ items: doc.items });
  const auditEvents = isExisting ? getAuditEventsForRef(doc.number) : [];

  // Stepper steps calculation matching prototype `flowBar("quote", q, inv)`
  const linkedInvoice = doc.invoiceId
    ? MOCK_QUOTES.find((q) => q.id === doc.id)?.invoiceId
    : undefined;

  const flowSteps = [
    { label: 'Quotation', done: isExisting },
    { label: 'Invoice', done: Boolean(linkedInvoice) },
    { label: 'Payment', done: false },
    { label: 'Receipt', done: false },
  ];

  // Document validation matching prototype `validateDoc()`
  const validateForm = (): boolean => {
    setItemError(null);
    if (!doc.customerId) {
      toast('Select a customer before saving.', true);
      setItemError('Select a customer before saving.');
      return false;
    }
    const validItems = doc.items.filter((i) => i.desc.trim() || i.price > 0);
    if (!validItems.length) {
      toast('Add at least one item with a description and price.', true);
      setItemError('Add at least one item with a description and price.');
      return false;
    }
    for (const it of validItems) {
      if (!it.desc.trim()) {
        toast('Every line needs a description.', true);
        setItemError('Every line needs a description.');
        return false;
      }
      if (!(+it.qty > 0)) {
        toast(`Quantity for "${it.desc}" must be greater than zero.`, true);
        setItemError(`Quantity for "${it.desc}" must be greater than zero.`);
        return false;
      }
      if (+it.disc < 0 || +it.disc > 100) {
        toast(`Discount for "${it.desc}" must be between 0 and 100%.`, true);
        setItemError(`Discount for "${it.desc}" must be between 0 and 100%.`);
        return false;
      }
    }
    if (doc.expiry < doc.date) {
      toast("The validity date can't be before the quotation date.", true);
      setItemError("The validity date can't be before the quotation date.");
      return false;
    }
    return true;
  };

  // Actions
  const handleSave = (markSent = false) => {
    if (!can('quotes')) {
      toast('You do not have permission to edit quotations.', true);
      return;
    }
    if (!validateForm()) return;

    const saved = saveQuote(
      {
        ...doc,
        id: isExisting ? doc.id : undefined,
        total_milli: totals.total,
      },
      markSent
    );
    setDoc(JSON.parse(JSON.stringify(saved)));
    toast(markSent ? `${saved.number} marked as sent` : 'Draft saved');
  };

  const handleAccept = () => {
    if (!can('quotes')) return;
    const accepted = acceptQuote(doc.id);
    if (accepted) {
      setDoc({ ...doc, state: 'accepted' });
      toast(`${accepted.number} accepted. It can now be converted to an invoice.`);
    }
  };

  const handleReject = async () => {
    if (!can('quotes')) return;
    const res = await confirmBox({
      title: `Reject ${doc.number}?`,
      text: 'The quotation is kept for reporting but can no longer be converted.',
      ok: 'Mark rejected',
      danger: true,
      reason: 'Reason for rejection (for the record) *',
    });

    if (typeof res === 'string' && res.trim()) {
      const rejected = rejectQuote(doc.id, res.trim());
      if (rejected) {
        setDoc({ ...doc, state: 'rejected', rejectReason: res.trim() });
        toast(`${rejected.number} marked rejected`);
      }
    }
  };

  const handleDuplicate = () => {
    if (!can('quotes')) return;
    const duplicated = duplicateQuote(doc.id);
    if (duplicated) {
      toast(`${duplicated.number} created as a draft copy`);
      setDoc(JSON.parse(JSON.stringify(duplicated)));
    }
  };

  const handleDelete = async () => {
    if (!can('quotes') || doc.state !== 'draft') return;
    const confirmed = await confirmBox({
      title: `Delete draft ${doc.number}?`,
      text: 'Drafts were never sent to the customer, so they can be deleted. The deletion is recorded in the audit trail.',
      ok: 'Delete draft',
      danger: true,
    });
    if (confirmed) {
      deleteDraftQuote(doc.id);
      toast('Draft deleted');
      onBack();
    }
  };

  const handleConvert = () => {
    if (!can('invoices')) {
      toast('Accountant or Administrator role required to convert quotations.', true);
      return;
    }
    try {
      const res = convertQuoteToInvoice(doc.id);
      toast(`Draft invoice created from ${doc.number}`);
      if (onNavigateInvoice) {
        onNavigateInvoice(res.invoiceId);
      } else {
        toast(`Invoice #${res.invoiceNumber || res.invoiceId} created`);
      }
    } catch (e: any) {
      toast(e.message || 'Failed to convert quotation', true);
    }
  };

  // Quick Customer Registration Modal
  const openNewCustomerModal = () => {
    openCustomerModal(null, (created) => {
      setDoc((prev) => ({
        ...prev,
        customerId: created.id,
        customerName: created.name,
      }));
    });
  };

  // Share Modal / Clipboard helper
  const handleShare = () => {
    const cust = selectedCustomer;
    const lines = doc.items
      .map(
        (it) =>
          `  ${it.qty} x ${it.desc} @ ${priceStr(it.price)}${
            +it.disc ? ` (-${it.disc}%)` : ''
          } = ${formatMoney(lineCalc(it).total, doc.currency)}`
      )
      .join('\n');

    const shareText = `Dear ${cust?.attn && cust.attn !== 'N/A' ? cust.attn : cust?.name || 'Customer'},\n\nThank you for your enquiry. Please find our quotation ${doc.number} dated ${fmtLong(doc.date)}:\n\n${lines}\n\n${totals.disc ? `Discount: -${formatMoney(totals.disc, doc.currency)}\n` : ''}${totals.tax ? `Tax: ${formatMoney(totals.tax, doc.currency)}\n` : ''}Total: ${formatMoney(totals.total, doc.currency)}\nValid until: ${fmtLong(doc.expiry)}\n\n${doc.terms ? `Terms:\n${doc.terms}\n\n` : ''}Reply to this message to accept.\n\nSAFE TECH SOLUTIONS`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      toast('Quotation summary copied to clipboard');
    } else {
      toast('Preview available in dialog');
    }
  };

  // Preview Modal matching prototype line 796
  const handlePreview = () => {
    openModal({
      title: 'Quotation preview',
      wide: true,
      body: (
        <div>
          <DocumentScaleWrapper>
            <DocumentSheet kind="quote" document={doc} />
          </DocumentScaleWrapper>
          <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>
            This is the exact A4 layout of the PDF, including your logo, stamp and signature line.
          </p>
        </div>
      ),
      foot: (
        <button type="button" className="btn" onClick={closeModal}>
          Close
        </button>
      ),
    });
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="crumb">
            <a
              href="#quotations"
              onClick={(e) => {
                e.preventDefault();
                onBack();
              }}
            >
              Quotations
            </a>{' '}
            / {isExisting ? doc.number : 'New'}
          </div>
          <h1>
            {isExisting ? doc.number : 'New quotation'}{' '}
            {isExisting && (
              <span className={`chip c-${resolvedStatus}`}>
                {STATUS_LABELS[resolvedStatus] || resolvedStatus}
              </span>
            )}
          </h1>
          <p>
            {isExisting
              ? selectedCustomer?.name || 'Customer quotation'
              : 'Number is assigned when you save.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="actions">
          {isExisting && (
            <>
              <button type="button" className="btn" onClick={handlePreview}>
                <Icon name="eye" />
                Preview
              </button>
              <button type="button" className="btn" onClick={handleShare}>
                <Icon name="send" />
                Share
              </button>
              {can('quotes') && (
                <button type="button" className="btn" onClick={handleDuplicate}>
                  <Icon name="copy" />
                  Duplicate
                </button>
              )}
            </>
          )}

          {can('quotes') && (!isExisting || doc.state === 'draft') && (
            <>
              {isExisting && (
                <button type="button" className="btn danger" onClick={handleDelete}>
                  Delete draft
                </button>
              )}
              <button type="button" className="btn" onClick={() => handleSave(false)}>
                Save draft
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => handleSave(true)}
              >
                <Icon name="send" />
                Save &amp; mark sent
              </button>
            </>
          )}

          {can('quotes') && isExisting && doc.state === 'sent' && resolvedStatus !== 'expired' && (
            <>
              <button type="button" className="btn danger" onClick={handleReject}>
                Mark rejected
              </button>
              <button type="button" className="btn primary" onClick={handleAccept}>
                Mark accepted
              </button>
            </>
          )}

          {isExisting && doc.state === 'accepted' && !linkedInvoice && (
            <button
              type="button"
              className="btn primary"
              disabled={!can('invoices')}
              title={
                can('invoices')
                  ? 'Convert to invoice'
                  : 'Accountant or Administrator converts quotations'
              }
              onClick={handleConvert}
            >
              <Icon name="arrow" />
              Convert to invoice
            </button>
          )}
        </div>
      </div>

      {/* Workflow Stepper */}
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

      {/* Editor Body & Sticky Sidebar */}
      <div className="editor">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {/* Read-Only State Banner */}
          {readOnly && isExisting && (
            <div
              className={`lock-note ${
                doc.state === 'rejected' || resolvedStatus === 'expired' ? 'warn' : ''
              }`}
            >
              <Icon
                name={
                  doc.state === 'rejected' || resolvedStatus === 'expired'
                    ? 'info'
                    : 'lock'
                }
              />
              <span>
                {doc.state === 'rejected'
                  ? `Rejected. Reason: ${doc.rejectReason || 'No reason provided.'}`
                  : resolvedStatus === 'expired'
                  ? `This quotation expired on ${fmtD(doc.expiry)}. Duplicate it to make a revised version.`
                  : doc.state === 'draft'
                  ? `Read-only for the ${role} role.`
                  : `This quotation was sent ${fmtD(doc.date)} and is locked. Duplicate it to make a revised version.`}
              </span>
            </div>
          )}

          {/* Customer & Dates Panel */}
          <section className="panel">
            <div className="panel-head">
              <h2>Customer &amp; dates</h2>
            </div>
            <div className="panel-body">
              <div className="form-grid">
                {/* Customer Picker */}
                <div className="field wide">
                  <label htmlFor="fCust">Customer</label>
                  {readOnly ? (
                    <div style={{ fontWeight: 600 }}>{selectedCustomer?.name || '—'}</div>
                  ) : (
                    <select
                      id="fCust"
                      className="sel"
                      value={doc.customerId}
                      onChange={(e) => {
                        if (e.target.value === '__new') {
                          openNewCustomerModal();
                        } else {
                          const c = getCustomerById(e.target.value);
                          setDoc((prev) => ({
                            ...prev,
                            customerId: e.target.value,
                            customerName: c ? c.name : prev.customerName,
                          }));
                        }
                      }}
                    >
                      <option value="">Select a customer…</option>
                      {MOCK_CUSTOMERS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                      {can('customers') && (
                        <option value="__new">+ Register new customer…</option>
                      )}
                    </select>
                  )}
                  <span className="hint" id="custHint">
                    {selectedCustomer
                      ? `${selectedCustomer.address ? selectedCustomer.address.replace(/\n/g, ', ') + ' · ' : ''}${selectedCustomer.phone}`
                      : 'Select the bill-to customer account'}
                  </span>
                </div>

                {/* Quotation Date */}
                <div className="field">
                  <label htmlFor="fDate">Quotation date</label>
                  <input
                    id="fDate"
                    type="date"
                    className="inp"
                    value={doc.date}
                    disabled={readOnly}
                    onChange={(e) => setDoc((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                {/* Valid until date */}
                <div className="field">
                  <label htmlFor="fExp">Valid until</label>
                  <input
                    id="fExp"
                    type="date"
                    className="inp"
                    value={doc.expiry}
                    disabled={readOnly}
                    onChange={(e) => setDoc((prev) => ({ ...prev, expiry: e.target.value }))}
                  />
                  <span className="hint" id="expHint">
                    {daysBetween(doc.date, doc.expiry)} days validity
                  </span>
                </div>

                {/* Currency */}
                <div className="field">
                  <label htmlFor="fCur">Currency</label>
                  <select
                    id="fCur"
                    className="sel"
                    value={doc.currency}
                    disabled={readOnly}
                    onChange={(e) =>
                      setDoc((prev) => ({ ...prev, currency: e.target.value }))
                    }
                  >
                    <option value="USD">USD</option>
                    <option value="SOS">SOS</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Line Items Table */}
          <QuoteItemsTable
            items={doc.items}
            currency={doc.currency}
            readOnly={readOnly}
            error={itemError}
            onChange={(items) => setDoc((prev) => ({ ...prev, items }))}
          />

          {/* Terms & Conditions Panel */}
          <section className="panel">
            <div className="panel-head">
              <h2>Terms &amp; conditions</h2>
            </div>
            <div className="panel-body">
              <textarea
                id="fTerms"
                className="inp"
                rows={4}
                style={{ width: '100%' }}
                disabled={readOnly}
                value={doc.terms}
                onChange={(e) => setDoc((prev) => ({ ...prev, terms: e.target.value }))}
              />
            </div>
          </section>
        </div>

        {/* Sticky Sidebar */}
        <aside className="sticky-side">
          {/* Summary Panel */}
          <section className="panel">
            <div className="panel-head">
              <h2>Summary</h2>
            </div>
            <div className="panel-body">
              <div className="totals" id="totals">
                <div className="row">
                  <span>Subtotal</span>
                  <span>{formatMoney(totals.sub, doc.currency)}</span>
                </div>
                {totals.disc > 0 && (
                  <div className="row">
                    <span>Discount</span>
                    <span>-{formatMoney(totals.disc, doc.currency)}</span>
                  </div>
                )}
                {totals.tax > 0 && (
                  <div className="row">
                    <span>Tax</span>
                    <span>{formatMoney(totals.tax, doc.currency)}</span>
                  </div>
                )}
                <div className="row grand">
                  <span>Total</span>
                  <span>{formatMoney(totals.total, doc.currency)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Activity Timeline (if quote exists) */}
          {isExisting && (
            <section className="panel">
              <div className="panel-head">
                <h2>Activity</h2>
              </div>
              <div className="panel-body">
                {auditEvents.length > 0 ? (
                  <ul className="timeline">
                    {auditEvents.map((a, i) => (
                      <li key={i}>
                        <div>
                          <b>{a.action}</b>{' '}
                          {a.ref !== doc.number && (
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
          )}

          {/* Preview button shortcut for new document */}
          {!isExisting && (
            <button
              type="button"
              className="btn"
              style={{ justifyContent: 'center' }}
              onClick={handlePreview}
            >
              <Icon name="eye" />
              Preview document
            </button>
          )}
        </aside>
      </div>
    </>
  );
};
