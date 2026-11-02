import React from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { IconPlus, IconArrow } from '../../components/icons';
import { useNavStore } from '../../store/useNavStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatMoney } from '../../lib/formatters';

export const DashboardView: React.FC = () => {
  const { setActiveTab } = useNavStore();
  const { can, needs } = useAuthStore();

  const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const invoicedData = [2400, 3100, 2800, 4200, 3800, 5100, 4600, 6200, 5800, 7400, 8100, 9200];
  const receivedData = [2100, 2700, 2500, 3600, 3400, 4800, 4100, 5900, 5200, 6900, 7600, 8400];

  // SVG Bar Chart rendering matching prototype barChart()
  const renderBarChart = () => {
    const W = 640;
    const H = 220;
    const pl = 44;
    const pr = 12;
    const pt = 14;
    const pb = 26;
    const max = 10000;
    const step = 2500;
    const iw = W - pl - pr;
    const ih = H - pt - pb;
    const bw = iw / months.length;
    const y = (v: number) => pt + ih - (v / max) * ih;

    const gridLines = [];
    for (let v = 0; v <= max; v += step) {
      gridLines.push(
        <g key={v}>
          <line
            x1={pl}
            x2={W - pr}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--line)"
            strokeWidth="1"
          />
          <text
            x={pl - 6}
            y={y(v) + 4}
            textAnchor="end"
            fontSize="10"
            fill="var(--muted)"
            fontFamily="var(--f-num)"
          >
            ${v >= 1000 ? `${v / 1000}k` : v}
          </text>
        </g>
      );
    }

    const bars = months.map((m, i) => {
      const x = pl + i * bw;
      const barW = Math.max(4, bw * 0.32);
      const isLast = i === months.length - 1;
      return (
        <g key={m}>
          {/* Invoiced Bar */}
          <rect
            x={x + bw * 0.16}
            y={y(invoicedData[i])}
            width={barW}
            height={ih + pt - y(invoicedData[i])}
            rx="2"
            fill="var(--line-strong)"
          />
          {/* Received Bar */}
          <rect
            x={x + bw * 0.16 + barW + 2}
            y={y(receivedData[i])}
            width={barW}
            height={ih + pt - y(receivedData[i])}
            rx="2"
            fill="var(--accent)"
            opacity={isLast ? 1 : 0.85}
          />
          {/* Month Label */}
          <text
            x={x + bw / 2}
            y={H - 6}
            textAnchor="middle"
            fontSize="10"
            fill="var(--muted)"
            fontFamily="var(--f-ui)"
          >
            {m}
          </text>
        </g>
      );
    });

    return (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Monthly invoiced and received">
        {gridLines}
        {bars}
      </svg>
    );
  };

  const statusBreakdown = [
    { s: 'paid' as const, label: 'Paid', n: 4, pct: 40, amt: 12500000, color: 'var(--ok)' },
    { s: 'partial' as const, label: 'Partial', n: 2, pct: 20, amt: 4850000, color: 'var(--warn)' },
    { s: 'sent' as const, label: 'Sent', n: 2, pct: 20, amt: 2200000, color: 'var(--info)' },
    { s: 'overdue' as const, label: 'Overdue', n: 2, pct: 20, amt: 850000, color: 'var(--bad)' },
  ];

  const recentTransactions = [
    {
      date: '30 Oct 2026',
      kind: 'Payment',
      ref: 'RCP-2026-0042',
      customer: 'Acme Global Ltd',
      status: 'paid' as const,
      amt: 1500000,
      currency: 'USD',
      isPayment: true,
    },
    {
      date: '28 Oct 2026',
      kind: 'Invoice',
      ref: 'INV-2026-0089',
      customer: 'Apex Logistics Inc',
      status: 'sent' as const,
      amt: 2200000,
      currency: 'USD',
      isPayment: false,
    },
    {
      date: '25 Oct 2026',
      kind: 'Quotation',
      ref: 'QT-2026-0104',
      customer: 'Nairobi Water Works',
      status: 'accepted' as const,
      amt: 4850000,
      currency: 'USD',
      isPayment: false,
    },
    {
      date: '20 Oct 2026',
      kind: 'Invoice',
      ref: 'INV-2026-0078',
      customer: 'Zenith Holdings Ltd',
      status: 'overdue' as const,
      amt: 850000,
      currency: 'USD',
      isPayment: false,
    },
  ];

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Commercial performance overview · figures in USD</p>
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

      {/* 5 KPIs matching prototype */}
      <div className="kpis">
        <a className="kpi" href="#quotations" onClick={(e) => { e.preventDefault(); setActiveTab('quotations'); }}>
          <span className="k-label">Quotations</span>
          <span className="k-value">5</span>
          <span className="k-meta">60% accepted of decided</span>
        </a>

        <a className="kpi" href="#invoices" onClick={(e) => { e.preventDefault(); setActiveTab('invoices'); }}>
          <span className="k-label">Invoices issued</span>
          <span className="k-value">5</span>
          <span className="k-meta">0 draft · 0 cancelled</span>
        </a>

        <a className="kpi" href="#receipts" onClick={(e) => { e.preventDefault(); setActiveTab('receipts'); }}>
          <span className="k-label">Payments received</span>
          <span className="k-value">{formatMoney(14500000, 'USD')}</span>
          <span className="k-meta">{formatMoney(2000000, 'USD')} this month</span>
        </a>

        <a className="kpi" href="#reports" onClick={(e) => { e.preventDefault(); setActiveTab('reports'); }}>
          <span className="k-label">Outstanding</span>
          <span className="k-value">{formatMoney(7350000, 'USD')}</span>
          <span className="k-meta">4 open invoices</span>
        </a>

        <a className="kpi alert" href="#invoices" onClick={(e) => { e.preventDefault(); setActiveTab('invoices'); }}>
          <span className="k-label">Overdue</span>
          <span className="k-value">{formatMoney(2300000, 'USD')}</span>
          <span className="k-meta">2 invoices past due</span>
        </a>
      </div>

      {/* Two Column Grid: Revenue Chart + Invoice Status */}
      <div className="grid-2">
        {/* Monthly Revenue Chart */}
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
            {renderBarChart()}
          </div>
        </section>

        {/* Invoice Status & Quick Actions */}
        <section className="panel">
          <div className="panel-head">
            <h2>Invoice status</h2>
            <span className="sub">5 issued</span>
          </div>
          <div className="panel-body">
            {/* Horizontal Color Stack Bar */}
            <div className="stack">
              {statusBreakdown.map((item) => (
                <i
                  key={item.s}
                  style={{ width: `${item.pct}%`, background: item.color }}
                  title={`${item.label}: ${item.n}`}
                />
              ))}
            </div>

            {/* Status Breakdown Legend List */}
            <div className="status-list">
              {statusBreakdown.map((item) => (
                <div key={item.s}>
                  <span>
                    <Badge variant={item.s}>{item.s}</Badge>
                    <span className="muted" style={{ marginLeft: 6, fontSize: 12 }}>
                      × {item.n}
                    </span>
                  </span>
                  <span className="num">{formatMoney(item.amt, 'USD')}</span>
                </div>
              ))}
            </div>

            {/* Quick Actions Grid */}
            <h2
              style={{
                fontSize: 12.5,
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
              <button
                type="button"
                onClick={() => {
                  if (needs('payments')) setActiveTab('receipts');
                }}
              >
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
                <span>5 on file</span>
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Recent Transactions Panel */}
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
              {recentTransactions.map((tx, idx) => (
                <tr key={idx} className="link">
                  <td className="muted mono">{tx.date}</td>
                  <td>{tx.kind}</td>
                  <td className="mono font-semibold" style={{ color: 'var(--accent)' }}>
                    {tx.ref}
                  </td>
                  <td>{tx.customer}</td>
                  <td>
                    <Badge variant={tx.status}>{tx.status}</Badge>
                  </td>
                  <td
                    className="r strong font-mono"
                    style={{ color: tx.isPayment ? 'var(--ok)' : undefined }}
                  >
                    {tx.isPayment ? '+' : ''}
                    {formatMoney(tx.amt, tx.currency)}
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
