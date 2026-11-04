import { create } from 'zustand';
import { UserRole } from '../types';
import { toast } from './useUIStore';
import api from '../lib/api';
import { queryClient } from '../lib/queryClient';

export interface RoleDefinition {
  label: string;
  user: string;
  can: string[];
}

export const ROLES: Record<UserRole, RoleDefinition> = {
  admin: {
    label: 'Administrator',
    user: 'Amina Yusuf',
    can: ['quotes', 'invoices', 'payments', 'customers', 'settings', 'audit'],
  },
  accountant: {
    label: 'Accountant',
    user: 'Hassan Ali',
    can: ['invoices', 'payments'],
  },
  sales: {
    label: 'Sales Officer',
    user: 'Faadumo Nur',
    can: ['quotes', 'customers'],
  },
  viewer: {
    label: 'Viewer',
    user: 'Guest Viewer',
    can: [],
  },
};

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string }> = {
  admin: { email: 'admin@safetech.so', pass: 'Admin@123' },
  accountant: { email: 'accountant@safetech.so', pass: 'Accountant@123' },
  sales: { email: 'sales@safetech.so', pass: 'Sales@123' },
  viewer: { email: 'viewer@safetech.so', pass: 'Viewer@123' },
};

export async function switchRoleAuth(newRole: UserRole) {
  const creds = DEMO_CREDENTIALS[newRole];
  if (!creds) return;
  try {
    const res = await api.post('/auth/login', {
      email: creds.email,
      password: creds.pass,
    });
    if (res.data?.token) {
      localStorage.setItem('safetech_token', res.data.token);
      useAuthStore.setState({ token: res.data.token });
      queryClient.invalidateQueries();
    }
  } catch {
    // Graceful fallback to offline/mock mode
  }
}

export function getAvatarInitials(userName: string): string {
  return userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

interface AuthState {
  role: UserRole;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  token: string | null;
  setRole: (role: UserRole) => void;
  can: (permission: string) => boolean;
  needs: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialRole: UserRole = 'admin';
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('safetech_token') : null;
  const initialToken = storedToken || `demo_token_${initialRole}`;
  if (typeof window !== 'undefined' && !storedToken) {
    localStorage.setItem('safetech_token', initialToken);
  }

  return {
    role: initialRole,
    user: {
      id: `usr_${initialRole}`,
      name: ROLES[initialRole].user,
      email: `${initialRole}@safetech.so`,
      role: initialRole,
    },
    token: initialToken,

    setRole: (newRole: UserRole) => {
      const roleInfo = ROLES[newRole];
      const demoToken = `demo_token_${newRole}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem('safetech_token', demoToken);
      }
      set({
        role: newRole,
        user: {
          id: `usr_${newRole}`,
          name: roleInfo.user,
          email: `${newRole}@safetech.so`,
          role: newRole,
        },
        token: demoToken,
      });
      toast(`Now viewing as ${roleInfo.label} (${roleInfo.user})`);
      queryClient.invalidateQueries();
      switchRoleAuth(newRole);
    },

    can: (permission: string) => {
      const currentRole = get().role;
      return ROLES[currentRole].can.includes(permission);
    },

    needs: (permission: string) => {
      if (get().can(permission)) {
        return true;
      }
      const currentRole = get().role;
      toast(`${ROLES[currentRole].label}s can't do that. Switch role to try it.`, true);
      return false;
    },
  };
});

// Auto-seed and login in background if needed
if (typeof window !== 'undefined') {
  switchRoleAuth('admin');
}

