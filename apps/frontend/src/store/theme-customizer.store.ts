import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AccentPalette = 'blue' | 'indigo' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'slate';
export type RadiusScale = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type FontFamily = 'inter' | 'geist' | 'roboto' | 'poppins' | 'cairo' | 'tajawal';
export type DensityScale = 'compact' | 'comfortable' | 'spacious';
export type ThemeMode = 'light' | 'dark' | 'system';
export type SidebarMode = 'expanded' | 'collapsed' | 'icon-only';
export type AnimationMode = 'enabled' | 'reduced' | 'disabled';

export interface AccentColors {
  '--primary': string;
  '--primary-hover': string;
  '--primary-light': string;
  '--primary-50': string;
  '--primary-100': string;
  '--primary-200': string;
  '--primary-300': string;
  '--primary-400': string;
  '--primary-500': string;
  '--primary-600': string;
  '--primary-700': string;
  '--primary-800': string;
  '--primary-900': string;
  '--ring': string;
  '--chart-1': string;
  '--chart-2': string;
  '--chart-3': string;
  '--chart-4': string;
  '--chart-5': string;
}

export interface AppearancePreferences {
  theme: ThemeMode;
  accentColor: AccentPalette;
  customAccentColor: string | null;
  borderRadius: RadiusScale;
  font: FontFamily;
  density: DensityScale;
  sidebar: SidebarMode;
  animations: AnimationMode;
}

const CUSTOM_PALETTES: Record<string, { light: AccentColors; dark: AccentColors }> = {};

function generateCustomPalette(hex: string): { light: AccentColors; dark: AccentColors } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lighten = (amt: number) => {
    const nr = Math.min(255, Math.round(r + (255 - r) * amt));
    const ng = Math.min(255, Math.round(g + (255 - g) * amt));
    const nb = Math.min(255, Math.round(b + (255 - b) * amt));
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  };
  const darken = (amt: number) => {
    const nr = Math.max(0, Math.round(r * (1 - amt)));
    const ng = Math.max(0, Math.round(g * (1 - amt)));
    const nb = Math.max(0, Math.round(b * (1 - amt)));
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  };
  return {
    light: {
      '--primary': hex, '--primary-hover': darken(0.1), '--primary-light': lighten(0.3),
      '--primary-50': lighten(0.45), '--primary-100': lighten(0.35), '--primary-200': lighten(0.25),
      '--primary-300': lighten(0.15), '--primary-400': lighten(0.08), '--primary-500': hex,
      '--primary-600': darken(0.08), '--primary-700': darken(0.15), '--primary-800': darken(0.22),
      '--primary-900': darken(0.3), '--ring': hex,
      '--chart-1': hex, '--chart-2': '#E80B83', '--chart-3': lighten(0.3),
      '--chart-4': '#FF006E', '--chart-5': lighten(0.15),
    },
    dark: {
      '--primary': lighten(0.15), '--primary-hover': lighten(0.3), '--primary-light': darken(0.6),
      '--primary-50': darken(0.55), '--primary-100': darken(0.5), '--primary-200': darken(0.42),
      '--primary-300': darken(0.35), '--primary-400': darken(0.25), '--primary-500': darken(0.15),
      '--primary-600': hex, '--primary-700': lighten(0.15), '--primary-800': lighten(0.3),
      '--primary-900': lighten(0.4), '--ring': lighten(0.15),
      '--chart-1': lighten(0.15), '--chart-2': '#E80B83', '--chart-3': lighten(0.3),
      '--chart-4': '#FF006E', '--chart-5': hex,
    },
  };
}

export function getAccentPalettes() {
  return ACCENT_PALETTES;
}

export function getCustomPalette(hex: string) {
  if (!CUSTOM_PALETTES[hex]) CUSTOM_PALETTES[hex] = generateCustomPalette(hex);
  return CUSTOM_PALETTES[hex];
}

