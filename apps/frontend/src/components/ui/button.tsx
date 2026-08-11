import * as React from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:  'btn-primary',
  secondary:'btn-secondary',
  outline:  'btn-outline',
  ghost:    'btn-ghost',
  danger:   'btn-danger',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 gap-1.5 rounded-md',
  md: 'h-9 px-4 gap-2 rounded-lg',
  lg: 'h-10 px-5 gap-2 rounded-lg text-body',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      iconLeft,
      iconRight,
      className,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        className={cn(
          'btn',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" className="shrink-0" />
        ) : (
          iconLeft && <span className="shrink-0 inline-flex">{iconLeft}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && iconRight && <span className="shrink-0 inline-flex">{iconRight}</span>}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button };
