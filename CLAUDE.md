# Nimbus Weather App — AI Codebase Guide

Portfolio-grade client-side weather app: React 19 + TypeScript 5.9 + Three.js + Open-Meteo. No backend, no API keys, no auth. Dynamic weather-driven theming with 3D diorama background.

**Deploy**: https://test-feb26.netlify.app | **Repo**: https://github.com/KaliDenali12/nimbus-weather

---

## Workflow Rules

- **Pure client-side** — all logic runs in the browser, zero server dependencies
- **Open-Meteo only** — free API, no keys, no rate limits
- **localStorage persistence** — user prefs + recent cities, nothing else
- **3D is atmosphere, not content** — gradients + themes do emotional heavy lifting; 3D enhances
- **No Shadcn/UI** — despite PRD mention, app uses custom glassmorphism components throughout

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React + ReactDOM | 19.2.x |
| Language | TypeScript (strict, erasableSyntaxOnly) | 5.9.x |
| Bundler | Vite | 7.3.x |
| Styling | Tailwind CSS + CSS custom properties | 3.4.x |
| 3D | Three.js + @react-three/fiber + @react-three/drei | 0.175 / 9.1 / 10.0 |
| Charts | Recharts | 2.15.x |
| Icons | Lucide React | 0.511.x |
| Animation | Framer Motion (minimal usage) | 12.12.x |
| Testing | Vitest + @testing-library/react + jsdom | 3.2.x / 16.3.x |
| Deploy | Netlify (static CDN, SPA redirect) | — |

## Project Structure

```
src/
├── components/           # UI components (Header, SearchBar, CurrentWeather, etc.)
│   ├── __tests__/        # Component tests (WeatherIcon, Toast)
│   └── SceneErrorBoundary.tsx  # Error boundary for WebGL crashes
├── scenes/               # Three.js / R3F 3D scene components
│   ├── WeatherScene.tsx   # Canvas wrapper, lazy-loads SceneContent
│   ├── SceneContent.tsx   # Main orchestrator: lighting, particles, objects
│   ├── RainParticles.tsx  # BufferGeometry rain with fall animation
│   ├── SnowParticles.tsx  # Slower particles with sine drift
│   ├── SimpleCloud.tsx    # 4 overlapping spheres (custom, not drei Cloud)
│   ├── Ground.tsx         # Weather-reactive colored plane
│   └── DioramaObjects.tsx # Tree + House meshes, snow variant
├── lib/                  # Pure utility modules
│   ├── api.ts            # Open-Meteo geocoding + forecast
│   ├── weather-codes.ts  # WMO code → condition/label/icon mapping
│   ├── theme.ts          # 16 weather themes + dark mode override
│   ├── storage.ts        # localStorage: prefs, recent cities (max 5)
│   ├── units.ts          # Temp/wind conversion + day name formatting
│   ├── geolocation.ts    # Browser geolocation with 8s timeout → Antarctica fallback
│   └── __tests__/        # Unit tests for all lib modules
├── context/
│   └── WeatherContext.tsx # Single context: weather data + prefs + actions
├── hooks/
│   └── useDebounce.ts    # Generic debounce hook (300ms for search)
├── types/
│   ├── weather.ts        # All domain types (WeatherCondition, WeatherData, etc.)
│   └── index.ts          # Barrel re-export
├── test/
│   └── setup.ts          # @testing-library/jest-dom setup
├── App.tsx               # Root: WeatherProvider → WeatherApp layout
├── main.tsx              # StrictMode + createRoot
└── index.css             # Tailwind directives, CSS vars, glassmorphism classes
```

## Commands

```bash
npm run dev               # Vite dev server (localhost:5173)
npm run build             # tsc -b && vite build
npm run preview           # Preview production build
npm run test              # Vitest: 97 tests, 10 files, ~1.3s
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage with @vitest/coverage-v8
npm run lint              # ESLint 9 with TypeScript + React plugins
netlify deploy --prod     # Deploy dist/ to Netlify
```

## Environment Variables

**None.** Open-Meteo is free and keyless. No backend, no secrets, no .env files.

## Architecture

### Data Flow

```
Geolocation/Search → Open-Meteo API → WeatherData → WeatherContext
  ↓                                                     ↓
  Fallback: Antarctica                    Components consume via useWeather()
                                                        ↓
                                          Theme applied → CSS custom properties
                                          Prefs saved → localStorage
```

### State Management

