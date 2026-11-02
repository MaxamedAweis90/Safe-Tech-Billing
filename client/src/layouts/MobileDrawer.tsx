import React from 'react';
import { useNavStore } from '../store/useNavStore';
import { useAuthStore, ROLE_CONFIG } from '../store/useAuthStore';
import { Icon, IconName, IconX } from '../components/icons';
import { NavTab } from '../types';
import { cn } from '../utils/cn';

export const MobileDrawer: React.FC = () => {
  const { mobileDrawerOpen, setMobileDrawerOpen, activeTab, setActiveTab, navCounts } =
    useNavStore();
  const { role } = useAuthStore();
  const roleConfig = ROLE_CONFIG[role];

  if (!mobileDrawerOpen) return null;

  const navItems: { id: NavTab; label: string; icon: IconName; badge?: number; alert?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dash' },
    { id: 'quotations', label: 'Quotations', icon: 'quote', badge: navCounts.openQ },
    { id: 'invoices', label: 'Invoices', icon: 'inv', badge: navCounts.overdue, alert: true },
    { id: 'receipts', label: 'Receipts', icon: 'rec' },
    { id: 'customers', label: 'Customers', icon: 'cust' },
    { id: 'reports', label: 'Reports', icon: 'rep' },
    ...(role === 'admin'
      ? [
          { id: 'settings' as NavTab, label: 'Company & settings', icon: 'set' as IconName },
          { id: 'audit' as NavTab, label: 'Audit trail', icon: 'log' as IconName },
        ]
      : []),
    { id: 'blueprint', label: 'System blueprint', icon: 'bp' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-xs flex"
      onClick={() => setMobileDrawerOpen(false)}
    >
      <div
        className="w-64 bg-bg-surface border-r border-border-strong h-full flex flex-col p-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center font-bold text-accent text-sm">
              ST
            </div>
            <span className="font-bold text-sm text-text-primary">Safe Tech Billing</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:text-text-primary"
          >
            <IconX size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileDrawerOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors',
                  isActive
                    ? 'bg-accent/15 text-accent font-semibold border-l-2 border-accent'
                    : 'text-text-muted hover:bg-bg-subtle hover:text-text-primary'
                )}
              >
                <Icon name={item.icon} size={16} />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-bold mono',
                      item.alert
                        ? 'bg-danger text-white'
                        : 'bg-bg-subtle text-text-muted border border-border-strong'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="pt-3 border-t border-border-subtle text-xs text-text-muted">
          <div>{roleConfig.user}</div>
          <div className="text-[10px] text-accent">{roleConfig.label}</div>
        </div>
      </div>
    </div>
  );
};

