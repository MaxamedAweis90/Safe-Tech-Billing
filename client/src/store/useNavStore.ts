import { create } from 'zustand';
import { NavTab } from '../types';

interface NavState {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
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
  setActiveTab: (tab) => set({ activeTab: tab, mobileDrawerOpen: false }),
  navCounts: {
    overdue: 2,
    openQ: 4,
  },
  setNavCounts: (counts) => set({ navCounts: counts }),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  mobileDrawerOpen: false,
  setMobileDrawerOpen: (mobileDrawerOpen) => set({ mobileDrawerOpen }),
  toggleMobileDrawer: () => set((state) => ({ mobileDrawerOpen: !state.mobileDrawerOpen })),
}));

