/**
 * Safe Tech Billing — Typed Design System Bridge
 * Strictly derived from prototype HTML dark theme tokens in Safe Tech Billing (3).html
 */

export const theme = {
  colors: {
    // Canvas & Layout Surfaces
    bg: '#0D121A',
    surface: '#151C27',
    surface2: '#111823',
    sideBg: '#0A0F17',
    sideInk: '#B9C5DA',
    sideActive: '#18263D',
    sideMuted: '#66748C',

    // Borders & Structural Dividers
    line: '#243042',
    lineStrong: '#33425A',

    // Primary Accents
    accent: '#6E9CF0',
    accentInk: '#0B1424',
    accentSoft: '#18273F',
    accentHover: '#8FB3F5',

    // Typography Ink
    ink: '#E5EAF2',
    muted: '#9AA6BA',
    faint: '#6F7B90',

    // Semantic Status States
    ok: '#5CC58C',
    okSoft: '#13291D',
    warn: '#E3A54A',
    warnSoft: '#2C2112',
    bad: '#F07A70',
    badSoft: '#2E1614',
    info: '#7EA6F0',
    infoSoft: '#18273F',
    neutralSoft: '#1C2533',
  },
  fonts: {
    ui: ['"IBM Plex Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
    num: ['"IBM Plex Mono"', 'ui-monospace', '"SFMono-Regular"', 'Menlo', 'monospace'],
    doc: ['Questrial', '"Century Gothic"', '"Avenir Next"', 'sans-serif'],
    docTitle: ['Poppins', '"Century Gothic"', 'sans-serif'],
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '10px',
  },
} as const;

export type ThemeColors = typeof theme.colors;
export type ThemeFonts = typeof theme.fonts;
export type ThemeRadius = typeof theme.radius;

/**
 * CSS Variable Mapping Bridge for programmatic styling & canvas exports.
 */
export const cssVarMap: Record<keyof ThemeColors, string> = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface-2)',
  sideBg: 'var(--side-bg)',
  sideInk: 'var(--side-ink)',
  sideActive: 'var(--side-active)',
  sideMuted: 'var(--side-muted)',
  line: 'var(--line)',
  lineStrong: 'var(--line-strong)',
  accent: 'var(--accent)',
  accentInk: 'var(--accent-ink)',
  accentSoft: 'var(--accent-soft)',
  accentHover: 'var(--accent-hover)',
  ink: 'var(--ink)',
  muted: 'var(--muted)',
  faint: 'var(--faint)',
  ok: 'var(--ok)',
  okSoft: 'var(--ok-soft)',
  warn: 'var(--warn)',
  warnSoft: 'var(--warn-soft)',
  bad: 'var(--bad)',
  badSoft: 'var(--bad-soft)',
  info: 'var(--info)',
  infoSoft: 'var(--info-soft)',
  neutralSoft: 'var(--neutral-soft)',
};

/**
 * Status Chip Color Definitions matching prototype .chip classes.
 */
export const statusBadgeStyles = {
  draft: { bg: theme.colors.neutralSoft, text: theme.colors.muted },
  sent: { bg: theme.colors.infoSoft, text: theme.colors.info },
  unpaid: { bg: theme.colors.infoSoft, text: theme.colors.info },
  accepted: { bg: theme.colors.okSoft, text: theme.colors.ok },
  paid: { bg: theme.colors.okSoft, text: theme.colors.ok },
  partial: { bg: theme.colors.warnSoft, text: theme.colors.warn },
  rejected: { bg: theme.colors.badSoft, text: theme.colors.bad },
  overdue: { bg: theme.colors.badSoft, text: theme.colors.bad },
  expired: { bg: theme.colors.neutralSoft, text: theme.colors.faint },
  cancelled: { bg: theme.colors.neutralSoft, text: theme.colors.faint },
} as const;

