import type { Config } from 'tailwindcss';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../packages/ui/src/tokens';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // EarthPrint palette (from design tokens)
        'forest-deep': colors.forestDeep,
        'forest-mid': colors.forestMid,
        'forest-action': colors.forestAction,
        'growth-green': colors.growthGreen,
        'pale-green': colors.paleGreen,
        tint: colors.tint,
        'sunlight-amber': colors.sunlightAmber,
        'earth-coral': colors.earthCoral,
        ink: colors.ink,
        'ink-soft': colors.inkSoft,
        'ink-inverse': colors.inkInverse,
        border: colors.border,
        'border-dark': colors.borderDark,
        'surface-card': colors.surfaceCard,
        'surface-card-dark': colors.surfaceCardDark,
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', '"Courier New"', 'monospace'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'], // Override Tailwind default
      },
      fontSize: fontSizes,
      spacing: {
        ...spacing,
        18: '4.5rem',
        72: '18rem',
        80: '20rem',
        88: '22rem',
        96: '24rem',
      },
      borderRadius: {
        ...borderRadius,
        DEFAULT: '8px',
      },
      boxShadow: {
        sm: shadows.sm,
        DEFAULT: shadows.DEFAULT,
        md: shadows.md,
        lg: shadows.lg,
        glow: shadows.glow,
        'amber-glow': shadows.amberGlow,
      },
      backgroundImage: {
        'gradient-forest': `linear-gradient(135deg, ${colors.forestDeep} 0%, ${colors.forestMid} 100%)`,
        'gradient-green': `linear-gradient(135deg, ${colors.forestAction} 0%, ${colors.growthGreen} 100%)`,
        'gradient-hero': `linear-gradient(160deg, ${colors.forestDeep} 0%, #0D3D22 50%, ${colors.forestMid} 100%)`,
        'gradient-card': `linear-gradient(135deg, rgba(45, 122, 79, 0.08) 0%, rgba(77, 184, 122, 0.04) 100%)`,
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'count-up': 'countUp 1s ease-out forwards',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGreen: {
          '0%, 100%': { boxShadow: `0 0 0 0 rgba(77, 184, 122, 0)` },
          '50%': { boxShadow: `0 0 0 8px rgba(77, 184, 122, 0.15)` },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
