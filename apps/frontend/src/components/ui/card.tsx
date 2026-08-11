import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddings = { sm: 'p-4', md: 'p-5', lg: 'p-6' };

export function Card({ children, className, padding = 'md', hover }: CardProps) {
  return (
    <div
      className={cn(
        'card rounded-xl',
        paddings[padding],
        hover && 'hover:shadow-card-hover hover:border-border-hover',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  iconColor?: string;
}

export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
  iconColor,
}: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-surface"
          >
            <Icon size={14} className={cn('text-primary', iconColor)} />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-small text-text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value?: string | null | React.ReactNode;
  icon?: LucideIcon;
}

export function DetailRow({ label, value, icon: Icon }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0 border-border">
      {Icon && <Icon size={14} className="text-text-muted mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text-muted mb-0.5">{label}</p>
        <p className="text-small font-medium text-text-primary">
          {value ?? <span className="text-text-muted font-normal">—</span>}
        </p>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-h2 font-semibold text-text-primary">{title}</h1>
        {subtitle && <p className="text-small text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
