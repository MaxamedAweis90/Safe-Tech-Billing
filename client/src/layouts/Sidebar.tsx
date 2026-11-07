import React from 'react';
import { useNavStore } from '../store/useNavStore';
import { useAuthStore, getAvatarInitials } from '../store/useAuthStore';
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
  const { can, user } = useAuthStore();
  const isDemo = Boolean(user?.isDemo && (user?.email === 'demo@account.com' || user?.id === 'usr_demo_admin'));
  const { data: companyData } = useCompanySettings();
  const company = companyData?.company;

  const isCompanyConfigured = Boolean(
    company?.name && company.name.trim().length > 0 && company.name !== 'Set your business info'
  );

  // Fetch live counts from API with graceful fallback to mock data
  const { data: quotesData } = useQuotations();
  const { data: invoicesData } = useInvoices();
  const mockCounts = computeNavCounts();

  const openQ = quotesData?.quotations
    ? quotesData.quotations.filter((q) => ['draft', 'sent'].includes(q.state)).length
    : (isDemo ? mockCounts.openQ : 0);

  const overdue = invoicesData?.invoices
    ? invoicesData.invoices.filter((i) => {
        if (i.status === 'overdue') return true;
        if (i.state === 'issued' && (i.balance_milli ?? 0) > 0) {
          if (i.due && new Date(i.due) < new Date()) return true;
        }
        return false;
      }).length
    : (isDemo ? mockCounts.overdue : 0);

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

      {/* Dynamic Company Bottom Area */}
      <div
        id="sideFoot"
        style={{
          borderTop: '1px solid var(--line, #243042)',
          padding: '12px 14px',
          marginTop: 'auto',
          backgroundColor: 'var(--side-bg, #0A0F17)',
        }}
      >
        {isCompanyConfigured && company ? (
          <div
            role={can('settings') ? 'button' : undefined}
            tabIndex={can('settings') ? 0 : undefined}
            onClick={() => {
              if (can('settings')) {
                setActiveTab('settings');
                setMobileDrawerOpen(false);
                if (typeof window !== 'undefined') {
                  window.location.hash = 'company';
                }
              }
            }}
            onKeyDown={(e) => {
              if (can('settings') && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setActiveTab('settings');
                setMobileDrawerOpen(false);
                if (typeof window !== 'undefined') {
                  window.location.hash = 'company';
                }
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 8px',
              margin: '-4px -6px',
              borderRadius: '6px',
              cursor: can('settings') ? 'pointer' : 'default',
              transition: 'background-color 0.15s ease',
            }}
            className={can('settings') ? 'hover:bg-[#151C27]' : ''}
            title={can('settings') ? `Manage ${company.name} in Settings` : company.name}
          >
            {company.logo ? (
              <img
                src={company.logo}
                alt={company.name}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  objectFit: 'contain',
                  backgroundColor: '#151C27',
                  border: '1px solid #243042',
                  padding: '2px',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#18263D',
                  color: '#6E9CF0',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid #243042',
                }}
              >
                {getAvatarInitials(company.name)}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#E5EAF2',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={company.name}
              >
                {company.name}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#8A97AC',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: '1px',
                }}
                title={company.tagline || company.email || 'Active Workspace'}
              >
                {company.tagline || company.email || 'Active Workspace'}
              </div>
            </div>
          </div>
        ) : (
          <div
            role={can('settings') ? 'button' : undefined}
            tabIndex={can('settings') ? 0 : undefined}
            onClick={() => {
              if (can('settings')) {
                setActiveTab('settings');
                setMobileDrawerOpen(false);
                if (typeof window !== 'undefined') {
                  window.location.hash = 'company';
                }
              }
            }}
            onKeyDown={(e) => {
              if (can('settings') && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setActiveTab('settings');
                setMobileDrawerOpen(false);
                if (typeof window !== 'undefined') {
                  window.location.hash = 'company';
                }
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 8px',
              margin: '-4px -6px',
              borderRadius: '6px',
              cursor: can('settings') ? 'pointer' : 'default',
              transition: 'background-color 0.15s ease',
            }}
            className={can('settings') ? 'hover:bg-[#151C27]' : ''}
            title="Configure business profile in Settings"
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'rgba(227, 165, 74, 0.15)',
                color: 'var(--warn, #E3A54A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid rgba(227, 165, 74, 0.3)',
              }}
            >
              <Icon name="alert" size={16} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--warn, #E3A54A)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Set business info
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#8A97AC',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Configure in Settings
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
