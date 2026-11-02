import React from 'react';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'danger-solid' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:opacity-40 disabled:cursor-not-allowed select-none whitespace-nowrap cursor-pointer';

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-accent hover:bg-accent-hover text-bg-base font-semibold border border-transparent shadow-sm active:scale-[0.98]',
      secondary:
        'bg-bg-surface hover:bg-bg-surface/80 text-text-primary border border-border-strong hover:border-accent hover:text-accent active:scale-[0.98]',
      danger:
        'bg-transparent hover:bg-danger-soft text-danger border border-border-strong hover:border-danger active:scale-[0.98]',
      'danger-solid':
        'bg-danger hover:bg-danger/90 text-white font-semibold border border-transparent active:scale-[0.98]',
      ghost:
        'bg-transparent hover:bg-accent-soft text-text-muted hover:text-accent border border-transparent',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'h-7 px-2.5 text-xs',
      md: 'h-9 px-3.5 text-sm',
      lg: 'h-10 px-5 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

