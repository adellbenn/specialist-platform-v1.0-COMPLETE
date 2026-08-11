'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, required, ...props }, ref) => {
    const id = useId();
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    const describedBy =
      [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-small font-medium text-text-primary"
          >
            {label}
            {required && (
              <span className="text-danger mr-1" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(
              'input rounded-lg appearance-none',
              error && 'input-error',
              className,
            )}
            aria-required={required || undefined}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted"
            aria-hidden="true"
          />
        </div>
        {error && (
          <p className="text-xs text-danger" id={errorId}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-text-muted" id={hintId}>
            {hint}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = 'Select';
