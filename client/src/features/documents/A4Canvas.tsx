import React, { useEffect, useRef } from 'react';
import { LineItem, CustomerSnapshot } from '../../types';
import { formatMoney } from '../../lib/formatters';
import { useCompanySettings } from '../../hooks/useSettings';
import { useAuthStore } from '../../store/useAuthStore';

export interface A4DocumentProps {
  type: 'INVOICE' | 'QUOTATION' | 'RECEIPT';
  number: string;
  date: string;
  dueDateOrExpiry?: string;
  customer: CustomerSnapshot;
  items: LineItem[];
  subtotal_milli: number;
  disc_total_milli: number;
  tax_total_milli: number;
  total_milli: number;
  currency?: string;
  notes?: string;
  amountInWords?: string;
}

/**
 * A4 Printable Document Canvas matching prototype `.sheet-wrap`, `.sheet-scale`, `.doc`
 * Strict 794px geometry (A4 at 96 DPI), scaled dynamically to fit container.
 */
export const A4Canvas: React.FC<A4DocumentProps> = ({
  type,
  number,
  date,
  dueDateOrExpiry,
  customer,
  items,
  subtotal_milli,
  disc_total_milli,
  tax_total_milli,
  total_milli,
  currency = 'USD',
  notes,
  amountInWords,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);

  const { user } = useAuthStore();
  const { data: companyData } = useCompanySettings();
  const company = companyData?.company;
  const isDemo = Boolean(user?.isDemo && (user?.email === 'demo@account.com' || user?.id === 'usr_demo_admin'));

  const compName = company?.name || user?.companyName || (isDemo ? 'Safe Tech Solutions' : 'My Business');
  const compTagline = company?.tagline || (isDemo ? 'Enterprise IT, Billing & Infrastructure' : '');
  const compAddress = company?.address || (isDemo ? 'KM4 Airport Road, Wadajir District, Mogadishu, Somalia' : '');
  const compEmail = company?.email || user?.email || (isDemo ? 'billing@safetech.so' : '');
  const compPhone = company?.phone || (isDemo ? '+252 61 000 0000' : '');
  const compTax = company?.tax_id || (isDemo ? 'SO-TIN-889021' : '');
  const compBank = company?.bank_name || (isDemo ? 'Premier Bank' : '');
  const compAccount = company?.account_no
    ? `${company.account_no}${company.account_name ? ` (${company.account_name})` : ''}`
    : (isDemo ? '010204982001 (Safe Tech Solutions LLC)' : '');
  const compMobile = company?.mobile_money || (isDemo ? 'EVC Plus: +252 61 000 0000' : '');

  useEffect(() => {
    const fitSheets = () => {
      if (!wrapRef.current || !scaleRef.current) return;
      const computedPadding = parseFloat(window.getComputedStyle(wrapRef.current).paddingLeft) || 10;
      const avail = wrapRef.current.clientWidth - computedPadding * 2;
      const k = Math.min(1, avail / 794);
      scaleRef.current.style.transform = `scale(${k})`;
      scaleRef.current.style.width = '794px';
      if (scaleRef.current.firstElementChild) {
        scaleRef.current.style.height = `${
          (scaleRef.current.firstElementChild as HTMLElement).offsetHeight * k
        }px`;
      }
    };

    fitSheets();
    window.addEventListener('resize', fitSheets);
    return () => window.removeEventListener('resize', fitSheets);
  }, []);

  return (
    <div ref={wrapRef} className="sheet-wrap">
      <div ref={scaleRef} className="sheet-scale">
        <div className="doc">
          {/* Header */}
          <div className="dh">
            <div className="dlogo">
              {company?.logo ? (
                <img
                  src={company.logo}
                  alt={compName}
                  style={{ maxHeight: 36, maxWidth: 160, objectFit: 'contain' }}
                />
              ) : (
                <b>{compName.toUpperCase()}</b>
              )}
            </div>
            <div className="dtitle">{type}</div>
          </div>

          {/* Company & Meta */}
          <div className="dco">
            <div>
              <h3>{compName.toUpperCase()}</h3>
              {compTagline && <div className="tag">{compTagline}</div>}
              <div style={{ marginTop: 4, color: '#555', fontSize: 11.5 }}>
                {compAddress && (
                  <>
                    {compAddress}
                    <br />
                  </>
                )}
                {[
                  compTax ? `PIN/TIN: ${compTax}` : null,
                  compPhone ? `Phone: ${compPhone}` : null,
                  compEmail ? `Email: ${compEmail}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </div>
            <dl className="meta">
              <dt>Number:</dt>
              <dd className="mono font-bold">{number}</dd>
              <dt>Date:</dt>
              <dd>{date}</dd>
              {dueDateOrExpiry && (
                <>
                  <dt>{type === 'QUOTATION' ? 'Valid until:' : 'Due date:'}</dt>
                  <dd>{dueDateOrExpiry}</dd>
                </>
              )}
            </dl>
          </div>

          {/* Bill To */}
          <dl className="billto">
            <dt>Bill to:</dt>
            <dd>
              <strong>{customer.name}</strong>
              {customer.attn && <div>Attn: {customer.attn}</div>}
              {customer.address && <div>{customer.address}</div>}
              {customer.phone && <div>{customer.phone}</div>}
            </dd>
          </dl>

          {/* Line Items Table */}
          <table className="dt">
            <thead>
              <tr>
                <th>Description</th>
                <th className="r" style={{ width: 60 }}>Qty</th>
                <th className="r" style={{ width: 90 }}>Price</th>
                <th className="r" style={{ width: 60 }}>Disc</th>
                <th className="r" style={{ width: 60 }}>Tax</th>
                <th className="r" style={{ width: 100 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.desc}</td>
                  <td className="r font-mono">{item.qty}</td>
                  <td className="r font-mono">{formatMoney(item.price_milli, currency)}</td>
                  <td className="r font-mono">{item.disc_pct ? `${item.disc_pct}%` : '—'}</td>
                  <td className="r font-mono">{item.tax_rate ? `${item.tax_rate}%` : '0%'}</td>
                  <td className="r font-mono font-semibold">
                    {formatMoney(item.total_milli, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Foot: Remittance & Totals */}
          <div className="dfoot">
            {(compBank || compAccount || compMobile) && (
              <dl className="pay">
                <div className="ph">Payment Remittance</div>
                {compBank && (
                  <>
                    <dt>Bank:</dt>
                    <dd>{compBank}</dd>
                  </>
                )}
                {compAccount && (
                  <>
                    <dt>Account:</dt>
                    <dd className="font-mono">{compAccount}</dd>
                  </>
                )}
                {compMobile && (
                  <>
                    <dt>Mobile:</dt>
                    <dd className="font-mono">{compMobile}</dd>
                  </>
                )}
              </dl>
            )}

            <div className="tot">
              <div className="lbl">Subtotal:</div>
              <div className="val">{formatMoney(subtotal_milli, currency)}</div>

              {disc_total_milli > 0 && (
                <>
                  <div className="lbl">Discount:</div>
                  <div className="val">-{formatMoney(disc_total_milli, currency)}</div>
                </>
              )}

              <div className="lbl">VAT (Tax):</div>
              <div className="val">{formatMoney(tax_total_milli, currency)}</div>

              <div className="lbl" style={{ color: '#111', fontWeight: 800 }}>Total:</div>
              <div className="val big">{formatMoney(total_milli, currency)}</div>
            </div>
          </div>

          {/* Amount in Words */}
          {amountInWords && (
            <div style={{ marginTop: 14, fontSize: 11.5, color: '#444' }}>
              <strong>Amount in words:</strong> <em>{amountInWords}</em>
            </div>
          )}

          {/* Terms & Notes */}
          {notes && (
            <div className="terms">
              <h4>Terms &amp; Conditions</h4>
              <div>{notes}</div>
            </div>
          )}

          {/* Signature Line */}
          <div className="sig">
            <div className="line">
              Authorized Signature &amp; Stamp
            </div>
          </div>

          {/* Thank You Note */}
          <div className="dfine">
            <div className="thanks">Thank you for your business.</div>
            <div>{compName} · Accounts Department</div>
          </div>
        </div>
      </div>
    </div>
  );
};
