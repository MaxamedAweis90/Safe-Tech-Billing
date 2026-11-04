import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { toast } from '../store/useUIStore';

export interface TeamMember {
  id: string;
  _id?: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'accountant' | 'sales' | 'viewer';
  status: 'active' | 'pending_verification' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
}

export interface TeamInvitationItem {
  id: string;
  _id?: string;
  email: string;
  role: 'accountant' | 'sales';
  token?: string;
  invitedBy?: any;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string | null;
  status: string;
  isExpired: boolean;
}

export const teamKeys = {
  all: ['team'] as const,
  members: () => [...teamKeys.all, 'members'] as const,
  invitations: () => [...teamKeys.all, 'invitations'] as const,
};

export function useTeamMembers() {
  return useQuery({
    queryKey: teamKeys.members(),
    queryFn: async () => {
      const res = await api.get('/team/members');
      return (res.data?.members || []) as TeamMember[];
    },
  });
}

export function useTeamInvitations() {
  return useQuery({
    queryKey: teamKeys.invitations(),
    queryFn: async () => {
      const res = await api.get('/team/invitations');
      return (res.data?.invitations || []) as TeamInvitationItem[];
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      email: string;
      role: 'accountant' | 'sales';
      fullName?: string;
    }) => {
      const res = await api.post('/team/invite', payload);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.invitations() });
      queryClient.invalidateQueries({ queryKey: teamKeys.members() });
      toast(`Invitation sent to ${variables.email}`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to dispatch staff invitation', true);
    },
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/team/invitations/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.invitations() });
      toast('Invitation revoked successfully');
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to revoke invitation', true);
    },
  });
}
