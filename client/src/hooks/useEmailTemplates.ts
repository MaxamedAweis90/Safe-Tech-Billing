import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { toast } from '../store/useUIStore';

export interface EmailTemplateItem {
  _id?: string;
  slug: string;
  name: string;
  subject: string;
  htmlBody: string;
  variables: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const emailTemplateKeys = {
  all: ['emailTemplates'] as const,
  list: () => [...emailTemplateKeys.all, 'list'] as const,
  slug: (slug: string) => [...emailTemplateKeys.all, slug] as const,
};

export function useEmailTemplates() {
  return useQuery({
    queryKey: emailTemplateKeys.list(),
    queryFn: async () => {
      const res = await api.get('/settings/email-templates');
      return (res.data?.templates || []) as EmailTemplateItem[];
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      subject,
      htmlBody,
    }: {
      slug: string;
      subject: string;
      htmlBody: string;
    }) => {
      const res = await api.patch(`/settings/email-templates/${slug}`, {
        subject,
        htmlBody,
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
      toast(`Email template "${variables.slug}" updated successfully`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to update email template', true);
    },
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: async ({
      slug,
      destinationEmail,
    }: {
      slug: string;
      destinationEmail?: string;
    }) => {
      const res = await api.post(`/settings/email-templates/${slug}/test`, {
        destinationEmail,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast(data?.message || 'Test email dispatched successfully');
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to send test email', true);
    },
  });
}

export function useResetEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const res = await api.post(`/settings/email-templates/${slug}/reset`);
      return res.data;
    },
    onSuccess: (_data, slug) => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
      toast(`Template "${slug}" reset to factory default`);
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to reset email template', true);
    },
  });
}
