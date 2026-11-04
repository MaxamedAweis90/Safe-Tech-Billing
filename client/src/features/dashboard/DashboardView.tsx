import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SkeletonBox } from 'skullet/react';
import { Button } from '../../components/ui/Button';
import { IconPlus, IconArrow } from '../../components/icons';
import { useNavStore } from '../../store/useNavStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { formatMoney, fmtLong, fmtD } from '../../lib/formatters';
import api from '../../lib/api';
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

interface DashboardSummaryApiResponse {
  success: boolean;
  summary: {
    kpis: {
      totalQuotes: number;
      winRate: number;
      issuedInvoices: number;
      draftCount: number;
      cancelledCount: number;
      received: number;
      thisMonth: number;
      outstanding: number;
      openInvoicesCount: number;
      overdueAmt: number;
      overdueCount: number;
    };
    revenueData: {
      months: string[];
      invoiced: number[];
      received: number[];
    };
    statusDist: Array<{
      status: string;
      count: number;
      total_milli: number;
      pct: number;
    }>;
    recentTransactions: Array<{
      date: string;
      kind: 'Payment' | 'Invoice' | 'Quotation';
      ref: string;
      customerName: string;
      customerId: string;
      amt: number;
      cur: string;
      href: string;
      sub: string;
    }>;
  };
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'var(--ok)',
  partial: 'var(--warn)',
  sent: 'var(--info)',
  unpaid: 'var(--accent)',
  overdue: 'var(--bad)',
};

const STATUS_LABELS: Record<string, string> = {
  paid: 'Paid',
  partial: 'Partially paid',
  sent: 'Sent',
  unpaid: 'Unpaid',
  overdue: 'Overdue',
};

