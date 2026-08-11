'use client';

import { useEffect } from 'react';
import {
  Palette, X, Check,
  Monitor, Sun, Moon, Type, Grid,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  useThemeCustomizer,
  ACCENT_PALETTES, RADIUS_VALUES, DENSITY_VALUES,
  type AccentPalette, type RadiusScale, type FontFamily, type DensityScale,
} from '@/store/theme-customizer.store';
import { applyAccent, applyRadius, applyDensity, applyFont } from '@/lib/theme-customizer';
import { useThemeToggle } from '@/hooks/use-theme';

const ACCENTS: Array<{ key: AccentPalette; label: string }> = [
  { key: 'blue',   label: 'أزرق' },
  { key: 'indigo', label: 'نيلي' },
  { key: 'purple', label: 'بنفسجي' },
  { key: 'green',  label: 'أخضر' },
  { key: 'orange', label: 'برتقالي' },
  { key: 'red',    label: 'أحمر' },
  { key: 'pink',   label: 'زهري' },
  { key: 'slate',  label: 'سليت' },
];

const RADIUS_OPTIONS: Array<{ key: RadiusScale; label: string }> = [
  { key: 'none', label: 'بدون' },
  { key: 'sm',   label: 'صغير' },
  { key: 'md',   label: 'متوسط' },
  { key: 'lg',   label: 'كبير' },
  { key: 'xl',   label: 'كبير جداً' },
];

const FONT_OPTIONS: Array<{ key: FontFamily; label: string }> = [
  { key: 'cairo',   label: 'القاهرة' },
  { key: 'tajawal', label: 'تاجوال' },
  { key: 'inter',   label: 'إنتر' },
  { key: 'geist',   label: 'جيست' },
  { key: 'roboto',  label: 'روبوتو' },
  { key: 'poppins', label: 'بوبينز' },
];

const DENSITY_OPTIONS: Array<{ key: DensityScale; label: string }> = [
  { key: 'compact',     label: 'مضغوط' },
  { key: 'comfortable', label: 'مريح' },
  { key: 'spacious',    label: 'واسع' },
];

function SectionHeader({ icon: Icon, title, description }: { icon: any; title: string; description?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
        <Icon size={15} style={{ color: 'var(--primary)' }} />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
        {description && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      </div>
    </div>
  );
}

function Swatch({ active, color, onClick }: { active: boolean; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="relative w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{ backgroundColor: color, '--tw-ring-color': color } as React.CSSProperties}>
      {active && <Check size={14} className="absolute inset-0 m-auto text-white" />}
    </button>
  );
}

export function ThemeCustomizer() {
  const {
    accentColor, borderRadius: radius, font, density, isOpen, customAccentColor,
    setAccent: setAccentColor, setRadius, setFont, setDensity, close,
  } = useThemeCustomizer();
  const { resolvedTheme } = useTheme();
  const { setTheme, theme } = useThemeToggle();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => { applyAccent(accentColor, isDark, customAccentColor); }, [accentColor, isDark, customAccentColor]);
  useEffect(() => { applyRadius(radius); }, [radius]);
  useEffect(() => { applyDensity(density); }, [density]);
  useEffect(() => { applyFont(font); }, [font]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      <div className="fixed inset-0" style={{ backgroundColor: 'var(--overlay)' }} onClick={close} />
      <div role="dialog" aria-modal="true" aria-label="مخصص السمات" className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-y-auto max-h-[80vh]"
        style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
              <Palette size={16} className="text-white" />
            </div>
            <h2 className="text-base font-bold text-h3 font-semibold text-text-primary">مخصص السمات</h2>
          </div>
          <button onClick={close} className="p-1.5 rounded-lg hover:bg-[var(--surface)] transition-colors">
            <X size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <SectionHeader icon={Monitor} title="الوضع" />
            <div className="flex gap-2">
              {[
                { key: 'light' as const, icon: Sun, label: 'فاتح' },
                { key: 'dark' as const,  icon: Moon, label: 'داكن' },
                { key: 'system' as const, icon: Monitor, label: 'النظام' },
              ].map(({ key, icon: Icon, label }) => (
                <button key={key} onClick={() => setTheme(key)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl font-medium transition-all border flex-1 justify-center"
                  style={{
                    backgroundColor: theme === key ? 'var(--primary)' : 'transparent',
                    borderColor: theme === key ? 'var(--primary)' : 'var(--border)',
                    color: theme === key ? '#fff' : 'var(--text-secondary)',
                  }}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader icon={Palette} title="لون التمييز" description="يغير اللون الأساسي في جميع أنحاء التطبيق" />
            <div className="flex flex-wrap gap-2.5">
              {ACCENTS.map((a) => (
                <Swatch key={a.key} active={accentColor === a.key && !customAccentColor} color={ACCENT_PALETTES[a.key].light['--primary']} onClick={() => setAccentColor(a.key)} />
              ))}
              {customAccentColor && (
                <div title="لون مخصص"
                  className="w-7 h-7 rounded-lg border-2 transition-all"
                  style={{ backgroundColor: customAccentColor, borderColor: 'var(--primary)' }} />
              )}
            </div>
          </div>

          <div>
            <SectionHeader icon={Grid} title="نصف القطر" description="درجة استدارة الزوايا في التطبيق" />
            <div className="flex flex-wrap gap-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <button key={r.key} onClick={() => setRadius(r.key)}
                  className="px-3 py-1.5 text-xs rounded-lg font-medium transition-all border"
                  style={{
                    backgroundColor: radius === r.key ? 'var(--primary)' : 'transparent',
                    borderColor: radius === r.key ? 'var(--primary)' : 'var(--border)',
                    color: radius === r.key ? '#fff' : 'var(--text-secondary)',
                  }}>
                  {r.label}
                </button>
              ))}
            </div>
            <div className="mt-2 h-12 rounded-xl border-2 border-dashed flex items-center justify-center transition-all"
              style={{ borderRadius: RADIUS_VALUES[radius], borderColor: 'var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>معاينة: {RADIUS_VALUES[radius]}</span>
            </div>
          </div>

          <div>
            <SectionHeader icon={Type} title="الخط" description="نوع الخط المستخدم في جميع أنحاء التطبيق" />
            <div className="flex flex-wrap gap-1.5">
              {FONT_OPTIONS.map((f) => (
                <button key={f.key} onClick={() => setFont(f.key)}
                  className="px-3 py-1.5 text-xs rounded-lg font-medium transition-all border"
                  style={{
                    backgroundColor: font === f.key ? 'var(--primary)' : 'transparent',
                    borderColor: font === f.key ? 'var(--primary)' : 'var(--border)',
                    color: font === f.key ? '#fff' : 'var(--text-secondary)',
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader icon={Grid} title="الكثافة" description="المسافات والتباعد بين العناصر" />
            <div className="flex flex-wrap gap-1.5">
              {DENSITY_OPTIONS.map((d) => (
                <button key={d.key} onClick={() => setDensity(d.key)}
                  className="px-3 py-1.5 text-xs rounded-lg font-medium transition-all border"
                  style={{
                    backgroundColor: density === d.key ? 'var(--primary)' : 'transparent',
                    borderColor: density === d.key ? 'var(--primary)' : 'var(--border)',
                    color: density === d.key ? '#fff' : 'var(--text-secondary)',
                  }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
