import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'var(--font-cairo)', 'Cairo', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        /* ═══════════════════════════════════════════════════════════════════════
           NEW TOKEN SYSTEM — Semantic color namespaces
           Source: design-tokens.ts → toTailwindColors()
           These are the canonical Tailwind color tokens for new components.
           ═══════════════════════════════════════════════════════════════════════ */

        brand: {
          DEFAULT: 'var(--brand-primary)',
          hover: 'var(--brand-primary-hover)',
          active: 'var(--brand-primary-active)',
          light: 'var(--brand-primary-light)',
          subtle: 'var(--brand-primary-subtle)',
          foreground: 'var(--brand-primary-foreground)',
        },

        surface: {
          DEFAULT: 'var(--surface-card)',
          secondary: 'var(--surface-background-secondary)',
          background: 'var(--surface-background)',
          'background-secondary': 'var(--surface-background-secondary)',
          card: 'var(--surface-card)',
          'card-hover': 'var(--surface-card-hover)',
          sidebar: 'var(--surface-sidebar)',
          'sidebar-hover': 'var(--surface-sidebar-hover)',
          'sidebar-active': 'var(--surface-sidebar-active)',
          header: 'var(--surface-header)',
          footer: 'var(--surface-footer)',
          border: 'var(--surface-border)',
          'border-strong': 'var(--surface-border-strong)',
          divider: 'var(--surface-divider)',
          overlay: 'var(--surface-overlay)',
          modal: 'var(--surface-modal)',
          popover: 'var(--surface-popover)',
          input: 'var(--surface-input)',
          'input-disabled': 'var(--surface-input-disabled)',
          muted: 'var(--surface-muted)',
          accent: 'var(--surface-accent)',
        },

        'text-token': {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: 'var(--text-muted)',
          disabled: 'var(--text-disabled)',
          inverse: 'var(--text-inverse)',
          link: 'var(--text-link)',
          'link-hover': 'var(--text-link-hover)',
        },

        'icon-token': {
          primary: 'var(--icon-primary)',
          secondary: 'var(--icon-secondary)',
          success: 'var(--icon-success)',
          warning: 'var(--icon-warning)',
          error: 'var(--icon-error)',
          info: 'var(--icon-info)',
          disabled: 'var(--icon-disabled)',
          inverse: 'var(--icon-inverse)',
        },

        /* ═══════════════════════════════════════════════════════════════════════
           BACKWARD-COMPATIBLE ALIASES
           These keep existing Tailwind class names working (bg-primary, text-text-primary, etc.)
           The theme customizer overrides --primary-* at runtime for accent color switching.
           ═══════════════════════════════════════════════════════════════════════ */

        background: 'var(--background)',
        foreground: 'var(--foreground)',

        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },

        primary: {
          50:  'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)',
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
        },

        success: {
          DEFAULT: 'var(--success)',
          light: 'var(--success-light)',
          text: 'var(--success-text)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          light: 'var(--warning-light)',
          text: 'var(--warning-text)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          light: 'var(--danger-light)',
          text: 'var(--danger-text)',
        },
        info: {
          DEFAULT: 'var(--info)',
          light: 'var(--info-light)',
          text: 'var(--info-text)',
        },
        pink: {
          light: 'var(--pink-light)',
          magenta: 'var(--pink-magenta)',
          hot: 'var(--pink-hot)',
        },

        border: {
          DEFAULT: 'var(--border)',
          hover: 'var(--border-hover)',
        },
        ring: 'var(--ring)',

        sidebar: {
          bg: 'var(--sidebar-bg)',
          text: 'var(--sidebar-text)',
          'text-muted': 'var(--sidebar-text-muted)',
          hover: 'var(--sidebar-hover)',
          active: 'var(--sidebar-active)',
        },
        navbar: {
          bg: 'var(--navbar-bg)',
          border: 'var(--navbar-border)',
        },
        overlay: 'var(--overlay)',

        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
        },
      },

      backgroundImage: {
        'gradient-pp': 'linear-gradient(135deg, var(--primary) 0%, var(--primary-300) 100%)',
        'gradient-pink': 'linear-gradient(135deg, var(--pink-hot) 0%, var(--pink-light) 100%)',
      },

      borderRadius: {
        none: 'var(--radius-none)',
        xs:   'var(--radius-xs)',
        sm:   'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },

      boxShadow: {
        'xs':     'var(--shadow-xs)',
        'card':   'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'modal':  'var(--shadow-xl)',
        'dropdown': 'var(--shadow-lg)',
        'sidebar': '1px 0 0 0 var(--surface-border)',
      },

      fontSize: {
        'h1': ['32px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.5px' }],
        'h2': ['28px', { lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.25px' }],
        'h3': ['24px', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-large': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-small': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'small': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        'label': ['14px', { lineHeight: '1.5', fontWeight: '600' }],
      },

      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      spacing: {
        'xs':  'var(--spacing-xs)',
        'sm':  'var(--spacing-sm)',
        'md':  'var(--spacing-md)',
        'lg':  'var(--spacing-lg)',
        'xl':  'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
        '4xl': 'var(--spacing-4xl)',
      },
      maxWidth: {
        'container-sm':  'var(--container-sm)',
        'container-md':  'var(--container-md)',
        'container-lg':  'var(--container-lg)',
        'container-xl':  'var(--container-xl)',
        'container-2xl': 'var(--container-2xl)',
      },
      screens: {
        'mobile': '320px',
        'sm':     '480px',
        'md':     '768px',
        'lg':     '1024px',
        'xl':     '1280px',
        '2xl':    '1536px',
      },
    },
  },
  plugins: [],
};

export default config;