- **Global**: `WeatherContext` — weather data, loading, error, preferences, geoError, derived condition/timeOfDay
- **Local**: Component-level state (SearchBar dropdown, AlertBanner dismissals, Toast visibility)
- **Persistent**: `localStorage` key `nimbus-preferences` (unit, darkMode, recentCities)
- **No external state library** — useState + useContext only

### Error Handling

| Scenario | Behavior |
|----------|----------|
| Network failure | ErrorState card with "Try Again" button |
| Geolocation denied/timeout/unavailable | Toast notification + Antarctica fallback |
| Short search query (<2 chars) | Returns empty array, no API call |
| Malformed localStorage | Silent catch, returns defaults |
| No search results | "No cities found" in dropdown |

### Performance

- **Code splitting**: `three` chunk + `recharts` chunk + `SceneContent` lazy-loaded
- **Debounce**: 300ms on search input via `useDebounce` hook
- **Memoization**: `useMemo` for 3D scene calculations, `useCallback` for all context actions
- **DPR cap**: `Math.min(window.devicePixelRatio, 2)` for WebGL
- **Reduced motion**: `prefers-reduced-motion` disables all animations and transitions

## Conventions

### Imports

- **Always use `@/` alias** with explicit file extensions: `import { useWeather } from '@/context/WeatherContext.tsx'`
- **Type imports**: `import type { WeatherData } from '@/types/index.ts'`
- **Barrel exports**: Types from `types/index.ts`, everything else from source

### TypeScript

- **Strict mode** with `noUnusedLocals`, `noUnusedParameters`
- **`erasableSyntaxOnly: true`** — no parameter properties, no enums, no namespaces. Declare class fields explicitly and assign in constructor body.
- **Discriminated unions** for result types (e.g., geolocation `{ ok: true; position } | { ok: false; error }`)
- **Named exports** everywhere — no default exports

### Components

- Functional components with hooks only
- Named exports (not default)
- CSS via Tailwind utilities + glassmorphism classes from `index.css`
- ARIA attributes on all interactive elements

### File Naming

- Components: `PascalCase.tsx` (e.g., `WeatherIcon.tsx`)
- Utilities: `kebab-case.ts` (e.g., `weather-codes.ts`)
- Tests: `__tests__/<ModuleName>.test.ts(x)` colocated with source
- Constants: `UPPER_SNAKE_CASE` (e.g., `ANTARCTICA`, `GEOLOCATION_TIMEOUT`)

## Design System

> These values are baked into the codebase. Do NOT deviate when writing new UI.

### Dynamic Theming

16 themes (8 weather conditions x day/night) + dark mode override. Theme applied via CSS custom properties on `:root`:

| Variable | Role |
|----------|------|
| `--bg-gradient` | Full-page background gradient |
| `--card-surface` | Glassmorphism card background (rgba) |
| `--card-border` | Glassmorphism card border (rgba) |
| `--text-primary` | Primary text color |
| `--text-secondary` | Secondary/muted text color |
| `--color-success/warning/error/info` | Semantic status colors (static) |

**Dark mode**: When enabled, overrides ALL weather themes with a single charcoal theme (`#09090b → #27272a`).

### Glassmorphism Classes

| Class | Key Properties |
|-------|---------------|
| `.glass-card` | blur(16px), border-radius: 16px, padding: 20px |
| `.glass-button` | bg: white/10%, border-radius: 10px, hover: white/18% |
| `.glass-chip` | border-radius: 20px (pill), padding: 6px 14px |
| `.glass-input` | blur(12px), border-radius: 14px, padding: 14px 16px |

### Typography

| Token | Font | Size | Weight |
|-------|------|------|--------|
| display-xl | Bricolage Grotesque | 64px | 800 |
| display-lg | Bricolage Grotesque | 36px | 700 |
| heading-1 | Bricolage Grotesque | 26px | 800 |
| heading-2 | Bricolage Grotesque | 20px | 700 |
| body | Figtree | 15px | 400 |
| body-sm | Figtree | 13px | 400 |
| label | Figtree | 13px | 600 |
| caption | Figtree | 11px | 500 |

### Spacing (4px Grid)

Card padding: 20px. Card gap: 12–16px. Page padding: 16px mobile / 24px desktop. Max width: 900px.

### Border Radius

Cards: 16px. Buttons: 10px. Search: 14px. Chips: 20px. Dropdown/Toast: 12px.

### Transitions

Fast: 150ms. Normal: 200ms. Slow: 600ms (theme). Extra slow: 800ms (background gradient).

