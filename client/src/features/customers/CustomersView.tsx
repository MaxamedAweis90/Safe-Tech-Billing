import React, { useState } from 'react';
import { SkeletonBox } from 'skullet/react';
import { MOCK_CUSTOMERS, custFin } from '../../lib/mockData';
import { formatMoney } from '../../lib/formatters';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { IconPlus } from '../../components/icons';
import { CustomerProfileView } from './CustomerProfileView';
import { openCustomerModal } from './CustomerModal';
import { useCustomers } from '../../hooks/useCustomers';

type FilterType = 'all' | 'balance' | 'overdue';

export const CustomersView: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { can } = useAuthStore();
  const { selectedRecordId, setSelectedRecord } = useNavStore();

  const { data: apiData, isLoading } = useCustomers({
    q: searchQuery.trim() || undefined,
  });

  // If a specific customer is selected, render the profile view
  if (selectedRecordId) {
    return (
      <CustomerProfileView
        customerId={selectedRecordId}
        onBack={() => setSelectedRecord('customers', null)}
      />
    );
  }

  const hasLiveCustomers = Boolean(apiData?.customers);

  const rawRows = hasLiveCustomers && apiData
    ? apiData.customers.map((c: any) => ({
        c: {
          id: c._id || c.id || String(c.code),
          code: c.code,
          name: c.name,
          attn: c.attn || '',
          phone: c.phone || '',
          email: c.email || '',
          taxId: c.tax_id || '',
          address: c.address || '',
          since: c.since || '',
        },
        f: {
          invoiced: c.invoiced_milli ?? 0,
          paid: c.paid_milli ?? 0,
          credit: c.credited_milli ?? 0,
          bal: c.balance_milli ?? 0,
          overdue: Boolean(c.is_overdue),
          count: 0,
        },
      }))
    : MOCK_CUSTOMERS.map((c) => ({
        c,
        f: custFin(c.id),
      }));

  // Apply financial filter and sorting
  const rows = rawRows
    .filter((x) => {
      if (filter === 'balance') return x.f.bal > 0;
      if (filter === 'overdue') return x.f.overdue;
      return true;
    })
    .filter((x) => {
      // Local fallback filter if offline
      if (!searchQuery.trim() || hasLiveCustomers) return true;
      const q = searchQuery.toLowerCase().trim();
      const searchable = [
        x.c.name,
        x.c.phone,
        x.c.email,
        x.c.code.toString(),
        x.c.taxId || '',
      ]
        .join(' ')
        .toLowerCase();
      return searchable.includes(q);
    })
    .sort((a, b) => b.f.bal - a.f.bal || a.c.name.localeCompare(b.c.name));

  const totalCount = hasLiveCustomers && apiData?.total !== undefined ? apiData.total : MOCK_CUSTOMERS.length;

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Customers</h1>
          <p>
            {totalCount} {totalCount === 1 ? 'customer' : 'customers'}. Balances update as invoices are issued
            and paid.
          </p>
        </div>
        <div className="actions">
          {can('customers') && (
            <button
              type="button"
              className="btn primary"
              data-act="new-customer"
              onClick={() =>
                openCustomerModal(null, (rec) => {
                  setSelectedRecord('customers', rec.id);
                })
              }
            >
              <IconPlus size={15} />
              Add customer
            </button>
          )}
        </div>
      </div>

      {/* Main Panel */}
      <section className="panel">
        <div className="filters">
          <div className="seg" data-seg="customers">
            {(
              [
                ['all', 'All'],
                ['balance', 'With balance'],
                ['overdue', 'Overdue'],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                data-v={v}
                className={filter === v ? 'on' : ''}
                onClick={() => setFilter(v)}
              >
                {l}
              </button>
            ))}
          </div>

          <input
            className="inp"
            style={{ flex: 1, minWidth: 160, maxWidth: 320 }}
            placeholder="Name, phone, email, ID or TIN"
            data-listq="customers"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th className="r">Invoiced</th>
                <th className="r">Paid</th>
                <th className="r">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && !hasLiveCustomers ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-${idx}`}>
                    <td><SkeletonBox width={40} height={18} /></td>
                    <td><SkeletonBox width={160} height={18} /></td>
                    <td><SkeletonBox width={100} height={18} /></td>
                    <td><SkeletonBox width={140} height={18} /></td>
                    <td className="r"><SkeletonBox width={70} height={18} /></td>
                    <td className="r"><SkeletonBox width={70} height={18} /></td>
                    <td className="r"><SkeletonBox width={70} height={18} /></td>
                  </tr>
                ))
              ) : rows.length > 0 ? (
                rows.map(({ c, f }) => (
                  <tr
                    key={c.id}
                    className="link"
                    data-href={`#customer-${c.id}`}
                    onClick={() => setSelectedRecord('customers', c.id)}
                  >
                    <td className="mono muted">{c.code}</td>
                    <td className="strong">
                      {c.name}
                      {f.overdue && (
                        <span
                          className="chip c-overdue"
                          style={{ marginLeft: 6 }}
                        >
                          Overdue
                        </span>
                      )}
                    </td>
                    <td className="muted">{c.phone}</td>
                    <td className="muted">{c.email || '—'}</td>
                    <td className="r">{formatMoney(f.invoiced, 'USD')}</td>
                    <td className="r muted">{formatMoney(f.paid, 'USD')}</td>
                    <td
                      className="r strong"
                      style={f.overdue ? { color: 'var(--bad)' } : undefined}
                    >
                      {formatMoney(f.bal, 'USD')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">No customers match.</div>
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
