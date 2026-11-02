import { create } from 'zustand';
import { UserRole } from '../types';
import { toast } from './useUIStore';

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

export const useAuthStore = create<AuthState>((set, get) => ({
  role: 'admin',
  user: {
    id: 'usr_amina',
    name: ROLES.admin.user,
    email: 'amina@safetech.co.ke',
    role: 'admin',
  },
  token: localStorage.getItem('safetech_token') || 'demo_token',

  setRole: (newRole: UserRole) => {
    const roleInfo = ROLES[newRole];
    set({
      role: newRole,
      user: {
        id: `usr_${newRole}`,
        name: roleInfo.user,
        email: `${roleInfo.user.toLowerCase().replace(/\s+/g, '.')}@safetech.co.ke`,
        role: newRole,
      },
    });
    toast(`Now viewing as ${roleInfo.label} (${roleInfo.user})`);
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
}));
