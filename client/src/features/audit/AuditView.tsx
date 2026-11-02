import React from 'react';

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
      ref: 'QT-2026-0104',
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
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Audit Trail</h1>
          <p>Immutable log of all financial modifications, status changes, and operator actions.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Forensic activity log</h2>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Reference</th>
                <th>Operator</th>
                <th>Role guard</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="muted mono">{log.timestamp}</td>
                  <td className="mono font-semibold" style={{ color: 'var(--accent)' }}>
                    {log.action}
                  </td>
                  <td>{log.resource}</td>
                  <td className="mono muted">{log.ref}</td>
                  <td className="strong">{log.user}</td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: 'var(--surface-2)',
                        border: '1px solid var(--line)',
                        fontSize: 11.5,
                        color: 'var(--muted)',
                      }}
                    >
                      {log.role}
                    </span>
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
