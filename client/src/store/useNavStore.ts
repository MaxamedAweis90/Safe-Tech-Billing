import { create } from 'zustand';
import { NavTab } from '../types';

export function tabToHash(tab: NavTab, recordId?: string | null): string {
  if (tab === 'dashboard') return 'dashboard';
  if (tab === 'quotations') {
    if (recordId === 'new') return 'quote-new';
    if (recordId) return `quote-${recordId}`;
    return 'quotes';
  }
  if (tab === 'invoices') {
    if (recordId === 'new') return 'invoice-new';
    if (recordId) return `invoice-${recordId}`;
    return 'invoices';
  }
  if (tab === 'receipts') {
    if (recordId) return `receipt-${recordId}`;
    return 'receipts';
  }
  if (tab === 'customers') {
    if (recordId) return `customer-${recordId}`;
    return 'customers';
  }
  return tab;
}

export function parseHash(hashStr: string): { tab: NavTab; recordId: string | null } {
  const h = hashStr.replace(/^#/, '') || 'dashboard';
  let m: RegExpMatchArray | null;

  if (h === 'dashboard') return { tab: 'dashboard', recordId: null };
  if (h === 'quotes') return { tab: 'quotations', recordId: null };
  if (h === 'quote-new') return { tab: 'quotations', recordId: 'new' };
  if ((m = h.match(/^quote-([\w-]+)$/))) return { tab: 'quotations', recordId: m[1] };
  if (h === 'invoices') return { tab: 'invoices', recordId: null };
  if (h === 'invoice-new') return { tab: 'invoices', recordId: 'new' };
  if ((m = h.match(/^invoice-([\w-]+)$/))) return { tab: 'invoices', recordId: m[1] };
  if (h === 'receipts') return { tab: 'receipts', recordId: null };
  if ((m = h.match(/^receipt-([\w-]+)$/))) return { tab: 'receipts', recordId: m[1] };
  if (h === 'customers') return { tab: 'customers', recordId: null };
  if ((m = h.match(/^customer-([\w-]+)$/))) return { tab: 'customers', recordId: m[1] };
  if (h === 'reports') return { tab: 'reports', recordId: null };
  if (h === 'settings') return { tab: 'settings', recordId: null };
  if (h === 'audit') return { tab: 'audit', recordId: null };
  if (h === 'blueprint') return { tab: 'blueprint', recordId: null };

  return { tab: 'dashboard', recordId: null };
}

const initial = typeof window !== 'undefined' ? parseHash(window.location.hash) : { tab: 'dashboard' as NavTab, recordId: null };

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
      const targetHash = '#' + tabToHash(tab, null);
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
      window.scrollTo(0, 0);
    }
    set({ activeTab: tab, selectedRecordId: null, mobileDrawerOpen: false });
  },
  setSelectedRecord: (tab, recordId = null) => {
    if (typeof window !== 'undefined') {
      const targetHash = '#' + tabToHash(tab, recordId);
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
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
