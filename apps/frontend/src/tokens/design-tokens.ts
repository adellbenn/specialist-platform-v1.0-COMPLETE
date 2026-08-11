/**
 * ============================================================================
 * Design Token Architecture — Specialist Platform Healthcare ERP
 * ============================================================================
 *
 * A production-ready, enterprise-grade design token system for a healthcare ERP
 * platform used by administrators, specialists, therapists, accountants,
 * receptionists, and managers.
 *
 * Architecture:
 *   Layer 1: Primitives   — Raw color values, no semantic meaning
 *   Layer 2: Semantic     — Purpose-driven aliases organized by namespace
 *   Layer 3: Component    — Component-specific tokens referencing semantic layer
 *
 * Design References:
 *   Apple HIG, Microsoft Fluent 2, IBM Carbon, Atlassian DS, Radix UI,
 *   shadcn/ui, Stripe Dashboard, Linear, Notion
 *
 * ============================================================================
 */

// ─── Type Definitions ──────────────────────────────────────────────────────

/** A flat map of CSS variable name → value */
export type CSSVariableMap = Record<string, string>;

/** Recursive token group for TypeScript access */
export type TokenGroup = {
  [key: string]: string | TokenGroup;
};

// ============================================================================
// SECTION 1: PRIMITIVE PALETTE
// ============================================================================
// Raw color values with zero semantic meaning.
// These are the atoms from which all semantic tokens are composed.
// Organized by hue with numeric steps (50–950) for consistency.
// ============================================================================