export const DashboardView: React.FC = () => {
  const { setActiveTab, setSelectedRecord } = useNavStore();
  const { can, needs } = useAuthStore();
  const { openModal, closeModal, addToast } = useUIStore();
  const queryClient = useQueryClient();

  // 1. Fetch live dashboard summary via TanStack Query
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DashboardSummaryApiResponse>({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary');
      return res.data;
    },
    staleTime: 30000,
  });

  // Fallbacks to prototype sample data if database is empty or query is pending/offline
  const mockKpis = computeDashboardKPIs();
  const mockRevenue = compute12MonthRevenue();
  const mockStatusDist = computeInvoiceStatusDistribution();
  const mockTransactions = getRecentTransactions();

  const hasLiveRecords =
    (data?.summary?.kpis?.totalQuotes ?? 0) > 0 ||
    (data?.summary?.kpis?.issuedInvoices ?? 0) > 0 ||
    (data?.summary?.kpis?.received ?? 0) > 0;

  // Resolved live KPIs
  const kpis = hasLiveRecords && data ? data.summary.kpis : mockKpis;

  // Resolved 12-month revenue
  const revenueData = hasLiveRecords && data ? data.summary.revenueData : mockRevenue;

  // Resolved status breakdown
  const statusItems =
    hasLiveRecords && data?.summary?.statusDist
      ? data.summary.statusDist
          .filter((x) => x.count > 0)
          .map((x) => ({
            s: x.status,
            label: STATUS_LABELS[x.status] || x.status,
            n: x.count,
            amt: x.total_milli,
            color: STATUS_COLORS[x.status] || 'var(--accent)',
          }))
      : mockStatusDist.byStatus;

  const totalN = statusItems.reduce((acc, x) => acc + x.n, 0) || 1;
  const totalIssued = hasLiveRecords && data ? data.summary.kpis.issuedInvoices : mockStatusDist.totalIssued;

  // Resolved recent transactions
  const transactions =
    hasLiveRecords && data?.summary?.recentTransactions?.length
      ? data.summary.recentTransactions.map((tx) => {
          let tab: 'receipts' | 'invoices' | 'quotations' = 'invoices';
          let id = tx.ref;
          if (tx.kind === 'Payment' || tx.href.startsWith('#receipt-')) {
            tab = 'receipts';
            id = tx.href.replace('#receipt-', '');
          } else if (tx.kind === 'Invoice' || tx.href.startsWith('#invoice-')) {
            tab = 'invoices';
            id = tx.href.replace('#invoice-', '');
          } else if (tx.kind === 'Quotation' || tx.href.startsWith('#quote-')) {
            tab = 'quotations';
            id = tx.href.replace('#quote-', '');
          }
          return {
            id,
            date: tx.date,
            kind: tx.kind,
            ref: tx.ref,
            customerId: tx.customerId,
            customerName: tx.customerName,
            amt: tx.amt,
            cur: tx.cur,
            href: tx.href,
            sub: tx.sub,
            isPayment: tx.kind === 'Payment',
            tab,
          };
        })
      : mockTransactions;

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
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
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

      {/* Query Error Alert Banner */}
      {isError && (
        <div
          className="panel"
          style={{
            borderColor: 'var(--bad)',
            marginBottom: 16,
            background: 'rgba(239, 68, 68, 0.06)',
            padding: '12px 16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <b style={{ color: 'var(--bad)' }}>Failed to load live dashboard summary.</b>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                {(error as any)?.message || 'An unexpected error occurred while communicating with the server.'}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* 5 Financial KPIs matching prototype */}
      <div className="kpis">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="kpi">
              <span className="k-label">
                <SkeletonBox height={11} width={80} />
              </span>
              <span className="k-value">
                <SkeletonBox height={24} width={110} style={{ margin: '6px 0' }} />
              </span>
              <span className="k-meta">
                <SkeletonBox height={12} width={130} />
              </span>
            </div>
          ))
        ) : (
          <>
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
          </>
        )}
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
            {isLoading ? (
              <div
                style={{
                  height: 240,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SkeletonBox height={220} width="100%" radius={4} />
              </div>
            ) : (
              <MonthlyRevenueChart
                months={revenueData.months}
                invoiced={revenueData.invoiced}
                received={revenueData.received}
              />
            )}
          </div>
        </section>

        {/* Invoice Status Distribution & Quick Actions */}
        <section className="panel">
          <div className="panel-head">
            <h2>Invoice status</h2>
            <span className="sub">{totalIssued} issued</span>
          </div>
          <div className="panel-body">
            {isLoading ? (
              <>
                <SkeletonBox
                  height={16}
                  width="100%"
                  radius={999}
                  style={{ marginBottom: 16 }}
                />
                <div className="status-list">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                      }}
                    >
                      <SkeletonBox height={16} width={110} />
                      <SkeletonBox height={16} width={65} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Horizontal Stack Bar */}
                <div className="stack">
                  {statusItems.map((x) => (
                    <i
                      key={x.s}
                      style={{
                        width: `${(x.n / totalN) * 100}%`,
                        background: x.color,
                      }}
                      title={x.label}
                    />
                  ))}
                </div>

                {/* Status Breakdown Legend List */}
                <div className="status-list">
                  {statusItems.map((x) => (
                    <div key={x.s}>
                      <span>
                        <span className={`chip c-${x.s}`}>{x.label}</span>
                        <span
                          className="muted"
                          style={{ color: 'var(--muted)', marginLeft: 6 }}
                        >
                          × {x.n}
                        </span>
                      </span>
                      <span className="num">{formatMoney(x.amt, 'USD')}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

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
                  if (needs('quotes')) setSelectedRecord('quotations', 'new');
                }}
              >
                <b>Create quotation</b>
                <span>Price a job for a customer</span>
              </a>

              <a
                href="#invoice-new"
                onClick={(e) => {
                  e.preventDefault();
                  if (needs('invoices')) setSelectedRecord('invoices', 'new');
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
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td>
                      <SkeletonBox height={14} width={70} />
                    </td>
                    <td>
                      <SkeletonBox height={14} width={60} />
                    </td>
                    <td>
                      <SkeletonBox height={14} width={85} />
                    </td>
                    <td>
                      <SkeletonBox height={14} width={140} />
                    </td>
                    <td>
                      <SkeletonBox height={14} width={90} />
                    </td>
                    <td className="r">
                      <SkeletonBox
                        height={14}
                        width={70}
                        style={{ marginLeft: 'auto' }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                transactions.map((tx, idx) => (
                  <tr
                    key={`${tx.kind}-${tx.ref}-${idx}`}
                    className="link"
                    onClick={() => setSelectedRecord(tx.tab, tx.id)}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};
