import React from 'react';
import { useNavStore } from '../store/useNavStore';
import { useAuthStore, ROLE_CONFIG } from '../store/useAuthStore';
import { UserRole } from '../types';
import { IconSearch } from '../components/icons';

export const Header: React.FC = () => {
  const { searchQuery, setSearchQuery, toggleMobileDrawer } = useNavStore();
  const { role, setRole, user } = useAuthStore();

  const userInitials = (user?.name || 'SM')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-14 bg-bg-surface/90 backdrop-blur-md border-b border-border-strong px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          type="button"
          onClick={toggleMobileDrawer}
          className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle"
          aria-label="Open navigation drawer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="relative w-full">
          <IconSearch
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search quotations, invoices, customers... (Press /)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-bg-subtle border border-border-strong rounded-lg text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>
      </div>

      {/* Right: Role Switcher & Profile Avatar */}
      <div className="flex items-center gap-3">
        {/* Role Switcher (matching prototype interactiveness) */}
        <div className="flex items-center gap-2">
          <label htmlFor="role-select" className="hidden sm:inline text-xs text-text-faint">
            Role:
          </label>
          <select
            id="role-select"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="h-8 px-2.5 text-xs bg-bg-subtle border border-border-strong rounded-lg text-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="admin">Admin</option>
            <option value="accountant">Accountant</option>
            <option value="sales">Sales</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        {/* System Online Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ok-soft border border-ok/30 text-ok text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />
          <span>System Online</span>
        </div>

        {/* Profile Avatar */}
        <div
          className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 text-accent flex items-center justify-center font-bold text-xs select-none"
          title={`Signed in as ${ROLE_CONFIG[role].user}`}
        >
          {userInitials}
        </div>
      </div>
    </header>
  );
};

