import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SegmentedControl, SegmentOption } from '../../components/ui/SegmentedControl';
import { IconPlus } from '../../components/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { InvoiceStatus } from '../../types';
import { formatMoney } from '../../lib/formatters';

interface MockInvoice {
  _id: string;
  number: string;
  customerName: string;
  date: string;
  due_date: string;
  total_milli: number;
  paid_milli: number;
  balance_milli: number;
  currency: string;
  status: InvoiceStatus;
  daysLate?: number;
}

export const InvoicesView: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { can } = useAuthStore();

  const mockInvoices: MockInvoice[] = [
    {
      _id: 'i1',
      number: 'INV-2026-0001',
      customerName: 'Acme Global Ltd',
      date: '01 Oct 2026',
      due_date: '31 Oct 2026',
      total_milli: 12500000,
      paid_milli: 12500000,
      balance_milli: 0,
      currency: 'USD',
      status: 'paid',
    },
    {
      _id: 'i2',
      number: 'INV-2026-0002',
      customerName: 'Nairobi Water Works',
      date: '10 Oct 2026',
      due_date: '09 Nov 2026',
      total_milli: 4850000,
      paid_milli: 2000000,
      balance_milli: 2850000,
      currency: 'USD',
      status: 'partial',
    },
    {
      _id: 'i3',
      number: 'INV-2026-0003',
      customerName: 'Apex Logistics Inc',
      date: '12 Oct 2026',
      due_date: '11 Nov 2026',
      total_milli: 2200000,
      paid_milli: 0,
      balance_milli: 2200000,
      currency: 'USD',
      status: 'sent',
    },
    {
      _id: 'i4',
      number: 'INV-2026-0004',
      customerName: 'Zenith Holdings Ltd',
      date: '15 Sep 2026',
      due_date: '15 Oct 2026',
      total_milli: 850000,
      paid_milli: 0,
      balance_milli: 850000,
      currency: 'USD',
      status: 'overdue',
      daysLate: 18,
    },
  ];

  const counts: Record<string, number> = {
    all: mockInvoices.length,
    draft: mockInvoices.filter((i) => i.status === 'draft').length,
    sent: mockInvoices.filter((i) => i.status === 'sent').length,
    unpaid: mockInvoices.filter((i) => i.status === 'unpaid').length,
    partial: mockInvoices.filter((i) => i.status === 'partial').length,
    paid: mockInvoices.filter((i) => i.status === 'paid').length,
    overdue: mockInvoices.filter((i) => i.status === 'overdue').length,
    cancelled: mockInvoices.filter((i) => i.status === 'cancelled').length,
  };

  const filterOptions: SegmentOption[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'draft', label: 'Draft', count: counts.draft },
    { id: 'sent', label: 'Sent', count: counts.sent },
    { id: 'unpaid', label: 'Unpaid', count: counts.unpaid },
    { id: 'partial', label: 'Partial', count: counts.partial },
    { id: 'paid', label: 'Paid', count: counts.paid },
    { id: 'overdue', label: 'Overdue', count: counts.overdue },
    { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];

  const filteredInvoices = mockInvoices.filter((inv) => {
    const matchesFilter = filter === 'all' || inv.status === filter;
    const matchesSearch =
      inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Invoices</h1>
          <p>
            Issued invoices are locked. Corrections go through credit notes or cancellation, and every change is logged.
          </p>
        </div>
        <div className="actions">
          {can('invoices') && (
            <Button variant="primary" leftIcon={<IconPlus size={15} />}>
              New invoice
            </Button>
          )}
        </div>
      </div>

      {/* Main Panel with Filter Bar & Invoices Table */}
      <section className="panel">
        <div className="filters">
          <SegmentedControl
            options={filterOptions}
            value={filter}
            onChange={setFilter}
          />
          <input
            className="inp"
            style={{ flex: 1, minWidth: 160, maxWidth: 280 }}
            placeholder="Filter by number or customer"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Due</th>
                <th>Status</th>
                <th className="r">Total</th>
                <th className="r">Paid</th>
                <th className="r">Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv._id} className="link">
                    <td className="mono strong" style={{ color: 'var(--accent)' }}>
                      {inv.number}
                    </td>
                    <td>{inv.customerName}</td>
                    <td className="muted mono">{inv.date}</td>
                    <td className="muted mono">
                      {inv.due_date}
                      {inv.daysLate ? (
                        <div style={{ color: 'var(--bad)', fontSize: 11.5 }}>
                          {inv.daysLate} days late
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <Badge variant={inv.status}>{inv.status}</Badge>
                    </td>
                    <td className="r font-mono">
                      {formatMoney(inv.total_milli, inv.currency)}
                    </td>
                    <td className="r muted font-mono">
                      {inv.paid_milli ? formatMoney(inv.paid_milli, inv.currency) : '—'}
                    </td>
                    <td
                      className="r strong font-mono"
                      style={{
                        color:
                          inv.balance_milli > 0 && inv.status === 'overdue'
                            ? 'var(--bad)'
                            : inv.balance_milli > 0
                            ? 'var(--warn)'
                            : undefined,
                      }}
                    >
                      {formatMoney(inv.balance_milli, inv.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">No invoices match this filter.</div>
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
