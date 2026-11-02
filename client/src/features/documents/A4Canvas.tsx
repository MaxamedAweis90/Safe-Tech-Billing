import React, { useEffect, useRef } from 'react';
import { LineItem, CustomerSnapshot } from '../../types';
import { formatMoney } from '../../lib/formatters';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);

  // Responsive scale down to fit container while keeping 794px width (standard A4 at 96 DPI)
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !scaleRef.current) return;
      const availableWidth = containerRef.current.clientWidth - 32;
      const scale = Math.min(1, availableWidth / 794);
      scaleRef.current.style.transform = `scale(${scale})`;
      scaleRef.current.style.transformOrigin = 'top center';
      scaleRef.current.style.width = '794px';
      if (scaleRef.current.firstElementChild) {
        scaleRef.current.style.height = `${
          (scaleRef.current.firstElementChild as HTMLElement).offsetHeight * scale
        }px`;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center p-4 bg-bg-base/60 overflow-hidden"
    >
      <div ref={scaleRef} className="transition-transform duration-200">
        {/* Printable White A4 Sheet */}
        <div className="w-[794px] min-h-[1123px] bg-white text-neutral-900 p-12 shadow-xl font-sans text-xs leading-relaxed flex flex-col justify-between">
          <div>
            {/* Document Header */}
            <div className="flex justify-between items-start border-b border-neutral-200 pb-8 mb-6">
              <div>
                <div className="text-xl font-extrabold text-neutral-900 tracking-tight">
                  SAFE TECH SOLUTIONS LTD
                </div>
                <div className="text-neutral-500 text-[11px] mt-1">
                  Enterprise Safety & Telecommunications Engineering
                </div>
                <div className="text-neutral-500 text-[11px] mt-0.5">
                  Commercial Plaza, Westlands · P.O. Box 48201-00100 Nairobi
                </div>
                <div className="text-neutral-500 text-[11px]">
                  PIN: P051234567Z · Email: billing@safetech.co.ke
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-neutral-900 tracking-wider">
                  {type}
                </div>
                <div className="text-sm font-bold font-mono text-neutral-700 mt-1">
                  #{number}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  Date: <span className="font-semibold text-neutral-700">{date}</span>
                </div>
                {dueDateOrExpiry && (
                  <div className="text-[11px] text-neutral-500">
                    {type === 'QUOTATION' ? 'Valid Until: ' : 'Due Date: '}
                    <span className="font-semibold text-neutral-700">
                      {dueDateOrExpiry}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bill To / Attention */}
            <div className="mb-6 p-4 rounded-lg bg-neutral-50 border border-neutral-100">
              <div className="text-[10.5px] uppercase font-bold tracking-wider text-neutral-400">
                Billed To:
              </div>
              <div className="text-sm font-bold text-neutral-900 mt-1">
                {customer.name}
              </div>
              {customer.attn && (
                <div className="text-[11px] text-neutral-600">
                  Attn: {customer.attn}
                </div>
              )}
              {customer.address && (
                <div className="text-[11px] text-neutral-500">{customer.address}</div>
              )}
              {customer.phone && (
                <div className="text-[11px] text-neutral-500">{customer.phone}</div>
              )}
            </div>

            {/* Line Items Table */}
            <table className="w-full text-left mb-6 border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-900 text-[10.5px] uppercase tracking-wider text-neutral-600 font-bold">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Disc %</th>
                  <th className="py-2 text-right">Tax</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-medium text-neutral-800">
                      {item.desc}
                    </td>
                    <td className="py-2.5 text-right font-mono text-neutral-700">
                      {item.qty}
                    </td>
                    <td className="py-2.5 text-right font-mono text-neutral-700">
                      {formatMoney(item.price_milli, currency)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-neutral-500">
                      {item.disc_pct ? `${item.disc_pct}%` : '—'}
                    </td>
                    <td className="py-2.5 text-right font-mono text-neutral-500">
                      {item.tax_rate ? `${item.tax_rate}%` : '0%'}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-neutral-900">
                      {formatMoney(item.total_milli, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Section */}
            <div className="flex justify-end mb-8">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between py-1 text-neutral-600 border-b border-neutral-100">
                  <span>Subtotal:</span>
                  <span className="font-mono">
                    {formatMoney(subtotal_milli, currency)}
                  </span>
                </div>
                {disc_total_milli > 0 && (
                  <div className="flex justify-between py-1 text-neutral-600 border-b border-neutral-100">
                    <span>Discount:</span>
                    <span className="font-mono text-red-600">
                      -{formatMoney(disc_total_milli, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1 text-neutral-600 border-b border-neutral-100">
                  <span>Tax (VAT):</span>
                  <span className="font-mono">
                    {formatMoney(tax_total_milli, currency)}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-sm font-bold text-neutral-900 border-t-2 border-neutral-900">
                  <span>Total Due:</span>
                  <span className="font-mono font-extrabold">
                    {formatMoney(total_milli, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount in Words */}
            {amountInWords && (
              <div className="p-3 bg-neutral-50 rounded border border-neutral-200 text-[11px] mb-6">
                <span className="font-semibold text-neutral-700">Amount in words: </span>
                <span className="italic text-neutral-600">{amountInWords}</span>
              </div>
            )}

            {/* Notes */}
            {notes && (
              <div className="text-[11px] text-neutral-500 mb-6">
                <span className="font-semibold text-neutral-700">Terms & Notes: </span>
                <span>{notes}</span>
              </div>
            )}
          </div>

          {/* Footer & Banking Info */}
          <div className="pt-6 border-t border-neutral-200 grid grid-cols-2 gap-4 text-[10.5px] text-neutral-500">
            <div>
              <div className="font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Banking Remittance
              </div>
              <div>Standard Chartered Bank · A/C: 0102030405060</div>
              <div>SWIFT: SCBLKENX · Safe Tech Solutions Ltd</div>
              <div>M-Pesa Buy Goods: 567890</div>
            </div>
            <div className="text-right flex flex-col justify-end">
              <div className="font-semibold text-neutral-700">Authorized Signature</div>
              <div className="text-neutral-400 mt-6">Safe Tech Commercial Department</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

