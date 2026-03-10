# Theming System — Nimbus Weather App

## Architecture

Dynamic weather-driven theming via CSS custom properties on `:root`. No fixed brand palette — the entire UI shifts based on weather + time of day.

**Flow**: `WeatherContext` derives `condition` + `timeOfDay` → `getTheme()` → `applyTheme()` → sets CSS vars on `document.documentElement`.

## Theme Structure (src/lib/theme.ts)

16 base themes: 8 conditions x 2 time-of-day variants, plus 1 dark mode override.

```typescript
interface WeatherTheme {
  gradient: string          // CSS linear-gradient for body background
  cardSurface: string       // rgba for glass card background
  cardBorder: string        // rgba for glass card border
  textPrimary: string       // Primary text color
  textSecondary: string     // Muted text color
}
```

## Theme Palette Summary

| Condition | Day Gradient | Night Gradient | Notes |
|-----------|-------------|----------------|-------|
| clear | #1e5faa → #8bbaf0 | #0b1224 → #2b2670 | Bright blue / deep navy |
| partly-cloudy | #3a7bc8 → #a3c4e8 | #0f1a2e → #2a3f5e | Softer blue |
| cloudy | #5a6a7a → #b0bec9 | #1a2030 → #3a4858 | Gray tones |
| foggy | #7a8a9a → #c0cdd8 | #1a2030 → #3a4858 | Lighter gray |
| drizzle | #3a5a75 → #6d9ab5 | #0c1824 → #1e3a52 | Teal-blue |
| rain | #1c3550 → #3f6d8c | #0a1420 → #1a3048 | Deep blue |
| snow | #d8e4ee → #8a9baa | #1a2533 → #3a4858 | Light! Dark text (#1a2533) |
| storm | #12121f → #323252 | #08080f → #1a1a30 | Very dark |
| **dark mode** | #09090b → #27272a | — | Overrides all above |

## Critical Rule: Snow Day Has Dark Text

Snow-day is the ONLY theme where text is dark (`#1a2533`) against a light background. All other themes use white/light text. This is intentional — do not "fix" it.

## CSS Custom Properties (src/index.css)

```css
:root {
  --bg-gradient: ...      /* Applied to body background */
  --card-surface: ...     /* Used by .glass-card, .glass-button, etc. */
  --card-border: ...
  --text-primary: ...     /* Used by body color, all text elements */
  --text-secondary: ...
  --color-success: #34d399   /* Static — not weather-driven */
  --color-warning: #fbbf24
  --color-error: #f87171
  --color-info: #60a5fa
}
```

## Glassmorphism Classes (src/index.css @layer components)

| Class | Background | Blur | Radius | Padding |
|-------|-----------|------|--------|---------|
| .glass-card | var(--card-surface) | 16px | 16px | 20px |
| .glass-button | white/10% | — | 10px | 6px 14px |
| .glass-chip | white/10% | — | 20px | 6px 14px |
| .glass-input | white/10% | 12px | 14px | 14px 16px |

All include `transition` for smooth theme changes. Hover states increase to white/18%.

## Dark Mode Toggle

- Stored in `preferences.darkModeEnabled` (localStorage)
- When enabled: `getTheme()` returns `darkModeTheme` regardless of weather
- Toggle button in `Header.tsx` (Sun/Moon icon swap)
- Does NOT use `prefers-color-scheme` media query (stretch feature, not implemented)

## Transition Speeds

- Background gradient: 800ms ease (extra slow — smooth weather transitions)
- Card surface/border: 600ms ease (slow — follows gradient)
- Interactive elements: 200ms ease (normal — responsive feedback)
- Hover effects: 150ms ease (fast — instant feel)
