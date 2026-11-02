import React from 'react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, children, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="field">
        {label && (
          <label htmlFor={selectId}>
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'sel w-full',
            error && 'border-bad',
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-surface text-ink">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error ? (
          <span className="err-msg">{error}</span>
        ) : helperText ? (
          <span className="hint">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
