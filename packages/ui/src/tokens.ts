/**
 * EarthPrint Design System Tokens
 *
 * These tokens are the single source of truth for the entire design system.
 * They are consumed by:
 *   - Tailwind CSS config (apps/web/tailwind.config.ts)
 *   - React Native StyleSheet (apps/mobile)
 *   - CSS custom properties (app/globals.css)
 *
 * Design philosophy: Forest-inspired palette that feels grounded and hopeful,
 * not corporate-green or anxiety-inducing.
 */

// ─── Color Palette ───────────────────────────────────────────────────────────

export const colors = {
  // Background hierarchy
  forestDeep: '#0A2318',     // Primary backgrounds, navbars, deep surfaces
  forestMid: '#1A4A2E',      // Secondary backgrounds, sidebar hover states
  forestAction: '#2D7A4F',   // Interactive — buttons, links, progress bars, CTAs

  // Green spectrum
  growthGreen: '#4DB87A',    // Success states, achievements, positive feedback
  paleGreen: '#C8F0DC',      // Highlights, tags, light-mode chip backgrounds
  tint: '#F0FAF4',           // Card backgrounds, page background (light mode)

  // Accent
  sunlightAmber: '#E8960A',  // Warnings, opportunities, streak indicators
  earthCoral: '#D94F3B',     // High-emission alerts — use sparingly

  // Text
  ink: '#0F1C14',            // Primary body text (on light backgrounds)
  inkSoft: '#5A7060',        // Secondary text, labels, captions
  inkInverse: '#F0FAF4',     // Text on dark (Forest Deep) backgrounds

  // Neutrals
  border: '#D1E8D9',         // Card borders, dividers (light mode)
  borderDark: '#2D4A38',     // Card borders (dark mode)
  surfaceCard: '#FFFFFF',    // Card surface (light mode)
  surfaceCardDark: '#132B1F',// Card surface (dark mode)

  // Semantic
  success: '#4DB87A',
  warning: '#E8960A',
  error: '#D94F3B',
  info: '#3B82F6',

  // Transparent overlays
  overlayDark: 'rgba(10, 35, 24, 0.8)',
  overlayLight: 'rgba(240, 250, 244, 0.9)',
} as const;

export type ColorToken = keyof typeof colors;

// ─── Typography ──────────────────────────────────────────────────────────────

export const fonts = {
  display: '"DM Serif Display", Georgia, serif',   // Headings, impact numbers
  body: '"DM Sans", system-ui, sans-serif',         // All body text, UI
  mono: '"Space Mono", "Courier New", monospace',   // Data labels, codes, CO₂ numbers
} as const;

export const fontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem',// 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  '6xl': '3.75rem', // 60px
  '7xl': '4.5rem',  // 72px
} as const;

export const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeights = {
  tight: '1.2',
  normal: '1.5',
  relaxed: '1.75',
} as const;

// ─── Spacing (4px base unit) ─────────────────────────────────────────────────

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────

export const borderRadius = {
  none: '0',
  sm: '4px',
  DEFAULT: '8px',  // Cards
  md: '8px',
  lg: '12px',      // Modals, panels
  xl: '16px',
  '2xl': '20px',   // Pills, chips, badges
  full: '9999px',  // Circles, fully-rounded
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const shadows = {
  none: 'none',
  sm: '0 1px 3px rgba(0, 0, 0, 0.08)',           // Subtle card lift
  DEFAULT: '0 2px 8px rgba(0, 0, 0, 0.10)',      // Cards
  md: '0 4px 16px rgba(0, 0, 0, 0.12)',           // Modals, dropdowns
  lg: '0 8px 32px rgba(0, 0, 0, 0.15)',           // Full-screen overlays
  glow: '0 0 20px rgba(77, 184, 122, 0.25)',      // Growth Green glow effect
  amberGlow: '0 0 20px rgba(232, 150, 10, 0.30)',// Sunlight Amber glow (streaks)
} as const;

// ─── Breakpoints ─────────────────────────────────────────────────────────────

export const breakpoints = {
  mobile: '375px',
  tablet: '768px',
  desktop: '1280px',
} as const;

// ─── Z-Index ─────────────────────────────────────────────────────────────────

export const zIndex = {
  base: 0,
  card: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
  tooltip: 600,
} as const;

// ─── Transitions ─────────────────────────────────────────────────────────────

export const transitions = {
  fast: '150ms ease',
  base: '250ms ease',
  slow: '400ms ease',
  spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy spring for badge unlocks
} as const;

// ─── Combined Token Export ────────────────────────────────────────────────────

export const tokens = {
  colors,
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  transitions,
} as const;

export type Tokens = typeof tokens;