export const primitives = {
  /** Neutral scale — Cool slate for premium, modern feel (Linear/GitHub-inspired) */
  neutral: {
    0:    '#FFFFFF',
    25:   '#FCFCFD',
    50:   '#F8FAFC',
    75:   '#F3F6FA',
    100:  '#F1F5F9',
    150:  '#E8ECF1',
    200:  '#E2E8F0',
    300:  '#CBD5E1',
    400:  '#94A3B8',
    500:  '#64748B',
    600:  '#475569',
    700:  '#334155',
    800:  '#1E293B',
    850:  '#162032',
    900:  '#0F172A',
    925:  '#0B1120',
    950:  '#020617',
  } as const,

  /** Clinical Blue — Primary brand. Professional, trustworthy, clinical. */
  blue: {
    50:  '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  } as const,

  /** Healthcare Green — Success, positive outcomes, health indicators */
  green: {
    50:  '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  } as const,

  /** Care Orange — Warnings, attention, care indicators */
  orange: {
    50:  '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
    950: '#431407',
  } as const,

  /** Alert Red — Errors, critical alerts, destructive actions */
  red: {
    50:  '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  } as const,

  /** Purple — Supplementary accents, badges, tags */
  purple: {
    50:  '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
    950: '#3B0764',
  } as const,

  /** Teal — Information, neutral-positive indicators */
  teal: {
    50:  '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
    950: '#042F2E',
  } as const,

  /** Pink — Special accents, limited use */
  pink: {
    50:  '#FDF2F8',
    100: '#FCE7F3',
    200: '#FBCFE8',
    300: '#F9A8D4',
    400: '#F472B6',
    500: '#EC4899',
    600: '#DB2777',
    700: '#BE185D',
    800: '#9D174D',
    900: '#831843',
    950: '#500724',
  } as const,
} as const;

// ============================================================================
// SECTION 2: SEMANTIC TOKENS — LIGHT THEME
// ============================================================================
// Purpose-driven color aliases. Each token maps to a primitive and carries
// clear semantic meaning. These are the tokens consumed by components.
// ============================================================================

export const lightTheme = {
  // ─── Brand ──────────────────────────────────────────────────────────────
  // Primary brand identity. Used for CTAs, active states, links, focus rings.
  brand: {
    /** Primary brand color — buttons, links, active indicators */
    primary:             primitives.blue[600],
    /** Primary hover state — slightly darker on hover */
    primaryHover:        primitives.blue[700],
    /** Primary active/pressed state — darkest interactive */
    primaryActive:       primitives.blue[800],
    /** Primary light — tinted background for primary emphasis */
    primaryLight:        primitives.blue[50],
    /** Primary subtle — even lighter tint for minimal emphasis */
    primarySubtle:       '#F0F5FF',
    /** Primary foreground — white text on primary background */
    primaryForeground:   '#FFFFFF',
  },

  // ─── Surface ────────────────────────────────────────────────────────────
  // Structural background colors. Defines the visual hierarchy of layers.
  surface: {
    /** Page background — deepest canvas */
    background:           primitives.neutral[50],
    /** Secondary background — slightly elevated from page */
    backgroundSecondary:  primitives.neutral[75],
    /** Card/panel surface — floating content containers */
    card:                 primitives.neutral[0],
    /** Card hover state — barely perceptible lift */
    cardHover:            primitives.neutral[25],
    /** Sidebar surface — left navigation panel */
    sidebar:              primitives.neutral[0],
    /** Sidebar hover — nav item hover background */
    sidebarHover:         primitives.neutral[50],
    /** Sidebar active — currently selected nav item */
    sidebarActive:        primitives.blue[50],
    /** Header/navbar surface — top navigation bar */
    header:               primitives.neutral[0],
    /** Footer surface — bottom bar */
    footer:               primitives.neutral[50],
    /** Default border color — subtle dividers */
    border:               primitives.neutral[200],
    /** Strong border — emphasis borders, input borders */
    borderStrong:         primitives.neutral[300],
    /** Divider — horizontal/vertical rule separators */
    divider:              primitives.neutral[150],
    /** Overlay/backdrop — modal and dropdown backgrounds */
    overlay:              'rgba(15, 23, 42, 0.5)',
    /** Modal surface — elevated dialog background */
    modal:                primitives.neutral[0],
    /** Popover surface — tooltip, dropdown, popover background */
    popover:              primitives.neutral[0],
    /** Input background — form field backgrounds */
    input:                primitives.neutral[0],
    /** Input disabled — disabled form field background */
    inputDisabled:        primitives.neutral[100],
    /** Muted — subtle background for tags, badges, code blocks */
    muted:                primitives.neutral[100],
    /** Accent — tinted background for contextual emphasis */
    accent:               primitives.blue[50],
  },

  // ─── Text ───────────────────────────────────────────────────────────────
  // Typography color hierarchy. Controls reading flow and emphasis levels.
  text: {
    /** Primary text — headings, body, high-emphasis content */
    primary:    primitives.neutral[900],
    /** Secondary text — descriptions, supporting content */
    secondary:  primitives.neutral[600],
    /** Tertiary text — captions, metadata, timestamps */
    tertiary:   primitives.neutral[500],
    /** Muted text — placeholders, disabled labels */
    muted:      primitives.neutral[500],
    /** Disabled text — non-interactive labels */
    disabled:   primitives.neutral[300],
    /** Inverse text — text on dark/brand backgrounds */
    inverse:    primitives.neutral[0],
    /** Link text — interactive text links */
    link:       primitives.blue[600],
    /** Link hover — text link hover state */
    linkHover:  primitives.blue[700],
  },

  // ─── Icon ───────────────────────────────────────────────────────────────
  // Icon color tokens. Maps to text hierarchy with status awareness.
  icon: {
    /** Default icon color — matches secondary text */
    primary:    primitives.neutral[700],
    /** Secondary icon — lighter icons in supporting contexts */
    secondary:  primitives.neutral[500],
    /** Success icon — positive indicators */
    success:    primitives.green[600],
    /** Warning icon — attention-required indicators */
    warning:    primitives.orange[600],
    /** Error icon — error states, destructive indicators */
    error:      primitives.red[600],
    /** Info icon — informational indicators */
    info:       primitives.blue[600],
    /** Disabled icon — non-interactive icons */
    disabled:   primitives.neutral[300],
    /** Inverse icon — icons on dark/brand backgrounds */
    inverse:    primitives.neutral[0],
  },

  // ─── Interactive ────────────────────────────────────────────────────────
  // States for interactive elements (hover, focus, selection).
  interactive: {
    /** Hover background — element hover state */
    hover:      primitives.neutral[75],
    /** Active/pressed background — mouse-down state */
    active:     primitives.neutral[100],
    /** Focus ring color — keyboard navigation indicator */
    focus:      primitives.blue[500],
    /** Focus ring — CSS outline ring for focus-visible */
    focusRing:  primitives.blue[500],
    /** Selected background — selected/checked state */
    selected:   primitives.blue[50],
    /** Selected border — selected item border accent */
    selectedBorder: primitives.blue[500],
    /** Disabled background — non-interactive element background */
    disabled:   primitives.neutral[100],
    /** Disabled text on disabled background */
    disabledText: primitives.neutral[400],
    /** Pressed — active click state, slightly darker than hover */
    pressed:    primitives.neutral[150],
  },

  // ─── Status ─────────────────────────────────────────────────────────────
  // Semantic status colors for UI indicators and badges.
  status: {
    /** Success — completed, achieved, positive outcome */
    success:     primitives.green[600],
    successLight: primitives.green[50],
    successText:  primitives.green[800],
    /** Warning — attention needed, caution */
    warning:     primitives.orange[600],
    warningLight: primitives.orange[50],
    warningText:  primitives.orange[800],
    /** Error — failure, critical error */
    error:       primitives.red[600],
    errorLight:  primitives.red[50],
    errorText:   primitives.red[800],
    /** Info — informational, neutral-positive */
    info:        primitives.blue[600],
    infoLight:   primitives.blue[50],
    infoText:    primitives.blue[800],
    /** Pending — in-progress, awaiting action */
    pending:     primitives.orange[500],
    pendingLight: primitives.orange[50],
    pendingText:  primitives.orange[800],
    /** Completed — task/session/appointment completed */
    completed:   primitives.green[600],
    completedLight: primitives.green[50],
    completedText:  primitives.green[800],
    /** Cancelled — void, cancelled, no longer active */
    cancelled:   primitives.neutral[400],
    cancelledLight: primitives.neutral[100],
    cancelledText:  primitives.neutral[700],
    /** Scheduled — upcoming, planned */
    scheduled:   primitives.blue[600],
    scheduledLight: primitives.blue[50],
    scheduledText:  primitives.blue[800],
    /** Draft — not yet published/submitted */
    draft:       primitives.neutral[500],
    draftLight:  primitives.neutral[100],
    draftText:   primitives.neutral[700],
    /** Archived — historical, read-only */
    archived:    primitives.neutral[400],
    archivedLight: primitives.neutral[100],
    archivedText:  primitives.neutral[600],
  },

  // ─── Medical Status ─────────────────────────────────────────────────────
  // Patient/clinical status indicators. Critical for healthcare workflows.
  medical: {
    /** Critical — life-threatening, immediate action required */
    critical:      primitives.red[600],
    criticalLight: primitives.red[50],
    criticalText:  primitives.red[800],
    /** Stable — patient is stable, no immediate concerns */
    stable:        primitives.green[600],
    stableLight:   primitives.green[50],
    stableText:    primitives.green[800],
    /** Recovering — patient is in recovery phase */
    recovering:    primitives.teal[600],
    recoveringLight: primitives.teal[50],
    recoveringText:  primitives.teal[800],
    /** Discharged — patient has been discharged */
    discharged:    primitives.neutral[500],
    dischargedLight: primitives.neutral[100],
    dischargedText:  primitives.neutral[700],
    /** Admitted — patient is currently admitted */
    admitted:      primitives.blue[600],
    admittedLight: primitives.blue[50],
    admittedText:  primitives.blue[800],
    /** Observation — patient under observation */
    observation:   primitives.purple[600],
    observationLight: primitives.purple[50],
    observationText:  primitives.purple[800],
    /** Emergency — emergency situation, highest priority */
    emergency:     primitives.red[700],
    emergencyLight: primitives.red[50],
    emergencyText:  primitives.red[900],
  },

  // ─── Appointment Status ─────────────────────────────────────────────────
  // Calendar and scheduling-specific status tokens.
  appointment: {
    /** Confirmed — appointment confirmed by both parties */
    confirmed:      primitives.blue[600],
    confirmedLight: primitives.blue[50],
    /** Checked-in — patient has arrived and checked in */
    checkedIn:      primitives.teal[600],
    checkedInLight: primitives.teal[50],
    /** Completed — appointment session finished */
    completed:      primitives.green[600],
    completedLight: primitives.green[50],
    /** Missed — patient did not attend (no-show) */
    missed:         primitives.orange[600],
    missedLight:    primitives.orange[50],
    /** Cancelled — appointment was cancelled */
    cancelled:      primitives.neutral[400],
    cancelledLight: primitives.neutral[100],
    /** Rescheduled — appointment moved to new date/time */
    rescheduled:    primitives.purple[600],
    rescheduledLight: primitives.purple[50],
    /** Waiting — patient is in waiting area */
    waiting:        primitives.orange[500],
    waitingLight:   primitives.orange[50],
  },

  // ─── Payment Status ─────────────────────────────────────────────────────
  // Financial transaction status tokens.
  payment: {
    /** Paid — payment successfully processed */
    paid:       primitives.green[600],
    paidLight:  primitives.green[50],
    paidText:   primitives.green[800],
    /** Pending — payment awaiting processing */
    pending:    primitives.orange[500],
    pendingLight: primitives.orange[50],
    pendingText:  primitives.orange[800],
    /** Overdue — payment past due date */
    overdue:    primitives.red[600],
    overdueLight: primitives.red[50],
    overdueText:  primitives.red[800],
    /** Refunded — payment returned to patient */
    refunded:   primitives.blue[600],
    refundedLight: primitives.blue[50],
    refundedText:  primitives.blue[800],
    /** Failed — payment processing failed */
    failed:     primitives.red[700],
    failedLight: primitives.red[50],
    failedText:  primitives.red[900],
  },

  // ─── Priority ───────────────────────────────────────────────────────────
  // Task/work-item priority levels.
  priority: {
    /** Low priority — can be deferred */
    low:       primitives.neutral[400],
    lowLight:  primitives.neutral[100],
    lowText:   primitives.neutral[700],
    /** Medium priority — standard urgency */
    medium:    primitives.blue[500],
    mediumLight: primitives.blue[50],
    mediumText:  primitives.blue[800],
    /** High priority — needs prompt attention */
    high:      primitives.orange[600],
    highLight: primitives.orange[50],
    highText:  primitives.orange[800],
    /** Urgent — requires immediate action */
    urgent:    primitives.red[500],
    urgentLight: primitives.red[50],
    urgentText:  primitives.red[800],
    /** Critical — highest priority, emergency-level */
    critical:  primitives.red[700],
    criticalLight: primitives.red[50],
    criticalText:  primitives.red[900],
  },

  // ─── Role Colors ────────────────────────────────────────────────────────
  // Unique color identity for each user role. Used for avatars, badges, tags.
  role: {
    /** Super Administrator — deepest blue, authority */
    superAdmin:      primitives.blue[700],
    superAdminLight: primitives.blue[50],
    /** Center Manager — teal, management */
    centerManager:   primitives.teal[600],
    centerManagerLight: primitives.teal[50],
    /** Supervisor — purple, oversight */
    supervisor:      primitives.purple[600],
    supervisorLight: primitives.purple[50],
    /** Specialist — indigo, professional */
    specialist:      primitives.blue[600],
    specialistLight: primitives.blue[50],
    /** Receptionist — teal, welcoming */
    receptionist:    primitives.teal[500],
    receptionistLight: primitives.teal[50],
    /** Accountant — green, financial */
    accountant:      primitives.green[600],
    accountantLight: primitives.green[50],
  },

  // ─── Chart Palette ──────────────────────────────────────────────────────
  // 12 perceptually distinct colors for data visualization.
  // Optimized for pie, bar, line, area, and heatmap charts.
  // Avoids adjacent-hue confusion; maintains 3:1+ contrast on white.
  chart: {
    1:  primitives.blue[600],    // Primary data series
    2:  primitives.purple[500],  // Secondary series
    3:  primitives.teal[500],    // Tertiary series
    4:  primitives.orange[500],  // Fourth series
    5:  primitives.pink[500],    // Fifth series
    6:  primitives.green[500],   // Sixth series
    7:  primitives.blue[400],    // Seventh series
    8:  primitives.red[500],     // Eighth series
    9:  primitives.teal[700],    // Ninth series
    10: primitives.orange[700],  // Tenth series
    11: primitives.purple[700],  // Eleventh series
    12: primitives.neutral[500], // Twelfth series (neutral fallback)
  },

  // ─── Avatar Colors ──────────────────────────────────────────────────────
  // 12 harmonious background colors for user avatars.
  // Each paired with a white foreground. Cycled by user index.
  avatar: {
    1:  primitives.blue[600],
    2:  primitives.purple[600],
    3:  primitives.teal[600],
    4:  primitives.orange[600],
    5:  primitives.pink[600],
    6:  primitives.green[600],
    7:  primitives.red[600],
    8:  primitives.blue[800],
    9:  primitives.purple[800],
    10: primitives.teal[700],
    11: primitives.orange[700],
    12: primitives.neutral[700],
  },

  // ─── Badge Variants ─────────────────────────────────────────────────────
  // Badge appearance tokens. Each badge semantic color has soft/outline/solid.
  badge: {
    /** Soft — tinted background, colored text (default) */
    softBg:    primitives.blue[50],
    softText:  primitives.blue[700],
    /** Outline — transparent background, colored border + text */
    outlineBg: 'transparent',
    outlineBorder: primitives.blue[300],
    outlineText:   primitives.blue[700],
    /** Solid — filled background, white text */
    solidBg:   primitives.blue[600],
    solidText: primitives.neutral[0],
    /** Subtle — very faint background, muted text */
    subtleBg:  primitives.neutral[100],
    subtleText: primitives.neutral[600],
  },

  // ─── Focus Ring ─────────────────────────────────────────────────────────
  // Consistent focus indicators for keyboard accessibility (WCAG 2.4.7).
  focus: {
    /** Focus ring color */
    color:   primitives.blue[500],
    /** Focus ring offset from element */
    offset:  '2px',
    /** Focus ring width */
    width:   '2px',
    /** Focus ring style */
    style:   'solid',
    /** Composite focus ring CSS value for light theme */
    ring:    `0 0 0 var(--focus-width, 2px) var(--focus-color, ${primitives.blue[500]})`,
  },

  // ─── Shadows ────────────────────────────────────────────────────────────
  // Elevation system via box-shadows. Subtle, diffused shadows for depth.
  // No harsh edges. Optimized for light backgrounds.
  shadow: {
    /** XS — barely visible lift (subtle cards, inputs) */
    xs:   '0 1px 2px rgba(0, 0, 0, 0.04)',
    /** SM — slight elevation (dropdowns, popovers) */
    sm:   '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
    /** MD — moderate elevation (cards, panels) */
    md:   '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
    /** LG — significant elevation (modals, floating elements) */
    lg:   '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
    /** XL — maximum elevation (dialog, toast stack) */
    xl:   '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
    /** Ring — focus/elevation ring without shadow */
    ring: '0 0 0 3px rgba(37, 99, 235, 0.15)',
  },

  // ─── Border Radius ──────────────────────────────────────────────────────
  // Consistent rounding scale. Matches shadcn/ui and Radix conventions.
  radius: {
    /** XS — pills, badges, tags */
    none: '0px',
    xs:   '2px',
    /** SM — buttons, inputs */
    sm:   '4px',
    /** MD — cards, panels */
    md:   '6px',
    /** LG — modals, large cards */
    lg:   '8px',
    /** XL — dialogs, popovers */
    xl:   '12px',
    /** 2XL — hero sections, large containers */
    '2xl': '16px',
    /** Full — circles, pills */
    full: '9999px',
  },

  // ─── Opacity ────────────────────────────────────────────────────────────
  // Standardized opacity levels for overlays, disabled states, and emphasis.
  opacity: {
    /** Fully transparent */
    transparent: '0',
    /** Hover overlay — very subtle */
    hover:    '0.04',
    /** Active/pressed overlay */
    active:   '0.08',
    /** Disabled — reduces visual prominence */
    disabled: '0.5',
    /** Subtle overlay — backdrop */
    subtle:   '0.3',
    /** Medium overlay — modal backdrop */
    medium:   '0.5',
    /** Strong overlay — high-contrast backdrop */
    strong:   '0.75',
    /** Fully opaque */
    opaque:   '1',
  },

  // ─── Gradients (RESTRICTED) ────────────────────────────────────────────
  // Only for: landing pages, hero banners, marketing cards.
  // NEVER for: buttons, tables, forms, cards, inputs.
  gradient: {
    /** Hero gradient — landing page hero sections */
    hero:        `linear-gradient(135deg, ${primitives.blue[600]} 0%, ${primitives.purple[600]} 100%)`,
    /** Marketing accent — promotional banners */
    marketing:   `linear-gradient(135deg, ${primitives.blue[500]} 0%, ${primitives.teal[500]} 100%)`,
    /** Subtle brand — watermark-style backgrounds */
    subtleBrand: `linear-gradient(180deg, ${primitives.blue[50]} 0%, ${primitives.neutral[0]} 100%)`,
  },
} as const;

// ============================================================================
// SECTION 3: SEMANTIC TOKENS — DARK THEME
// ============================================================================
// NOT a simple inversion. Dark theme uses elevated surfaces, muted colors,
// and cool undertones (inspired by GitHub Dark, Linear, Stripe Night).
//
// Key principles:
//   - Backgrounds use cool dark (slight blue undertone)
//   - Surfaces are elevated, not inverted
//   - Primary colors are brightened for contrast on dark backgrounds
//   - Borders replace shadows for depth definition
//   - Text is slightly muted, never pure white (except inverse)
// ============================================================================

export const darkTheme = {
  brand: {
    primary:             primitives.blue[500],
    primaryHover:        primitives.blue[400],
    primaryActive:       primitives.blue[300],
    primaryLight:        '#1A2744',
    primarySubtle:       '#111D33',
    primaryForeground:   '#FFFFFF',
  },

  surface: {
    background:           '#0B0F19',
    backgroundSecondary:  '#111827',
    card:                 '#151D2C',
    cardHover:            '#1A2438',
    sidebar:              '#0D1220',
    sidebarHover:         '#151D2C',
    sidebarActive:        '#1A2744',
    header:               '#0D1220',
    footer:               '#0B0F19',
    border:               '#1E293B',
    borderStrong:         '#334155',
    divider:              '#1A2234',
    overlay:              'rgba(0, 0, 0, 0.65)',
    modal:                '#151D2C',
    popover:              '#151D2C',
    input:                '#111827',
    inputDisabled:        '#1A2234',
    muted:                '#1A2234',
    accent:               '#1A2744',
  },

  text: {
    primary:    '#F1F5F9',
    secondary:  '#94A3B8',
    tertiary:   '#64748B',
    muted:      '#8494AB',
    disabled:   '#334155',
    inverse:    '#0F172A',
    link:       primitives.blue[400],
    linkHover:  primitives.blue[300],
  },

  icon: {
    primary:    '#CBD5E1',
    secondary:  '#64748B',
    success:    primitives.green[400],
    warning:    primitives.orange[400],
    error:      primitives.red[400],
    info:       primitives.blue[400],
    disabled:   '#334155',
    inverse:    '#0F172A',
  },

  interactive: {
    hover:      '#1A2234',
    active:     '#1E293B',
    focus:      primitives.blue[500],
    focusRing:  primitives.blue[500],
    selected:   '#1A2744',
    selectedBorder: primitives.blue[500],
    disabled:   '#151D2C',
    disabledText: '#334155',
    pressed:    '#1E293B',
  },

  status: {
    success:      primitives.green[500],
    successLight: '#0D2818',
    successText:  primitives.green[300],
    warning:      primitives.orange[400],
    warningLight: '#2D1B06',
    warningText:  primitives.orange[300],
    error:        primitives.red[500],
    errorLight:   '#2D0F0F',
    errorText:    primitives.red[300],
    info:         primitives.blue[400],
    infoLight:    '#0F1D33',
    infoText:     primitives.blue[300],
    pending:      primitives.orange[400],
    pendingLight: '#2D1B06',
    pendingText:  primitives.orange[300],
    completed:    primitives.green[500],
    completedLight: '#0D2818',
    completedText:  primitives.green[300],
    cancelled:    '#475569',
    cancelledLight: '#1A2234',
    cancelledText:  '#94A3B8',
    scheduled:    primitives.blue[400],
    scheduledLight: '#0F1D33',
    scheduledText:  primitives.blue[300],
    draft:        '#64748B',
    draftLight:   '#1A2234',
    draftText:    '#94A3B8',
    archived:     '#475569',
    archivedLight: '#1A2234',
    archivedText:  '#64748B',
  },

  medical: {
    critical:      primitives.red[500],
    criticalLight: '#2D0F0F',
    criticalText:  primitives.red[300],
    stable:        primitives.green[500],
    stableLight:   '#0D2818',
    stableText:    primitives.green[300],
    recovering:    primitives.teal[400],
    recoveringLight: '#0D2420',
    recoveringText:  primitives.teal[300],
    discharged:    '#64748B',
    dischargedLight: '#1A2234',
    dischargedText:  '#94A3B8',
    admitted:      primitives.blue[400],
    admittedLight: '#0F1D33',
    admittedText:  primitives.blue[300],
    observation:   primitives.purple[400],
    observationLight: '#1F1533',
    observationText:  primitives.purple[300],
    emergency:     primitives.red[400],
    emergencyLight: '#2D0F0F',
    emergencyText:  primitives.red[300],
  },

  appointment: {
    confirmed:      primitives.blue[400],
    confirmedLight: '#0F1D33',
    checkedIn:      primitives.teal[400],
    checkedInLight: '#0D2420',
    completed:      primitives.green[500],
    completedLight: '#0D2818',
    missed:         primitives.orange[400],
    missedLight:    '#2D1B06',
    cancelled:      '#475569',
    cancelledLight: '#1A2234',
    rescheduled:    primitives.purple[400],
    rescheduledLight: '#1F1533',
    waiting:        primitives.orange[400],
    waitingLight:   '#2D1B06',
  },

  payment: {
    paid:       primitives.green[500],
    paidLight:  '#0D2818',
    paidText:   primitives.green[300],
    pending:    primitives.orange[400],
    pendingLight: '#2D1B06',
    pendingText:  primitives.orange[300],
    overdue:    primitives.red[500],
    overdueLight: '#2D0F0F',
    overdueText:  primitives.red[300],
    refunded:   primitives.blue[400],
    refundedLight: '#0F1D33',
    refundedText:  primitives.blue[300],
    failed:     primitives.red[400],
    failedLight: '#2D0F0F',
    failedText:  primitives.red[300],
  },

  priority: {
    low:       '#475569',
    lowLight:  '#1A2234',
    lowText:   '#94A3B8',
    medium:    primitives.blue[400],
    mediumLight: '#0F1D33',
    mediumText:  primitives.blue[300],
    high:      primitives.orange[400],
    highLight: '#2D1B06',
    highText:  primitives.orange[300],
    urgent:    primitives.red[400],
    urgentLight: '#2D0F0F',
    urgentText:  primitives.red[300],
    critical:  primitives.red[500],
    criticalLight: '#2D0F0F',
    criticalText:  primitives.red[300],
  },

  role: {
    superAdmin:      primitives.blue[400],
    superAdminLight: '#0F1D33',
    centerManager:   primitives.teal[400],
    centerManagerLight: '#0D2420',
    supervisor:      primitives.purple[400],
    supervisorLight: '#1F1533',
    specialist:      primitives.blue[500],
    specialistLight: '#0F1D33',
    receptionist:    primitives.teal[500],
    receptionistLight: '#0D2420',
    accountant:      primitives.green[500],
    accountantLight: '#0D2818',
  },

  chart: {
    1:  primitives.blue[400],
    2:  primitives.purple[400],
    3:  primitives.teal[400],
    4:  primitives.orange[400],
    5:  primitives.pink[400],
    6:  primitives.green[400],
    7:  primitives.blue[300],
    8:  primitives.red[400],
    9:  primitives.teal[300],
    10: primitives.orange[300],
    11: primitives.purple[300],
    12: primitives.neutral[400],
  },

  avatar: {
    1:  primitives.blue[500],
    2:  primitives.purple[500],
    3:  primitives.teal[500],
    4:  primitives.orange[500],
    5:  primitives.pink[500],
    6:  primitives.green[500],
    7:  primitives.red[500],
    8:  primitives.blue[700],
    9:  primitives.purple[700],
    10: primitives.teal[600],
    11: primitives.orange[600],
    12: primitives.neutral[500],
  },

  badge: {
    softBg:    '#1A2744',
    softText:  primitives.blue[300],
    outlineBg: 'transparent',
    outlineBorder: primitives.blue[700],
    outlineText:   primitives.blue[300],
    solidBg:   primitives.blue[600],
    solidText: '#FFFFFF',
    subtleBg:  '#1A2234',
    subtleText: primitives.neutral[400],
  },

  focus: {
    color:   primitives.blue[500],
    offset:  '2px',
    width:   '2px',
    style:   'solid',
    ring:    `0 0 0 var(--focus-width, 2px) var(--focus-color, ${primitives.blue[500]})`,
  },

  shadow: {
    xs:   '0 1px 2px rgba(0, 0, 0, 0.2)',
    sm:   '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
    md:   '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
    lg:   '0 10px 15px -3px rgba(0, 0, 0, 0.35), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
    xl:   '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
    ring: '0 0 0 3px rgba(96, 165, 250, 0.2)',
  },

  radius: {
    none: '0px',
    xs:   '2px',
    sm:   '4px',
    md:   '6px',
    lg:   '8px',
    xl:   '12px',
    '2xl': '16px',
    full: '9999px',
  },

  opacity: {
    transparent: '0',
    hover:    '0.06',
    active:   '0.10',
    disabled: '0.4',
    subtle:   '0.2',
    medium:   '0.5',
    strong:   '0.7',
    opaque:   '1',
  },

  gradient: {
    hero:        `linear-gradient(135deg, ${primitives.blue[600]} 0%, ${primitives.purple[600]} 100%)`,
    marketing:   `linear-gradient(135deg, ${primitives.blue[500]} 0%, ${primitives.teal[500]} 100%)`,
    subtleBrand: `linear-gradient(180deg, #1A2744 0%, #0B0F19 100%)`,
  },
} as const;

// ============================================================================
// SECTION 4: COMPONENT TOKENS
// ============================================================================
// Component-level tokens that reference semantic tokens.
// These provide the final layer of abstraction before CSS variables.
// ============================================================================

function buildComponentTokens(theme: typeof lightTheme | typeof darkTheme) {
  return {
    // ─── Button ─────────────────────────────────────────────────────────
    button: {
      primary: {
        background:       theme.brand.primary,
        backgroundHover:   theme.brand.primaryHover,
        backgroundActive:  theme.brand.primaryActive,
        foreground:        theme.brand.primaryForeground,
        border:            'none',
        borderRadius:      '8px',
        padding:           '10px 24px',
        fontSize:          '14px',
        fontWeight:        '600',
        boxShadowHover:    `0 4px 12px rgba(37, 99, 235, 0.3)`,
        disabledBg:        theme.interactive.disabled,
        disabledFg:        theme.interactive.disabledText,
        disabledOpacity:   '0.6',
        focusRing:         theme.focus.ring,
      },
      secondary: {
        background:       theme.surface.card,
        backgroundHover:  theme.surface.accent,
        foreground:       theme.brand.primary,
        border:           `2px solid ${theme.brand.primary}`,
        borderRadius:     '8px',
        padding:          '10px 24px',
        fontSize:         '14px',
        fontWeight:       '600',
        borderColorHover: theme.brand.primaryHover,
        disabledBg:       theme.interactive.disabled,
        disabledFg:       theme.interactive.disabledText,
      },
      success: {
        background:       theme.status.success,
        backgroundHover:  theme.status.completed,
        foreground:       '#FFFFFF',
        border:           'none',
        borderRadius:     '8px',
        padding:          '10px 24px',
        fontSize:         '14px',
        fontWeight:       '600',
        boxShadowHover:   `0 4px 12px rgba(22, 163, 74, 0.3)`,
        disabledBg:       theme.interactive.disabled,
        disabledFg:       theme.interactive.disabledText,
      },
      danger: {
        background:       theme.status.error,
        backgroundHover:  primitives.red[700],
        foreground:       '#FFFFFF',
        border:           'none',
        borderRadius:     '8px',
        padding:          '10px 24px',
        fontSize:         '14px',
        fontWeight:       '600',
        boxShadowHover:   `0 4px 12px rgba(220, 38, 38, 0.3)`,
        disabledBg:       theme.interactive.disabled,
        disabledFg:       theme.interactive.disabledText,
      },
      ghost: {
        background:       'transparent',
        backgroundHover:  theme.surface.accent,
        foreground:       theme.brand.primary,
        border:           'none',
        borderRadius:     '8px',
        padding:          '10px 24px',
        fontSize:         '14px',
        fontWeight:       '600',
        disabledFg:       theme.interactive.disabledText,
      },
    },

    // ─── Card ───────────────────────────────────────────────────────────
    card: {
      default: {
        background:       theme.surface.card,
        borderRadius:     '12px',
        padding:          '24px',
        shadow:           '0 1px 3px rgba(0, 0, 0, 0.1)',
        border:           `1px solid ${theme.surface.border}`,
        shadowHover:      '0 4px 12px rgba(0, 0, 0, 0.1)',
        borderHover:      theme.surface.borderStrong,
      },
      elevated: {
        background:       theme.surface.card,
        borderRadius:     '12px',
        padding:          '24px',
        shadow:           '0 10px 30px rgba(0, 0, 0, 0.15)',
        border:           'none',
        shadowHover:      '0 10px 30px rgba(0, 0, 0, 0.15)',
        borderHover:      'none',
      },
      outlined: {
        background:       theme.surface.card,
        borderRadius:     '12px',
        padding:          '24px',
        shadow:           'none',
        border:           `2px solid ${theme.brand.primary}`,
        shadowHover:      'none',
        borderHover:      theme.brand.primaryHover,
      },
    },

    // ─── Input ──────────────────────────────────────────────────────────
    input: {
      default: {
        background:             theme.surface.input,
        backgroundDisabled:     theme.surface.inputDisabled,
        border:                 `2px solid ${theme.surface.borderStrong}`,
        borderRadius:           '8px',
        padding:                '12px 16px',
        fontSize:               '14px',
        text:                   theme.text.primary,
        placeholder:            theme.text.muted,
        label:                  theme.text.primary,
        helperText:             theme.text.secondary,
        borderFocus:            theme.brand.primary,
        focusRing:              '0 0 0 3px rgba(37, 99, 235, 0.1)',
        disabledBg:             theme.surface.inputDisabled,
        disabledOpacity:        '0.6',
      },
      error: {
        border:                 theme.status.error,
        focusRing:              '0 0 0 3px rgba(239, 68, 68, 0.1)',
        errorBorder:            theme.status.error,
        errorText:              theme.status.errorText,
      },
      success: {
        border:                 theme.status.success,
        focusRing:              '0 0 0 3px rgba(34, 197, 94, 0.1)',
      },
    },

    // ─── Modal ──────────────────────────────────────────────────────────
    modal: {
      overlay:          theme.surface.overlay,
      background:       theme.surface.modal,
      border:           theme.surface.border,
      shadow:           theme.shadow.xl,
      title:            theme.text.primary,
      description:      theme.text.secondary,
    },

    // ─── Dropdown/Popover ───────────────────────────────────────────────
    popover: {
      background:       theme.surface.popover,
      border:           theme.surface.border,
      shadow:           theme.shadow.lg,
      itemHover:        theme.interactive.hover,
      itemActive:       theme.interactive.active,
      itemSelected:     theme.interactive.selected,
      itemText:         theme.text.primary,
      itemMutedText:    theme.text.secondary,
      divider:          theme.surface.divider,
    },

    // ─── Table ──────────────────────────────────────────────────────────
    table: {
      background:       theme.surface.card,
      headerBg:         theme.surface.backgroundSecondary,
      headerText:       theme.text.secondary,
      rowHover:         theme.interactive.hover,
      rowSelected:      theme.interactive.selected,
      border:           theme.surface.divider,
      cellText:         theme.text.primary,
      cellMutedText:    theme.text.secondary,
    },

    // ─── Sidebar ────────────────────────────────────────────────────────
    sidebar: {
      background:       theme.surface.sidebar,
      text:             theme.text.primary,
      textMuted:        theme.text.muted,
      hover:            theme.surface.sidebarHover,
      active:           theme.surface.sidebarActive,
      activeText:       theme.brand.primary,
      border:           theme.surface.border,
    },

    // ─── Navbar ─────────────────────────────────────────────────────────
    navbar: {
      background:       theme.surface.header,
      border:           theme.surface.border,
      text:             theme.text.primary,
      textMuted:        theme.text.muted,
    },

    // ─── Badge ──────────────────────────────────────────────────────────
    badge: {
      softBg:           theme.badge.softBg,
      softText:         theme.badge.softText,
      outlineBg:        theme.badge.outlineBg,
      outlineBorder:    theme.badge.outlineBorder,
      outlineText:      theme.badge.outlineText,
      solidBg:          theme.badge.solidBg,
      solidText:        theme.badge.solidText,
      subtleBg:         theme.badge.subtleBg,
      subtleText:       theme.badge.subtleText,
    },

    // ─── Toast/Notification ─────────────────────────────────────────────
    toast: {
      successBg:        theme.status.successLight,
      successBorder:    theme.status.success,
      successText:      theme.status.successText,
      warningBg:        theme.status.warningLight,
      warningBorder:    theme.status.warning,
      warningText:      theme.status.warningText,
      errorBg:          theme.status.errorLight,
      errorBorder:      theme.status.error,
      errorText:        theme.status.errorText,
      infoBg:           theme.status.infoLight,
      infoBorder:       theme.status.info,
      infoText:         theme.status.infoText,
    },
  };
}

// ============================================================================
// SECTION 5: LAYOUT TOKENS — Spacing, Containers, Breakpoints
// ============================================================================
// Layout system. 8px base unit. Responsive containers and breakpoints.
// These are theme-independent (same for light and dark).
// ============================================================================

/** Spacing scale — 8px base system */
export const spacing = {
  'xs':  '4px',
  'sm':  '8px',
  'md':  '16px',
  'lg':  '24px',
  'xl':  '32px',
  '2xl': '48px',
  '3xl': '64px',
  '4xl': '96px',
} as const;

/** Container max-widths */
export const containers = {
  'sm':  '480px',
  'md':  '768px',
  'lg':  '1024px',
  'xl':  '1280px',
  '2xl': '1536px',
} as const;

/** Responsive breakpoints */
export const breakpoints = {
  'mobile': '320px',
  'sm':     '480px',
  'md':     '768px',
  'lg':     '1024px',
  'xl':     '1280px',
  '2xl':    '1536px',
} as const;

// ============================================================================
// SECTION 6: TYPOGRAPHY TOKENS
// ============================================================================
// Type scale. Inter/Cairo font stack. Consistent sizing and weight hierarchy.
// ============================================================================

export const typography = {
  /** H1 — Page titles, hero headings */
  h1: {
    fontSize:      '32px',
    fontWeight:    700,
    lineHeight:    1.2,
    letterSpacing: '-0.5px',
    fontFamily:    '"Inter", "Segoe UI", sans-serif',
    color:         'neutral-900',
  },
  /** H2 — Section headings */
  h2: {
    fontSize:      '28px',
    fontWeight:    700,
    lineHeight:    1.3,
    letterSpacing: '-0.25px',
    color:         'neutral-900',
  },
  /** H3 — Subsection headings */
  h3: {
    fontSize:      '24px',
    fontWeight:    600,
    lineHeight:    1.4,
    color:         'neutral-900',
  },
  /** H4 — Card titles, minor headings */
  h4: {
    fontSize:      '20px',
    fontWeight:    600,
    lineHeight:    1.4,
    color:         'neutral-800',
  },
  /** Body large — Intro paragraphs, hero body */
  'body-large': {
    fontSize:      '18px',
    fontWeight:    400,
    lineHeight:    1.6,
    color:         'neutral-700',
  },
  /** Body regular — Default body text */
  'body-regular': {
    fontSize:      '16px',
    fontWeight:    400,
    lineHeight:    1.6,
    color:         'neutral-700',
  },
  /** Body small — Secondary body text, dense UI */
  'body-small': {
    fontSize:      '14px',
    fontWeight:    400,
    lineHeight:    1.5,
    color:         'neutral-600',
  },
  /** Caption — Timestamps, metadata, helper text */
  caption: {
    fontSize:      '12px',
    fontWeight:    500,
    lineHeight:    1.4,
    color:         'neutral-500',
  },
  /** Label — Form labels, field names */
  label: {
    fontSize:      '14px',
    fontWeight:    600,
    lineHeight:    1.5,
    color:         'neutral-700',
  },
} as const;

/** Typography type for TypeScript consumers */
export type TypographyScale = typeof typography;
export type TypographyKey = keyof TypographyScale;

// ============================================================================
// SECTION 6: THEME GENERATION
// ============================================================================
// Utility functions to flatten token maps into CSS custom property strings
// and provide typed access for TypeScript consumers.
// ============================================================================

/** Flatten a nested token group into CSS variable entries */
function flattenTokens(
  obj: Record<string, any>,
  prefix: string = '',
): CSSVariableMap {
  const result: CSSVariableMap = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const varName = prefix ? `${prefix}-${key}` : key;
    if (typeof value === 'string') {
      result[`--${varName}`] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenTokens(value, varName));
    }
  }
  return result;
}

/** Generate CSS custom properties for a theme */
export function generateCSSVariables(
  theme: typeof lightTheme | typeof darkTheme,
  prefix: string = '',
): string {
  const flat = flattenTokens(theme as any, prefix);
  return Object.entries(flat)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
}

/** Generate the complete :root CSS block */
export function generateRootCSS(): string {
  const light = generateCSSVariables(lightTheme);
  const dark = generateCSSVariables(darkTheme);

  return `
:root {
${light}
}

.dark {
${dark}
}
`.trim();
}

// ─── Typed Token Access ──────────────────────────────────────────────────

/** Component tokens for light theme */
export const lightComponents = buildComponentTokens(lightTheme);
/** Component tokens for dark theme */
export const darkComponents = buildComponentTokens(darkTheme);

/** Full light theme (semantic + component tokens) */
export const light = {
  ...lightTheme,
  component: lightComponents,
};

/** Full dark theme (semantic + component tokens) */
export const dark = {
  ...darkTheme,
  component: darkComponents,
};

// ─── Tailwind Config Helpers ─────────────────────────────────────────────

/** Flatten theme tokens into a color map suitable for Tailwind's theme.extend.colors */
export function toTailwindColors(theme: typeof lightTheme | typeof darkTheme): Record<string, any> {
  const result: Record<string, any> = {};

  // Brand
  result.brand = {
    DEFAULT: theme.brand.primary,
    hover: theme.brand.primaryHover,
    active: theme.brand.primaryActive,
    light: theme.brand.primaryLight,
    subtle: theme.brand.primarySubtle,
    foreground: theme.brand.primaryForeground,
  };

  // Surface
  result.surface = {
    DEFAULT: theme.surface.card,
    background: theme.surface.background,
    'background-secondary': theme.surface.backgroundSecondary,
    card: theme.surface.card,
    'card-hover': theme.surface.cardHover,
    sidebar: theme.surface.sidebar,
    'sidebar-hover': theme.surface.sidebarHover,
    'sidebar-active': theme.surface.sidebarActive,
    header: theme.surface.header,
    footer: theme.surface.footer,
    border: theme.surface.border,
    'border-strong': theme.surface.borderStrong,
    divider: theme.surface.divider,
    overlay: theme.surface.overlay,
    modal: theme.surface.modal,
    popover: theme.surface.popover,
    input: theme.surface.input,
    'input-disabled': theme.surface.inputDisabled,
    muted: theme.surface.muted,
    accent: theme.surface.accent,
  };

  // Text
  result.text = {
    primary: theme.text.primary,
    secondary: theme.text.secondary,
    tertiary: theme.text.tertiary,
    muted: theme.text.muted,
    disabled: theme.text.disabled,
    inverse: theme.text.inverse,
    link: theme.text.link,
    'link-hover': theme.text.linkHover,
  };

  // Icon
  result.icon = {
    primary: theme.icon.primary,
    secondary: theme.icon.secondary,
    success: theme.icon.success,
    warning: theme.icon.warning,
    error: theme.icon.error,
    info: theme.icon.info,
    disabled: theme.icon.disabled,
    inverse: theme.icon.inverse,
  };

  // Status
  result.success = { DEFAULT: theme.status.success, light: theme.status.successLight, text: theme.status.successText };
  result.warning = { DEFAULT: theme.status.warning, light: theme.status.warningLight, text: theme.status.warningText };
  result.danger  = { DEFAULT: theme.status.error, light: theme.status.errorLight, text: theme.status.errorText };
  result.error   = { DEFAULT: theme.status.error, light: theme.status.errorLight, text: theme.status.errorText };
  result.info    = { DEFAULT: theme.status.info, light: theme.status.infoLight, text: theme.status.infoText };

  // Chart
  result.chart = Object.fromEntries(
    Object.entries(theme.chart).map(([k, v]) => [k, v])
  );

  // Avatar
  result.avatar = Object.fromEntries(
    Object.entries(theme.avatar).map(([k, v]) => [k, v])
  );

  // Priority
  result.priority = Object.fromEntries(
    Object.entries(theme.priority).map(([k, v]) => [k, v])
  );

  return result;
}

// ─── Default Export ──────────────────────────────────────────────────────

const designTokens = {
  primitives,
  light: lightTheme,
  dark: darkTheme,
  lightComponents,
  darkComponents,
  spacing,
  containers,
  breakpoints,
  typography,
  generateRootCSS,
  toTailwindColors,
};

export default designTokens;
