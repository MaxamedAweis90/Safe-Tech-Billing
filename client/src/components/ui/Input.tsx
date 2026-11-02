import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="field">
        {label && (
          <label htmlFor={inputId}>
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-2.5 text-faint pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'inp w-full',
              leftIcon && 'pl-8',
              rightIcon && 'pr-8',
              error && 'border-bad',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-2.5 text-faint pointer-events-none flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <span className="err-msg">{error}</span>
        ) : helperText ? (
          <span className="hint">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
