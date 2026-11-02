import React, { useState } from 'react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { IconPlus, IconEye, IconCash } from '../../components/icons';
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
}

export const InvoicesView: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const mockInvoices: MockInvoice[] = [
    {
      _id: 'i1',
      number: 'INV-2026-0001',
      customerName: 'Acme Global Ltd',
      date: '2026-10-01',
      due_date: '2026-10-31',
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
      date: '2026-10-10',
      due_date: '2026-11-09',
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
      date: '2026-10-12',
      due_date: '2026-11-11',
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
      date: '2026-09-15',
      due_date: '2026-10-15',
      total_milli: 850000,
      paid_milli: 0,
      balance_milli: 850000,
      currency: 'USD',
      status: 'overdue',
    },
  ];

  const filteredInvoices = mockInvoices.filter((inv) => {
    const matchesFilter = filter === 'all' || inv.status === filter;
    const matchesSearch =
      inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'unpaid', label: 'Unpaid' },
    { id: 'partial', label: 'Partial' },
    { id: 'paid', label: 'Paid' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
            Tax Invoices
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Commercial legal billings, receivable balances & aging
          </p>
        </div>
        <Button variant="primary" size="md" leftIcon={<IconPlus size={15} />}>
          New invoice
        </Button>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="gap-3">
          {/* Segmented Filter Control */}
          <div className="flex items-center rounded-lg border border-border-strong bg-bg-subtle p-0.5 text-xs overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-bg-surface text-accent font-semibold shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search invoice or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 px-3 text-xs bg-bg-subtle border border-border-strong rounded-lg text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </CardHeader>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-subtle/50 text-text-muted font-semibold uppercase tracking-wider text-[10.5px]">
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Due Date</th>
                <th className="py-2.5 px-4 text-right">Total</th>
                <th className="py-2.5 px-4 text-right">Balance Due</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv._id}
                    className="hover:bg-bg-subtle/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-accent">
                      {inv.number}
                    </td>
                    <td className="py-3 px-4 font-medium text-text-primary">
                      {inv.customerName}
                    </td>
                    <td className="py-3 px-4 text-text-muted mono">{inv.date}</td>
                    <td className="py-3 px-4 text-text-muted mono">{inv.due_date}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-text-primary">
                      {formatMoney(inv.total_milli, inv.currency)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-semibold ${
                        inv.balance_milli > 0
                          ? inv.status === 'overdue'
                            ? 'text-danger'
                            : 'text-warn'
                          : 'text-ok'
                      }`}
                    >
                      {formatMoney(inv.balance_milli, inv.currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={inv.status}>{inv.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        type="button"
                        className="p-1 text-text-muted hover:text-accent rounded"
                        title="View Invoice"
                      >
                        <IconEye size={15} />
                      </button>
                      {inv.balance_milli > 0 && (
                        <button
                          type="button"
                          className="p-1 text-text-muted hover:text-ok rounded"
                          title="Record Payment"
                        >
                          <IconCash size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center text-text-muted text-xs"
                  >
                    No tax invoices found matching the selected filter.
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

