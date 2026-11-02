import React from 'react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';

interface MockAuditLog {
  id: string;
  action: string;
  resource: string;
  ref: string;
  user: string;
  role: string;
  timestamp: string;
}

export const AuditView: React.FC = () => {
  const auditLogs: MockAuditLog[] = [
    {
      id: 'a1',
      action: 'PAYMENT_RECORDED',
      resource: 'Payment',
      ref: 'RCP-2026-0002',
      user: 'Daniel K.',
      role: 'Accountant',
      timestamp: '2026-10-22 14:32:10 UTC',
    },
    {
      id: 'a2',
      action: 'INVOICE_ISSUED',
      resource: 'Invoice',
      ref: 'INV-2026-0003',
      user: 'Sarah M.',
      role: 'Administrator',
      timestamp: '2026-10-12 09:15:44 UTC',
    },
    {
      id: 'a3',
      action: 'QUOTATION_ACCEPTED',
      resource: 'Quotation',
      ref: 'QT-2026-0001',
      user: 'Amina O.',
      role: 'Sales',
      timestamp: '2026-10-15 11:42:01 UTC',
    },
    {
      id: 'a4',
      action: 'CUSTOMER_CREATED',
      resource: 'Customer',
      ref: 'Code #1004',
      user: 'Amina O.',
      role: 'Sales',
      timestamp: '2026-09-15 08:20:19 UTC',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
          Audit Trail
        </h1>
        <p className="text-xs text-text-muted mt-0.5">
          Immutable forensic log of all financial modifications and transactions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity Ledger</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-subtle/50 text-text-muted font-semibold uppercase tracking-wider text-[10.5px]">
                <th className="py-2.5 px-4">Timestamp (UTC)</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Resource</th>
                <th className="py-2.5 px-4">Reference</th>
                <th className="py-2.5 px-4">Operator</th>
                <th className="py-2.5 px-4">Role Guard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-bg-subtle/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-text-muted">{log.timestamp}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-accent">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-text-primary">{log.resource}</td>
                  <td className="py-3 px-4 font-mono text-text-muted">{log.ref}</td>
                  <td className="py-3 px-4 text-text-primary font-medium">{log.user}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-bg-subtle border border-border-strong text-[11px] text-text-muted">
                      {log.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

