import React from 'react';
import {
  MockInvoice,
  COMPANY_SETTINGS,
  getCustomerById,
  invFin,
  invStatus,
} from '../../lib/mockData';
import {
  fmtLong,
  plain,
  priceStr,
  lineCalc,
  CURRENCY_SYMBOLS,
} from '../../lib/formatters';

export interface InvoiceDocumentSheetProps {
  invoice: MockInvoice;
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

export const InvoiceDocumentSheet: React.FC<InvoiceDocumentSheetProps> = ({ invoice }) => {
  const co = COMPANY_SETTINGS;
  const c = getCustomerById(invoice.customerId) || {
    name: invoice.customerName || 'Customer not selected',
    address: '',
    phone: '',
    attn: '',
    code: '—',
  };

  const cur = invoice.currency || 'USD';
  const sym = CURRENCY_SYMBOLS[cur] || `${cur} `;
  const fin = invFin(invoice);
  const st = invStatus(invoice);

  const anyDisc = (invoice.items || []).some((i) => +i.disc > 0);
  const anyTax = (invoice.items || []).some((i) => +i.taxRate > 0);

  const minRows = 12;
  const activeItems = (invoice.items || []).filter((i) => i.desc || i.price > 0);
  const paddedRowsCount = Math.max(0, minRows - activeItems.length);

  // Totals breakdown rows
  const totRows: Array<{ label: string; value: number; isBig?: boolean }> = [
    { label: 'Subtotal', value: fin.sub },
  ];
  if (fin.disc > 0) totRows.push({ label: 'Discount', value: -fin.disc });
  if (fin.tax > 0) totRows.push({ label: 'Tax', value: fin.tax });
  totRows.push({ label: 'Total', value: fin.total, isBig: true });
  totRows.push({ label: 'Paid', value: fin.paid });
  if (fin.credit > 0) totRows.push({ label: 'Credited', value: fin.credit });
  totRows.push({
    label: 'Balance',
    value: invoice.state === 'cancelled' ? 0 : invoice.state === 'draft' ? fin.total : fin.balance,
    isBig: true,
  });

  return (
    <div className="doc" id={`doc-invoice-${invoice.id}`}>
      {/* Watermark for paid, overdue, cancelled, draft */}
      {['paid', 'overdue', 'cancelled', 'draft'].includes(st) && (
        <div className={`wm ${st}`}>{STATUS_LABELS[st].toUpperCase()}</div>
      )}

      {/* Header */}
      <div className="dh">
        <div className="dlogo">
          <b>{co.name}</b>
        </div>
        <div className="dtitle">Invoice</div>
      </div>

      {/* Company Tagline & Meta */}
      <div className="dco">
        <div>
          <h3>{co.name}</h3>
          <div className="tag">{co.tagline}</div>
        </div>
        <dl className="meta">
          <dt>Date:</dt>
          <dd>{fmtLong(invoice.date)}</dd>
          <dt>Invoice #:</dt>
          <dd className="font-mono">{invoice.number || 'DRAFT'}</dd>
          <dt>Customer ID:</dt>
          <dd>{c.code}</dd>
          <dt>Due date:</dt>
          <dd>{fmtLong(invoice.due || invoice.due_date)}</dd>
        </dl>
      </div>

      {/* Bill To */}
      <dl className="billto">
        <dt>ATTN:</dt>
        <dd>{c.attn || 'N/A'}</dd>
        <dt>To:</dt>
        <dd>
          {c.name}
          <br />
          {c.address ? (
            <>
              {c.address.split('\n').map((line, idx) => (
                <React.Fragment key={idx}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </>
          ) : null}
          {c.phone}
        </dd>
      </dl>

      {/* Line Items Table */}
      <table className="dt">
        <thead>
          <tr>
            <th className="c" style={{ width: 56 }}>
              Qty
            </th>
            <th>Description</th>
            <th className="r" style={{ width: 96 }}>
              Unit Price
            </th>
            {anyDisc && (
              <th className="r" style={{ width: 56 }}>
                Disc
              </th>
            )}
            {anyTax && (
              <th className="r" style={{ width: 56 }}>
                Tax
              </th>
            )}
            <th colSpan={2} className="r" style={{ width: 120 }}>
              Line Total
            </th>
          </tr>
        </thead>
        <tbody>
          {activeItems.map((it, idx) => {
            const cCalc = lineCalc(it);
            return (
              <tr key={idx}>
                <td className="c">{it.qty}</td>
                <td>{it.desc}</td>
                <td className="r">{priceStr(it.price)}</td>
                {anyDisc && (
                  <td className="r">{+it.disc ? `${it.disc}%` : ''}</td>
                )}
                {anyTax && (
                  <td className="r">{+it.taxRate ? `${it.taxRate}%` : ''}</td>
                )}
                <td className="cur">{sym.length > 1 ? '' : sym}</td>
                <td className="r">{plain(cCalc.total, cur)}</td>
              </tr>
            );
          })}
          {Array.from({ length: paddedRowsCount }).map((_, idx) => (
            <tr key={`pad-${idx}`}>
              <td></td>
              <td></td>
              <td></td>
              {anyDisc && <td></td>}
              {anyTax && <td></td>}
              <td></td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Document Footer: Bank Info & Totals Grid */}
      <div className="dfoot">
        <dl className="pay">
          <dt>Bank Name:</dt>
          <dd>{co.bankName}</dd>
          <dt>Account Name:</dt>
          <dd>{co.accountName}</dd>
          <dt>Account No:</dt>
          <dd className="font-mono">{co.accountNo}</dd>
          {co.mobileMoney && (
            <>
              <dt>Mobile money:</dt>
              <dd>{co.mobileMoney}</dd>
            </>
          )}
          <dt>Status:</dt>
          <dd>{STATUS_LABELS[st] || st}</dd>
          <dt>Terms:</dt>
          <dd>
            {invoice.termsDays ? `Net ${invoice.termsDays} days` : 'Due on receipt'}
          </dd>
        </dl>

        <div className="tot">
          {totRows.map((tr, idx) => (
            <React.Fragment key={idx}>
              <div className="lbl">{tr.label}</div>
              <div className={`val ${tr.isBig ? 'big' : ''}`}>
                {tr.value === 0 && tr.label === 'Paid'
                  ? ''
                  : `${sym.length > 1 ? sym + ' ' : sym}${tr.value < 0 ? '−' : ''}${plain(
                      Math.abs(tr.value),
                      cur
                    )}`}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Terms & Payment Instructions */}
      {invoice.terms && (
        <div className="terms">
          <h4>Payment instructions</h4>
          {invoice.terms}
        </div>
      )}

      {/* Signature */}
      <div className="sig">
        <div className="line">{co.signatory}</div>
      </div>

      {/* Fine Print */}
      <div className="dfine">
        <div>Make all checks payable to {co.name}</div>
        <div className="thanks">Thank you for your business!</div>
        <div>
          {co.address}, {co.phone}
        </div>
        <div>
          Email: {co.email} &nbsp; {co.website}
        </div>
      </div>
    </div>
  );
};

