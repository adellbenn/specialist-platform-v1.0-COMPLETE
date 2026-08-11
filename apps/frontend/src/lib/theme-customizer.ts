import {
  ACCENT_PALETTES, RADIUS_VALUES, DENSITY_VALUES, getCustomPalette,
  type AccentPalette, type RadiusScale, type DensityScale, type FontFamily, type AnimationMode,
} from '@/store/theme-customizer.store';

export function applyAccent(palette: AccentPalette, isDark: boolean, customHex?: string | null): void {
  const palettes = customHex ? getCustomPalette(customHex) : (ACCENT_PALETTES[palette] || ACCENT_PALETTES.purple);
  const colors = palettes[isDark ? 'dark' : 'light'];
  const root = document.documentElement;
  for (const [key, value] of Object.entries(colors)) {
    root.style.setProperty(key, value);
  }
}

const RADIUS_BASE: Record<string, number> = {
  '--radius-xs': 2,
  '--radius-sm': 4,
  '--radius-md': 6,
  '--radius-lg': 8,
  '--radius-xl': 12,
  '--radius-2xl': 16,
};

const RADIUS_SCALE: Record<RadiusScale, number> = {
  none: 0,
  sm: 0.5,
  md: 1,
  lg: 1.5,
  xl: 2,
};

export function applyRadius(radius: RadiusScale): void {
  const factor = RADIUS_SCALE[radius] ?? 1;
  const root = document.documentElement;
  for (const [key, px] of Object.entries(RADIUS_BASE)) {
    root.style.setProperty(key, factor === 0 ? '0px' : `${Math.round(px * factor)}px`);
  }
  root.style.setProperty('--radius-none', '0px');
  root.style.setProperty('--radius-full', '9999px');
  root.style.setProperty('--radius', factor === 0 ? '0px' : `${Math.round(RADIUS_BASE['--radius-md'] * factor)}px`);
}

export function applyDensity(density: DensityScale): void {
  const d = DENSITY_VALUES[density] || DENSITY_VALUES.comfortable;
  document.documentElement.style.setProperty('--density-spacing', `${d.spacing * 0.25}rem`);
  document.documentElement.style.setProperty('--density-gap', `${d.gap * 0.25}rem`);
  document.documentElement.style.setProperty('--density-padding', `${d.padding * 0.25}rem`);
  document.documentElement.dataset.density = density;
}

export function applyFont(font: FontFamily): void {
  const FONTS: Record<FontFamily, string> = {
    inter:   "'Inter', sans-serif",
    geist:   "'Geist', sans-serif",
    roboto:  "'Roboto', sans-serif",
    poppins: "'Poppins', sans-serif",
    cairo:   "'Cairo', sans-serif",
    tajawal: "'Tajawal', sans-serif",
  };
  document.documentElement.style.setProperty('--font-family', FONTS[font]);
}

export function applyAnimations(mode: AnimationMode): void {
  const root = document.documentElement;
  root.dataset.motion = mode;
  if (mode === 'disabled') {
    root.style.setProperty('--animation-duration', '0ms');
    root.style.setProperty('--animation-disable', 'none');
  } else if (mode === 'reduced') {
    root.style.setProperty('--animation-duration', '100ms');
    root.style.setProperty('--animation-disable', '');
  } else {
    root.style.setProperty('--animation-duration', '');
    root.style.setProperty('--animation-disable', '');
  }
}
