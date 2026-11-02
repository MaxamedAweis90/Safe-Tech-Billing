import React from 'react';

export const BlueprintView: React.FC = () => {
  const layers = [
    {
      title: 'Database & Models',
      desc: 'MongoDB + Mongoose with 12 schemas and integer thousandths precision.',
    },
    {
      title: 'Arithmetic Engine',
      desc: 'Quantized roundToCents with zero floating-point accumulation errors.',
    },
    {
      title: 'REST API & RBAC',
      desc: 'Express 5 + Zod middleware guarding Admin, Accountant, Sales, and Viewer.',
    },
    {
      title: 'Client Architecture',
      desc: 'Vite React TypeScript + TanStack Query + Zustand with strict dark theme.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>System Blueprint</h1>
          <p>Technical architecture, database schema invariants, and arithmetic specifications.</p>
        </div>
      </div>

      <div className="grid-2e">
        {/* Layer Stack */}
        <section className="panel">
          <div className="panel-head">
            <h2>Architecture layers</h2>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {layers.map((layer) => (
              <div
                key={layer.title}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  background: 'var(--surface-2)',
                }}
              >
                <b style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
                  {layer.title}
                </b>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {layer.desc}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* RBAC Matrix */}
        <section className="panel">
          <div className="panel-head">
            <h2>Role-based access matrix</h2>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Permitted domains</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="strong">Administrator</td>
                  <td className="muted">Full system read/write, Settings, User administration, Audit trail</td>
                </tr>
                <tr>
                  <td className="strong">Accountant</td>
                  <td className="muted">Invoices, Receipts, Payments, Credit Notes, Financial Reports</td>
                </tr>
                <tr>
                  <td className="strong">Sales Rep</td>
                  <td className="muted">Quotations, Customer Accounts, Read-only Invoices</td>
                </tr>
                <tr>
                  <td className="strong">Viewer</td>
                  <td className="muted">Read-only view across all modules (Auditor)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