## Accessibility

- **Icon-only buttons**: Must have `aria-label`
- **Decorative icons**: `aria-hidden="true"`
- **Touch targets**: Minimum 44px
- **Keyboard nav**: SearchBar supports ArrowUp/Down/Enter/Escape with combobox ARIA pattern
- **Focus indicators**: `focus-visible` with white outline on all interactive elements
- **Reduced motion**: `prefers-reduced-motion` media query disables all animations
- **Live regions**: Toast has `role="status"`, loading has `aria-live`
- **3D scene**: `role="img"` with `aria-label` on canvas wrapper

## Data Model

### localStorage Schema (`nimbus-preferences`)

```typescript
interface UserPreferences {
  unitPreference: 'celsius' | 'fahrenheit'
  darkModeEnabled: boolean
  recentCities: City[] // max 5, FIFO with lat/lon dedup
}
```

### Open-Meteo Endpoints

- **Geocoding**: `geocoding-api.open-meteo.com/v1/search?name=<query>&count=8`
- **Forecast**: `api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=...&daily=...`
- Free tier: no alerts, no historical data, no hourly breakdown

### WMO Weather Code Mapping

0→clear, 1-3→partly-cloudy, 45-48→foggy, 51-57→drizzle, 61-67→rain, 71-77→snow, 80-84→rain, 85-86→snow, 95-99→storm. All other codes→cloudy.

## Common Recipes

### Adding a New Weather Scene Variant
1. Map WMO codes in `lib/weather-codes.ts`
2. Add theme colors in `lib/theme.ts`
3. Create/update R3F component in `scenes/`
4. Add conditional rendering in `SceneContent.tsx`
5. Test with mock data for the condition

### Adding a New Weather Data Card
1. Create component in `components/` using `.glass-card` class
2. Consume data via `useWeather()` hook
3. Add to layout grid in `App.tsx`
4. Ensure responsive behavior (mobile-first)
5. Add unit tests

### Adding a New Utility Function
1. Add to appropriate `lib/*.ts` file
2. Export types from `types/weather.ts` if needed
3. Write unit tests in `lib/__tests__/`
4. Pure functions preferred — no side effects

## What's Not Implemented

All mandatory MVP features are complete. Stretch features from the PRD:
- Service worker / offline support
- Share button / URL-based city routing
- Weather-appropriate greetings
- Antarctica Easter egg (penguin in 3D scene)
- Animated number transitions
- Hourly forecast breakdown
- Sunrise/sunset, UV index, pressure, visibility
- ~~`prefers-color-scheme` system dark mode detection~~ (implemented: defaults to system preference on first visit)
- Performance toggle to disable 3D scene
- Weather alerts (Open-Meteo free tier lacks alert data — UI component exists)

## Known Gotchas

1. **erasableSyntaxOnly** — Cannot use `public status?: number` in constructor params. Must declare field explicitly and assign in constructor body. Also blocks enums and namespaces.
2. **@react-three/drei v10** — `Cloud` component API changed (no `width`/`depth`/`segments` props). We use custom `SimpleCloud` (overlapping spheres) instead.
3. **R3F v9 bufferAttribute** — Requires `args` prop in JSX. We use programmatic `new THREE.BufferAttribute()` instead.
4. **TypeScript narrowing with derived booleans** — After `const isRain = condition === 'rain'`, TS can't narrow `condition` further. Restructure conditionals to avoid.
5. **`vi.useFakeTimers()` + `userEvent`** — Causes timeouts. Use `fireEvent` instead in tests with fake timers.
6. **Open-Meteo free tier** — No weather alerts, no hourly data, no historical. AlertBanner component exists but `alerts` array is always empty.

## Documentation Hierarchy

| Layer | Loaded | Content |
|-------|--------|---------|
| **CLAUDE.md** (this file) | Every conversation | Rules, conventions, architecture |
| **MEMORY.md** | Every conversation | Project state, cross-cutting patterns |
| **Sub-memory files** (.claude/memory/) | On demand | Feature-deep-dives — see MEMORY.md index |
| **Inline comments** | When code is read | Non-obvious "why" explanations |

**Rule**: Prevents mistakes on any task → CLAUDE.md. Cross-cutting pattern → MEMORY.md. Single-feature deep dive → sub-memory file. Single non-obvious line → inline comment.

## NightyTidy — Last Run

Last run: 2026-03-18. To undo, reset to git tag `nightytidy-before-2026-03-18-1312`.
