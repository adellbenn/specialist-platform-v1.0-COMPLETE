import * as React from 'react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, required, ...props }, ref) => {
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
        <input
          type={type}
          id={id}
          className={cn(
            'input rounded-lg',
            error && 'input-error',
            className,
          )}
          ref={ref}
          aria-required={required || undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          {...props}
        />
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
Input.displayName = 'Input';

export { Input };
