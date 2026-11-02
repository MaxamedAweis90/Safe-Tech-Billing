import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
            Company & System Settings
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Configure enterprise identity, tax identifiers, and banking details
          </p>
        </div>
        <Button variant="primary" type="submit">
          {saved ? 'Saved Successfully!' : 'Save changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Identity */}
        <Card>
          <CardHeader>
            <CardTitle>Company Legal Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Registered Company Name"
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
            />
            <Input
              label="Tagline / Sub-heading"
              value={company.tagline}
              onChange={(e) => setCompany({ ...company, tagline: e.target.value })}
            />
            <Input
              label="Physical Address"
              value={company.address}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Telephone"
                value={company.phone}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
              />
              <Input
                label="Billing Email"
                value={company.email}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
              />
            </div>
            <Input
              label="KRA PIN / Tax ID"
              value={company.tax_id}
              onChange={(e) => setCompany({ ...company, tax_id: e.target.value })}
            />
          </CardContent>
        </Card>

        {/* Banking & Settlement Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Details & Remittance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Bank Name"
              value={company.bank_name}
              onChange={(e) => setCompany({ ...company, bank_name: e.target.value })}
            />
            <Input
              label="Account Name"
              value={company.account_name}
              onChange={(e) => setCompany({ ...company, account_name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Account Number"
                value={company.account_number}
                onChange={(e) => setCompany({ ...company, account_number: e.target.value })}
              />
              <Input
                label="SWIFT / BIC Code"
                value={company.swift_code}
                onChange={(e) => setCompany({ ...company, swift_code: e.target.value })}
              />
            </div>
            <Input
              label="Mobile Money Till / Paybill"
              value={company.mobile_provider}
              onChange={(e) => setCompany({ ...company, mobile_provider: e.target.value })}
            />
            <Input
              label="Till / Account Number"
              value={company.mobile_number}
              onChange={(e) => setCompany({ ...company, mobile_number: e.target.value })}
            />
          </CardContent>
          <CardFooter>
            <span className="text-xs text-text-faint">
              These details are printed on all generated PDF invoices & quotations.
            </span>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
};

