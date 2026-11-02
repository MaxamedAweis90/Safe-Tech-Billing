import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { SegmentedControl, SegmentOption } from '../../components/ui/SegmentedControl';
import { IconCash } from '../../components/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { formatMoney } from '../../lib/formatters';

interface MockReceipt {
  _id: string;
  number: string;
  date: string;
  customerName: string;
  invoiceNumber: string;
  method: string;
  reference: string;
  amount_milli: number;
  balanceAfter_milli: number;
  currency: string;
}

export const ReceiptsView: React.FC = () => {
  const [methodFilter, setMethodFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { can } = useAuthStore();

  const mockReceipts: MockReceipt[] = [
    {
      _id: 'r1',
      number: 'RCP-2026-0001',
      date: '18 Oct 2026',
      customerName: 'Acme Global Ltd',
      invoiceNumber: 'INV-2026-0001',
      method: 'Bank transfer',
      reference: 'FT26291992X',
      amount_milli: 12500000,
      balanceAfter_milli: 0,
      currency: 'USD',
    },
    {
      _id: 'r2',
      number: 'RCP-2026-0002',
      date: '22 Oct 2026',
      customerName: 'Nairobi Water Works',
      invoiceNumber: 'INV-2026-0002',
      method: 'Mobile money',
      reference: 'QK78921099',
      amount_milli: 2000000,
      balanceAfter_milli: 2850000,
      currency: 'USD',
    },
  ];

  const methodOptions: SegmentOption[] = [
    { id: 'all', label: 'All methods' },
    { id: 'Cash', label: 'Cash' },
    { id: 'Bank transfer', label: 'Bank transfer' },
    { id: 'Mobile money', label: 'Mobile money' },
    { id: 'Card', label: 'Card' },
  ];

  const filteredReceipts = mockReceipts.filter((r) => {
    const matchesMethod = methodFilter === 'all' || r.method === methodFilter;
    const matchesSearch =
      r.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reference.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  const totalAmount = filteredReceipts.reduce((sum, r) => sum + r.amount_milli, 0);

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Receipts</h1>
          <p>A receipt is issued automatically for every recorded payment, one per payment.</p>
        </div>
        <div className="actions">
          {can('payments') && (
            <Button variant="primary" leftIcon={<IconCash size={15} />}>
              Record payment
            </Button>
          )}
        </div>
      </div>

      {/* Main Panel */}
      <section className="panel">
        <div className="filters">
          <SegmentedControl
            options={methodOptions}
            value={methodFilter}
            onChange={setMethodFilter}
          />
          <input
            className="inp"
            style={{ flex: 1, minWidth: 160, maxWidth: 280 }}
            placeholder="Receipt, invoice, customer or reference"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span
            className="num"
            style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 13 }}
          >
            {filteredReceipts.length} receipts · {formatMoney(totalAmount, 'USD')}
          </span>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Invoice</th>
                <th>Method</th>
                <th>Reference</th>
                <th className="r">Amount</th>
                <th className="r">Balance after</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.length > 0 ? (
                filteredReceipts.map((r) => (
                  <tr key={r._id} className="link">
                    <td className="mono strong" style={{ color: 'var(--accent)' }}>
                      {r.number}
                    </td>
                    <td className="muted mono">{r.date}</td>
                    <td>{r.customerName}</td>
                    <td className="mono" style={{ color: 'var(--accent)' }}>
                      {r.invoiceNumber}
                    </td>
                    <td>{r.method}</td>
                    <td className="mono muted">{r.reference || '—'}</td>
                    <td className="r strong font-mono" style={{ color: 'var(--ok)' }}>
                      {formatMoney(r.amount_milli, r.currency)}
                    </td>
                    <td className="r muted font-mono">
                      {formatMoney(r.balanceAfter_milli, r.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">
                      No receipts yet. Record a payment against an invoice to issue one.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};
