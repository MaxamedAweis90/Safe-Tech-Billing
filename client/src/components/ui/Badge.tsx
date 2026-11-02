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

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  unpaid: 'Unpaid',
  accepted: 'Accepted',
  paid: 'Paid',
  partial: 'Partial',
  rejected: 'Rejected',
  overdue: 'Overdue',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

/**
 * Status chip matching prototype `.chip` and `.c-*` classes.
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'muted',
  className = '',
  ...props
}) => {
  const chipClass = `c-${variant}`;
  const label = typeof children === 'string' && STATUS_LABELS[children] ? STATUS_LABELS[children] : children;

  return (
    <span
      className={cn('chip', chipClass, className)}
      {...props}
    >
      {label}
    </span>
  );
};
