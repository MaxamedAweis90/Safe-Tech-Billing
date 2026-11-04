import React from 'react';

export const SCHEMA_DEFINITION = `companies(id, name, tagline, address, phone, email, website, tin, bank_name, account_name,
          account_no, mobile_money, logo_url, stamp_url, signature_url, default_currency)
users(id, company_id→companies, name, email UNIQUE, password_hash /* argon2id */, role, active)
customers(id, company_id, code UNIQUE, name, attn, phone, email, address, tin, created_at)
tax_rates(id, company_id, name, rate NUMERIC(5,2))
currencies(code PK, symbol, decimals, rate_per_usd NUMERIC(12,4))
number_sequences(company_id, doc_type, format, next_value)  -- SELECT … FOR UPDATE
quotations(id, number UNIQUE, customer_id→customers, issue_date, valid_until, currency,
           status CHECK (draft|sent|accepted|rejected|expired), terms, invoice_id→invoices NULL,
           subtotal, discount_total, tax_total, total, created_by→users)
invoices(id, number UNIQUE NULL /* set on issue */, customer_id, quotation_id UNIQUE NULL,
         issue_date, due_date, terms_days, currency, state CHECK (draft|issued|cancelled),
         sent_at, cancelled_at, cancel_reason, subtotal, discount_total, tax_total, total)
document_items(id, document_type, document_id, position, description, qty NUMERIC(12,3),
               unit_price NUMERIC(14,3), discount_pct NUMERIC(5,2), tax_name, tax_rate NUMERIC(5,2),
               line_total NUMERIC(14,2))
payments(id, invoice_id→invoices, paid_on, amount NUMERIC(14,2) CHECK (amount > 0), method,
         reference, recorded_by, UNIQUE(method, reference))
receipts(id, number UNIQUE, payment_id→payments UNIQUE, invoice_id, customer_id, amount,
         balance_after, issued_at)
credit_notes(id, number UNIQUE, invoice_id→invoices, amount, reason, issued_on, issued_by)
audit_log(id BIGSERIAL, at, user_id, action, entity_type, entity_id, before JSONB, after JSONB, ip)
          -- INSERT only: UPDATE/DELETE revoked from the app role`;

export const SchemaCodeBlock: React.FC = () => {
  return (
    <div className="code" tabIndex={0} role="region" aria-label="PostgreSQL Database Schema">
      {SCHEMA_DEFINITION}
    </div>
  );
};

