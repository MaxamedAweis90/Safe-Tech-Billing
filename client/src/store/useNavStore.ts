import { create } from 'zustand';
import { NavTab } from '../types';

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
  activeTab: 'dashboard',
  selectedRecordId: null,
  prefillCustomerId: null,
  setPrefillCustomerId: (id) => set({ prefillCustomerId: id }),
  setActiveTab: (tab) =>
    set({ activeTab: tab, selectedRecordId: null, mobileDrawerOpen: false }),
  setSelectedRecord: (tab, recordId = null) =>
    set({ activeTab: tab, selectedRecordId: recordId, mobileDrawerOpen: false }),
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

