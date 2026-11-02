import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon, IconPlus, IconAlertTriangle } from '../../components/icons';
import { useNavStore } from '../../store/useNavStore';
import { formatMoney } from '../../lib/formatters';

export const DashboardView: React.FC = () => {
  const { setActiveTab } = useNavStore();

  const kpis = [
    {
      label: 'Total Invoiced',
      value: formatMoney(14520000, 'USD'),
      meta: '+12.5% vs last month',
      alert: false,
    },
    {
      label: 'Total Settled',
      value: formatMoney(11200000, 'USD'),
      meta: '88.4% collection efficiency',
      alert: false,
      accent: true,
    },
    {
      label: 'Outstanding Balance',
      value: formatMoney(3320000, 'USD'),
      meta: 'Pending customer clearance',
      alert: false,
      warn: true,
    },
    {
      label: 'Overdue Amount',
      value: formatMoney(850000, 'USD'),
      meta: '2 invoices require action',
      alert: true,
    },
  ];

  const recentTransactions = [
    {
      date: '2026-10-30',
      kind: 'Payment',
      ref: 'RCP-2026-0042',
      customer: 'Acme Global Ltd',
      amount_milli: 1500000,
      currency: 'USD',
      status: 'paid' as const,
    },
    {
      date: '2026-10-28',
      kind: 'Invoice',
      ref: 'INV-2026-0089',
      customer: 'Apex Logistics Inc',
      amount_milli: 2200000,
      currency: 'USD',
      status: 'sent' as const,
    },
    {
      date: '2026-10-25',
      kind: 'Quotation',
      ref: 'QT-2026-0104',
      customer: 'Nairobi Water Works',
      amount_milli: 4850000,
      currency: 'USD',
      status: 'accepted' as const,
    },
    {
      date: '2026-10-20',
      kind: 'Invoice',
      ref: 'INV-2026-0078',
      customer: 'Zenith Holdings Ltd',
      amount_milli: 850000,
      currency: 'USD',
      status: 'overdue' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
            Dashboard
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Commercial billing ledger overview · Base Currency: USD
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<IconPlus size={15} />}
            onClick={() => setActiveTab('quotations')}
          >
            New quotation
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<IconPlus size={15} />}
            onClick={() => setActiveTab('invoices')}
          >
            New invoice
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className={`bg-bg-surface border rounded-xl p-4.5 relative shadow-sm transition-colors ${
              kpi.alert
                ? 'border-danger/40 bg-danger-soft/10'
                : 'border-border-strong hover:border-border-strong/80'
            }`}
          >
            {kpi.alert && (
              <div className="absolute left-0 top-3 bottom-3 w-1 bg-danger rounded-r" />
            )}
            <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              {kpi.label}
            </div>
            <div
              className={`text-2xl font-bold mt-2 mono ${
                kpi.alert
                  ? 'text-danger'
                  : kpi.accent
                  ? 'text-accent'
                  : kpi.warn
                  ? 'text-warn'
                  : 'text-text-primary'
              }`}
            >
              {kpi.value}
            </div>
            <div className="text-xs text-text-muted mt-1.5 flex items-center gap-1.5">
              {kpi.alert && <IconAlertTriangle size={12} className="text-danger" />}
              <span>{kpi.meta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Grid: Activity Ledger & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Commercial Ledger Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <div className="text-xs text-text-muted mt-0.5">
                  Latest recorded invoices, receipts and quotes
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('invoices')}
              >
                View all &rarr;
              </Button>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-subtle/50 text-text-muted font-semibold uppercase tracking-wider text-[10.5px]">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Ref Number</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {recentTransactions.map((tx, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-bg-subtle/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-text-muted mono">{tx.date}</td>
                      <td className="py-3 px-4 font-medium text-text-primary">
                        {tx.kind}
                      </td>
                      <td className="py-3 px-4 font-mono text-accent">
                        {tx.ref}
                      </td>
                      <td className="py-3 px-4 text-text-primary">{tx.customer}</td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-text-primary">
                        {formatMoney(tx.amount_milli, tx.currency)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={tx.status}>{tx.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Quick Commercial Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 p-4">
              <button
                type="button"
                onClick={() => setActiveTab('quotations')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border-strong bg-bg-subtle hover:border-accent hover:bg-accent/5 transition-all text-left cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-semibold text-text-primary group-hover:text-accent">
                    Create Quotation
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    Draft a proposal with line items & discounts
                  </div>
                </div>
                <Icon name="quote" size={16} className="text-text-faint group-hover:text-accent" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('invoices')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border-strong bg-bg-subtle hover:border-accent hover:bg-accent/5 transition-all text-left cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-semibold text-text-primary group-hover:text-accent">
                    Issue Tax Invoice
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    Lock terms, generate serial number & balance
                  </div>
                </div>
                <Icon name="inv" size={16} className="text-text-faint group-hover:text-accent" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('receipts')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border-strong bg-bg-subtle hover:border-accent hover:bg-accent/5 transition-all text-left cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-semibold text-text-primary group-hover:text-accent">
                    Record Payment
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    Log cash, M-Pesa or bank transfer receipt
                  </div>
                </div>
                <Icon name="rec" size={16} className="text-text-faint group-hover:text-accent" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('customers')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border-strong bg-bg-subtle hover:border-accent hover:bg-accent/5 transition-all text-left cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-semibold text-text-primary group-hover:text-accent">
                    Add Customer
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    Create new client ledger account
                  </div>
                </div>
                <Icon name="cust" size={16} className="text-text-faint group-hover:text-accent" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

