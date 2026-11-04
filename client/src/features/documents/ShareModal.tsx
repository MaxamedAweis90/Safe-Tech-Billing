import React, { useState } from 'react';
import {
  COMPANY_SETTINGS,
  getCustomerById,
  getInvoiceById,
  getQuoteById,
  markInvoiceSent,
  invFin,
  TODAY,
  logAuditEvent,
} from '../../lib/mockData';
import {
  fmtLong,
  formatMoney,
  totalsOf,
  priceStr,
  lineCalc,
} from '../../lib/formatters';
import { useAuthStore } from '../../store/useAuthStore';
import { openModal, closeModal, toast } from '../../store/useUIStore';
import { copyText } from '../reports/csvExport';
import { Icon, IconSend, IconCopy } from '../../components/icons';
import { downloadPdf } from './pdfEngine';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank transfer',
  mobile: 'Mobile money',
  card: 'Card',
};

export interface ShareModalContentProps {
  kind: 'quote' | 'invoice' | 'receipt';
  record: any;
  onShared?: () => void;
  onClose: () => void;
}

export const ShareModalContent: React.FC<ShareModalContentProps> = ({
  kind,
  record,
  onShared,
  onClose,
}) => {
  const { can } = useAuthStore();
  const c = getCustomerById(record.customerId);
  const cur = record.currency || 'USD';

  // Compute default copy text matching prototype lines 882-884
  const defaultText = React.useMemo(() => {
    const custAttn = c?.attn && c.attn !== 'N/A' ? c.attn : c?.name || 'Customer';

    if (kind === 'invoice') {
      const tot = totalsOf({ items: record.items || [] }).total;
      const bal = invFin(record).balance;
      const dueDate = fmtLong(record.due || record.due_date);
      const mmLine = COMPANY_SETTINGS.mobileMoney
        ? `, or ${COMPANY_SETTINGS.mobileMoney}`
        : '';

      return (
        `Dear ${custAttn},\n\n` +
        `Please find invoice ${record.number} dated ${fmtLong(record.date)} for ${formatMoney(tot, cur)}. ` +
        `Balance due: ${formatMoney(bal, cur)} by ${dueDate}.\n\n` +
        `Pay to ${COMPANY_SETTINGS.bankName}, account ${COMPANY_SETTINGS.accountNo} (${COMPANY_SETTINGS.accountName})${mmLine}. ` +
        `Please quote ${record.number} as the reference.\n\n` +
        `Thank you for your business,\n` +
        `${COMPANY_SETTINGS.name}\n` +
        `${COMPANY_SETTINGS.phone}`
      );
    }

    if (kind === 'quote') {
      const t = totalsOf({ items: record.items || [] });
      const lines = (record.items || [])
        .map(
          (it: any) =>
            `• ${it.qty} × ${it.desc} @ ${priceStr(it.price)}${+it.disc ? ' (−' + it.disc + '%)' : ''} = ${formatMoney(lineCalc(it).total, cur)}`
        )
        .join('\n');
      const discLine = t.disc ? `Discount: −${formatMoney(t.disc, cur)}\n` : '';
      const taxLine = t.tax ? `Tax: ${formatMoney(t.tax, cur)}\n` : '';
      const termsLine = record.terms ? `Terms:\n${record.terms}\n\n` : '';

      return (
        `Dear ${custAttn},\n\n` +
        `Thank you for your enquiry. Please find our quotation ${record.number} dated ${fmtLong(record.date)}:\n\n` +
        `${lines}\n\n` +
        `${discLine}${taxLine}Total: ${formatMoney(t.total, cur)}\n` +
        `Valid until: ${fmtLong(record.expiry || record.expiry_date)}\n\n` +
        `${termsLine}` +
        `Reply to this message to accept, or call us on ${COMPANY_SETTINGS.phone}.\n\n` +
        `${COMPANY_SETTINGS.name}\n` +
        `${COMPANY_SETTINGS.email} · ${COMPANY_SETTINGS.website}`
      );
    }

    // Receipt
    const inv = getInvoiceById(record.invoiceId);
    const methodStr = METHOD_LABELS[record.method] || record.method;
    const refStr = record.reference ? ` (ref ${record.reference})` : '';

    return (
      `Dear ${c?.name || 'Customer'},\n\n` +
      `We confirm receipt of ${formatMoney(record.amount_milli ?? record.amount, cur)} by ${methodStr}${refStr} on ${fmtLong(record.date)} against invoice ${inv?.number || record.invoiceNumber}. ` +
      `Receipt number: ${record.number}. Remaining balance: ${formatMoney(record.balanceAfter_milli ?? 0, cur)}.\n\n` +
      `Thank you,\n` +
      `${COMPANY_SETTINGS.name}`
    );
  }, [kind, record, c, cur]);

  const [message, setMessage] = useState(defaultText);

  const canMark =
    (kind === 'quote' && record.state === 'draft' && can('quotes')) ||
    (kind === 'invoice' && record.state === 'issued' && !record.sentAt && can('invoices'));

  const [markAsSent, setMarkAsSent] = useState(canMark);

  const digits = String(c?.phone || '').replace(/\D/g, '');
  const waUrl = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : '';

  const handleMarkSent = () => {
    if (!markAsSent) return;
    if (kind === 'quote') {
      const q = getQuoteById(record.id) || record;
      q.state = 'sent';
      record.state = 'sent';
      logAuditEvent('Sent quotation', record.number, 'Shared with customer');
      toast(`${record.number} marked as sent`);
    } else if (kind === 'invoice') {
      markInvoiceSent(record.id);
      record.sentAt = TODAY;
      toast(`Invoice ${record.number} marked as sent`);
    }
  };

  const handleCopy = () => {
    copyText(message, 'Message copied');
    logAuditEvent('Copied share message', record.number);
    handleMarkSent();
    onShared?.();
    onClose();
  };

  const handleWhatsApp = () => {
    logAuditEvent('Shared via WhatsApp', record.number, c?.phone);
    handleMarkSent();
    onShared?.();
    onClose();
  };

  const handleDownloadPdf = (btn?: HTMLElement | null) => {
    downloadPdf(kind, record, btn);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="field">
        <label>Customer</label>
        <div>
          <b>{c?.name || record.customerName || '—'}</b>
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
              {c?.phone || 'none on file'}
            </span>
          </span>
          <span>
            Email:{' '}
            <span style={{ userSelect: 'all', color: 'var(--ink)' }}>
              {c?.email || 'none on file'}
            </span>
          </span>
        </div>
      </div>

      <div className="field">
        <label htmlFor="shTxt">Message</label>
        <textarea
          id="shTxt"
          className="inp"
          rows={12}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <span className="hint">
          Edit the message if you like, then send it by WhatsApp or copy it into
          email or SMS. Download the PDF and attach it in WhatsApp or email.
        </span>
      </div>

      {canMark && (
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
            id="shMark"
            checked={markAsSent}
            onChange={(e) => setMarkAsSent(e.target.checked)}
          />{' '}
          Mark as sent after sharing
        </label>
      )}

      <div
        className="modal-foot"
        style={{
          marginTop: 6,
          padding: '14px 0 0',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <button type="button" className="btn" onClick={onClose}>
          Close
        </button>
        <button
          type="button"
          className="btn dl-btn"
          onClick={(e) => handleDownloadPdf(e.currentTarget)}
        >
          <Icon name="down" />
          Download PDF
        </button>
        {digits ? (
          <a
            className="btn"
            id="shWa"
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsApp}
          >
            <IconSend size={15} />
            Open in WhatsApp
          </a>
        ) : null}
        <button
          type="button"
          className="btn primary"
          id="shCopy"
          onClick={handleCopy}
        >
          <IconCopy size={15} />
          Copy message
        </button>
      </div>
    </div>
  );
};

export function openShareModal(
  kind: 'quote' | 'invoice' | 'receipt',
  record: any,
  onShared?: () => void
) {
  const title = `Share ${kind === 'quote' ? 'quotation' : kind} ${record.number}`;
  openModal({
    title,
    body: (
      <ShareModalContent
        kind={kind}
        record={record}
        onShared={onShared}
        onClose={closeModal}
      />
    ),
  });
}
