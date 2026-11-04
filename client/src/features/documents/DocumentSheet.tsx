import React from 'react';
import {
  COMPANY_SETTINGS,
  getCustomerById,
  getInvoiceById,
  invFin,
  invStatus,
} from '../../lib/mockData';
import {
  fmtLong,
  plain,
  priceStr,
  lineCalc,
  totalsOf,
  daysBetween,
  formatMoney,
  CURRENCY_SYMBOLS,
} from '../../lib/formatters';
import { amountWords } from './amountWords';

export type DocumentKind = 'invoice' | 'quote' | 'receipt';

export interface DocumentSheetProps {
  kind: DocumentKind;
  document: any;
  company?: typeof COMPANY_SETTINGS;
  className?: string;
  id?: string;
}

const TITLE_LABELS: Record<DocumentKind, string> = {
  quote: 'Quotation',
  invoice: 'Invoice',
  receipt: 'Receipt',
};

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
  cash: 'Cash',
  bank: 'Bank transfer',
  mobile: 'Mobile money',
  card: 'Card',
};

export const DocumentSheet: React.FC<DocumentSheetProps> = ({
  kind,
  document: d,
  company = COMPANY_SETTINGS,
  className = '',
  id,
}) => {
  const co = company;
  const c = getCustomerById(d.customerId) || {
    id: d.customerId || '',
    name: d.customerName || 'Customer not selected',
    address: '',
    phone: '',
    attn: '',
    code: '—',
  };

  const title = TITLE_LABELS[kind];
  const cur = d.currency || 'USD';
  const sym = CURRENCY_SYMBOLS[cur] || `${cur} `;

  // Header banner matching prototype line 767
  const renderHeader = () => (
    <div className="dh">
      <div className="dlogo">
        {co.logo ? (
          <img src={co.logo} alt={co.name} />
        ) : (
          <b>{co.name}</b>
        )}
      </div>
      <div className="dtitle">{title}</div>
    </div>
  );

  // Metadata block matching prototype lines 768-772
  const renderMeta = () => {
    if (kind === 'quote') {
      return (
        <dl className="meta">
          <dt>Date:</dt>
          <dd>{fmtLong(d.date)}</dd>
          <dt>Quotation #:</dt>
          <dd className="font-mono">{d.number || 'DRAFT'}</dd>
          <dt>Valid until:</dt>
          <dd>{fmtLong(d.expiry)}</dd>
          <dt>Customer ID:</dt>
          <dd>{c.code}</dd>
        </dl>
      );
    }
    if (kind === 'invoice') {
      return (
        <dl className="meta">
          <dt>Date:</dt>
          <dd>{fmtLong(d.date)}</dd>
          <dt>Invoice #:</dt>
          <dd className="font-mono">{d.number || 'DRAFT'}</dd>
          <dt>Customer ID:</dt>
          <dd>{c.code}</dd>
          <dt>Due date:</dt>
          <dd>{fmtLong(d.due || d.due_date)}</dd>
        </dl>
      );
    }
    // Receipt
    const linkedInvoice = d.invoiceId ? getInvoiceById(d.invoiceId) : undefined;
    const invNumber = linkedInvoice?.number || (d as any)?.invoiceNumber || '—';
    const custCode = c?.code || (d as any)?.customerCode || '—';
    return (
      <dl className="meta">
        <dt>Date:</dt>
        <dd>{fmtLong(d.date)}</dd>
        <dt>Receipt #:</dt>
        <dd className="font-mono">{d.number}</dd>
        <dt>Invoice #:</dt>
        <dd className="font-mono">{invNumber}</dd>
        <dt>Customer ID:</dt>
        <dd>{custCode}</dd>
      </dl>
    );
  };

  // Company identity & meta line matching prototype line 772
  const renderCompanyAndMeta = () => (
    <div className="dco">
      <div>
        <h3>{co.name}</h3>
        <div className="tag">{co.tagline}</div>
      </div>
      {renderMeta()}
    </div>
  );

  // Billing address block matching prototype line 773
  const renderBilling = () => {
    const addressLines = (c.address || '')
      .split('\n')
      .map((line: string, idx: number) => (
        <React.Fragment key={idx}>
          {line}
          <br />
        </React.Fragment>
      ));

    if (kind === 'receipt') {
      return (
        <dl className="billto">
          <dt>From:</dt>
          <dd>{c.name}</dd>
          <dt></dt>
          <dd>
            {addressLines}
            {c.phone}
          </dd>
        </dl>
      );
    }

    return (
      <dl className="billto">
        <dt>ATTN:</dt>
        <dd>{c.attn || 'N/A'}</dd>
        <dt>To:</dt>
        <dd>
          {c.name}
          <br />
          {addressLines}
          {c.phone}
        </dd>
      </dl>
    );
  };

  // Signatory & stamp block matching prototype line 775
  const renderSignature = () => (
    <div className="sig">
      <div className="line">
        {co.signature ? <img className="sg" src={co.signature} alt="" /> : null}
        {co.signatory}
      </div>
      {co.stamp ? (
        <img
          className="stamp"
          src={co.stamp}
          alt=""
          style={{ right: 60, top: -70 }}
        />
      ) : null}
    </div>
  );

  // Fine print footer matching prototype line 774
  const renderFinePrint = () => (
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
  );

  // If kind === 'receipt', render specialized receipt document matching lines 776-780
  if (kind === 'receipt') {
    const linkedInvoice = d.invoiceId ? getInvoiceById(d.invoiceId) : undefined;
    const invNumber = linkedInvoice?.number || (d as any)?.invoiceNumber || '—';
    const invDateStr = linkedInvoice ? fmtLong(linkedInvoice.date) : (d as any)?.invoiceDate ? fmtLong((d as any).invoiceDate) : '—';
    const receiptAmount = d.amount_milli ?? d.amount ?? 0;
    const balanceAfter = d.balanceAfter_milli ?? d.balanceAfter ?? 0;
    const linkedFin = linkedInvoice ? invFin(linkedInvoice) : undefined;
    const invoiceTotal = d.invoiceTotal ?? (linkedFin ? linkedFin.total : receiptAmount + balanceAfter);
    const prevPaid = d.prevPaid ?? Math.max(0, invoiceTotal - receiptAmount - balanceAfter);

    return (
      <div className={`doc ${className}`} id={id || `doc-receipt-${d.id}`}>
        {renderHeader()}
        {renderCompanyAndMeta()}
        {renderBilling()}

        <div className="rc-amt">
          <div>
            <div className="l">Amount received</div>
            <div className="w">{amountWords(receiptAmount, cur)}</div>
          </div>
          <div className="v">{formatMoney(receiptAmount, cur)}</div>
        </div>

        <table className="dt rc-tbl">
          <tbody>
            <tr>
              <td>Payment date</td>
              <td>{fmtLong(d.date)}</td>
            </tr>
            <tr>
              <td>Payment method</td>
              <td>{METHOD_LABELS[d.method] || d.method}</td>
            </tr>
            <tr>
              <td>Payment reference</td>
              <td>{d.reference || '—'}</td>
            </tr>
            <tr>
              <td>For invoice</td>
              <td>
                {invNumber} dated {invDateStr}
              </td>
            </tr>
            <tr>
              <td>Invoice total</td>
              <td>{formatMoney(invoiceTotal, cur)}</td>
            </tr>
            <tr>
              <td>Previously paid &amp; credited</td>
              <td>{formatMoney(prevPaid, cur)}</td>
            </tr>
            <tr>
              <td>This payment</td>
              <td>
                <b>{formatMoney(receiptAmount, cur)}</b>
              </td>
            </tr>
            <tr>
              <td>Remaining balance</td>
              <td>
                <b>{formatMoney(balanceAfter, cur)}</b>
                {balanceAfter <= 0 && ' \u00A0(invoice settled in full)'}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: 40 }}>{renderSignature()}</div>
        {renderFinePrint()}
      </div>
    );
  }

  // Invoice & Quotation Line Items & Totals Logic matching prototype lines 781-795
  const t = totalsOf(d);
  const items = d.items || [];
  const anyDisc = items.some((i: any) => +i.disc > 0);
  const anyTax = items.some((i: any) => +i.taxRate > 0);
  const minRows = 12;

  const activeItems = items.filter((i: any) => i.desc || i.price > 0);
  const paddedCount = Math.max(0, minRows - activeItems.length);
  const totalCols = 5 + (anyDisc ? 1 : 0) + (anyTax ? 1 : 0);

  // Status & Watermark
  let st = 'draft';
  let fin = { paid: 0, credit: 0, balance: t.total };
  if (kind === 'invoice') {
    fin = invFin(d);
    st = invStatus(d);
  }

  // Totals Breakdown Rows
  const totRows: Array<{ label: string; value: number; isBig?: boolean }> = [
    { label: 'Subtotal', value: t.sub },
  ];
  if (t.disc > 0) totRows.push({ label: 'Discount', value: -t.disc });
  if (t.tax > 0) totRows.push({ label: 'Tax', value: t.tax });

  if (kind === 'invoice') {
    totRows.push({ label: 'Total', value: t.total, isBig: true });
    totRows.push({ label: 'Paid', value: fin.paid });
    if (fin.credit > 0) totRows.push({ label: 'Credited', value: fin.credit });
    totRows.push({
      label: 'Balance',
      value: d.state === 'cancelled' ? 0 : d.state === 'draft' ? t.total : fin.balance,
      isBig: true,
    });
  } else {
    totRows.push({ label: 'Total', value: t.total, isBig: true });
  }

  // Left instructions column
  const renderLeftInstructions = () => {
    if (kind === 'invoice') {
      return (
        <dl className="pay">
          <dt>Bank Name:</dt>
          <dd>{co.bankName}</dd>
          <dt>Account Name:</dt>
          <dd>{co.accountName}</dd>
          <dt>Account No:</dt>
          <dd>{co.accountNo}</dd>
          {co.mobileMoney ? (
            <>
              <dt>Mobile money:</dt>
              <dd>{co.mobileMoney}</dd>
            </>
          ) : null}
          <dt>Status:</dt>
          <dd>{STATUS_LABELS[st] || st}</dd>
          <dt>Terms:</dt>
          <dd>{+d.termsDays ? `Net ${d.termsDays} days` : 'Due on receipt'}</dd>
        </dl>
      );
    }
    // Quotation
    return (
      <dl className="pay">
        <dt>Valid until:</dt>
        <dd>
          {fmtLong(d.expiry)} ({daysBetween(d.date, d.expiry)} days)
        </dd>
        <dt>Prepared by:</dt>
        <dd>{co.name}</dd>
        <dt>Contact:</dt>
        <dd>{co.phone}</dd>
      </dl>
    );
  };

  return (
    <div
      className={`doc ${className}`}
      id={id || `doc-${kind}-${d.id || 'draft'}`}
    >
      {/* Dynamic Watermark for invoices */}
      {kind === 'invoice' && ['paid', 'overdue', 'cancelled', 'draft'].includes(st) && (
        <div className={`wm ${st}`}>{STATUS_LABELS[st].toUpperCase()}</div>
      )}

      {renderHeader()}
      {renderCompanyAndMeta()}
      {renderBilling()}

      {/* Line Items Table matching prototype line 784 */}
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
          {activeItems.map((it: any, idx: number) => {
            const cCalc = lineCalc(it);
            return (
              <tr key={idx}>
                <td className="c">{it.qty}</td>
                <td>{it.desc}</td>
                <td className="r">{priceStr(it.price)}</td>
                {anyDisc && (
                  <td className="r">
                    {+it.disc ? `${it.disc}%` : ''}
                  </td>
                )}
                {anyTax && (
                  <td className="r">
                    {+it.taxRate ? `${it.taxRate}%` : ''}
                  </td>
                )}
                <td className="cur">{sym.length > 1 ? '' : sym}</td>
                <td className="r">{plain(cCalc.total, cur)}</td>
              </tr>
            );
          })}
          {/* Pad up to 12 rows with zebra striping */}
          {Array.from({ length: paddedCount }).map((_, idx) => (
            <tr key={`empty-${idx}`}>
              {Array.from({ length: totalCols }).map((__, colIdx) => (
                <td key={colIdx}></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footers & Totals matching prototype lines 790-793 */}
      <div className="dfoot">
        {renderLeftInstructions()}
        <div className="tot">
          {totRows.map((row, idx) => {
            const symPrefix = sym.length > 1 ? `${sym} ` : `${sym} `;
            const isZeroPaid = row.value === 0 && row.label === 'Paid';
            const valueText = isZeroPaid
              ? ''
              : `${symPrefix}${row.value < 0 ? '−' : ''}${plain(Math.abs(row.value), cur)}`;

            return (
              <React.Fragment key={idx}>
                <div className="lbl">{row.label}</div>
                <div className={`val ${row.isBig ? 'big' : ''}`}>{valueText}</div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Terms & Payment Instructions */}
      {d.terms ? (
        <div className="terms">
          <h4>
            {kind === 'quote' ? 'Terms & conditions' : 'Payment instructions'}
          </h4>
          {d.terms}
        </div>
      ) : null}

      {renderSignature()}
      {renderFinePrint()}
    </div>
  );
};
