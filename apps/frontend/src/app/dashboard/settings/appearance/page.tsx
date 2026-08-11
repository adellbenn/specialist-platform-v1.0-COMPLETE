'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useThemeCustomizer, ACCENT_PALETTES, FONT_CONFIGS, RADIUS_VALUES, DENSITY_VALUES, DEFAULT_APPEARANCE, type AccentPalette, type RadiusScale, type FontFamily, type DensityScale, type ThemeMode, type SidebarMode, type AnimationMode } from '@/store/theme-customizer.store';
import { applyAccent, applyRadius, applyDensity, applyFont, applyAnimations } from '@/lib/theme-customizer';
import { preferencesService } from '@/services/preferences.service';
import { useThemeToggle } from '@/hooks/use-theme';
import toast from 'react-hot-toast';
import { Sun, Moon, Monitor, Paintbrush, Radius, Type, Layout, Sidebar, Eye, RefreshCw, Check, Palette } from 'lucide-react';

const ACCENT_LIST: Array<{ key: AccentPalette; label: string }> = [
  { key: 'blue', label: 'أزرق' },
  { key: 'indigo', label: 'نيلي' },
  { key: 'purple', label: 'بنفسجي' },
  { key: 'green', label: 'أخضر' },
  { key: 'orange', label: 'برتقالي' },
  { key: 'red', label: 'أحمر' },
  { key: 'pink', label: 'وردي' },
  { key: 'slate', label: 'سليت' },
];

const THEMES: Array<{ key: ThemeMode; label: string; icon: any }> = [
  { key: 'light', label: 'فاتح', icon: Sun },
  { key: 'dark', label: 'داكن', icon: Moon },
  { key: 'system', label: 'النظام', icon: Monitor },
];

const RADIUS_LIST: Array<{ key: RadiusScale; label: string }> = [
  { key: 'none', label: 'بدون' },
  { key: 'sm', label: 'صغير' },
  { key: 'md', label: 'متوسط' },
  { key: 'lg', label: 'كبير' },
  { key: 'xl', label: 'كبير جداً' },
];

const FONT_LIST: Array<{ key: FontFamily; label: string; rtl: boolean }> = [
  { key: 'inter', label: 'Inter', rtl: false },
  { key: 'geist', label: 'Geist', rtl: false },
  { key: 'roboto', label: 'Roboto', rtl: false },
  { key: 'poppins', label: 'Poppins', rtl: false },
  { key: 'cairo', label: 'Cairo', rtl: true },
  { key: 'tajawal', label: 'Tajawal', rtl: true },
];

const DENSITY_LIST: Array<{ key: DensityScale; label: string }> = [
  { key: 'compact', label: 'مضغوط' },
  { key: 'comfortable', label: 'مريح' },
  { key: 'spacious', label: 'واسع' },
];

const SIDEBAR_OPTIONS: Array<{ key: SidebarMode; label: string }> = [
  { key: 'expanded', label: 'موسع' },
  { key: 'collapsed', label: 'مطوي' },
  { key: 'icon-only', label: 'أيقونات فقط' },
];

const ANIMATION_OPTIONS: Array<{ key: AnimationMode; label: string }> = [
  { key: 'enabled', label: 'مفعلة' },
  { key: 'reduced', label: 'مخفضة' },
  { key: 'disabled', label: 'معطلة' },
];

function Swatch({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
      style={{ backgroundColor: color, outline: selected ? `3px solid ${color}` : 'none', outlineOffset: '2px' }}>
      {selected && <Check size={14} className="text-white" />}
    </button>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <Icon size={16} style={{ color: 'var(--primary)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function OptionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}

function OptionsRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2 flex-wrap">{children}</div>;
}

function OptionChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs rounded-lg transition font-medium"
      style={{
        backgroundColor: selected ? 'var(--primary)' : 'var(--surface)',
        color: selected ? '#fff' : 'var(--text-primary)',
        border: selected ? 'none' : '1px solid var(--border)',
      }}>
      {children}
    </button>
  );
}

function DensityPreview({ density }: { density: DensityScale }) {
  const d = DENSITY_VALUES[density];
  return (
    <div className="rounded-lg p-3 mt-2" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="flex gap-2" style={{ gap: `${d.gap * 0.25}rem` }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 rounded" style={{
            height: `${d.spacing * 12}px`,
            backgroundColor: 'var(--primary-100)',
            borderRadius: 'var(--radius)',
          }} />
        ))}
      </div>
      <div className="rounded text-[10px] text-center"
        style={{ marginTop: `${d.gap * 0.25}rem`, padding: `${d.padding * 0.25}rem`, backgroundColor: 'var(--primary-50)', color: 'var(--primary)', borderRadius: 'var(--radius)' }}>
        كثافة {density === 'compact' ? 'مضغوطة' : density === 'comfortable' ? 'مريحة' : 'واسعة'}
      </div>
    </div>
  );
}

