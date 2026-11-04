import React from 'react';
import { useNavStore } from '../store/useNavStore';
import { useAuthStore, ROLES, getAvatarInitials } from '../store/useAuthStore';
import { computeNavCounts } from '../lib/mockData';
import { useQuotations } from '../hooks/useQuotations';
import { useInvoices } from '../hooks/useInvoices';
import { useCompanySettings } from '../hooks/useSettings';
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
  const { role, user, can } = useAuthStore();
  const roleInfo = ROLES[role] || ROLES.admin;
  const { data: companyData } = useCompanySettings();
  const company = companyData?.company;

  const userName = user?.fullName || user?.name || roleInfo.user;
  const userInitials = getAvatarInitials(userName);

  const roleBadgeConfig: Record<string, { label: string; className: string }> = {
    admin: { label: 'Admin', className: 'chip c-blue' },
    accountant: { label: 'Accountant', className: 'chip c-teal' },
    sales: { label: 'Sales Officer', className: 'chip c-purple' },
    viewer: { label: 'Viewer', className: 'chip c-muted' },
  };
  const badge = roleBadgeConfig[role] || roleBadgeConfig.viewer;

  const isCompanyConfigured = Boolean(
    company?.name && company.name.trim().length > 0 && company.name !== 'Set your business info'
  );

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
          <img
            src="/logo.png"
            alt="Safe Tech Logo"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
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

      {/* Upgraded Dynamic Bottom Identity Block */}
      <div
        id="sideFoot"
        style={{
          borderTop: '1px solid var(--line, #243042)',
          padding: '12px 14px',
          marginTop: 'auto',
          backgroundColor: 'var(--side-bg, #0A0F17)',
        }}
      >
        {/* Business Information */}
        <div style={{ marginBottom: '10px' }}>
          {isCompanyConfigured && company ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '4px',
                    objectFit: 'contain',
                    backgroundColor: '#151C27',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '4px',
                    backgroundColor: '#18263D',
                    color: '#6E9CF0',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {(company.name.slice(0, 2)).toUpperCase()}
                </div>
              )}
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: '#E5EAF2',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={company.name}
              >
                {company.name}
              </span>
            </div>
          ) : (
            <a
              href="#settings"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('settings');
              }}
              className="text-xs text-status-warn hover:underline"
              style={{
                color: 'var(--warn, #E3A54A)',
                fontSize: '11.5px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              ⚠️ Set your business info in Settings
            </a>
          )}
        </div>

        {/* User Identity Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#18263D',
              color: '#6E9CF0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              flexShrink: 0,
              border: '1px solid #243042',
            }}
          >
            {userInitials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              className="text-sm strong truncate"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#E5EAF2',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={userName}
            >
              {userName}
            </div>
            <div style={{ marginTop: '2px' }}>
              <span
                className={badge.className}
                style={{ fontSize: '10.5px', height: '18px', padding: '0 6px' }}
              >
                {badge.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
