# Accessibility — Nimbus Weather App

## ARIA Patterns

### SearchBar (Combobox Pattern)
- Input: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`
- Dropdown: `role="listbox"`, `id` matching `aria-controls`
- Options: `role="option"`, `aria-selected` for active item
- Keyboard: ArrowUp/Down navigate, Enter selects, Escape closes

### Interactive Elements
- All `<button>` elements use native semantics (no `role="button"` needed)
- Icon-only buttons: `aria-label` describing action (e.g., "Toggle dark mode", "Toggle temperature unit")
- Close buttons: `aria-label="Dismiss notification"`

### Live Regions
- `Toast`: `role="status"` — polite announcements
- `LoadingState`: `aria-live="polite"` — loading status
- `AlertBanner`: `role="alert"` — important weather alerts
- `ErrorState`: implicit live via button focus

### Decorative Elements
- `WeatherIcon`: `aria-hidden="true"` on all SVGs
- `WeatherScene` canvas: `role="img"` with `aria-label` describing current weather

## Focus Management

- **Focus indicators**: `focus-visible` with `outline: 2px solid rgba(255, 255, 255, 0.5); outline-offset: 2px` on buttons/chips
- **Input focus**: `outline: 2px solid rgba(255, 255, 255, 0.35)` with `outline-offset: 0`
- **No focus trapping**: Single-page, no modals
- **Search dropdown**: Focus returns to input on Escape

## Touch Targets

- Minimum 44px on all interactive elements (buttons, chips, search results)
- Glass-button padding: 6px 14px + icon size meets minimum
- Search results: full-width rows with adequate padding

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- 3D scene: `WeatherScene` checks `matchMedia` and skips Canvas entirely
- All CSS transitions and animations disabled
- Particle effects (rain/snow) not rendered

## Color Contrast

- Most themes: white text on blue/dark gradient — high contrast
- Snow-day: dark text (#1a2533) on light background (#d8e4ee) — adequate contrast
- Dark mode: light text (#e4e4e7) on dark background (#09090b) — high contrast
- Secondary text: reduced opacity (0.5–0.7) — may need review for WCAG AA

## Gaps / Future Work

- No `prefers-color-scheme` detection (dark mode is manual toggle only)
- No skip-to-content link
- No axe-core automated testing in CI
- Secondary text contrast ratios not formally verified
- No screen reader testing performed
- Alert severity colors may not meet contrast requirements on all themes
