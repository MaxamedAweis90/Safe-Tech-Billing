import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const BlueprintView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
          System Blueprint & Architecture
        </h1>
        <p className="text-xs text-text-muted mt-0.5">
          Technical specifications, arithmetic engine rules and domain schema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financial Arithmetic Engine */}
        <Card>
          <CardHeader>
            <CardTitle>Decimal Arithmetic Engine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs leading-relaxed text-text-muted">
            <p>
              <strong className="text-text-primary">Integer Thousandths Storage:</strong> All monetary
              figures in Safe Tech Billing are strictly stored as integer thousandths of a unit
              (e.g., $15.50 is stored as <code>15500</code>).
            </p>
            <p>
              <strong className="text-text-primary">Round-to-Cent Rules:</strong> Half-up intermediate
              calculations are quantized using <code>Math.round(milli / 10) * 10</code> to eliminate
              IEEE 754 floating point precision drift.
            </p>
            <p>
              <strong className="text-text-primary">Immutable History:</strong> Invoices, once issued,
              lock their line items and customer address snapshots to guarantee statutory integrity.
            </p>
          </CardContent>
        </Card>

        {/* RBAC Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Role-Based Access Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs leading-relaxed text-text-muted">
            <div className="flex justify-between py-1.5 border-b border-border-subtle">
              <span className="font-semibold text-text-primary">Administrator</span>
              <span>Full read/write access + Settings & Audit log</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border-subtle">
              <span className="font-semibold text-text-primary">Accountant</span>
              <span>Invoices, Payments, Receipts, Credit Notes & Reports</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border-subtle">
              <span className="font-semibold text-text-primary">Sales Rep</span>
              <span>Quotations, Customer Accounts & Read Invoices</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="font-semibold text-text-primary">Viewer</span>
              <span>Read-only inspection across all modules</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

