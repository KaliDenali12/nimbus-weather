# Nimbus Weather App — AI Codebase Guide

Nimbus is a portfolio-grade, client-side weather application built with React, TypeScript, and Three.js. It uses Open-Meteo's free API for weather data (no API key required), renders an immersive 3D weather diorama as background, and applies dynamic theming based on real weather conditions. Designed to showcase craft for hiring managers — every detail (transitions, accessibility, error states, responsiveness) is polished.

## Workflow Rules

- **No backend**: Pure client-side app — all logic runs in the browser
- **Open-Meteo only**: Free API, no keys, no rate limits to worry about
- **localStorage for persistence**: User preferences + recent cities, nothing more
- **3D is supporting, not central**: Atmospheric theming (colors + gradients) does the emotional heavy lifting; the 3D scene enhances but doesn't dominate

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18.x, TypeScript 5.x, Vite 5.x, Tailwind CSS 3.x |
| UI Components | Shadcn/UI (accessible primitives) |
| 3D Rendering | Three.js 0.162+, React Three Fiber 8.x, @react-three/drei 9.x |
| Data Visualization | Recharts (temperature trend charts) |
| Icons | Lucide React (18–48px stroke icons) |
| CSS Utility | clsx for conditional classes |
| Animation | Framer Motion (only if complexity stays low) |
| Weather API | Open-Meteo (free, no API key) — Geocoding + Forecast endpoints |
| Persistence | Browser localStorage |
| Hosting | Netlify (static CDN) |
| Testing | Vitest |

## Project Structure

```
Weather App/
├── PRD.md/                    # Product specs (read-only reference)
│   ├── Nimbus_Product_Vision.md
│   ├── Nimbus_Feature_Set.md
│   ├── Nimbus_User_Journey.md
│   ├── Nimbus_Tech_Stack.md
│   └── Nimbus_Design_Language_Guide.md
├── src/                       # TODO: Source code (not yet created)
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities, API clients, constants
│   ├── context/               # React Context providers (theme, preferences)
│   ├── scenes/                # Three.js / R3F scene components
│   ├── types/                 # TypeScript type definitions
│   └── App.tsx                # Root component
├── public/                    # Static assets
├── CLAUDE.md                  # This file
├── .claude/memory/            # AI memory files
└── .gitignore
```

## Build & Run Commands

```bash
# TODO: Commands will be available after project initialization
npm install                    # Install dependencies
npm run dev                    # Start Vite dev server
npm run build                  # Production build
npm run preview                # Preview production build
npm run test                   # Run Vitest
npm run test -- --coverage     # Run tests with coverage
```

## Environment Variables

**None required.** Open-Meteo API is free and keyless. No backend, no secrets.

## Key Architectural Rules

### Frontend

- **Path alias**: `@/` maps to `src/`
- **CSS framework**: Tailwind CSS 3.x with utility classes
- **Theme**: Weather-driven dynamic theming via CSS custom properties + dark mode toggle override
- **State management**: `useState` + `useContext` only — no external state library
- **Routing**: Single-page app, no router needed
- **Sensitive operations**: None — no API keys, no backend, no auth

### Data Flow

1. **On Load**: Browser geolocation → Open-Meteo API (coords) → Weather + forecast → Render UI + 3D + theme
2. **Search**: User input → debounced geocoding (300ms, min 2 chars) → autocomplete → selection → full refresh
3. **Preferences**: Unit toggle / dark mode → state update → localStorage persist
4. **Return Visit**: Geolocation re-detect (fresh data) + localStorage restore (unit, dark mode, recent cities)

### Error Handling

- Network failure → error card with "Try Again" button
- Geolocation timeout (>8s) → fall back to Antarctica + friendly toast
- No search results → "No cities found" in dropdown
- Malformed API response → graceful error message + retry

### Performance

- Debounce search at 300ms
- Optional 10–15 min client-side cache for API responses
- Cap Three.js pixel ratio on mobile
- Respect `prefers-reduced-motion`
- Lazy-load Three.js bundle (stretch goal)

## Conventions

- **Imports**: Use `@/` alias with file extensions
- **Types**: Export from feature type files, re-export via `types/index.ts`
- **Components**: Named exports, functional components with hooks
- **UI primitives**: Always use Shadcn/UI components (Button, Input, etc.)
- **3D components**: React Three Fiber — 3D scene is a React component receiving weather state as props

## Design System Standards

> Do NOT deviate from these values when writing new UI or editing existing UI.

### Theming — Weather-Driven Colors

No fixed brand palette. The entire UI shifts based on weather condition + time of day:

| Weather State | Gradient | Text |
|---------------|----------|------|
| Clear (Day) | #1e5faa → #8bbaf0 | White |
| Clear (Night) | #0b1224 → #2b2670 | Light gray |
| Cloudy (Day) | #5a6a7a → #b0bec9 | White |
| Rain | Deep blue-gray | Muted |
| Snow (Day) | #d8e4ee → #8a9baa | Dark |
| Storm | #12121f → #323252 | Muted |
| Dark Mode (override) | #09090b → #27272a | Standard |

### Card Glassmorphism

