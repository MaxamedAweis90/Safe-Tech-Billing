import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { IconPlus, IconArrow } from '../../components/icons';
import { useNavStore } from '../../store/useNavStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { formatMoney, fmtLong, fmtD } from '../../lib/formatters';
import {
  TODAY,
  MOCK_CUSTOMERS,
  MOCK_INVOICES,
  computeDashboardKPIs,
  compute12MonthRevenue,
  computeInvoiceStatusDistribution,
  getRecentTransactions,
  MockReceipt,
} from '../../lib/mockData';
import { MonthlyRevenueChart } from './MonthlyRevenueChart';
import { PaymentModalContent } from './PaymentModal';

export const DashboardView: React.FC = () => {
  const { setActiveTab } = useNavStore();
  const { can, needs } = useAuthStore();
  const { openModal, closeModal, addToast } = useUIStore();

  // Trigger state refresh when payments/data mutate
  const [, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // 1. Live financial metrics
  const kpis = computeDashboardKPIs();

  // 2. 12-month rolling revenue data
  const revenueData = compute12MonthRevenue();

  // 3. Invoice status breakdown
  const statusDist = computeInvoiceStatusDistribution();

  // 4. Recent transactions feed
  const transactions = getRecentTransactions();

  // Quick Action: Record Payment Modal
  const handleQuickPay = () => {
    if (!needs('payments')) return;

    const openInvoices = MOCK_INVOICES.filter(
      (i) => i.state === 'issued' && i.balance_milli > 0
    );

    if (!openInvoices.length) {
      addToast('There are no invoices with an outstanding balance.');
      return;
    }

    openModal({
      title: 'Record payment',
      body: (
        <PaymentModalContent
          initialInvoiceId={null}
          onSuccess={(receipt: MockReceipt) => {
            closeModal();
            triggerRefresh();
            addToast(`Receipt ${receipt.number} issued`);
            setActiveTab('receipts');
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  return (
    <>
      {/* Page Header matching prototype */}
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>{fmtLong(TODAY)} · figures in USD</p>
        </div>
        <div className="actions">
          {can('quotes') && (
            <Button
              variant="secondary"
              leftIcon={<IconPlus size={15} />}
              onClick={() => setActiveTab('quotations')}
            >
              New quotation
            </Button>
          )}
          {can('invoices') && (
            <Button
              variant="primary"
              leftIcon={<IconPlus size={15} />}
              onClick={() => setActiveTab('invoices')}
            >
              New invoice
            </Button>
          )}
        </div>
      </div>

      {/* 5 Financial KPIs matching prototype */}
      <div className="kpis">
        {/* 1. Quotations */}
        <a
          className="kpi"
          href="#quotations"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('quotations');
          }}
        >
          <span className="k-label">Quotations</span>
          <span className="k-value">{kpis.totalQuotes}</span>
          <span className="k-meta">{kpis.winRate}% accepted of decided</span>
        </a>

        {/* 2. Invoices issued */}
        <a
          className="kpi"
          href="#invoices"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('invoices');
          }}
        >
          <span className="k-label">Invoices issued</span>
          <span className="k-value">{kpis.issuedInvoices}</span>
          <span className="k-meta">
            {kpis.draftCount} draft · {kpis.cancelledCount} cancelled
          </span>
        </a>

        {/* 3. Payments received */}
        <a
          className="kpi"
          href="#receipts"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('receipts');
          }}
        >
          <span className="k-label">Payments received</span>
          <span className="k-value">{formatMoney(kpis.received, 'USD')}</span>
          <span className="k-meta">{formatMoney(kpis.thisMonth, 'USD')} this month</span>
        </a>

        {/* 4. Outstanding */}
        <a
          className="kpi"
          href="#reports"
          data-tab="outstanding"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('reports');
          }}
        >
          <span className="k-label">Outstanding</span>
          <span className="k-value">{formatMoney(kpis.outstanding, 'USD')}</span>
          <span className="k-meta">{kpis.openInvoicesCount} open invoices</span>
        </a>

        {/* 5. Overdue (Alert KPI) */}
        <a
          className="kpi alert"
          href="#invoices"
          data-filter="overdue"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('invoices');
          }}
        >
          <span className="k-label">Overdue</span>
          <span className="k-value">{formatMoney(kpis.overdueAmt, 'USD')}</span>
          <span className="k-meta">
            {kpis.overdueCount} invoice{kpis.overdueCount === 1 ? '' : 's'} past due
          </span>
        </a>
      </div>

      {/* Two-Column Grid: Monthly Revenue + Invoice Status */}
      <div className="grid-2">
        {/* Monthly Revenue Dual-Bar Chart */}
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Monthly revenue</h2>
              <span className="sub">Invoiced vs. cash received, last 12 months</span>
            </div>
            <div className="legend">
              <span>
                <i style={{ background: 'var(--line-strong)' }} />
                Invoiced
              </span>
              <span>
                <i style={{ background: 'var(--accent)' }} />
                Received
              </span>
            </div>
          </div>
          <div className="panel-body chart">
            <MonthlyRevenueChart
              months={revenueData.months}
              invoiced={revenueData.invoiced}
              received={revenueData.received}
            />
          </div>
        </section>

        {/* Invoice Status Distribution & Quick Actions */}
        <section className="panel">
          <div className="panel-head">
            <h2>Invoice status</h2>
            <span className="sub">{statusDist.totalIssued} issued</span>
          </div>
          <div className="panel-body">
            {/* Horizontal Stack Bar */}
            <div className="stack">
              {statusDist.byStatus.map((x) => (
                <i
                  key={x.s}
                  style={{
                    width: `${(x.n / statusDist.totalN) * 100}%`,
                    background: x.color,
                  }}
                  title={x.label}
                />
              ))}
            </div>

            {/* Status Breakdown Legend List */}
            <div className="status-list">
              {statusDist.byStatus.map((x) => (
                <div key={x.s}>
                  <span>
                    <span className={`chip c-${x.s}`}>{x.label}</span>
                    <span className="muted" style={{ color: 'var(--muted)', marginLeft: 6 }}>
                      × {x.n}
                    </span>
                  </span>
                  <span className="num">{formatMoney(x.amt, 'USD')}</span>
                </div>
              ))}
            </div>

            {/* Quick Actions Header & Grid */}
            <h2
              style={{
                fontSize: 13,
                margin: '22px 0 10px',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '.07em',
                fontWeight: 600,
              }}
            >
              Quick actions
            </h2>
            <div className="quick">
              <a
                href="#quote-new"
                onClick={(e) => {
                  e.preventDefault();
                  if (needs('quotes')) setActiveTab('quotations');
                }}
              >
                <b>Create quotation</b>
                <span>Price a job for a customer</span>
              </a>

              <a
                href="#invoice-new"
                onClick={(e) => {
                  e.preventDefault();
                  if (needs('invoices')) setActiveTab('invoices');
                }}
              >
                <b>Create invoice</b>
                <span>Bill without a quotation</span>
              </a>

              <button type="button" onClick={handleQuickPay}>
                <b>Record payment</b>
                <span>Issues a receipt automatically</span>
              </button>

              <a
                href="#customers"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('customers');
                }}
              >
                <b>Customers</b>
                <span>{MOCK_CUSTOMERS.length} on file</span>
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Recent Transactions Table */}
      <section className="panel">
        <div className="panel-head">
          <h2>Recent transactions</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('reports')}
            rightIcon={<IconArrow size={14} />}
          >
            All reports
          </Button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Number</th>
                <th>Customer</th>
                <th>Status</th>
                <th className="r">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr
                  key={`${tx.kind}-${tx.ref}-${idx}`}
                  className="link"
                  onClick={() => setActiveTab(tx.tab)}
                >
                  <td className="muted">{fmtD(tx.date)}</td>
                  <td>{tx.kind}</td>
                  <td
                    className="mono font-semibold"
                    style={{ color: 'var(--accent)' }}
                  >
                    {tx.ref}
                  </td>
                  <td>{tx.customerName}</td>
                  <td className="muted">{tx.sub}</td>
                  <td
                    className="r strong font-mono"
                    style={{ color: tx.isPayment ? 'var(--ok)' : undefined }}
                  >
                    {tx.isPayment ? '+' : ''}
                    {formatMoney(tx.amt, tx.cur)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};
