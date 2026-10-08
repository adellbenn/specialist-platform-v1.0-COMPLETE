import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import type { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** مكوّن الأيقونة الاختياري (lucide) */
  icon?: LucideIcon;
  /** أيقونة في نهاية الزر */
  trailingIcon?: ReactNode;
  /** عرض كامل داخل الحاوية */
  fullWidth?: boolean;
  /** حجم الزر */
  size?: ButtonSize;
  /** النمط/اللون */
  variant?: ButtonVariant;
  /** يعرض مؤشّر تحميل بدل المحتوى */
  loading?: boolean;
  /** يسمح بتمرير المحتوى كطفل ثابت */
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'min-h-7 px-3 text-xs gap-1.5',
  sm: 'min-h-8 px-3.5 text-sm gap-2',
  md: 'min-h-10 px-5 text-sm gap-2',
  lg: 'min-h-11 px-6 text-base gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = 'md', variant = 'primary', icon: Icon, trailingIcon, fullWidth, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={props.type ?? 'button'}
        className={cn(
          'btn inline-flex items-center justify-center rounded-lg font-medium text-small gap-2',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Spinner size={size === 'lg' ? 'md' : 'sm'} className="text-inherit" />
        ) : (
          <>
            {Icon && <Icon size={size === 'lg' ? 20 : 16} aria-hidden="true" />}
            {children}
            {trailingIcon}
          </>
        )}
      </button>
    );
  },
);
Button.displayName = 'Button';

export default Button;
