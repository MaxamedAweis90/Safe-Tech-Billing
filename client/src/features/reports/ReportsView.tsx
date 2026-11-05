import React, { useState, useMemo, useCallback } from 'react';
import { MOCK_CUSTOMERS, TODAY, getCustomerById } from '../../lib/mockData';
import { fmtD, addDays } from '../../lib/formatters';
import { IconCopy } from '../../components/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useCustomers } from '../../hooks/useCustomers';
import { exportCSV } from './csvExport';
import { RevenueReport } from './RevenueReport';
import { AgingReport } from './AgingReport';
import { PaymentReport } from './PaymentReport';
import { ConversionReport } from './ConversionReport';
import { PaidUnpaidReport } from './PaidUnpaidReport';

type ReportTab =
  | 'revenue'
  | 'outstanding'
  | 'payments'
  | 'conversion'
  | 'paidunpaid';

type RangePreset = 'month' | '30' | 'year' | 'all' | 'custom';
type GroupBy = 'day' | 'month' | 'year';

const TABS: [ReportTab, string][] = [
  ['revenue', 'Revenue'],
  ['outstanding', 'Outstanding & aging'],
  ['payments', 'Payment history'],
  ['conversion', 'Quotation conversion'],
  ['paidunpaid', 'Paid vs unpaid'],
];

const RANGE_PRESETS: [RangePreset, string][] = [
  ['month', 'This month'],
  ['30', 'Last 30 days'],
  ['year', 'This year'],
  ['all', 'All time'],
  ['custom', 'Custom'],
];

export const ReportsView: React.FC = () => {
  const [tab, setTab] = useState<ReportTab>('revenue');
  const [range, setRange] = useState<RangePreset>('year');
  const [from, setFrom] = useState(TODAY.slice(0, 4) + '-01-01');
  const [to, setTo] = useState(TODAY);
  const [cust, setCust] = useState('all');
  const [group, setGroup] = useState<GroupBy>('month');

  // Active report CSV matrix
  const [currentCSV, setCurrentCSV] = useState<(string | number)[][]>([]);

  const handleUpdateCSV = useCallback((matrix: (string | number)[][]) => {
    setCurrentCSV(matrix);
  }, []);

  // Compute active date boundaries matching prototype rangeDates()
  const [activeFrom, activeTo] = useMemo(() => {
    const y = TODAY.slice(0, 4);
    if (range === 'month') return [TODAY.slice(0, 8) + '01', TODAY];
    if (range === '30') return [addDays(TODAY, -29), TODAY];
    if (range === 'year') return [y + '-01-01', TODAY];
    if (range === 'all') return ['2000-01-01', TODAY];
    return [from || y + '-01-01', to || TODAY];
  }, [range, from, to]);

  const { user } = useAuthStore();
  const isDemo = user?.isDemo === true;

  const { data: customersData } = useCustomers();
  const customerList = customersData?.customers && customersData.customers.length > 0
    ? customersData.customers.map((c: any) => ({
        id: c._id || c.id || String(c.code),
        name: c.name,
      }))
    : isDemo
    ? MOCK_CUSTOMERS.map((c) => ({ id: c.id, name: c.name }))
    : [];

  const selectedCustomer = cust !== 'all'
    ? customerList.find((c) => c.id === cust) || (isDemo ? getCustomerById(cust) : null)
    : null;

  const handleCopyCSV = () => {
    exportCSV(currentCSV);
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Reports &amp; analytics</h1>
          <p>
            {fmtD(activeFrom)} – {fmtD(activeTo)}
            {selectedCustomer ? ` · ${selectedCustomer.name}` : ' · all customers'}
            {' · amounts in USD'}
          </p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn"
            data-act="copy-csv"
            onClick={handleCopyCSV}
          >
            <IconCopy size={15} />
            Copy as CSV
          </button>
        </div>
      </div>

      {/* Main Panel */}
      <section className="panel">
        {/* Sub-Navigation Tabs */}
        <div className="tabs" data-rep="tab">
          {TABS.map(([k, l]) => (
            <button
              key={k}
              type="button"
              data-v={k}
              className={tab === k ? 'on' : ''}
              onClick={() => setTab(k)}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Global Report Filters Bar */}
        <div className="filters">
          <div className="seg" data-rep="range">
            {RANGE_PRESETS.map(([v, l]) => (
              <button
                key={v}
                type="button"
                data-v={v}
                className={range === v ? 'on' : ''}
                onClick={() => setRange(v)}
              >
                {l}
              </button>
            ))}
          </div>

          {range === 'custom' && (
            <>
              <input
                type="date"
                className="inp"
                id="rFrom"
                value={from}
                aria-label="From"
                onChange={(e) => setFrom(e.target.value)}
              />
              <input
                type="date"
                className="inp"
                id="rTo"
                value={to}
                aria-label="To"
                onChange={(e) => setTo(e.target.value)}
              />
            </>
          )}

          <select
            className="sel"
            id="rCust"
            aria-label="Customer"
            value={cust}
            onChange={(e) => setCust(e.target.value)}
          >
            <option value="all">All customers</option>
            {customerList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Report Content */}
        {tab === 'revenue' && (
          <RevenueReport
            from={activeFrom}
            to={activeTo}
            cust={cust}
            group={group}
            onGroupChange={setGroup}
            onUpdateCSV={handleUpdateCSV}
          />
        )}

        {tab === 'outstanding' && (
          <AgingReport
            to={activeTo}
            cust={cust}
            onUpdateCSV={handleUpdateCSV}
          />
        )}

        {tab === 'payments' && (
          <PaymentReport
            from={activeFrom}
            to={activeTo}
            cust={cust}
            onUpdateCSV={handleUpdateCSV}
          />
        )}

        {tab === 'conversion' && (
          <ConversionReport
            from={activeFrom}
            to={activeTo}
            cust={cust}
            onUpdateCSV={handleUpdateCSV}
          />
        )}

        {tab === 'paidunpaid' && (
          <PaidUnpaidReport
            from={activeFrom}
            to={activeTo}
            cust={cust}
            onUpdateCSV={handleUpdateCSV}
          />
        )}
      </section>

      {/* Export hint */}
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12.5 }}>
        Copy as CSV pastes straight into Excel or Google Sheets. In production,
        the server also exports PDF and .xlsx.
      </p>
    </>
  );
};
