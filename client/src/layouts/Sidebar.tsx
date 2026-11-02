import React from 'react';
import { useNavStore } from '../store/useNavStore';
import { useAuthStore, ROLE_CONFIG } from '../store/useAuthStore';
import { Icon, IconName } from '../components/icons';
import { NavTab } from '../types';
import { cn } from '../utils/cn';

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
  const { activeTab, setActiveTab, navCounts } = useNavStore();
  const { role } = useAuthStore();
  const roleConfig = ROLE_CONFIG[role];

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
          badge: navCounts.openQ,
        },
        {
          id: 'invoices',
          label: 'Invoices',
          icon: 'inv',
          badge: navCounts.overdue,
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
        ...(role === 'admin'
          ? [
              {
                id: 'settings' as NavTab,
                label: 'Company & settings',
                icon: 'set' as IconName,
              },
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
    <aside className="w-60 bg-side-bg text-side-ink border-r border-line flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-line shrink-0">
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center font-bold text-bg-base text-lg shadow-sm shrink-0">
          <span className="text-accent font-black tracking-tighter">ST</span>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate tracking-tight">
            Safe Tech
          </div>
          <div className="text-[10.5px] uppercase tracking-wider text-side-muted font-semibold">
            Commercial Billing
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-2.5 mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-side-muted">
              {section.title}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer',
                        isActive
                          ? 'bg-side-active text-white font-semibold border-l-2 border-accent rounded-l-none'
                          : 'text-side-ink hover:bg-side-active/60 hover:text-white'
                      )}
                    >
                      <Icon
                        name={item.icon}
                        size={16}
                        className={isActive ? 'text-accent' : 'text-side-muted'}
                      />
                      <span className="truncate flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={cn(
                            'px-1.5 py-0.2 rounded-full text-[10px] font-bold mono',
                            item.alert
                              ? 'bg-bad text-white'
                              : 'bg-white/10 text-side-ink'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Session Footer */}
      <div className="p-3.5 border-t border-line bg-side-bg/60 text-xs shrink-0 text-side-muted">
        <div className="text-[11px] text-side-muted">Signed in as</div>
        <div className="font-semibold text-white truncate">
          {roleConfig.user}
        </div>
        <div className="text-[11px] text-accent truncate mt-0.5">
          {roleConfig.label}
        </div>
      </div>
    </aside>
  );
};
