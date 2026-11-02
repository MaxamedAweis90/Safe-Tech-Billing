import React, { useState, useEffect } from 'react';
import { Icon } from '../../components/icons';
import { QuoteItemsTable } from '../quotations/QuoteItemsTable';
import {
  MOCK_CUSTOMERS,
  MockInvoice,
  INVOICE_TERMS,
  INVOICE_TERMS_PRESETS,
  TODAY,
  getInvoiceById,
  getCustomerById,
  getQuoteById,
  persistInvoice,
  deleteDraftInvoice,
  peekNextInvoiceNumber,
  addCustomer,
} from '../../lib/mockData';
import {
  fmtLong,
  addDays,
  totalsOf,
  formatMoney,
} from '../../lib/formatters';
import { useAuthStore } from '../../store/useAuthStore';
import { confirmBox, toast, openModal, closeModal } from '../../store/useUIStore';
import { InvoiceDocumentSheet } from './InvoiceDocumentSheet';

export interface InvoiceEditorProps {
  invoiceId: string | null;
  onBack: () => void;
  onIssued: (issuedInvoice: MockInvoice) => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  invoiceId,
  onBack,
  onIssued,
}) => {
  const { can, role } = useAuthStore();
  const existingInv = invoiceId && invoiceId !== 'new' ? getInvoiceById(invoiceId) : undefined;

  // Local form state
  const [doc, setDoc] = useState<MockInvoice>(() => {
    if (existingInv) {
      return JSON.parse(JSON.stringify(existingInv));
    }
    const defaultTermsDays = 30;
    return {
      id: 'new',
      number: '',
      customerId: MOCK_CUSTOMERS[0]?.id || '',
      customerName: MOCK_CUSTOMERS[0]?.name || '',
      date: TODAY,
      due: addDays(TODAY, defaultTermsDays),
      due_date: addDays(TODAY, defaultTermsDays),
      termsDays: defaultTermsDays,
      state: 'draft',
      status: 'draft',
      currency: 'USD',
      items: [{ desc: '', qty: 1, price: 0, disc: 0, taxRate: 0, taxName: '' }],
      terms: INVOICE_TERMS,
      notes: '',
      total_milli: 0,
      paid_milli: 0,
      balance_milli: 0,
    };
  });

  const [itemError, setItemError] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceId && invoiceId !== 'new') {
      const i = getInvoiceById(invoiceId);
      if (i) setDoc(JSON.parse(JSON.stringify(i)));
    }
  }, [invoiceId]);

  const isExisting = Boolean(existingInv && doc.id !== 'new');
  const readOnly = !can('invoices');
  const nextNumberPreview = peekNextInvoiceNumber(doc.date);
  const selectedCustomer = getCustomerById(doc.customerId);
  const totals = totalsOf({ items: doc.items });
  const linkedQuote = doc.quoteId ? getQuoteById(doc.quoteId) : undefined;

  // Handle Terms Presets Change
  const handleTermsChange = (days: number) => {
    const newDue = addDays(doc.date, days);
    setDoc((prev) => ({
      ...prev,
      termsDays: days,
      due: newDue,
      due_date: newDue,
    }));
  };

  // Handle Date Change
  const handleDateChange = (newDate: string) => {
    const days = doc.termsDays ?? 30;
    const newDue = addDays(newDate, days);
    setDoc((prev) => ({
      ...prev,
      date: newDate,
      due: newDue,
      due_date: newDue,
    }));
  };

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
    if (doc.due < doc.date) {
      toast("The due date can't be before the invoice date.", true);
      setItemError("The due date can't be before the invoice date.");
      return false;
    }
    return true;
  };

  // Actions
  const handleSaveDraft = () => {
    if (!can('invoices')) {
      toast('You do not have permission to edit invoices.', true);
      return;
    }
    if (!validateForm()) return;

    const saved = persistInvoice(
      {
        ...doc,
        id: isExisting ? doc.id : undefined,
        total_milli: totals.total,
        balance_milli: totals.total,
      },
      false
    );
    setDoc(JSON.parse(JSON.stringify(saved)));
    toast('Draft saved');
  };

  const handleIssueInvoice = async () => {
    if (!can('invoices')) return;
    if (!validateForm()) return;

    const custName = selectedCustomer?.name || 'The customer';
    const totalFormatted = formatMoney(totals.total, doc.currency);
    const dueFormatted = fmtLong(doc.due);

    const confirmed = await confirmBox({
      title: `Issue invoice ${nextNumberPreview}?`,
      text: `${custName} will be billed ${totalFormatted}, due ${dueFormatted}. Issued invoices are locked: changes after this need a credit note or cancellation.`,
      ok: 'Issue invoice',
    });

    if (confirmed) {
      const issued = persistInvoice(
        {
          ...doc,
          id: isExisting ? doc.id : undefined,
          total_milli: totals.total,
          balance_milli: totals.total,
        },
        true
      );
      toast(`Invoice ${issued.number} issued and locked`);
      onIssued(issued);
    }
  };

  const handleDelete = async () => {
    if (!can('invoices') || doc.state !== 'draft') return;
    const confirmed = await confirmBox({
      title: 'Delete this draft invoice?',
      text: 'It has no number yet and was never issued.',
      ok: 'Delete draft',
      danger: true,
    });
    if (confirmed) {
      deleteDraftInvoice(doc.id);
      toast('Draft deleted');
      onBack();
    }
  };

  // Quick Customer Registration Modal
  const openNewCustomerModal = () => {
    let nameVal = '';
    let attnVal = '';
    let phoneVal = '';
    let emailVal = '';
    let taxVal = '';
    let addrVal = '';

    openModal({
      title: 'Add customer',
      body: (
        <div className="form-grid">
          <div className="field wide">
            <label htmlFor="cuName">Customer or company name *</label>
            <input
              id="cuName"
              className="inp"
              placeholder="e.g. Modern Tech Ltd"
              onChange={(e) => (nameVal = e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="cuAttn">Attention (contact person)</label>
            <input
              id="cuAttn"
              className="inp"
              placeholder="e.g. Finance Officer"
              onChange={(e) => (attnVal = e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="cuPhone">Phone *</label>
            <input
              id="cuPhone"
              className="inp"
              placeholder="252 61 …"
              onChange={(e) => (phoneVal = e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="cuEmail">Email</label>
            <input
              id="cuEmail"
              className="inp"
              type="email"
              placeholder="billing@example.com"
              onChange={(e) => (emailVal = e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="cuTax">Tax ID (optional)</label>
            <input
              id="cuTax"
              className="inp"
              placeholder="TIN-..."
              onChange={(e) => (taxVal = e.target.value)}
            />
          </div>
          <div className="field wide">
            <label htmlFor="cuAddr">Physical address</label>
            <textarea
              id="cuAddr"
              className="inp"
              rows={2}
              placeholder="Street, District, City"
              onChange={(e) => (addrVal = e.target.value)}
            />
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
              if (!nameVal.trim() || !phoneVal.trim()) {
                toast('Enter a name and a phone number.', true);
                return;
              }
              const created = addCustomer({
                name: nameVal.trim(),
                attn: attnVal.trim(),
                phone: phoneVal.trim(),
                email: emailVal.trim(),
                taxId: taxVal.trim(),
                address: addrVal.trim(),
              });
              setDoc((prev) => ({
                ...prev,
                customerId: created.id,
                customerName: created.name,
              }));
              closeModal();
              toast('Customer registered and selected');
            }}
          >
            Add customer
          </button>
        </div>
      ),
    });
  };

  // Document Preview Modal
  const handlePreview = () => {
    openModal({
      title: 'Invoice preview',
      wide: true,
      body: (
        <div className="sheet-wrap">
          <div className="sheet-scale">
            <InvoiceDocumentSheet
              invoice={{
                ...doc,
                number: doc.number || nextNumberPreview,
              }}
            />
          </div>
        </div>
      ),
      foot: (
        <button type="button" className="btn" onClick={closeModal}>
          Close preview
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
              href="#invoices"
              onClick={(e) => {
                e.preventDefault();
                onBack();
              }}
            >
              Invoices
            </a>{' '}
            / {isExisting ? 'Draft' : 'New'}
          </div>
          <h1>
            {isExisting ? 'Draft invoice' : 'New invoice'}{' '}
            <span className="chip c-draft">Draft</span>
          </h1>
          <p>
            The next invoice number, <b className="num">#{nextNumberPreview}</b>, is
            assigned when you issue it, so numbers stay sequential with no gaps.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="actions">
          <button type="button" className="btn" onClick={handlePreview}>
            <Icon name="eye" />
            Preview
          </button>
          {!readOnly && (
            <>
              {isExisting && (
                <button type="button" className="btn danger" onClick={handleDelete}>
                  Delete draft
                </button>
              )}
              <button type="button" className="btn" onClick={handleSaveDraft}>
                Save draft
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={handleIssueInvoice}
              >
                <Icon name="lock" />
                Issue invoice
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lock Notes & Warnings */}
      {linkedQuote && (
        <div className="lock-note">
          <Icon name="lock" />
          <span>
            Created from quotation <b>{linkedQuote.number}</b>. Items were copied over;
            adjust before issuing if needed.
          </span>
        </div>
      )}

      {readOnly && (
        <div className="lock-note">
          <Icon name="lock" />
          <span>Read-only for the {role} role.</span>
        </div>
      )}

      {/* Editor Body & Sticky Sidebar */}
      <div className="editor">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {/* Bill to & Payment Terms Panel */}
          <section className="panel">
            <div className="panel-head">
              <h2>Bill to &amp; payment terms</h2>
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

                {/* Invoice Date */}
                <div className="field">
                  <label htmlFor="fDate">Invoice date</label>
                  <input
                    id="fDate"
                    type="date"
                    className="inp"
                    value={doc.date}
                    disabled={readOnly}
                    onChange={(e) => handleDateChange(e.target.value)}
                  />
                </div>

                {/* Payment Terms Presets */}
                <div className="field">
                  <label htmlFor="fTermsDays">Payment terms</label>
                  <select
                    id="fTermsDays"
                    className="sel"
                    value={doc.termsDays ?? 30}
                    disabled={readOnly}
                    onChange={(e) => handleTermsChange(+e.target.value)}
                  >
                    {INVOICE_TERMS_PRESETS.map(([days, label]) => (
                      <option key={days} value={days}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div className="field">
                  <label htmlFor="fDue">Due date</label>
                  <input
                    id="fDue"
                    type="date"
                    className="inp"
                    value={doc.due}
                    disabled={readOnly}
                    onChange={(e) =>
                      setDoc((prev) => ({
                        ...prev,
                        due: e.target.value,
                        due_date: e.target.value,
                      }))
                    }
                  />
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

          {/* Payment Instructions & Notes Panel */}
          <section className="panel">
            <div className="panel-head">
              <h2>Payment instructions &amp; notes</h2>
              <span className="sub">
                Bank and mobile money details print automatically from company settings
              </span>
            </div>
            <div className="panel-body">
              <textarea
                id="fTerms"
                className="inp"
                rows={3}
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

          {/* Legal / Policy Note */}
          <section className="panel">
            <div className="panel-body" style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              Once issued, an invoice can't be edited or deleted. You can record payments,
              issue a credit note, or cancel it with a reason.
            </div>
          </section>
        </aside>
      </div>
    </>
  );
};

