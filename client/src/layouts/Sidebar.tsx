import React from 'react';
import { useNavStore } from '../store/useNavStore';
import { useAuthStore, ROLES } from '../store/useAuthStore';
import { computeNavCounts } from '../lib/mockData';
import { useQuotations } from '../hooks/useQuotations';
import { useInvoices } from '../hooks/useInvoices';
import { Icon, IconName } from '../components/icons';
import { NavTab } from '../types';

interface NavItemConfig {
  id: NavTab;
  label: string;
  icon: IconName;
  badge?: number;
  alert?: boolean;
}

interface NavSectionConfig {
  title: string;
  items: NavItemConfig[];
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, mobileDrawerOpen, setMobileDrawerOpen } = useNavStore();
  const { role, can } = useAuthStore();
  const roleInfo = ROLES[role];

  // Fetch live counts from API with graceful fallback to mock data
  const { data: quotesData } = useQuotations();
  const { data: invoicesData } = useInvoices();
  const mockCounts = computeNavCounts();

  const openQ = quotesData?.quotations
    ? quotesData.quotations.filter((q) => ['draft', 'sent'].includes(q.state)).length
    : mockCounts.openQ;

  const overdue = invoicesData?.invoices
    ? invoicesData.invoices.filter((i) => {
        if (i.status === 'overdue') return true;
        if (i.state === 'issued' && (i.balance_milli ?? 0) > 0) {
          if (i.due && new Date(i.due) < new Date()) return true;
        }
        return false;
      }).length
    : mockCounts.overdue;

  const sections: NavSectionConfig[] = [
    {
      title: 'Overview',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: 'dash' }],
    },
    {
      title: 'Documents',
      items: [
        {
          id: 'quotations',
          label: 'Quotations',
          icon: 'quote',
          badge: openQ,
        },
        {
          id: 'invoices',
          label: 'Invoices',
          icon: 'inv',
          badge: overdue,
          alert: true,
        },
        { id: 'receipts', label: 'Receipts', icon: 'rec' },
      ],
    },
    {
      title: 'Records',
      items: [
        { id: 'customers', label: 'Customers', icon: 'cust' },
        { id: 'reports', label: 'Reports', icon: 'rep' },
      ],
    },
    {
      title: 'System',
      items: [
        ...(can('settings')
          ? [
              {
                id: 'settings' as NavTab,
                label: 'Company & settings',
                icon: 'set' as IconName,
              },
            ]
          : []),
        ...(can('audit')
          ? [
              {
                id: 'audit' as NavTab,
                label: 'Audit trail',
                icon: 'log' as IconName,
              },
            ]
          : []),
        { id: 'blueprint', label: 'System blueprint', icon: 'bp' },
      ],
    },
  ];

  return (
    <aside id="side" className={`side ${mobileDrawerOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="brand">
        <div className="brand-mark">
          <span style={{ color: '#1f3864', fontWeight: 800, fontSize: 16 }}>ST</span>
        </div>
        <div>
          <b>Safe Tech</b>
          <span>Billing</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav id="nav" className="nav" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sections.map((section) => (
          <div key={section.title}>
            <div className="nav-label">{section.title}</div>
            {section.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileDrawerOpen(false);
                  }}
                  className={isActive ? 'on' : ''}
                >
                  <Icon name={item.icon} size={17} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`count ${item.alert ? 'alert' : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Session Footer */}
      <div id="sideFoot" className="side-foot">
        Signed in as <b style={{ color: 'var(--side-ink)' }}>{roleInfo.user}</b>
        <br />
        {roleInfo.label}
      </div>
    </aside>
  );
};
