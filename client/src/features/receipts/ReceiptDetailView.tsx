import React from 'react';
import { Icon } from '../../components/icons';
import { DocumentSheet, DocumentScaleWrapper } from '../documents';
import {
  MockReceipt,
  COMPANY_SETTINGS,
  getInvoiceById,
  getCustomerById,
  logAuditEvent,
} from '../../lib/mockData';
import { fmtLong, formatMoney } from '../../lib/formatters';
import { useNavStore } from '../../store/useNavStore';
import { openModal, closeModal, toast } from '../../store/useUIStore';

export interface ReceiptDetailViewProps {
  receipt: MockReceipt;
  onBack: () => void;
  onNavigateInvoice?: (invoiceId: string) => void;
  onNavigateCustomer?: (customerId: string) => void;
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank transfer',
  mobile: 'Mobile money',
  card: 'Card',
};

export const ReceiptDetailView: React.FC<ReceiptDetailViewProps> = ({
  receipt: r,
  onBack,
  onNavigateInvoice,
  onNavigateCustomer,
}) => {
  const { setSelectedRecord } = useNavStore();
  const linkedInvoice = r.invoiceId ? getInvoiceById(r.invoiceId) : undefined;
  const customer = getCustomerById(r.customerId);
  const co = COMPANY_SETTINGS;
  const cur = r.currency || 'USD';

  // Share Modal matching prototype lines 881-893
  const handleShareReceipt = () => {
    const custName = customer?.name || r.customerName;
    const invNum = linkedInvoice?.number || r.invoiceNumber;
    const methodStr = METHOD_LABELS[r.method] || r.method;
    const refStr = r.reference ? ` (ref ${r.reference})` : '';
    const dateLong = fmtLong(r.date);
    const amtStr = formatMoney(r.amount_milli ?? r.amount ?? 0, cur);
    const balStr = formatMoney(r.balanceAfter_milli ?? r.balanceAfter ?? 0, cur);

    const defaultMsg = `Dear ${custName},\n\nWe confirm receipt of ${amtStr} by ${methodStr}${refStr} on ${dateLong} against invoice ${invNum}. Receipt number: ${r.number}. Remaining balance: ${balStr}.\n\nThank you,\n${co.name}`;

    let currentMsg = defaultMsg;
    const digits = String(customer?.phone || '').replace(/\D/g, '');
    const waUrl = (text: string) =>
      `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;

    openModal({
      title: `Share receipt ${r.number}`,
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Customer</label>
            <div>
              <b>{custName}</b>
            </div>
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
                  {customer?.phone || 'none on file'}
                </span>
              </span>
              <span>
                Email:{' '}
                <span style={{ userSelect: 'all', color: 'var(--ink)' }}>
                  {customer?.email || 'none on file'}
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
              defaultValue={defaultMsg}
              onChange={(e) => {
                currentMsg = e.target.value;
              }}
            />
            <span className="hint">
              Edit the message if you like, then send it by WhatsApp or copy it into email or SMS.
            </span>
          </div>
        </div>
      ),
      foot: (
        <>
          <button type="button" className="btn" onClick={closeModal}>
            Close
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              window.print();
            }}
          >
            <Icon name="pdf" size={15} />
            PDF
          </button>
          {digits ? (
            <a
              className="btn"
              href={waUrl(defaultMsg)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                logAuditEvent('Shared via WhatsApp', r.number, customer?.phone || '');
              }}
            >
              <Icon name="send" size={15} />
              Open in WhatsApp
            </a>
          ) : null}
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(currentMsg).then(() => {
                  toast('Message copied');
                  logAuditEvent('Copied share message', r.number);
                  closeModal();
                });
              } else {
                toast('Message copied');
                closeModal();
              }
            }}
          >
            <Icon name="copy" size={15} />
            Copy message
          </button>
        </>
      ),
    });
  };

  const handleOpenInvoice = () => {
    if (linkedInvoice) {
      if (onNavigateInvoice) {
        onNavigateInvoice(linkedInvoice.id);
      } else {
        setSelectedRecord('invoices', linkedInvoice.id);
      }
    }
  };

  const handleOpenCustomer = () => {
    if (customer) {
      if (onNavigateCustomer) {
        onNavigateCustomer(customer.id);
      } else {
        setSelectedRecord('customers', customer.id);
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
              href="#receipts"
              onClick={(e) => {
                e.preventDefault();
                onBack();
              }}
            >
              Receipts
            </a>{' '}
            / {r.number}
          </div>
          <h1>Receipt {r.number}</h1>
          <p>
            {formatMoney(r.amount_milli ?? r.amount ?? 0, cur)} from{' '}
            <a
              href={`#customer-${customer?.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleOpenCustomer();
              }}
            >
              {customer?.name || r.customerName}
            </a>{' '}
            against invoice{' '}
            <a
              href={`#invoice-${linkedInvoice?.id}`}
              className="mono font-semibold"
              style={{ color: 'var(--accent)' }}
              onClick={(e) => {
                e.preventDefault();
                handleOpenInvoice();
              }}
            >
              {linkedInvoice?.number || r.invoiceNumber}
            </a>
          </p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn primary"
            onClick={() => window.print()}
          >
            <Icon name="pdf" size={15} />
            PDF
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleShareReceipt}
          >
            <Icon name="send" size={15} />
            Share
          </button>
          {linkedInvoice && (
            <button
              type="button"
              className="btn"
              onClick={handleOpenInvoice}
            >
              Open invoice
            </button>
          )}
        </div>
      </div>

      {/* Scaled A4 Sheet Canvas */}
      <div style={{ maxWidth: 860 }}>
        <DocumentScaleWrapper>
          <DocumentSheet kind="receipt" document={r} />
        </DocumentScaleWrapper>
      </div>
    </>
  );
};

