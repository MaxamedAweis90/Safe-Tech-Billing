import React from 'react';
import { useNavStore } from '../store/useNavStore';
import { useAuthStore, ROLES } from '../store/useAuthStore';
import { computeNavCounts } from '../lib/mockData';
import { Icon, IconName, IconX } from '../components/icons';
import { NavTab } from '../types';

export const MobileDrawer: React.FC = () => {
  const { mobileDrawerOpen, setMobileDrawerOpen, activeTab, setActiveTab } =
    useNavStore();
  const { role, can } = useAuthStore();
  const roleInfo = ROLES[role];
  const { openQ, overdue } = computeNavCounts();

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

        <div className="pt-3 border-t border-line text-xs text-side-muted mt-auto">
          <div>{roleInfo.user}</div>
          <div style={{ color: 'var(--accent)', fontSize: 11 }}>{roleInfo.label}</div>
        </div>
      </div>
    </>
  );
};