- Background: `rgba(255, 255, 255, 0.07–0.16)` (weather-specific)
- Border: `1px solid rgba(255, 255, 255, 0.06–0.12)`
- Blur: `backdrop-filter: blur(16px)`

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Display XL (temperature) | Bricolage Grotesque | 64px | 800 |
| Display LG (city name) | Bricolage Grotesque | 36px | 700 |
| Heading 1 | Bricolage Grotesque | 26px | 800 |
| Heading 2 | Bricolage Grotesque | 20px | 700 |
| Body | Figtree | 15px | 400 |
| Body SM | Figtree | 13px | 400 |
| Label | Figtree | 13px | 600 |
| Caption | Figtree | 11px | 500 |

Font source: Google Fonts with `display=swap`

### Border Radius

| Context | Value |
|---------|-------|
| Cards | 16px |
| Buttons | 10px |
| Search input | 14px |
| Chips | 20px (pill) |
| Dropdown/Toast | 12px |

### Spacing (4px Grid)

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Tight internal padding |
| space-3 | 12px | Chip padding, compact gaps |
| space-4 | 16px | Standard spacing, input padding |
| space-5 | 20px | Card internal padding |
| space-6 | 24px | Between sections (mobile) |
| space-10 | 40px | Page top/bottom padding |

Key: Card padding = 20px, card gap = 12–16px, page padding = 16px mobile / 24px desktop, max width = 900px.

### Transitions

| Speed | Duration | Usage |
|-------|----------|-------|
| Fast | 150ms ease | Hovers, small interactions |
| Normal | 200ms ease | Button clicks, chip interactions |
| Slow | 600ms ease | Weather theme transitions |
| Extra Slow | 800ms ease | Background gradient transitions |

## Accessibility Standards

### Interactive Elements
Any non-interactive element with onClick must have: `role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space, `focus-visible` outline.

### Icon-Only Buttons
Must have `aria-label`.

### Touch Targets
Minimum 44px on all interactive elements.

### Reduced Motion
Respect `prefers-reduced-motion` — disable 3D animations, particle effects, and non-essential transitions.

### Responsive Breakpoints
- Mobile: <640px
- Tablet: 640–899px
- Desktop: 900px+

## Data Model

### localStorage Schema

```typescript
interface UserPreferences {
  unitPreference: "celsius" | "fahrenheit";
  darkModeEnabled: boolean;
  recentCities: Array<{
    name: string;
    lat: number;
    lon: number;
    country: string;
  }>; // max 5, FIFO with deduplication
}
```

### Open-Meteo API

- **Geocoding**: City name → `{ name, lat, lon, country, admin1 }[]`
- **Forecast**: lat/lon → `{ current: { temp, humidity, wind, feelsLike, weatherCode }, daily: { date, high, low, weatherCode }[], alerts: [] }`

## Auth & Roles

**None.** Fully public client-side app. No user accounts, no auth, no roles.

## Core Workflow

1. User opens app → browser requests geolocation
2. Coords sent to Open-Meteo → weather data returned
3. UI renders: 3D scene + dynamic theme + weather cards + forecast + chart
4. User searches a city → debounced autocomplete → selection triggers full refresh
5. City saved to recent cities (localStorage, max 5)
6. User toggles °C/°F or dark mode → persisted to localStorage
7. On return visit: geolocation re-detects, preferences restored

## Common Recipes

### Adding a New Weather Scene Variant
1. Add WMO code mapping in the theme config (weather code → CSS variables + scene props)
2. Create/update R3F scene component in `src/scenes/`
3. Update the scene selector to handle the new weather code
4. Test with mock data for the specific condition

### Adding a New Weather Data Card
1. Create component in `src/components/` using glassmorphism card pattern
2. Extract data from the weather API response via existing hooks
3. Add to the main layout grid
4. Ensure responsive behavior at all breakpoints
5. Add unit tests for data formatting logic

## What's Not Yet Implemented

**This project is in the specification phase.** No source code exists yet. All PRD documents are in `PRD.md/`. Implementation should follow the tech stack and patterns defined in this file.

## Documentation Hierarchy

When you learn something worth preserving, put it in the right place:

| Layer | Loaded | What goes here |
|-------|--------|---------------|
| **CLAUDE.md** (this file) | Every conversation | Rules/constraints that prevent mistakes on ANY task |
| **Auto-memory MEMORY.md** | Every conversation | Cross-cutting patterns and pitfalls learned across sessions |
| **Sub-memory files** (.claude/memory/) | On demand, by topic | Feature-specific deep dives — see topic table below |
| **Inline code comments** | When code is read | Non-obvious "why" explanations, right next to the code |

**Rule of thumb**: If it prevents mistakes on unrelated tasks → CLAUDE.md. If it's a pattern/pitfall that spans features → auto-memory. If it's only relevant when working on one feature → sub-memory file. If it explains a single non-obvious line → inline comment.

**Updating docs**: When you change code that affects a rule in CLAUDE.md, update CLAUDE.md. When you change a feature covered by a sub-memory file, update that file. If a new feature area doesn't fit any existing file, create a new one and add it to the table below.

### Sub-Memory Files — Load When Working On

| File | When to load |
|------|-------------|
| testing.md | Writing or fixing tests |
| three-js.md | Working on 3D scenes or R3F components |
| theming.md | Modifying weather-driven theme or dark mode |
| api-integration.md | Working with Open-Meteo API calls |
| accessibility.md | Fixing a11y issues or adding ARIA patterns |
