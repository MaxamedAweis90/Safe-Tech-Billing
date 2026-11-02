import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';

export const SettingsView: React.FC = () => {
  const [company, setCompany] = useState({
    name: 'Safe Tech Solutions Ltd',
    tagline: 'Enterprise Safety & Telecommunications Engineering',
    address: 'Commercial Plaza, Westlands, P.O. Box 48201-00100 Nairobi',
    phone: '+254 20 234 5678',
    email: 'billing@safetech.co.ke',
    website: 'https://safetech.co.ke',
    tax_id: 'P051234567Z',
    bank_name: 'Standard Chartered Bank',
    account_number: '0102030405060',
    account_name: 'Safe Tech Solutions Ltd',
    swift_code: 'SCBLKENX',
    mobile_provider: 'Safaricom M-Pesa (Buy Goods Till)',
    mobile_number: '567890',
    default_currency: 'USD',
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Company &amp; Settings</h1>
          <p>Configure corporate identity, tax identifiers, banking details, and default currency.</p>
        </div>
        <div className="actions">
          <Button variant="primary" type="submit">
            {saved ? 'Saved Successfully!' : 'Save changes'}
          </Button>
        </div>
      </div>

      <div className="grid-2e">
        {/* Company Identity */}
        <section className="panel">
          <div className="panel-head">
            <h2>Company legal identity</h2>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label>Registered Company Name</label>
              <input
                className="inp"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Tagline / Sub-heading</label>
              <input
                className="inp"
                value={company.tagline}
                onChange={(e) => setCompany({ ...company, tagline: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Physical Address</label>
              <input
                className="inp"
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>Telephone</label>
                <input
                  className="inp"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Billing Email</label>
                <input
                  className="inp"
                  value={company.email}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                />
              </div>
            </div>

            <div className="field">
              <label>KRA PIN / Tax ID</label>
              <input
                className="inp"
                value={company.tax_id}
                onChange={(e) => setCompany({ ...company, tax_id: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* Banking Details */}
        <section className="panel">
          <div className="panel-head">
            <h2>Bank details &amp; remittance</h2>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label>Bank Name</label>
              <input
                className="inp"
                value={company.bank_name}
                onChange={(e) => setCompany({ ...company, bank_name: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Account Name</label>
              <input
                className="inp"
                value={company.account_name}
                onChange={(e) => setCompany({ ...company, account_name: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>Account Number</label>
                <input
                  className="inp"
                  value={company.account_number}
                  onChange={(e) => setCompany({ ...company, account_number: e.target.value })}
                />
              </div>
              <div className="field">
                <label>SWIFT / BIC Code</label>
                <input
                  className="inp"
                  value={company.swift_code}
                  onChange={(e) => setCompany({ ...company, swift_code: e.target.value })}
                />
              </div>
            </div>

            <div className="field">
              <label>Mobile Money Till / Paybill</label>
              <input
                className="inp"
                value={company.mobile_provider}
                onChange={(e) => setCompany({ ...company, mobile_provider: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Till / Account Number</label>
              <input
                className="inp"
                value={company.mobile_number}
                onChange={(e) => setCompany({ ...company, mobile_number: e.target.value })}
              />
            </div>

            <span className="hint" style={{ marginTop: 6 }}>
              These remittance details are automatically embedded on all A4 printable quotes &amp; invoices.
            </span>
          </div>
        </section>
      </div>
    </form>
  );
};
