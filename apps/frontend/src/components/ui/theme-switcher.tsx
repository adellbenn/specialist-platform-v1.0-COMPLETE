'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeToggle } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { ThemeMode } from '@/lib/theme.service';

interface ThemeSwitcherProps {
  variant?: 'icon' | 'full';
  className?: string;
}

const OPTIONS: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'فاتح' },
  { value: 'dark', icon: Moon, label: 'داكن' },
  { value: 'system', icon: Monitor, label: 'النظام' },
];

export function ThemeSwitcher({ variant = 'icon', className }: ThemeSwitcherProps) {
  const { theme, setTheme, isDark, toggle } = useThemeToggle();

  if (variant === 'icon') {
    return (
      <button
        onClick={toggle}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'hover:bg-surface-secondary text-text-secondary hover:text-text-primary',
          className,
        )}
        aria-label={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
        title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 bg-surface-secondary rounded-lg p-1', className)}>
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium transition-all duration-300',
            theme === value
              ? 'bg-white text-primary shadow-sm dark:bg-surface dark:text-text-primary'
              : 'text-text-muted hover:text-text-primary',
          )}
        >
          <Icon size={14} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
