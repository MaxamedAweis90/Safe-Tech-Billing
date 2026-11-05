import React from 'react';
import { formatMoney } from '../../lib/formatters';
import { niceStep } from '../../lib/mockData';

interface MonthlyRevenueChartProps {
  months: string[];
  invoiced: number[];
  received: number[];
}

export const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({
  months,
  invoiced,
  received,
}) => {
  if (!months || months.length === 0) {
    return (
      <div
        style={{
          height: 240,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6F7B90',
          fontSize: '13px',
          textAlign: 'center',
          padding: '16px',
        }}
      >
        <p style={{ margin: '0 0 4px 0', color: '#B9C5DA', fontWeight: 600, fontSize: '13.5px' }}>
          No revenue records yet
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: '#6F7B90' }}>
          Your 12-month revenue performance chart will render here as invoices are issued and payments are collected.
        </p>
      </div>
    );
  }

  const W = 640;
  const H = 240;
  const pl = 48;
  const pr = 8;
  const pt = 12;
  const pb = 28;

  const maxVal = Math.max(...invoiced, ...received, 1000);
  const step = niceStep(maxVal / 4);
  const top = Math.ceil(maxVal / step) * step;
  const iw = W - pl - pr;
  const ih = H - pt - pb;
  const bw = iw / (months.length || 1);
  const y = (v: number) => pt + ih - (v / top) * ih;

  // Grid lines and Y-axis text
  const gridElements = [];
  for (let v = 0; v <= top; v += step) {
    const yPos = y(v);
    const label = v >= 1e6 ? `$${v / 1e6}k` : `$${Math.round(v / 1000).toLocaleString()}`;
    gridElements.push(
      <g key={`grid-${v}`}>
        <line
          x1={pl}
          x2={W - pr}
          y1={yPos}
          y2={yPos}
          stroke="var(--line)"
          strokeWidth="1"
        />
        <text
          x={pl - 6}
          y={yPos + 4}
          textAnchor="end"
          fontSize="10"
          fill="var(--muted)"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {label}
        </text>
      </g>
    );
  }

  // Dual Bars and X-axis month abbreviations
  const barElements = months.map((m, i) => {
    const x = pl + i * bw;
    const w = Math.max(4, bw * 0.32);
    const isLast = i === months.length - 1;
    const invH = ih + pt - y(invoiced[i] || 0);
    const recH = ih + pt - y(received[i] || 0);

    const monthAbbr = new Date(m + '-01T00:00:00Z').toLocaleDateString('en-GB', {
      month: 'short',
      timeZone: 'UTC',
    });

    return (
      <g key={`month-${m}`}>
        {/* Invoiced Bar */}
        <rect
          x={x + bw * 0.16}
          y={y(invoiced[i] || 0)}
          width={w}
          height={Math.max(0, invH)}
          rx="2"
          fill="var(--line-strong)"
        >
          <title>{`${m} invoiced ${formatMoney(invoiced[i] || 0, 'USD')}`}</title>
        </rect>

        {/* Received Bar */}
        <rect
          x={x + bw * 0.16 + w + 2}
          y={y(received[i] || 0)}
          width={w}
          height={Math.max(0, recH)}
          rx="2"
          fill="var(--accent)"
          opacity={isLast ? 1 : 0.85}
        >
          <title>{`${m} received ${formatMoney(received[i] || 0, 'USD')}`}</title>
        </rect>

        {/* Month Label */}
        <text
          x={x + bw / 2}
          y={H - 8}
          textAnchor="middle"
          fontSize="10.5"
          fill="var(--muted)"
        >
          {monthAbbr}
        </text>
      </g>
    );
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Monthly invoiced and received"
      className="w-full h-auto block"
    >
      {gridElements}
      {barElements}
    </svg>
  );
};

