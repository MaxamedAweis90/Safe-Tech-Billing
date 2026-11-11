import { create } from 'zustand';
import { NavTab } from '../types';

export function tabToPath(tab: NavTab, recordId?: string | null): string {
  if (tab === 'dashboard') return '/dashboard';
  if (tab === 'login') return '/login';
  if (tab === 'signup') return '/signup';
  if (tab === 'onboarding') return '/signup';
  if (tab === 'verify') return '/verify';
  if (tab === 'accept-invite') return '/accept-invite';
  if (tab === 'quotations') {
    if (recordId) return `/quotations/${recordId}`;
    return '/quotations';
  }
  if (tab === 'invoices') {
    if (recordId) return `/invoices/${recordId}`;
    return '/invoices';
  }
  if (tab === 'receipts') {
    if (recordId) return `/receipts/${recordId}`;
    return '/receipts';
  }
  if (tab === 'customers') {
    if (recordId) return `/customers/${recordId}`;
    return '/customers';
  }
  if (tab === 'reports') return '/reports';
  if (tab === 'settings') return '/settings';
  if (tab === 'audit') return '/audit';
  if (tab === 'trash') return '/trash';
  if (tab === 'blueprint') return '/blueprint';
  return `/${tab}`;
}

export function parsePath(pathnameStr: string): { tab: NavTab; recordId: string | null } {
  const [pathPart, queryPart] = (pathnameStr || '/dashboard').split('?');
  const clean = pathPart.replace(/^\//, '').toLowerCase();
  const segments = clean.split('/');
  const base = segments[0] || 'dashboard';
  let param = segments[1] || null;

  if (queryPart && (queryPart.includes('action=new') || queryPart.includes('new=true'))) {
    param = 'new';
  }

  if (base === 'login') return { tab: 'login', recordId: null };
  if (base === 'signup' || base === 'onboarding') return { tab: 'signup', recordId: null };
  if (base === 'verify') return { tab: 'verify', recordId: null };
  if (base === 'accept-invite') return { tab: 'accept-invite', recordId: null };

  if (base === 'dashboard') return { tab: 'dashboard', recordId: null };
  if (base === 'quotations' || base === 'quotes') return { tab: 'quotations', recordId: param };
  if (base === 'invoices') return { tab: 'invoices', recordId: param };
  if (base === 'receipts') return { tab: 'receipts', recordId: param };
  if (base === 'customers') return { tab: 'customers', recordId: param };
  if (base === 'reports') return { tab: 'reports', recordId: null };
  if (base === 'settings') return { tab: 'settings', recordId: null };
  if (base === 'audit') return { tab: 'audit', recordId: null };
  if (base === 'trash') return { tab: 'trash', recordId: null };
  if (base === 'blueprint') return { tab: 'blueprint', recordId: null };

  return { tab: 'dashboard', recordId: null };
}

// Backward compatibility alias for hash parsing
export function parseHash(hashStr: string): { tab: NavTab; recordId: string | null } {
  if (typeof window !== 'undefined' && window.location.pathname && window.location.pathname !== '/') {
    return parsePath(window.location.pathname);
  }
  const clean = hashStr.replace(/^#\/?/, '');
  return parsePath('/' + clean);
}

export function tabToHash(tab: NavTab, recordId?: string | null): string {
  return tabToPath(tab, recordId).replace(/^\//, '');
}

const getInitialRoute = (): { tab: NavTab; recordId: string | null } => {
  if (typeof window === 'undefined') return { tab: 'dashboard', recordId: null };
  // Check if hash has route
  if (window.location.hash) {
    const raw = window.location.hash.replace(/^#\/?/, '');
    if (raw) return parsePath('/' + raw);
  }
  return parsePath(window.location.pathname);
};

const initial = getInitialRoute();

interface NavState {
  activeTab: NavTab;
  selectedRecordId: string | null;
  prefillCustomerId: string | null;
  setPrefillCustomerId: (id: string | null) => void;
  setActiveTab: (tab: NavTab) => void;
  setSelectedRecord: (tab: NavTab, recordId?: string | null) => void;
  navCounts: {
    overdue: number;
    openQ: number;
  };
  setNavCounts: (counts: { overdue: number; openQ: number }) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
  toggleMobileDrawer: () => void;
}

export const useNavStore = create<NavState>((set) => ({
  activeTab: initial.tab,
  selectedRecordId: initial.recordId,
  prefillCustomerId: null,
  setPrefillCustomerId: (id) => set({ prefillCustomerId: id }),
  setActiveTab: (tab) => {
    if (typeof window !== 'undefined') {
      const targetPath = tabToPath(tab, null);
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      if (window.location.hash) {
        window.history.replaceState(null, '', targetPath);
      }
      window.scrollTo(0, 0);
    }
    set({ activeTab: tab, selectedRecordId: null, mobileDrawerOpen: false });
  },
  setSelectedRecord: (tab, recordId = null) => {
    if (typeof window !== 'undefined') {
      const targetPath = tabToPath(tab, recordId);
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      if (window.location.hash) {
        window.history.replaceState(null, '', targetPath);
      }
      window.scrollTo(0, 0);
    }
    set({ activeTab: tab, selectedRecordId: recordId, mobileDrawerOpen: false });
  },
  navCounts: {
    overdue: 2,
    openQ: 4,
  },
  setNavCounts: (counts) => set({ navCounts: counts }),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  mobileDrawerOpen: false,
  setMobileDrawerOpen: (mobileDrawerOpen) => set({ mobileDrawerOpen }),
  toggleMobileDrawer: () =>
    set((state) => ({ mobileDrawerOpen: !state.mobileDrawerOpen })),
}));

export default useNavStore;
