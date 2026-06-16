# EarthPrint UI Design System & Component Library

This document describes the design system tokens, typography scales, colors, and layout guidelines implemented in EarthPrint.

---

## 1. Design Philosophy

EarthPrint focuses on empowering and positive visuals rather than shame or guilt.
- **Deep & Harmonious Greens**: Base theme invokes forests, foliage, and nature.
- **Warm & Welcoming Accents**: Sand, soft gold, and ivory background shades.
- **Vibrant Interactive Elements**: Emerald gradients, sleek hover states.

---

## 2. Color Palette (Forest Deep Theme)

Defined as HSL values and mapped in `packages/ui/src/tokens.ts` and `apps/web/tailwind.config.ts`.

| Token Name | HSL Value | Description |
|---|---|---|
| `forest-deep` | `hsl(150, 24%, 9%)` | Dark mode background, primary layout container |
| `forest-mid` | `hsl(150, 22%, 15%)` | Card background, side navigation |
| `emerald-primary`| `hsl(142, 72%, 29%)` | Buttons, success indicators, primary metrics |
| `emerald-glow` | `hsl(142, 76%, 36%)` | Hover states, glowing rings |
| `sand-light` | `hsl(45, 29%, 97%)` | Primary text in dark mode, light background |
| `sand-muted` | `hsl(45, 12%, 75%)` | Secondary text, labels |

---

## 3. Typography Scale

Fonts are loaded from Google Fonts via Next.js `next/font/google`:
1. **DM Serif Display** (`font-serif`): For header typography, big numbers, and hero titles.
2. **DM Sans** (`font-sans`): For body copy, details, and form fields.
3. **Space Mono** (`font-mono`): For footprint numbers, tables, dates, and metrics.

### Sizes:
- **Heading 1**: `2.25rem` (36px) — `font-serif`
- **Heading 2**: `1.5rem` (24px) — `font-serif`
- **Heading 3**: `1.25rem` (20px) — `font-serif`
- **Body Regular**: `1rem` (16px) — `font-sans`
- **Body Muted**: `0.875rem` (14px) — `font-sans`
- **Metrics**: `3rem` (48px) — `font-mono`

---

## 4. Primitive Components (`components/ui/`)

### Button
- Custom design utilizing a double border layout with a subtle glass reflection in the dark mode variant.
- Hover scales the button slightly (`scale-102`) and highlights the emerald border.

### Card
- Backed by `forest-mid` colors with a 1px border colored by `hsl(150, 10%, 20%)`.
- Features an optional hover glow: `shadow-[0_0_15px_rgba(16,185,129,0.1)]`.

### ProgressBar
- Animated SVG layout with an optional progress percentage counter.
- Fluid transitioning using CSS transforms.
