import React from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant =
  | 'draft'
  | 'sent'
  | 'unpaid'
  | 'accepted'
  | 'paid'
  | 'partial'
  | 'rejected'
  | 'overdue'
  | 'expired'
  | 'cancelled'
  | 'accent'
  | 'muted';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'muted',
  dot = true,
  className,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    draft: 'bg-neutral-soft text-muted border border-line',
    sent: 'bg-info-soft text-info border border-info/30',
    unpaid: 'bg-info-soft text-info border border-info/30',
    accepted: 'bg-ok-soft text-ok border border-ok/30',
    paid: 'bg-ok-soft text-ok border border-ok/30',
    partial: 'bg-warn-soft text-warn border border-warn/30',
    rejected: 'bg-bad-soft text-bad border border-bad/30',
    overdue: 'bg-bad-soft text-bad border border-bad/40',
    expired: 'bg-neutral-soft text-faint line-through',
    cancelled: 'bg-neutral-soft text-faint line-through',
    accent: 'bg-accent-soft text-accent border border-accent/30',
    muted: 'bg-surface-2 text-muted border border-line',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            variant === 'draft' && 'bg-muted',
            (variant === 'sent' || variant === 'unpaid') && 'bg-info',
            (variant === 'accepted' || variant === 'paid') && 'bg-ok',
            variant === 'partial' && 'bg-warn',
            (variant === 'rejected' || variant === 'overdue') && 'bg-bad',
            (variant === 'expired' || variant === 'cancelled') && 'bg-faint',
            variant === 'accent' && 'bg-accent',
            variant === 'muted' && 'bg-muted'
          )}
        />
      )}
      {children}
    </span>
  );
};
