import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-xl bg-surface flex items-center justify-center mb-4">
        <Icon size={24} className="text-text-muted" />
      </div>
      <h3 className="text-body font-medium text-text-primary">{title}</h3>
      {description && (
        <p className="text-small text-text-muted mt-1.5 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
