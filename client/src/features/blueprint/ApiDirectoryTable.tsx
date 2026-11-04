import React from 'react';

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/dashboard/summary',
    summary: 'KPI totals, monthly revenue, recent activity',
  },
  {
    method: 'GET',
    path: '/api/v1/customers?q=&has_balance=',
    summary: 'Search and filter customers',
  },
  {
    method: 'POST',
    path: '/api/v1/customers',
    summary: 'Register a customer',
  },
  {
    method: 'GET',
    path: '/api/v1/customers/{id}/statement',
    summary: 'Transaction history and balances',
  },
  {
    method: 'GET',
    path: '/api/v1/quotations?status=',
    summary: 'List quotations',
  },
  {
    method: 'POST',
    path: '/api/v1/quotations',
    summary: 'Create a draft (number assigned)',
  },
  {
    method: 'PATCH',
    path: '/api/v1/quotations/{id}',
    summary: 'Edit a draft only (409 otherwise)',
  },
  {
    method: 'POST',
    path: '/api/v1/quotations/{id}/send',
    summary: 'Draft → Sent, emails PDF',
  },
  {
    method: 'POST',
    path: '/api/v1/quotations/{id}/accept',
    summary: 'Sent → Accepted',
  },
  {
    method: 'POST',
    path: '/api/v1/quotations/{id}/convert',
    summary: 'Accepted → draft invoice (idempotent)',
  },
  {
    method: 'POST',
    path: '/api/v1/invoices',
    summary: 'Create a draft invoice',
  },
  {
    method: 'POST',
    path: '/api/v1/invoices/{id}/issue',
    summary: 'Lock and assign the next sequential number',
  },
  {
    method: 'POST',
    path: '/api/v1/invoices/{id}/cancel',
    summary: 'Cancel with reason (no payments allowed)',
  },
  {
    method: 'POST',
    path: '/api/v1/invoices/{id}/credit-notes',
    summary: 'Issue a credit note ≤ balance',
  },
  {
    method: 'POST',
    path: '/api/v1/invoices/{id}/payments',
    summary:
      'Record payment + receipt in one transaction; Idempotency-Key header',
  },
  {
    method: 'GET',
    path: '/api/v1/receipts/{id}',
    summary: 'Receipt with payment and balance snapshot',
  },
  {
    method: 'GET',
    path: '/api/v1/documents/{type}/{id}.pdf',
    summary: 'Server-rendered A4 PDF',
  },
  {
    method: 'GET',
    path: '/api/v1/reports/{name}?from=&to=&customer=&format=json|csv|xlsx|pdf',
    summary: 'Revenue, aging, payments, conversion',
  },
  {
    method: 'GET',
    path: '/api/v1/audit-log',
    summary: 'Append-only audit entries (admin)',
  },
];

export const ApiDirectoryTable: React.FC = () => {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: 70 }}>Method</th>
            <th>Route Path</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {API_ENDPOINTS.map((ep, idx) => {
            const methodClass = `method m-${ep.method.toLowerCase()}`;
            return (
              <tr key={idx}>
                <td style={{ width: 70 }}>
                  <span className={methodClass}>{ep.method}</span>
                </td>
                <td className="mono" style={{ wordBreak: 'break-all' }}>
                  {ep.path}
                </td>
                <td className="muted">{ep.summary}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

