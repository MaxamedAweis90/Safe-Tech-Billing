import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { IconPlus } from '../../components/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { formatMoney } from '../../lib/formatters';

interface MockCustomer {
  _id: string;
  code: number;
  name: string;
  attn: string;
  phone: string;
  email: string;
  currency: string;
  invoiced_milli: number;
  balance_milli: number;
}

export const CustomersView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { can } = useAuthStore();

  const mockCustomers: MockCustomer[] = [
    {
      _id: 'c1',
      code: 1001,
      name: 'Acme Global Ltd',
      attn: 'James Wilson',
      phone: '+254 712 345 678',
      email: 'accounts@acmeglobal.com',
      currency: 'USD',
      invoiced_milli: 12500000,
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
      invoiced_milli: 4850000,
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
      invoiced_milli: 2200000,
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
      invoiced_milli: 850000,
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
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Customers</h1>
          <p>Manage customer accounts, currency settings, and commercial ledger balances.</p>
        </div>
        <div className="actions">
          {can('customers') && (
            <Button variant="primary" leftIcon={<IconPlus size={15} />}>
              New customer
            </Button>
          )}
        </div>
      </div>

      {/* Main Panel */}
      <section className="panel">
        <div className="filters">
          <input
            className="inp"
            style={{ width: '100%', maxWidth: 320 }}
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span
            className="num"
            style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 13 }}
          >
            {mockCustomers.length} customers on file
          </span>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Code</th>
                <th>Customer</th>
                <th>Attention</th>
                <th>Contact</th>
                <th>Currency</th>
                <th className="r">Invoiced</th>
                <th className="r">Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => (
                  <tr key={c._id} className="link">
                    <td className="mono strong" style={{ color: 'var(--accent)' }}>
                      #{c.code}
                    </td>
                    <td className="strong">{c.name}</td>
                    <td className="muted">{c.attn}</td>
                    <td className="muted">
                      {c.phone} · {c.email}
                    </td>
                    <td className="mono">{c.currency}</td>
                    <td className="r font-mono">
                      {formatMoney(c.invoiced_milli, c.currency)}
                    </td>
                    <td
                      className="r strong font-mono"
                      style={{
                        color: c.balance_milli > 0 ? 'var(--warn)' : 'var(--ok)',
                      }}
                    >
                      {formatMoney(c.balance_milli, c.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">No customers found matching search criteria.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};