const ACCENT_PALETTES: Record<AccentPalette, { light: AccentColors; dark: AccentColors }> = {
  blue: {
    light: {
      '--primary': '#3B82F6', '--primary-hover': '#2563EB', '--primary-light': '#DBEAFE',
      '--primary-50': '#EFF6FF', '--primary-100': '#DBEAFE', '--primary-200': '#BFDBFE',
      '--primary-300': '#93C5FD', '--primary-400': '#60A5FA', '--primary-500': '#3B82F6',
      '--primary-600': '#2563EB', '--primary-700': '#1D4ED8', '--primary-800': '#1E40AF',
      '--primary-900': '#1E3A8A', '--ring': '#3B82F6',
      '--chart-1': '#3B82F6', '--chart-2': '#EC4899', '--chart-3': '#F59E0B',
      '--chart-4': '#10B981', '--chart-5': '#8B5CF6',
    },
    dark: {
      '--primary': '#60A5FA', '--primary-hover': '#93C5FD', '--primary-light': '#1E3A5F',
      '--primary-50': '#172554', '--primary-100': '#1E3A5F', '--primary-200': '#1E40AF',
      '--primary-300': '#1D4ED8', '--primary-400': '#2563EB', '--primary-500': '#3B82F6',
      '--primary-600': '#60A5FA', '--primary-700': '#93C5FD', '--primary-800': '#BFDBFE',
      '--primary-900': '#DBEAFE', '--ring': '#60A5FA',
      '--chart-1': '#60A5FA', '--chart-2': '#F472B6', '--chart-3': '#FBBF24',
      '--chart-4': '#34D399', '--chart-5': '#A78BFA',
    },
  },
  indigo: {
    light: {
      '--primary': '#4F46E5', '--primary-hover': '#4338CA', '--primary-light': '#E0E7FF',
      '--primary-50': '#EEF2FF', '--primary-100': '#E0E7FF', '--primary-200': '#C7D2FE',
      '--primary-300': '#A5B4FC', '--primary-400': '#818CF8', '--primary-500': '#6366F1',
      '--primary-600': '#4F46E5', '--primary-700': '#4338CA', '--primary-800': '#3730A3',
      '--primary-900': '#312E81', '--ring': '#4F46E5',
      '--chart-1': '#4F46E5', '--chart-2': '#EC4899', '--chart-3': '#F59E0B',
      '--chart-4': '#10B981', '--chart-5': '#8B5CF6',
    },
    dark: {
      '--primary': '#818CF8', '--primary-hover': '#A5B4FC', '--primary-light': '#312E81',
      '--primary-50': '#1E1B4B', '--primary-100': '#312E81', '--primary-200': '#3730A3',
      '--primary-300': '#4338CA', '--primary-400': '#4F46E5', '--primary-500': '#6366F1',
      '--primary-600': '#818CF8', '--primary-700': '#A5B4FC', '--primary-800': '#C7D2FE',
      '--primary-900': '#E0E7FF', '--ring': '#818CF8',
      '--chart-1': '#818CF8', '--chart-2': '#F472B6', '--chart-3': '#FBBF24',
      '--chart-4': '#34D399', '--chart-5': '#A78BFA',
    },
  },
  purple: {
    light: {
      '--primary': '#8B5CF6', '--primary-hover': '#7C3AED', '--primary-light': '#EDE9FE',
      '--primary-50': '#F5F3FF', '--primary-100': '#EDE9FE', '--primary-200': '#DDD6FE',
      '--primary-300': '#C4B5FD', '--primary-400': '#A78BFA', '--primary-500': '#8B5CF6',
      '--primary-600': '#7C3AED', '--primary-700': '#6D28D9', '--primary-800': '#5B21B6',
      '--primary-900': '#4C1D95', '--ring': '#8B5CF6',
      '--chart-1': '#8B5CF6', '--chart-2': '#EC4899', '--chart-3': '#F59E0B',
      '--chart-4': '#10B981', '--chart-5': '#3B82F6',
    },
    dark: {
      '--primary': '#A78BFA', '--primary-hover': '#C4B5FD', '--primary-light': '#4C1D95',
      '--primary-50': '#2E1065', '--primary-100': '#4C1D95', '--primary-200': '#5B21B6',
      '--primary-300': '#6D28D9', '--primary-400': '#7C3AED', '--primary-500': '#8B5CF6',
      '--primary-600': '#A78BFA', '--primary-700': '#C4B5FD', '--primary-800': '#DDD6FE',
      '--primary-900': '#EDE9FE', '--ring': '#A78BFA',
      '--chart-1': '#A78BFA', '--chart-2': '#F472B6', '--chart-3': '#FBBF24',
      '--chart-4': '#34D399', '--chart-5': '#60A5FA',
    },
  },
  green: {
    light: {
      '--primary': '#10B981', '--primary-hover': '#059669', '--primary-light': '#D1FAE5',
      '--primary-50': '#ECFDF5', '--primary-100': '#D1FAE5', '--primary-200': '#A7F3D0',
      '--primary-300': '#6EE7B7', '--primary-400': '#34D399', '--primary-500': '#10B981',
      '--primary-600': '#059669', '--primary-700': '#047857', '--primary-800': '#065F46',
      '--primary-900': '#064E3B', '--ring': '#10B981',
      '--chart-1': '#10B981', '--chart-2': '#EC4899', '--chart-3': '#F59E0B',
      '--chart-4': '#3B82F6', '--chart-5': '#8B5CF6',
    },
    dark: {
      '--primary': '#34D399', '--primary-hover': '#6EE7B7', '--primary-light': '#064E3B',
      '--primary-50': '#022C22', '--primary-100': '#064E3B', '--primary-200': '#065F46',
      '--primary-300': '#047857', '--primary-400': '#059669', '--primary-500': '#10B981',
      '--primary-600': '#34D399', '--primary-700': '#6EE7B7', '--primary-800': '#A7F3D0',
      '--primary-900': '#D1FAE5', '--ring': '#34D399',
      '--chart-1': '#34D399', '--chart-2': '#F472B6', '--chart-3': '#FBBF24',
      '--chart-4': '#60A5FA', '--chart-5': '#A78BFA',
    },
  },
  orange: {
    light: {
      '--primary': '#F97316', '--primary-hover': '#EA580C', '--primary-light': '#FED7AA',
      '--primary-50': '#FFF7ED', '--primary-100': '#FFEDD5', '--primary-200': '#FED7AA',
      '--primary-300': '#FDBA74', '--primary-400': '#FB923C', '--primary-500': '#F97316',
      '--primary-600': '#EA580C', '--primary-700': '#C2410C', '--primary-800': '#9A3412',
      '--primary-900': '#7C2D12', '--ring': '#F97316',
      '--chart-1': '#F97316', '--chart-2': '#EC4899', '--chart-3': '#10B981',
      '--chart-4': '#3B82F6', '--chart-5': '#8B5CF6',
    },
    dark: {
      '--primary': '#FB923C', '--primary-hover': '#FDBA74', '--primary-light': '#7C2D12',
      '--primary-50': '#431407', '--primary-100': '#7C2D12', '--primary-200': '#9A3412',
      '--primary-300': '#C2410C', '--primary-400': '#EA580C', '--primary-500': '#F97316',
      '--primary-600': '#FB923C', '--primary-700': '#FDBA74', '--primary-800': '#FED7AA',
      '--primary-900': '#FFEDD5', '--ring': '#FB923C',
      '--chart-1': '#FB923C', '--chart-2': '#F472B6', '--chart-3': '#34D399',
      '--chart-4': '#60A5FA', '--chart-5': '#A78BFA',
    },
  },
  red: {
    light: {
      '--primary': '#EF4444', '--primary-hover': '#DC2626', '--primary-light': '#FECACA',
      '--primary-50': '#FEF2F2', '--primary-100': '#FEE2E2', '--primary-200': '#FECACA',
      '--primary-300': '#FCA5A5', '--primary-400': '#F87171', '--primary-500': '#EF4444',
      '--primary-600': '#DC2626', '--primary-700': '#B91C1C', '--primary-800': '#991B1B',
      '--primary-900': '#7F1D1D', '--ring': '#EF4444',
      '--chart-1': '#EF4444', '--chart-2': '#EC4899', '--chart-3': '#F59E0B',
      '--chart-4': '#10B981', '--chart-5': '#3B82F6',
    },
    dark: {
      '--primary': '#F87171', '--primary-hover': '#FCA5A5', '--primary-light': '#7F1D1D',
      '--primary-50': '#450A0A', '--primary-100': '#7F1D1D', '--primary-200': '#991B1B',
      '--primary-300': '#B91C1C', '--primary-400': '#DC2626', '--primary-500': '#EF4444',
      '--primary-600': '#F87171', '--primary-700': '#FCA5A5', '--primary-800': '#FECACA',
      '--primary-900': '#FEE2E2', '--ring': '#F87171',
      '--chart-1': '#F87171', '--chart-2': '#F472B6', '--chart-3': '#FBBF24',
      '--chart-4': '#34D399', '--chart-5': '#60A5FA',
    },
  },
  pink: {
    light: {
      '--primary': '#EC4899', '--primary-hover': '#DB2777', '--primary-light': '#FBCFE8',
      '--primary-50': '#FDF2F8', '--primary-100': '#FCE7F3', '--primary-200': '#FBCFE8',
      '--primary-300': '#F9A8D4', '--primary-400': '#F472B6', '--primary-500': '#EC4899',
      '--primary-600': '#DB2777', '--primary-700': '#BE185D', '--primary-800': '#9D174D',
      '--primary-900': '#831843', '--ring': '#EC4899',
      '--chart-1': '#EC4899', '--chart-2': '#8B5CF6', '--chart-3': '#F59E0B',
      '--chart-4': '#10B981', '--chart-5': '#3B82F6',
    },
    dark: {
      '--primary': '#F472B6', '--primary-hover': '#F9A8D4', '--primary-light': '#831843',
      '--primary-50': '#4A0E2E', '--primary-100': '#831843', '--primary-200': '#9D174D',
      '--primary-300': '#BE185D', '--primary-400': '#DB2777', '--primary-500': '#EC4899',
      '--primary-600': '#F472B6', '--primary-700': '#F9A8D4', '--primary-800': '#FBCFE8',
      '--primary-900': '#FCE7F3', '--ring': '#F472B6',
      '--chart-1': '#F472B6', '--chart-2': '#A78BFA', '--chart-3': '#FBBF24',
      '--chart-4': '#34D399', '--chart-5': '#60A5FA',
    },
  },
  slate: {
    light: {
      '--primary': '#64748B', '--primary-hover': '#475569', '--primary-light': '#E2E8F0',
      '--primary-50': '#F8FAFC', '--primary-100': '#F1F5F9', '--primary-200': '#E2E8F0',
      '--primary-300': '#CBD5E1', '--primary-400': '#94A3B8', '--primary-500': '#64748B',
      '--primary-600': '#475569', '--primary-700': '#334155', '--primary-800': '#1E293B',
      '--primary-900': '#0F172A', '--ring': '#64748B',
      '--chart-1': '#64748B', '--chart-2': '#EC4899', '--chart-3': '#F59E0B',
      '--chart-4': '#10B981', '--chart-5': '#3B82F6',
    },
    dark: {
      '--primary': '#94A3B8', '--primary-hover': '#CBD5E1', '--primary-light': '#1E293B',
      '--primary-50': '#0F172A', '--primary-100': '#1E293B', '--primary-200': '#334155',
      '--primary-300': '#475569', '--primary-400': '#64748B', '--primary-500': '#94A3B8',
      '--primary-600': '#CBD5E1', '--primary-700': '#E2E8F0', '--primary-800': '#F1F5F9',
      '--primary-900': '#F8FAFC', '--ring': '#94A3B8',
      '--chart-1': '#94A3B8', '--chart-2': '#F472B6', '--chart-3': '#FBBF24',
      '--chart-4': '#34D399', '--chart-5': '#60A5FA',
    },
  },
};

