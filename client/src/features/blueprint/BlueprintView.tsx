import React from 'react';
import { SchemaCodeBlock } from './SchemaCodeBlock';
import { ApiDirectoryTable } from './ApiDirectoryTable';
import { useNavStore } from '../../store/useNavStore';

export const BlueprintView: React.FC = () => {
  const { setSelectedRecord } = useNavStore();

  const handleOpenQuote = (e: React.MouseEvent, quoteId: string) => {
    e.preventDefault();
    setSelectedRecord('quotations', quoteId);
  };

  const handleOpenInvoice = (e: React.MouseEvent, invoiceId: string) => {
    e.preventDefault();
    setSelectedRecord('invoices', invoiceId);
  };

  const rbacMatrix = [
    {
      capability: 'Quotations & customers',
      admin: 'Full',
      accountant: 'View',
      sales: 'Full',
      viewer: 'View',
    },
    {
      capability: 'Invoices & credit notes',
      admin: 'Full',
      accountant: 'Full',
      sales: 'View',
      viewer: 'View',
    },
    {
      capability: 'Payments & receipts',
      admin: 'Full',
      accountant: 'Full',
      sales: 'View',
      viewer: 'View',
    },
    {
      capability: 'Reports',
      admin: 'Full',
      accountant: 'Full',
      sales: 'View',
      viewer: 'View',
    },
    {
      capability: 'Company settings, users',
      admin: 'Full',
      accountant: '—',
      sales: '—',
      viewer: '—',
    },
    {
      capability: 'Audit trail',
      admin: 'Full',
      accountant: '—',
      sales: '—',
      viewer: '—',
    },
  ];

  const architectureLayers = [
    {
      name: 'Web client',
      desc: 'React + TypeScript, Tailwind, TanStack Query, React Hook Form + Zod. Routes per module.',
    },
    {
      name: 'API',
      desc: 'FastAPI (Python 3.12) / Node.js Express, Pydantic/Zod schemas, OpenAPI docs at /docs, JWT access + refresh cookies.',
    },
    {
      name: 'Domain services',
      desc: 'QuotationService, InvoiceService, PaymentService, NumberingService, AuditService. Decimal-only money.',
    },
    {
      name: 'Database',
      desc: 'PostgreSQL 16 / MongoDB Atlas, NUMERIC(14,3) money, row-level locks for numbering, nightly pg_dump to object storage.',
    },
    {
      name: 'Documents',
      desc: 'Jinja2 HTML templates rendered to A4 PDF with WeasyPrint; the same templates as this preview.',
    },
    {
      name: 'Delivery',
      desc: 'Docker Compose: api, web (nginx), db, worker for email and PDFs; Caddy for automatic HTTPS.',
    },
  ];

  return (
    <>
      {/* Page Header matching prototype line 968 */}
      <div className="page-head">
        <div>
          <h1>System blueprint</h1>
          <p>
            Architecture, data model, API and build plan behind this prototype.
          </p>
        </div>
      </div>

      {/* 1. Core Workflow Section matching prototype lines 969-970 */}
      <section className="panel bp">
        <div className="panel-head">
          <h2>Core workflow</h2>
        </div>
        <div
          className="panel-body"
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div className="flow">
            <span>Quotation</span>
            <em>→</em>
            <span>Accepted</span>
            <em>→</em>
            <span>Draft invoice</span>
            <em>→</em>
            <span>Issued &amp; locked</span>
            <em>→</em>
            <span>Payment</span>
            <em>→</em>
            <span>Receipt</span>
          </div>
          <ul>
            <li>
              Quotations are editable only as drafts; once sent they are revised
              by duplicating.
            </li>
            <li>
              Converting copies customer, items, discounts and tax snapshots into
              a draft invoice and links both records, so it can only happen
              once.
            </li>
            <li>
              Invoice numbers are assigned at issue time from a locked database
              sequence, which keeps them sequential with no gaps from abandoned
              drafts.
            </li>
            <li>
              A payment and its receipt are written in one database transaction.
              A unique constraint on payment_id in receipts and a unique (method,
              reference) index prevent duplicate receipts.
            </li>
            <li>
              Payments above the outstanding balance are rejected; corrections
              use credit notes. Issued documents are never updated in place.
            </li>
          </ul>
        </div>
      </section>

      {/* 2. Architecture Topology Grid matching prototype lines 971-978 */}
      <section className="panel bp">
        <div className="panel-head">
          <h2>Architecture</h2>
        </div>
        <div className="panel-body">
          <div className="arch">
            {architectureLayers.map((layer) => (
              <div key={layer.name} className="layer">
                <b>{layer.name}</b>
                <span>{layer.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Database Schema Section matching prototype lines 979-1002 */}
      <section className="panel bp">
        <div className="panel-head">
          <h2>Database schema</h2>
          <span className="sub">PostgreSQL</span>
        </div>
        <div className="panel-body">
          <SchemaCodeBlock />
        </div>
      </section>

      {/* 4. REST API Endpoint Directory matching prototype line 1003 */}
      <section className="panel bp">
        <div className="panel-head">
          <h2>REST API</h2>
          <span className="sub">/api/v1, JSON, role checked per route</span>
        </div>
        <ApiDirectoryTable />
      </section>

      {/* 5. Roles & Permissions RBAC Matrix matching prototype line 1004 */}
      <section className="panel bp">
        <div className="panel-head">
          <h2>Roles &amp; permissions</h2>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Capability</th>
                <th>Administrator</th>
                <th>Accountant</th>
                <th>Sales Officer</th>
                <th>Viewer</th>
              </tr>
            </thead>
            <tbody>
              {rbacMatrix.map((row, idx) => (
                <tr key={idx}>
                  <td className="strong">{row.capability}</td>
                  <td className="muted">{row.admin}</td>
                  <td className="muted">{row.accountant}</td>
                  <td className="muted">{row.sales}</td>
                  <td className="muted">{row.viewer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          className="panel-body"
          style={{
            paddingTop: 12,
            fontSize: '12.5px',
            color: 'var(--muted)',
          }}
        >
          Switch roles from the top bar to see these limits applied in the
          prototype.
        </div>
      </section>

      {/* 6. Implementation Plan matching prototype lines 1005-1014 */}
      <section className="panel bp">
        <div className="panel-head">
          <h2>Implementation plan</h2>
        </div>
        <div className="panel-body">
          <ol
            style={{
              margin: 0,
              paddingLeft: 18,
              color: 'var(--muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              maxWidth: '80ch',
            }}
          >
            <li>
              <b style={{ color: 'var(--ink)' }}>Frontend prototype</b> (this
              page): validate screens, workflow and document layouts with Safe
              Tech staff.
            </li>
            <li>
              <b style={{ color: 'var(--ink)' }}>Foundation</b>: repo, Docker
              Compose, PostgreSQL migrations (Alembic), auth with argon2id
              hashing, roles, audit middleware.
            </li>
            <li>
              <b style={{ color: 'var(--ink)' }}>Customers &amp; settings</b>:
              CRUD, company profile, uploads, currencies, tax rates, numbering
              sequences.
            </li>
            <li>
              <b style={{ color: 'var(--ink)' }}>Quotations</b>: draft lifecycle,
              totals in Decimal, PDF template, email sending through a worker.
            </li>
            <li>
              <b style={{ color: 'var(--ink)' }}>Invoices</b>: conversion, issue
              locking, credit notes, cancellation, overdue job that runs daily.
            </li>
            <li>
              <b style={{ color: 'var(--ink)' }}>Payments &amp; receipts</b>:
              transactional recording, idempotency keys, receipt PDFs.
            </li>
            <li>
              <b style={{ color: 'var(--ink)' }}>Dashboard &amp; reports</b>: SQL
              views for aging and revenue; CSV, .xlsx (openpyxl) and PDF export.
            </li>
            <li>
              <b style={{ color: 'var(--ink)' }}>Hardening</b>: rate limits,
              CSRF, backups with restore drills, unit tests on money and status
              rules, Playwright end-to-end tests.
            </li>
          </ol>
        </div>
      </section>

      {/* 7. Testing This Prototype Walkthrough matching prototype lines 1015-1021 */}
      <section className="panel bp">
        <div className="panel-head">
          <h2>Testing this prototype</h2>
        </div>
        <div className="panel-body">
          <ol
            style={{
              margin: 0,
              paddingLeft: 18,
              color: 'var(--muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <li>
              Open quotation{' '}
              <a
                href="#quote-q9"
                onClick={(e) => handleOpenQuote(e, 'q9')}
              >
                QT-2026-0009
              </a>{' '}
              (accepted) and choose Convert to invoice, then Issue invoice.
            </li>
            <li>
              On the new invoice, choose Record payment and enter less than the
              balance. A receipt is issued and the status becomes Partially paid.
            </li>
            <li>
              Try paying more than the balance, or reusing reference
              EVC-77219005. Both are refused.
            </li>
            <li>
              Switch role to Sales Officer and open an invoice: payment and
              credit actions disappear.
            </li>
            <li>
              Open invoice{' '}
              <a
                href="#invoice-i10456"
                onClick={(e) => handleOpenInvoice(e, 'i10456')}
              >
                10456
              </a>{' '}
              to see the original Safe Tech invoice rebuilt in the new template.
            </li>
          </ol>
        </div>
      </section>
    </>
  );
};
