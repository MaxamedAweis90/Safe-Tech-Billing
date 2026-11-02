import React, { useState } from 'react';
import { Card, CardHeader } from '../../components/ui/Card';
import { IconEye, IconDownload } from '../../components/icons';
import { formatMoney } from '../../lib/formatters';

interface MockReceipt {
  _id: string;
  receipt_number: string;
  invoice_ref: string;
  customerName: string;
  date: string;
  method: string;
  amount_milli: number;
  currency: string;
}

export const ReceiptsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const mockReceipts: MockReceipt[] = [
    {
      _id: 'r1',
      receipt_number: 'RCP-2026-0001',
      invoice_ref: 'INV-2026-0001',
      customerName: 'Acme Global Ltd',
      date: '2026-10-18',
      method: 'Bank Transfer',
      amount_milli: 12500000,
      currency: 'USD',
    },
    {
      _id: 'r2',
      receipt_number: 'RCP-2026-0002',
      invoice_ref: 'INV-2026-0002',
      customerName: 'Nairobi Water Works',
      date: '2026-10-22',
      method: 'M-Pesa / Mobile',
      amount_milli: 2000000,
      currency: 'USD',
    },
  ];

  const filteredReceipts = mockReceipts.filter(
    (r) =>
      r.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.invoice_ref.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
          Payment Receipts
        </h1>
        <p className="text-xs text-text-muted mt-0.5">
          Immutable proof of payments recorded against invoices
        </p>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search receipt, invoice or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 px-3 text-xs bg-bg-subtle border border-border-strong rounded-lg text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-subtle/50 text-text-muted font-semibold uppercase tracking-wider text-[10.5px]">
                <th className="py-2.5 px-4">Receipt #</th>
                <th className="py-2.5 px-4">Invoice Ref</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Payment Method</th>
                <th className="py-2.5 px-4 text-right">Amount Received</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredReceipts.length > 0 ? (
                filteredReceipts.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-bg-subtle/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-accent">
                      {r.receipt_number}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-muted">
                      {r.invoice_ref}
                    </td>
                    <td className="py-3 px-4 font-medium text-text-primary">
                      {r.customerName}
                    </td>
                    <td className="py-3 px-4 text-text-muted mono">{r.date}</td>
                    <td className="py-3 px-4 text-text-primary">
                      <span className="px-2 py-0.5 rounded bg-bg-subtle border border-border-strong text-[11px]">
                        {r.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-ok">
                      {formatMoney(r.amount_milli, r.currency)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        type="button"
                        className="p-1 text-text-muted hover:text-accent rounded"
                        title="View Receipt"
                      >
                        <IconEye size={15} />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-text-muted hover:text-accent rounded"
                        title="Download PDF"
                      >
                        <IconDownload size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-text-muted text-xs"
                  >
                    No receipts recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