function BorderRadiusPreview({ radius }: { radius: RadiusScale }) {
  const val = RADIUS_VALUES[radius];
  return (
    <div className="flex items-center gap-3 mt-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: val, backgroundColor: 'var(--primary)', flexShrink: 0 }} />
      <div style={{ width: '60px', height: '40px', borderRadius: val, backgroundColor: 'var(--primary-100)', flexShrink: 0 }} />
      <div style={{ width: '80px', height: '40px', borderRadius: val, backgroundColor: 'var(--primary-200)', flexShrink: 0 }} />
      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{val}</span>
    </div>
  );
}

export default function AppearancePage() {
  const prefs = useThemeCustomizer();
  const { theme: currentTheme, setTheme: setThemeHook } = useThemeToggle();
  const [customColorInput, setCustomColorInput] = useState(prefs.customAccentColor || '#2563EB');
  const [syncing, setSyncing] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout>>();

  const isDark = currentTheme === 'dark';

  useEffect(() => {
    applyAccent(prefs.accentColor, isDark, prefs.customAccentColor);
    applyRadius(prefs.borderRadius);
    applyDensity(prefs.density);
    applyFont(prefs.font);
    applyAnimations(prefs.animations);
  }, [prefs.accentColor, prefs.customAccentColor, prefs.borderRadius, prefs.density, prefs.font, prefs.animations, isDark]);

  useEffect(() => {
    preferencesService.get().then((res) => {
      const server = res.data.data;
      if (server && Object.keys(server).length > 0) {
        useThemeCustomizer.getState().syncFromServer(server);
      }
    }).catch(() => {});
  }, []);

  const syncToServer = useCallback((updatedPrefs: Partial<typeof prefs>) => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      setSyncing(true);
      try {
        await preferencesService.update(updatedPrefs);
      } catch {
        // silent — local state already applied
      } finally {
        setSyncing(false);
      }
    }, 800);
  }, []);

  const handleThemeChange = (t: ThemeMode) => {
    prefs.setTheme(t);
    setThemeHook(t);
    syncToServer({ theme: t });
  };

  const handleAccentChange = (a: AccentPalette) => {
    prefs.setAccent(a);
    syncToServer({ accentColor: a, customAccentColor: null });
  };

  const handleCustomColor = (hex: string) => {
    setCustomColorInput(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      prefs.setCustomAccent(hex);
      syncToServer({ customAccentColor: hex });
    }
  };

  const handleRadiusChange = (r: RadiusScale) => {
    prefs.setRadius(r);
    syncToServer({ borderRadius: r });
  };

  const handleFontChange = (f: FontFamily) => {
    prefs.setFont(f);
    syncToServer({ font: f });
  };

  const handleDensityChange = (d: DensityScale) => {
    prefs.setDensity(d);
    syncToServer({ density: d });
  };

  const handleSidebarChange = (s: SidebarMode) => {
    prefs.setSidebar(s);
    syncToServer({ sidebar: s });
  };

  const handleAnimationsChange = (a: AnimationMode) => {
    prefs.setAnimations(a);
    syncToServer({ animations: a });
  };

  const handleReset = () => {
    prefs.resetAll();
    applyAccent(DEFAULT_APPEARANCE.accentColor, isDark, DEFAULT_APPEARANCE.customAccentColor);
    applyRadius(DEFAULT_APPEARANCE.borderRadius);
    applyDensity(DEFAULT_APPEARANCE.density);
    applyFont(DEFAULT_APPEARANCE.font);
    applyAnimations(DEFAULT_APPEARANCE.animations);
    syncToServer(DEFAULT_APPEARANCE);
    toast.success('تم إعادة التعيين إلى الإعدادات الافتراضية');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>المظهر</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>خصص مظهر التطبيق حسب تفضيلاتك</p>
        </div>
        <div className="flex items-center gap-2">
          {syncing && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>جاري الحفظ...</span>}
          <button onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition"
            style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <RefreshCw size={12} /> إعادة تعيين
          </button>
        </div>
      </div>

      {/* Live Preview Bar */}
      <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--primary-50)', border: '1px solid var(--primary-200)' }}>
        <Eye size={16} style={{ color: 'var(--primary)' }} />
        <span className="text-xs" style={{ color: 'var(--primary)' }}>
          جميع التغييرات تنعكس فوراً دون الحاجة لإعادة التحميل
        </span>
      </div>

      <div className="grid gap-6">
        {/* Theme */}
        <SectionCard title="السمة" icon={Paintbrush}>
          <OptionsRow>
            {THEMES.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => handleThemeChange(t.key)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition flex-1 justify-center"
                  style={{
                    backgroundColor: prefs.theme === t.key ? 'var(--primary)' : 'var(--surface)',
                    color: prefs.theme === t.key ? '#fff' : 'var(--text-primary)',
                    border: prefs.theme === t.key ? 'none' : '1px solid var(--border)',
                  }}>
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </OptionsRow>
        </SectionCard>

        {/* Accent Color */}
        <SectionCard title="اللون الأساسي" icon={Palette}>
          <OptionGroup label="الألوان المتاحة">
            <div className="flex items-center gap-2 flex-wrap">
              {ACCENT_LIST.map((a) => {
                const colors = ACCENT_PALETTES[a.key].light;
                return (
                  <Swatch
                    key={a.key}
                    color={colors['--primary']}
                    selected={prefs.accentColor === a.key && !prefs.customAccentColor}
                    onClick={() => handleAccentChange(a.key)}
                  />
                );
              })}
            </div>
          </OptionGroup>
          <OptionGroup label="لون مخصص">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customColorInput}
                onChange={(e) => handleCustomColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 p-0.5"
                style={{ backgroundColor: 'transparent' }}
              />
              <input
                type="text"
                value={customColorInput}
                onChange={(e) => handleCustomColor(e.target.value)}
                placeholder="#HEX"
                className="px-3 py-1.5 text-xs rounded-lg w-28"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
              />
              <div className="w-6 h-6 rounded-full" style={{
                backgroundColor: customColorInput,
                border: `2px solid ${prefs.customAccentColor ? 'var(--primary)' : 'var(--border)'}`,
              }} />
            </div>
          </OptionGroup>
        </SectionCard>

        {/* Border Radius */}
        <SectionCard title="زوايا الحواف" icon={Radius}>
          <OptionsRow>
            {RADIUS_LIST.map((r) => (
              <OptionChip key={r.key} selected={prefs.borderRadius === r.key} onClick={() => handleRadiusChange(r.key)}>
                {r.label}
              </OptionChip>
            ))}
          </OptionsRow>
          <BorderRadiusPreview radius={prefs.borderRadius} />
        </SectionCard>

        {/* Font */}
        <SectionCard title="الخط" icon={Type}>
          <OptionsRow>
            {FONT_LIST.map((f) => (
              <OptionChip key={f.key} selected={prefs.font === f.key} onClick={() => handleFontChange(f.key)}>
                {f.label} {f.rtl && <span className="opacity-60">(عربي)</span>}
              </OptionChip>
            ))}
          </OptionsRow>
          <div className="mt-3 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--surface)' }}>
            <p style={{ fontFamily: `var(--font-family, 'Cairo', sans-serif)`, color: 'var(--text-primary)' }}>
              هذا نص تجريبي لتوضيح شكل الخط. The quick brown fox jumps over the lazy dog.
            </p>
          </div>
        </SectionCard>

        {/* Density */}
        <SectionCard title="الكثافة" icon={Layout}>
          <OptionsRow>
            {DENSITY_LIST.map((d) => (
              <OptionChip key={d.key} selected={prefs.density === d.key} onClick={() => handleDensityChange(d.key)}>
                {d.label}
              </OptionChip>
            ))}
          </OptionsRow>
          <DensityPreview density={prefs.density} />
          <div className="mt-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            يُطبق على: الجداول، النماذج، البطاقات، الشريط الجانبي، التنقل، التقويم
          </div>
        </SectionCard>

        {/* Sidebar */}
        <SectionCard title="الشريط الجانبي" icon={Sidebar}>
          <OptionsRow>
            {SIDEBAR_OPTIONS.map((s) => (
              <OptionChip key={s.key} selected={prefs.sidebar === s.key} onClick={() => handleSidebarChange(s.key)}>
                {s.label}
              </OptionChip>
            ))}
          </OptionsRow>
        </SectionCard>

        {/* Animations */}
        <SectionCard title="الحركة" icon={Eye}>
          <OptionsRow>
            {ANIMATION_OPTIONS.map((a) => (
              <OptionChip key={a.key} selected={prefs.animations === a.key} onClick={() => handleAnimationsChange(a.key)}>
                {a.label}
              </OptionChip>
            ))}
          </OptionsRow>
          <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
            يحترم إعدادات إمكانية الوصول لنظام التشغيل
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
