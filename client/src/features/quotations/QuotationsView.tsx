import React, { useState } from 'react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { IconPlus, IconEye, IconCopy } from '../../components/icons';
import { QuotationStatus } from '../../types';
import { formatMoney } from '../../lib/formatters';

interface MockQuote {
  _id: string;
  number: string;
  customerName: string;
  date: string;
  expiry_date: string;
  total_milli: number;
  currency: string;
  status: QuotationStatus;
}

export const QuotationsView: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const mockQuotes: MockQuote[] = [
    {
      _id: 'q1',
      number: 'QT-2026-0001',
      customerName: 'Acme Global Ltd',
      date: '2026-10-15',
      expiry_date: '2026-11-15',
      total_milli: 12500000,
      currency: 'USD',
      status: 'accepted',
    },
    {
      _id: 'q2',
      number: 'QT-2026-0002',
      customerName: 'Nairobi Water Works',
      date: '2026-10-20',
      expiry_date: '2026-11-20',
      total_milli: 4850000,
      currency: 'USD',
      status: 'sent',
    },
    {
      _id: 'q3',
      number: 'QT-2026-0003',
      customerName: 'Apex Logistics Inc',
      date: '2026-10-25',
      expiry_date: '2026-11-25',
      total_milli: 3200000,
      currency: 'USD',
      status: 'draft',
    },
    {
      _id: 'q4',
      number: 'QT-2026-0004',
      customerName: 'Coast Builders',
      date: '2026-09-01',
      expiry_date: '2026-10-01',
      total_milli: 7100000,
      currency: 'USD',
      status: 'expired',
    },
  ];

  const filteredQuotes = mockQuotes.filter((q) => {
    const matchesFilter = filter === 'all' || q.status === filter;
    const matchesSearch =
      q.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'sent', label: 'Sent' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'expired', label: 'Expired' },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
            Quotations
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Commercial proposals, formal bids and estimates
          </p>
        </div>
        <Button variant="primary" size="md" leftIcon={<IconPlus size={15} />}>
          New quotation
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
              placeholder="Search quote or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 px-3 text-xs bg-bg-subtle border border-border-strong rounded-lg text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </CardHeader>

        {/* Quotations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-subtle/50 text-text-muted font-semibold uppercase tracking-wider text-[10.5px]">
                <th className="py-2.5 px-4">Quote #</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Expires</th>
                <th className="py-2.5 px-4 text-right">Total Amount</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredQuotes.length > 0 ? (
                filteredQuotes.map((q) => (
                  <tr
                    key={q._id}
                    className="hover:bg-bg-subtle/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-accent">
                      {q.number}
                    </td>
                    <td className="py-3 px-4 font-medium text-text-primary">
                      {q.customerName}
                    </td>
                    <td className="py-3 px-4 text-text-muted mono">{q.date}</td>
                    <td className="py-3 px-4 text-text-muted mono">
                      {q.expiry_date}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-text-primary">
                      {formatMoney(q.total_milli, q.currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={q.status}>{q.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        type="button"
                        className="p-1 text-text-muted hover:text-accent rounded"
                        title="View Quotation"
                      >
                        <IconEye size={15} />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-text-muted hover:text-accent rounded"
                        title="Duplicate"
                      >
                        <IconCopy size={15} />
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
                    No quotations found matching the selected filter.
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
