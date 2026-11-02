import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SegmentedControl, SegmentOption } from '../../components/ui/SegmentedControl';
import { IconPlus } from '../../components/icons';
import { useAuthStore } from '../../store/useAuthStore';
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
  invoiceNumber?: string;
}

export const QuotationsView: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { can } = useAuthStore();

  const mockQuotes: MockQuote[] = [
    {
      _id: 'q1',
      number: 'QT-2026-0001',
      customerName: 'Acme Global Ltd',
      date: '15 Oct 2026',
      expiry_date: '15 Nov 2026',
      total_milli: 12500000,
      currency: 'USD',
      status: 'accepted',
      invoiceNumber: 'INV-2026-0001',
    },
    {
      _id: 'q2',
      number: 'QT-2026-0002',
      customerName: 'Nairobi Water Works',
      date: '20 Oct 2026',
      expiry_date: '20 Nov 2026',
      total_milli: 4850000,
      currency: 'USD',
      status: 'accepted',
    },
    {
      _id: 'q3',
      number: 'QT-2026-0003',
      customerName: 'Apex Logistics Inc',
      date: '25 Oct 2026',
      expiry_date: '25 Nov 2026',
      total_milli: 3200000,
      currency: 'USD',
      status: 'sent',
    },
    {
      _id: 'q4',
      number: 'QT-2026-0004',
      customerName: 'Coast Builders',
      date: '01 Sep 2026',
      expiry_date: '01 Oct 2026',
      total_milli: 7100000,
      currency: 'USD',
      status: 'draft',
    },
  ];

  const counts: Record<string, number> = {
    all: mockQuotes.length,
    draft: mockQuotes.filter((q) => q.status === 'draft').length,
    sent: mockQuotes.filter((q) => q.status === 'sent').length,
    accepted: mockQuotes.filter((q) => q.status === 'accepted').length,
    rejected: mockQuotes.filter((q) => q.status === 'rejected').length,
    expired: mockQuotes.filter((q) => q.status === 'expired').length,
  };

  const filterOptions: SegmentOption[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'draft', label: 'Draft', count: counts.draft },
    { id: 'sent', label: 'Sent', count: counts.sent },
    { id: 'accepted', label: 'Accepted', count: counts.accepted },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
    { id: 'expired', label: 'Expired', count: counts.expired },
  ];

  const filteredQuotes = mockQuotes.filter((q) => {
    const matchesFilter = filter === 'all' || q.status === filter;
    const matchesSearch =
      q.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Quotations</h1>
          <p>Price jobs, track decisions, and convert accepted quotations into invoices.</p>
        </div>
        <div className="actions">
          {can('quotes') && (
            <Button variant="primary" leftIcon={<IconPlus size={15} />}>
              New quotation
            </Button>
          )}
        </div>
      </div>

      {/* Main Panel with Filter Bar & Table */}
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
                <th>Number</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Valid until</th>
                <th>Status</th>
                <th>Invoice</th>
                <th className="r">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.length > 0 ? (
                filteredQuotes.map((q) => (
                  <tr key={q._id} className="link">
                    <td className="mono strong" style={{ color: 'var(--accent)' }}>
                      {q.number}
                    </td>
                    <td>{q.customerName}</td>
                    <td className="muted mono">{q.date}</td>
                    <td className="muted mono">{q.expiry_date}</td>
                    <td>
                      <Badge variant={q.status}>{q.status}</Badge>
                    </td>
                    <td>
                      {q.invoiceNumber ? (
                        <span className="mono" style={{ color: 'var(--accent)' }}>
                          {q.invoiceNumber}
                        </span>
                      ) : q.status === 'accepted' ? (
                        <span style={{ color: 'var(--warn)', fontSize: 12.5, fontWeight: 500 }}>
                          Ready to convert
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="r strong font-mono">
                      {formatMoney(q.total_milli, q.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">No quotations match this filter.</div>
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