export const ACCENT_PALETTES_EXPORT = ACCENT_PALETTES;

const FONT_CONFIGS: Record<FontFamily, { name: string; nameAr: string; variable: string; family: string }> = {
  inter:   { name: 'Inter',          nameAr: 'إنتر',         variable: '--font-inter',    family: "'Inter', sans-serif" },
  geist:   { name: 'Geist',          nameAr: 'جيست',         variable: '--font-geist',    family: "'Geist', sans-serif" },
  roboto:  { name: 'Roboto',         nameAr: 'روبوتو',       variable: '--font-roboto',   family: "'Roboto', sans-serif" },
  poppins: { name: 'Poppins',        nameAr: 'بوبينز',       variable: '--font-poppins',  family: "'Poppins', sans-serif" },
  cairo:   { name: 'Cairo',          nameAr: 'القاهرة',      variable: '--font-cairo',    family: "'Cairo', sans-serif" },
  tajawal: { name: 'Tajawal',        nameAr: 'تاجوال',       variable: '--font-tajawal',  family: "'Tajawal', sans-serif" },
};

const RADIUS_VALUES: Record<RadiusScale, string> = {
  none: '0px',
  sm:   '6px',
  md:   '12px',
  lg:   '16px',
  xl:   '24px',
};

const DENSITY_VALUES: Record<DensityScale, { spacing: number; gap: number; padding: number }> = {
  compact:     { spacing: 0.75, gap: 0.5,  padding: 0.5 },
  comfortable: { spacing: 1.25, gap: 1,    padding: 1 },
  spacious:    { spacing: 1.75, gap: 1.5,  padding: 1.5 },
};

