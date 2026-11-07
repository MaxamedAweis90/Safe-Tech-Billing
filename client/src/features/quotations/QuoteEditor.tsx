import React, { useState, useEffect } from 'react';
import { Icon } from '../../components/icons';
import { QuoteItemsTable } from './QuoteItemsTable';
import {
  useQuotationDetail,
  useSaveQuotation,
  useSendQuotation,
  useAcceptQuotation,
  useRejectQuotation,
  useDuplicateQuotation,
  useDeleteQuotation,
  useConvertQuotation,
} from '../../hooks/useQuotations';
import { useCustomers } from '../../hooks/useCustomers';
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
  daysBetween,
  addDays,
  qStatus,
  totalsOf,
  formatMoney,
} from '../../lib/formatters';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { confirmBox, toast, openModal, closeModal } from '../../store/useUIStore';
import { DocumentScaleWrapper, DocumentSheet, downloadPdf } from '../documents';
import { openCustomerModal } from '../customers/CustomerModal';
import { openShareModal } from '../documents/ShareModal';

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
  const { can, role, user } = useAuthStore();
  const isDemo = Boolean(user?.isDemo && (user?.email === 'demo@account.com' || user?.id === 'usr_demo_admin'));
  const isNew = !quoteId || quoteId === 'new';

  // Live queries
  const { data: detailData } = useQuotationDetail(isNew ? null : quoteId);
  const { data: customersData } = useCustomers();

  // Mutations
  const saveMutation = useSaveQuotation();
  const sendMutation = useSendQuotation();
  const acceptMutation = useAcceptQuotation();
  const rejectMutation = useRejectQuotation();
  const duplicateMutation = useDuplicateQuotation();
  const deleteMutation = useDeleteQuotation();
  const convertMutation = useConvertQuotation();

  const existingQuote = !isNew ? getQuoteById(quoteId!) : undefined;

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
    const targetCust = prefillCust || (isDemo ? MOCK_CUSTOMERS[0] : null);
    const todayStr = isDemo ? TODAY : new Date().toISOString().slice(0, 10);
    return {
      id: 'new',
      number: 'New',
      customerId: targetCust?.id || '',
      customerName: targetCust?.name || '',
      date: todayStr,
      expiry: addDays(todayStr, 30),
      state: 'draft',
      currency: 'USD',
      items: [{ desc: '', qty: 1, price: 0, disc: 0, taxRate: 0, taxName: '' }],
      terms: isDemo ? QUOTE_TERMS : 'Prices are valid for 30 days from quotation date.',
      notes: '',
      total_milli: 0,
      createdAt: todayStr,
    };
  });

  const [itemError, setItemError] = useState<string | null>(null);

  // Sync state when detail data arrives from Express backend
  useEffect(() => {
    if (detailData?.quotation) {
      const q = detailData.quotation;
      const custObj: any = q.customer_id;
      const custId = typeof custObj === 'object' ? custObj?._id || custObj?.id : custObj;
      const custName = q.customerName || (typeof custObj === 'object' ? custObj?.name : undefined) || 'Customer';

      setDoc({
        id: q._id || q.id || '',
        number: q.number || 'Draft',
        customerId: custId || '',
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
        terms: q.terms || QUOTE_TERMS,
        notes: q.notes || '',
        total_milli: q.total_milli || 0,
        createdAt: q.created_at || TODAY,
        invoiceId: q.invoice_id,
        invoiceNumber: q.invoiceNumber,
        rejectReason: q.reject_reason,
      });
    } else if (quoteId && quoteId !== 'new') {
      const q = getQuoteById(quoteId);
      if (q) setDoc(JSON.parse(JSON.stringify(q)));
    }
  }, [detailData, quoteId]);

  // Auto-select first real customer if current selection is mock or empty when creating new quotation
  useEffect(() => {
    if (isNew && customersData?.customers && customersData.customers.length > 0) {
      setDoc((prev) => {
        const isMockCust = !prev.customerId || prev.customerId.startsWith('c') || prev.customerId === 'new';
        if (isMockCust) {
          const first = customersData.customers[0];
          return {
            ...prev,
            customerId: (first._id || first.id || '') as string,
            customerName: first.name,
          };
        }
        return prev;
      });
    }
  }, [isNew, customersData]);

  const isExisting = Boolean(!isNew && doc.id !== 'new');
  const resolvedStatus = isExisting ? qStatus(doc, TODAY) : 'draft';
  const readOnly = !(can('quotes') && (!isExisting || doc.state === 'draft'));

  // Resolve customer list from API or mock
  const customersList = customersData?.customers && customersData.customers.length > 0
    ? customersData.customers.map((c: any) => ({
        id: c._id || c.id,
        code: c.code,
        name: c.name,
        phone: c.phone || '',
        address: c.address || '',
        email: c.email || '',
      }))
    : (isDemo ? MOCK_CUSTOMERS : []);

  const selectedCustomer =
    customersList.find((c) => c.id === doc.customerId) ||
    (isDemo ? getCustomerById(doc.customerId) : null);

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
    if (doc.customerId.startsWith('c') && !isDemo && (!customersData?.customers || customersData.customers.length === 0)) {
      toast('Please add your first customer before saving the quotation.', true);
      openCustomerModal(null, (c: any) => {
        if (c?._id || c?.id) {
          setDoc((prev) => ({
            ...prev,
            customerId: (c._id || c.id || '') as string,
            customerName: c.name,
          }));
        }
      });
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
  const handleSave = async (markSent = false) => {
    if (!can('quotes')) {
      toast('You do not have permission to edit quotations.', true);
      return;
    }
    if (!validateForm()) return;

    try {
      const payload = {
        id: isExisting ? doc.id : undefined,
        customer_id: doc.customerId,
        customerName: selectedCustomer?.name || doc.customerName,
        date: doc.date,
        expiry: doc.expiry,
        currency: doc.currency,
        terms: doc.terms,
        notes: doc.notes,
        state: (markSent ? 'sent' : doc.state || 'draft') as any,
        items: doc.items.map((it) => ({
          desc: it.desc,
          qty: +it.qty,
          price_milli: +it.price,
          disc_pct: +it.disc || 0,
          tax_rate: +it.taxRate || 0,
          tax_name: it.taxName || '',
        })),
      };

      const result = await saveMutation.mutateAsync(payload);
      const saved = result.quotation;
      const savedId = saved._id || saved.id || '';

      if (markSent && savedId) {
        await sendMutation.mutateAsync(savedId);
      }

      setDoc((prev) => ({
        ...prev,
        id: savedId,
        number: saved.number || prev.number,
        state: markSent ? 'sent' : saved.state || prev.state,
        total_milli: totals.total,
      }));
    } catch {
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
    }
  };

  const handleAccept = async () => {
    if (!can('quotes')) return;
    try {
      if (isExisting) {
        await acceptMutation.mutateAsync(doc.id);
      }
      setDoc((prev) => ({ ...prev, state: 'accepted' }));
    } catch {
      const accepted = acceptQuote(doc.id);
      if (accepted) {
        setDoc({ ...doc, state: 'accepted' });
        toast(`${accepted.number} accepted. It can now be converted to an invoice.`);
      }
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
      try {
        if (isExisting) {
          await rejectMutation.mutateAsync({ id: doc.id, reason: res.trim() });
        }
        setDoc((prev) => ({ ...prev, state: 'rejected', rejectReason: res.trim() }));
      } catch {
        const rejected = rejectQuote(doc.id, res.trim());
        if (rejected) {
          setDoc({ ...doc, state: 'rejected', rejectReason: res.trim() });
          toast(`${rejected.number} marked rejected`);
        }
      }
    }
  };

  const handleDuplicate = async () => {
    if (!can('quotes')) return;
    try {
      const res = await duplicateMutation.mutateAsync(doc.id);
      const duplicated = res.quotation;
      setDoc((prev) => ({
        ...prev,
        id: duplicated._id || duplicated.id || '',
        number: duplicated.number || 'Draft Copy',
        state: 'draft',
      }));
    } catch {
      const duplicated = duplicateQuote(doc.id);
      if (duplicated) {
        toast(`${duplicated.number} created as a draft copy`);
        setDoc(JSON.parse(JSON.stringify(duplicated)));
      }
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
      try {
        if (isExisting) {
          await deleteMutation.mutateAsync(doc.id);
        } else {
          deleteDraftQuote(doc.id);
        }
      } catch {
        deleteDraftQuote(doc.id);
        toast('Draft deleted');
      }
      onBack();
    }
  };

  const handleConvert = async () => {
    if (!can('invoices')) {
      toast('Accountant or Administrator role required to convert quotations.', true);
      return;
    }
    try {
      const res = await convertMutation.mutateAsync(doc.id);
      const invId = res.invoice?.id || (res.invoice as any)?._id;
      if (invId) {
        if (onNavigateInvoice) {
          onNavigateInvoice(invId);
        } else {
          useNavStore.getState().setSelectedRecord('invoices', invId);
        }
        return;
      }
    } catch {
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

  // Share Modal matching prototype lines 881-893
  const handleShare = () => {
    openShareModal('quote', doc, () => {
      if (doc.state === 'draft') {
        setDoc((prev) => ({ ...prev, state: 'sent' }));
      }
    });
  };

  // Download PDF matching prototype lines 685, 1099
  const handleDownloadPdf = (btn?: HTMLElement | null) => {
    const currentDoc =
      doc.state === 'draft' && can('quotes')
        ? {
            ...doc,
            items: doc.items.filter((i) => i.desc.trim() || i.price > 0),
          }
        : doc;
    downloadPdf('quote', currentDoc, btn);
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
        <>
          <button type="button" className="btn" onClick={closeModal}>
            Close
          </button>
          <button
            type="button"
            className="btn dl-btn primary"
            onClick={(e) => downloadPdf('quote', doc, e.currentTarget)}
          >
            <Icon name="down" />
            Download PDF
          </button>
        </>
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
              <button
                type="button"
                className="btn dl-btn"
                onClick={(e) => handleDownloadPdf(e.currentTarget)}
              >
                <Icon name="down" />
                Download PDF
              </button>
              <button type="button" className="btn" onClick={handleShare}>
                <Icon name="send" />
                Share
              </button>
              <button type="button" className="btn" onClick={handlePreview}>
                <Icon name="eye" />
                Preview
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
                          const c = customersList.find((x) => x.id === e.target.value) || getCustomerById(e.target.value);
                          setDoc((prev) => ({
                            ...prev,
                            customerId: e.target.value,
                            customerName: c ? c.name : prev.customerName,
                          }));
                        }
                      }}
                    >
                      <option value="">Select a customer…</option>
                      {customersList.map((c) => (
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
