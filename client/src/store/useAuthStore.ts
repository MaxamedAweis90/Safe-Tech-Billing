import { create } from 'zustand';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  setUser: (user: User | null, token?: string | null) => void;
  logout: () => void;
}

export const ROLE_CONFIG: Record<UserRole, { label: string; user: string; perms: string[] }> = {
  admin: {
    label: 'Administrator (full access)',
    user: 'Sarah M. (Admin)',
    perms: ['quotes', 'invoices', 'receipts', 'customers', 'reports', 'settings', 'audit'],
  },
  accountant: {
    label: 'Accountant (invoices, receipts, reports)',
    user: 'Daniel K. (Accountant)',
    perms: ['invoices', 'receipts', 'customers', 'reports'],
  },
  sales: {
    label: 'Sales rep (quotes, customers, view inv)',
    user: 'Amina O. (Sales)',
    perms: ['quotes', 'customers'],
  },
  viewer: {
    label: 'Read-only viewer (auditor)',
    user: 'Audit Officer (Read-only)',
    perms: ['view_only'],
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    _id: 'usr_demo_admin',
    name: 'Sarah M.',
    email: 'admin@safetech.co.ke',
    role: 'admin',
  },
  token: localStorage.getItem('safetech_token') || 'demo_token',
  role: 'admin',
  setRole: (role) => {
    set((state) => ({
      role,
      user: state.user
        ? {
            ...state.user,
            role,
            name: ROLE_CONFIG[role].user.split(' ')[0] + ' ' + ROLE_CONFIG[role].user.split(' ')[1],
          }
        : null,
    }));
  },
  setUser: (user, token) => {
    if (token) localStorage.setItem('safetech_token', token);
    else localStorage.removeItem('safetech_token');
    set({ user, token: token || null, role: user?.role || 'admin' });
  },
  logout: () => {
    localStorage.removeItem('safetech_token');
    set({ user: null, token: null, role: 'viewer' });
  },
}));

