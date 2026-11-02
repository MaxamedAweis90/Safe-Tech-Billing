import React from 'react';
import { IconCheck, IconFileText, IconAlertTriangle } from './components/icons';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-6 md:p-12">
      <header className="max-w-6xl mx-auto mb-10 pb-6 border-b border-border-subtle flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-bg-surface border border-border-strong flex items-center justify-center text-accent">
              <IconFileText size={22} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Safe Tech Billing
            </h1>
          </div>
          <p className="text-text-muted text-sm mt-1">
            Enterprise Invoicing & Commercial Ledger System
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ok-soft text-ok border border-ok/30 text-xs font-medium">
          <IconCheck size={14} />
          <span>System Online</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {/* Metric Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-bg-surface border border-border-strong rounded-xl p-5 shadow-sm">
            <div className="text-text-muted text-xs font-medium uppercase tracking-wider">
              Total Invoiced
            </div>
            <div className="mt-2 text-2xl font-bold num text-text-primary">
              $14,520.00
            </div>
            <div className="mt-1 text-xs text-text-muted flex items-center gap-1">
              <span className="text-accent">+12.5%</span> this month
            </div>
          </div>

          <div className="bg-bg-surface border border-border-strong rounded-xl p-5 shadow-sm">
            <div className="text-text-muted text-xs font-medium uppercase tracking-wider">
              Total Settled
            </div>
            <div className="mt-2 text-2xl font-bold num text-accent">
              $11,200.00
            </div>
            <div className="mt-1 text-xs text-text-muted">
              88.4% collection rate
            </div>
          </div>

          <div className="bg-bg-surface border border-border-strong rounded-xl p-5 shadow-sm">
            <div className="text-text-muted text-xs font-medium uppercase tracking-wider">
              Outstanding Balance
            </div>
            <div className="mt-2 text-2xl font-bold num text-warn">
              $3,320.00
            </div>
            <div className="mt-1 text-xs text-warn flex items-center gap-1">
              Pending client clearance
            </div>
          </div>

          <div className="bg-bg-surface border border-border-strong rounded-xl p-5 shadow-sm">
            <div className="text-text-muted text-xs font-medium uppercase tracking-wider">
              Overdue Amount
            </div>
            <div className="mt-2 text-2xl font-bold num text-danger">
              $850.00
            </div>
            <div className="mt-1 text-xs text-danger flex items-center gap-1">
              <IconAlertTriangle size={12} />
              <span>2 invoices overdue</span>
            </div>
          </div>
        </section>

        {/* Design System Token Verification Canvas */}
        <section className="bg-bg-surface border border-border-strong rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <span>Palette Tokens & Theme Verification</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-bg-base border border-border-strong">
              <div className="font-semibold text-text-primary">bg-base</div>
              <div className="text-text-muted mono text-[10px] mt-1">#000100</div>
            </div>
            <div className="p-3 rounded-lg bg-bg-surface border border-border-strong">
              <div className="font-semibold text-text-primary">bg-surface</div>
              <div className="text-text-muted mono text-[10px] mt-1">#111C15</div>
            </div>
            <div className="p-3 rounded-lg bg-bg-subtle border border-border-strong">
              <div className="font-semibold text-text-primary">bg-subtle</div>
              <div className="text-text-muted mono text-[10px] mt-1">#0C1610</div>
            </div>
            <div className="p-3 rounded-lg bg-accent text-bg-base font-bold">
              <div>accent</div>
              <div className="mono text-[10px] mt-1">#1fbf55</div>
            </div>
            <div className="p-3 rounded-lg bg-accent-hover text-bg-base font-bold">
              <div>accent-hover</div>
              <div className="mono text-[10px] mt-1">#199e46</div>
            </div>
            <div className="p-3 rounded-lg bg-ok-soft text-ok border border-ok/30 font-semibold">
              <div>ok-soft</div>
              <div className="mono text-[10px] mt-1">#13291d</div>
            </div>
            <div className="p-3 rounded-lg bg-warn-soft text-warn border border-warn/30 font-semibold">
              <div>warn-soft</div>
              <div className="mono text-[10px] mt-1">#2c2112</div>
            </div>
            <div className="p-3 rounded-lg bg-danger-soft text-danger border border-danger/30 font-semibold">
              <div>danger-soft</div>
              <div className="mono text-[10px] mt-1">#2e1614</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;

