import React from 'react';
import { useNavStore } from '../store/useNavStore';
import { useAuthStore, getAvatarInitials } from '../store/useAuthStore';
import { useCompanySettings } from '../hooks/useSettings';
import { useQuotations } from '../hooks/useQuotations';
import { useInvoices } from '../hooks/useInvoices';
import { computeNavCounts } from '../lib/mockData';
import { Icon, IconName, IconX } from '../components/icons';
import { NavTab } from '../types';

export const MobileDrawer: React.FC = () => {
  const { mobileDrawerOpen, setMobileDrawerOpen, activeTab, setActiveTab } =
    useNavStore();
  const { can, user } = useAuthStore();
  const isDemo = user?.isDemo === true;
  const { data: companyData } = useCompanySettings();
  const company = companyData?.company;

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

  const isCompanyConfigured = Boolean(
    company?.name && company.name.trim().length > 0 && company.name !== 'Set your business info'
  );

  if (!mobileDrawerOpen) return null;

  const navItems: { id: NavTab; label: string; icon: IconName; badge?: number; alert?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dash' },
    { id: 'quotations', label: 'Quotations', icon: 'quote', badge: openQ },
    { id: 'invoices', label: 'Invoices', icon: 'inv', badge: overdue, alert: true },
    { id: 'receipts', label: 'Receipts', icon: 'rec' },
    { id: 'customers', label: 'Customers', icon: 'cust' },
    { id: 'reports', label: 'Reports', icon: 'rep' },
    ...(can('settings')
      ? [{ id: 'settings' as NavTab, label: 'Company & settings', icon: 'set' as IconName }]
      : []),
    ...(can('audit')
      ? [{ id: 'audit' as NavTab, label: 'Audit trail', icon: 'log' as IconName }]
      : []),
    { id: 'blueprint', label: 'System blueprint', icon: 'bp' },
  ];

  const closeDrawer = () => setMobileDrawerOpen(false);

  return (
    <>
      {/* Backdrop matching prototype `#drawerBg` */}
      <div
        id="drawerBg"
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={closeDrawer}
      />

      {/* Drawer Container */}
      <div
        className="fixed top-0 left-0 bottom-0 z-[70] w-64 bg-side-bg border-r border-line flex flex-col p-4 text-side-ink shadow-2xl"
      >
        <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-none">
              <img
                src="/logo.png"
                alt="Safe Tech Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-sm text-white">Safe Tech</span>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="w-7 h-7 rounded flex items-center justify-center text-side-muted hover:text-white"
          >
            <IconX size={16} />
          </button>
        </div>

        <nav className="nav flex-1 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  closeDrawer();
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
        </nav>

        {/* Dynamic Company Bottom Area */}
        <div className="pt-3 border-t border-line mt-auto">
          {isCompanyConfigured && company ? (
            <div
              role={can('settings') ? 'button' : undefined}
              tabIndex={can('settings') ? 0 : undefined}
              className={`flex items-center gap-2.5 p-1.5 -m-1 rounded transition-colors ${
                can('settings') ? 'cursor-pointer hover:bg-[#151C27]' : ''
              }`}
              onClick={() => {
                if (can('settings')) {
                  setActiveTab('settings');
                  closeDrawer();
                  if (typeof window !== 'undefined') {
                    window.location.hash = 'company';
                  }
                }
              }}
              title={can('settings') ? `Manage ${company.name} in Settings` : company.name}
            >
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-8 h-8 rounded object-contain bg-[#151C27] border border-line p-0.5 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-[#18263D] text-[#6E9CF0] text-xs font-bold flex items-center justify-center border border-line shrink-0">
                  {getAvatarInitials(company.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate" title={company.name}>
                  {company.name}
                </div>
                <div className="text-[11px] text-side-muted truncate">
                  {company.tagline || company.email || 'Active Workspace'}
                </div>
              </div>
            </div>
          ) : (
            <div
              role={can('settings') ? 'button' : undefined}
              tabIndex={can('settings') ? 0 : undefined}
              className={`flex items-center gap-2.5 p-1.5 -m-1 rounded transition-colors ${
                can('settings') ? 'cursor-pointer hover:bg-[#151C27]' : ''
              }`}
              onClick={() => {
                if (can('settings')) {
                  setActiveTab('settings');
                  closeDrawer();
                  if (typeof window !== 'undefined') {
                    window.location.hash = 'company';
                  }
                }
              }}
              title="Configure business profile in Settings"
            >
              <div className="w-8 h-8 rounded bg-[rgba(227,165,74,0.15)] text-[var(--warn,#E3A54A)] text-xs font-bold flex items-center justify-center border border-[rgba(227,165,74,0.3)] shrink-0">
                <Icon name="alert" size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[var(--warn,#E3A54A)] truncate">
                  Set business info
                </div>
                <div className="text-[11px] text-side-muted truncate">
                  Configure in Settings
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