// Migrate old persisted data (v1) to new shape
const OLD_STORAGE_KEY = 'theme-customizer';
try {
  const raw = localStorage.getItem(OLD_STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    const state = parsed?.state || {};
    // Map old values to new
    const migrated: Record<string, string> = {};
    if (state.accent) {
      const OLD_ACCENT_MAP: Record<string, string> = { teal: 'green', rose: 'red', amber: 'orange' };
      migrated.accentColor = OLD_ACCENT_MAP[state.accent] || state.accent;
    }
    if (state.radius) {
      if (state.radius === 'full') migrated.borderRadius = 'xl';
      else migrated.borderRadius = state.radius;
    }
    if (state.density === 'normal') migrated.density = 'comfortable';
    if (state.font === 'noto-sans-arabic') migrated.font = 'cairo';
    if (Object.keys(migrated).length) {
      parsed.state = { ...parsed.state, ...migrated };
      localStorage.setItem(OLD_STORAGE_KEY, JSON.stringify(parsed));
    }
  }
} catch {}

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  theme: 'system',
  accentColor: 'purple',
  customAccentColor: '#2563EB',
  borderRadius: 'md',
  font: 'cairo',
  density: 'comfortable',
  sidebar: 'expanded',
  animations: 'enabled',
};

interface ThemeCustomizerState extends AppearancePreferences {
  isOpen: boolean;
  setAccent: (a: AccentPalette) => void;
  setCustomAccent: (hex: string) => void;
  setRadius: (r: RadiusScale) => void;
  setFont: (f: FontFamily) => void;
  setDensity: (d: DensityScale) => void;
  setTheme: (t: ThemeMode) => void;
  setSidebar: (s: SidebarMode) => void;
  setAnimations: (a: AnimationMode) => void;
  resetAll: () => void;
  syncFromServer: (prefs: Partial<AppearancePreferences>) => void;
  toggleOpen: () => void;
  close: () => void;
  open: () => void;
}

export const useThemeCustomizer = create<ThemeCustomizerState>()(
  persist(
    (set) => ({
      ...DEFAULT_APPEARANCE,
      isOpen: false,
      setAccent: (accentColor) => set({ accentColor, customAccentColor: null }),
      setCustomAccent: (customAccentColor) => set({ customAccentColor }),
      setRadius: (borderRadius) => set({ borderRadius }),
      setFont: (font) => set({ font }),
      setDensity: (density) => set({ density }),
      setTheme: (theme) => set({ theme }),
      setSidebar: (sidebar) => set({ sidebar }),
      setAnimations: (animations) => set({ animations }),
      resetAll: () => set({ ...DEFAULT_APPEARANCE }),
      syncFromServer: (prefs) => set((s) => ({ ...s, ...prefs })),
      toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
      close: () => set({ isOpen: false }),
      open: () => set({ isOpen: true }),
    }),
    { name: 'theme-customizer' },
  ),
);

export {
  ACCENT_PALETTES, FONT_CONFIGS, RADIUS_VALUES, DENSITY_VALUES,
};
