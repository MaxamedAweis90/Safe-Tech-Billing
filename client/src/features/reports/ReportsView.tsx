import React from 'react';
import { formatMoney } from '../../lib/formatters';

export const ReportsView: React.FC = () => {
  const agingBuckets = [
    { label: 'Current (0-30 days)', amount: 2200000, count: 1, color: 'var(--ok)' },
    { label: '31-60 days', amount: 2850000, count: 1, color: 'var(--warn)' },
    { label: '61-90 days', amount: 850000, count: 1, color: 'var(--bad)' },
    { label: '90+ days overdue', amount: 0, count: 0, color: 'var(--faint)' },
  ];

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Financial Reports</h1>
          <p>Accounts receivable aging schedule, tax reconciliation, and collection efficiency.</p>
        </div>
      </div>

      {/* AR Aging Buckets */}
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Accounts receivable aging schedule</h2>
            <span className="sub">Outstanding invoice balances bucketed by payment due date</span>
          </div>
        </div>
        <div className="panel-body">
          <div className="kpis">
            {agingBuckets.map((bucket, idx) => (
              <div key={idx} className="kpi">
                <span className="k-label">{bucket.label}</span>
                <span className="k-value" style={{ color: bucket.color }}>
                  {formatMoney(bucket.amount, 'USD')}
                </span>
                <span className="k-meta">{bucket.count} open invoice(s)</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grid 2: Tax Reconciliation & Collection Efficiency */}
      <div className="grid-2e">
        <section className="panel">
          <div className="panel-head">
            <h2>Tax reconciliation summary</h2>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <tbody>
                <tr>
                  <td className="muted">Standard Rate VAT (16%)</td>
                  <td className="r strong font-mono">{formatMoney(1960000, 'USD')}</td>
                </tr>
                <tr>
                  <td className="muted">Zero-Rated Supplies (0%)</td>
                  <td className="r font-mono">{formatMoney(0, 'USD')}</td>
                </tr>
                <tr style={{ background: 'var(--surface-2)' }}>
                  <td className="strong">Total Output Tax Accrued</td>
                  <td className="r strong font-mono" style={{ color: 'var(--accent)' }}>
                    {formatMoney(1960000, 'USD')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Collection efficiency & KPI</h2>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <tbody>
                <tr>
                  <td className="muted">Collection Rate</td>
                  <td className="r strong font-mono" style={{ color: 'var(--ok)' }}>
                    88.4%
                  </td>
                </tr>
                <tr>
                  <td className="muted">Average Days to Pay (DSO)</td>
                  <td className="r strong font-mono">18.2 Days</td>
                </tr>
                <tr style={{ background: 'var(--surface-2)' }}>
                  <td className="strong">Disputed / Credit Note Ratio</td>
                  <td className="r strong font-mono" style={{ color: 'var(--muted)' }}>
                    0.0%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
};
