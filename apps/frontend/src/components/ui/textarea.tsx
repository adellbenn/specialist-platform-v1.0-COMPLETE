import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, required, ...props }, ref) => {
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
        <textarea
          ref={ref}
          id={id}
          rows={4}
          className={cn(
            'input rounded-lg resize-none',
            error && 'input-error',
            className,
          )}
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
Textarea.displayName = 'Textarea';
