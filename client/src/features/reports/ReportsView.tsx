import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { formatMoney } from '../../lib/formatters';

export const ReportsView: React.FC = () => {
  const agingBuckets = [
    { label: 'Current (0-30 days)', amount: 2200000, count: 1, color: 'text-ok' },
    { label: '31-60 days', amount: 2850000, count: 1, color: 'text-warn' },
    { label: '61-90 days', amount: 850000, count: 1, color: 'text-danger' },
    { label: '90+ days overdue', amount: 0, count: 0, color: 'text-text-faint' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
          Financial Reports
        </h1>
        <p className="text-xs text-text-muted mt-0.5">
          Commercial performance, aging schedules, and tax reconciliation
        </p>
      </div>

      {/* Aging Schedule */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Accounts Receivable Aging Schedule</CardTitle>
            <div className="text-xs text-text-muted mt-0.5">
              Outstanding receivable balances bucketed by payment due date
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {agingBuckets.map((bucket, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-border-strong bg-bg-subtle"
              >
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  {bucket.label}
                </div>
                <div className={`text-xl font-bold mt-2 mono ${bucket.color}`}>
                  {formatMoney(bucket.amount, 'USD')}
                </div>
                <div className="text-xs text-text-faint mt-1">
                  {bucket.count} outstanding invoice(s)
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tax & Collection Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tax Reconciliation Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border-subtle text-xs">
              <span className="text-text-muted">Standard Rate VAT (16%):</span>
              <span className="font-mono font-semibold text-text-primary">
                {formatMoney(1960000, 'USD')}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-subtle text-xs">
              <span className="text-text-muted">Zero Rated Supplies:</span>
              <span className="font-mono font-semibold text-text-primary">
                {formatMoney(0, 'USD')}
              </span>
            </div>
            <div className="flex justify-between py-2 text-xs font-semibold">
              <span className="text-text-primary">Total Output Tax:</span>
              <span className="font-mono text-accent">
                {formatMoney(1960000, 'USD')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settlement & Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border-subtle text-xs">
              <span className="text-text-muted">Collection Ratio:</span>
              <span className="font-mono font-semibold text-ok">88.4%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-subtle text-xs">
              <span className="text-text-muted">Average Days to Pay:</span>
              <span className="font-mono font-semibold text-text-primary">
                18.2 Days
              </span>
            </div>
            <div className="flex justify-between py-2 text-xs font-semibold">
              <span className="text-text-primary">Disputed / Credit Note Ratio:</span>
              <span className="font-mono text-text-muted">0.0%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

