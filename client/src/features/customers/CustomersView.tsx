import React, { useState } from 'react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { IconPlus, IconEye } from '../../components/icons';
import { formatMoney } from '../../lib/formatters';

interface MockCustomer {
  _id: string;
  code: number;
  name: string;
  attn: string;
  phone: string;
  email: string;
  currency: string;
  balance_milli: number;
}

export const CustomersView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const mockCustomers: MockCustomer[] = [
    {
      _id: 'c1',
      code: 1001,
      name: 'Acme Global Ltd',
      attn: 'James Wilson',
      phone: '+254 712 345 678',
      email: 'accounts@acmeglobal.com',
      currency: 'USD',
      balance_milli: 0,
    },
    {
      _id: 'c2',
      code: 1002,
      name: 'Nairobi Water Works',
      attn: 'Eng. Peter Mwangi',
      phone: '+254 722 987 654',
      email: 'billing@nairobiwater.co.ke',
      currency: 'USD',
      balance_milli: 2850000,
    },
    {
      _id: 'c3',
      code: 1003,
      name: 'Apex Logistics Inc',
      attn: 'Grace Ochieng',
      phone: '+254 733 456 789',
      email: 'procurement@apexlogistics.com',
      currency: 'USD',
      balance_milli: 2200000,
    },
    {
      _id: 'c4',
      code: 1004,
      name: 'Zenith Holdings Ltd',
      attn: 'David Kimani',
      phone: '+254 701 112 233',
      email: 'finance@zenith.co.ke',
      currency: 'USD',
      balance_milli: 850000,
    },
  ];

  const filteredCustomers = mockCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.attn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
            Customer Accounts
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Client directory, contact details, currency & commercial balances
          </p>
        </div>
        <Button variant="primary" size="md" leftIcon={<IconPlus size={15} />}>
          New customer
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search customer name, contact, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 px-3 text-xs bg-bg-subtle border border-border-strong rounded-lg text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-subtle/50 text-text-muted font-semibold uppercase tracking-wider text-[10.5px]">
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4">Company Name</th>
                <th className="py-2.5 px-4">Attention</th>
                <th className="py-2.5 px-4">Phone / Email</th>
                <th className="py-2.5 px-4">Currency</th>
                <th className="py-2.5 px-4 text-right">Ledger Balance</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-bg-subtle/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-accent">
                      #{c.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-text-primary">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 text-text-muted">{c.attn}</td>
                    <td className="py-3 px-4 text-text-muted">
                      <div>{c.phone}</div>
                      <div className="text-[11px] text-text-faint">{c.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-text-faint">
                      {c.currency}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-semibold ${
                        c.balance_milli > 0 ? 'text-warn' : 'text-ok'
                      }`}
                    >
                      {formatMoney(c.balance_milli, c.currency)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        className="p-1 text-text-muted hover:text-accent rounded"
                        title="View Statement"
                      >
                        <IconEye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-text-muted text-xs"
                  >
                    No customers found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

