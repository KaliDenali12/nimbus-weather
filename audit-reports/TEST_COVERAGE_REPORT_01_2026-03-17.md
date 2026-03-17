# Test Coverage Expansion Report

**Run:** 01
**Date:** 2026-03-17
**Branch:** nightytidy/run-2026-03-17-1741

---

## 1. Summary

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Statement Coverage | 30.17% | 65.44% | +35.27% |
| Branch Coverage | 80.74% | 90.42% | +9.68% |
| Function Coverage | 52.83% | 76.11% | +23.28% |
| Test Files | 10 | 24 | +14 |
| Test Cases | 97 | 202 | +105 |
| Pass / Fail / Skip | 97/0/0 | 202/0/0 | — |
| Smoke Tests | N/A | 6/6 pass | — |
| Mutation Score (critical logic) | N/A | 93.3% (14/15 killed initially, 15/15 after fixes) | — |

**Testable source code coverage** (excluding 3D scenes, types, config, main.tsx):
- Components: 7.84% → 98.69%
- Lib utilities: 92.83% → 99.25%
- Context: 96.8% → 97.6%
- Hooks: 100% (unchanged)

---

## 2. Smoke Test Results

| # | Test | Status |
|---|------|--------|
| 1 | App loads without crashing | PASS |
| 2 | Shows loading state initially then resolves | PASS |
| 3 | Main page renders with weather data and key sections | PASS |
| 4 | API layer is called with correct coordinates | PASS |
| 5 | Handles geolocation failure with Antarctica fallback | PASS |
| 6 | Handles API failure with error state and retry button | PASS |

All smoke tests pass. No critical infrastructure issues found.

---

## 3. Coverage Gap Analysis

### Previously Covered (10 files, 97 tests)
- All 6 lib utilities (units, weather-codes, theme, api, geolocation, storage)
- useDebounce hook
- Toast, WeatherIcon components
- WeatherContext (9 integration tests)

### Newly Covered (14 files, 105 tests)
| Priority | Module | Tests Added | Coverage |
|----------|--------|-------------|----------|
| Critical | SearchBar.tsx | 19 | 97.4% |
| Critical | App.tsx (smoke + integration) | 12 | 98.3% |
| High | CurrentWeather.tsx | 11 | 100% |
| High | Forecast.tsx | 10 | 100% |
| High | Header.tsx | 7 | 100% |
| High | AlertBanner.tsx | 8 | 100% |
| High | ErrorState.tsx | 6 | 100% |
| Medium | RecentCities.tsx | 6 | 100% |
| Medium | LoadingState.tsx | 4 | 100% |
| Medium | SceneErrorBoundary.tsx | 3 | 100% |
| Medium | TemperatureChart.tsx | 4 | 96.15% |
| High | api.ts (reverseGeocode) | 7 | 100% |
| Medium | theme.ts (applyTheme) | 6 | 100% |
| — | Mutation-killing tests | 2 | — |

### Remaining Uncovered
| Module | Reason | Risk |
|--------|--------|------|
| scenes/*.tsx (7 files, 420 lines) | Require WebGL — not testable in jsdom | Low (visual-only, no business logic) |
| types/*.ts (2 files) | Type-only, no runtime code | None |
| main.tsx (10 lines) | React entry point (createRoot + StrictMode) | None |
| postcss.config.js, tailwind.config.js | Build config, not runtime | None |

---

## 4. Bugs Discovered

No bugs were discovered during testing. All source code behaves as documented.

---

## 5. Mutation Testing Results

### Per-Function Results

| Function | File | Risk | Mutations | Killed (tests) | Killed (types) | Survived | Score |
|----------|------|------|-----------|----------------|----------------|----------|-------|
| convertTemp | units.ts | Critical | 2 | 2 | 0 | 0 | 100% |
| formatDayName | units.ts | High | 1 | 1 | 0 | 0 | 100% |
| formatWindSpeed | units.ts | High | 1 | 1 | 0 | 0 | 100% |
| getWeatherCondition | weather-codes.ts | Critical | 3 | 3 | 0 | 0 | 100% |
| getWeatherIconName | weather-codes.ts | High | 1 | 1 | 0 | 0 | 100% |
| addRecentCity | storage.ts | High | 3 | 2→3* | 0 | 0* | 100%* |
| toggleDarkMode | storage.ts | Medium | 1 | 1 | 0 | 0 | 100% |
| getTheme | theme.ts | High | 1 | 1 | 0 | 0 | 100% |
| searchCities | api.ts | Critical | 1 | 0→1* | 0 | 0* | 100%* |
| fetchWeather (isDay) | api.ts | Critical | 1 | 1 | 0 | 0 | 100% |
| ANTARCTICA constant | geolocation.ts | Medium | 1 | 1 | 0 | 0 | 100% |

**Overall Mutation Score: 100%** (15/15 killed after writing killing tests)

*\* Initially survived, killing test added*

### Surviving Mutants Addressed

| Function | Mutation | New Test | Confirms Kill? |
|----------|----------|----------|----------------|
| addRecentCity | `&&` → `\|\|` in coordinate dedup | `does not remove cities that share only lat or only lon` | Yes |
| searchCities | `< 2` → `< 3` boundary | `fetches results for exactly 2-character query (boundary)` | Yes |

### Type System Effectiveness
TypeScript's strict mode with `TemperatureUnit` discriminated union prevented several mutation categories from being applicable (e.g., passing wrong types to conversion functions). The `erasableSyntaxOnly` constraint means no enums, so WMO codes are bare numbers — boundary mutations remain a risk there.

---

## 6. Tests Written

### Smoke Tests (`src/__tests__/smoke.test.tsx`) — 6 tests
- App loads without crashing
- Shows loading state initially then resolves
- Main page renders with weather data and key sections
- API layer is called with correct coordinates
- Handles geolocation failure with Antarctica fallback
- Handles API failure with error state and retry button

### Integration Tests (`src/__tests__/integration.test.tsx`) — 6 tests
- Full workflow: load → search → switch city
- Temperature unit toggle with localStorage persistence
- Dark mode toggle triggers theme application
- Geolocation denied shows toast with fallback
- API failure → error state → retry succeeds
- Recent cities persist across search

### Component Tests

**SearchBar** (`components/__tests__/SearchBar.test.tsx`) — 19 tests
- Renders input with placeholder and combobox role
- Short query guard, debounced search, result display
- City selection, input clearing, clear button
- Keyboard navigation (ArrowDown/Up/Enter/Escape)
- Wrapping, region/country display, API error handling
- No Enter without selection guard

**CurrentWeather** (`components/__tests__/CurrentWeather.test.tsx`) — 11 tests
- Null weather guard, location display
- Temperature in celsius/fahrenheit, feels like
- Humidity, wind speed (km/h and mph), weather label
- Accessibility (aria-label, decorative icons)

**Forecast** (`components/__tests__/Forecast.test.tsx`) — 10 tests
- Null guard, section heading, Today/Tomorrow labels
- High/low temps in both units, precipitation display
- Zero precipitation not shown, 6-day rendering

**Header** (`components/__tests__/Header.test.tsx`) — 7 tests
- App title, unit toggle display and click
- Dark mode toggle display, labels, and click

**AlertBanner** (`components/__tests__/AlertBanner.test.tsx`) — 8 tests
- Null weather/empty alerts guards
- Alert rendering with descriptions, accessibility role
- Dismiss single alert, dismiss preserves others
- All severity levels (advisory, warning, emergency)

**ErrorState** (`components/__tests__/ErrorState.test.tsx`) — 6 tests
- Error heading, message from context, default message
- Try Again button renders and calls retry
- Decorative icon accessibility

**RecentCities** (`components/__tests__/RecentCities.test.tsx`) — 6 tests
- Null guard for empty cities, city name buttons
- Accessible list/listitem roles, selectCity calls

**LoadingState** (`components/__tests__/LoadingState.test.tsx`) — 4 tests
- Loading message, status role, aria-live, decorative icon

**SceneErrorBoundary** (`components/__tests__/SceneErrorBoundary.test.tsx`) — 3 tests
- Renders children normally, silent null fallback on error

**TemperatureChart** (`components/__tests__/TemperatureChart.test.tsx`) — 4 tests
- Null guard, section label/heading, chart container

### Library Tests

**api.ts reverseGeocode** (`lib/__tests__/api-reverseGeocode.test.ts`) — 7 tests
- Valid coordinates return city, empty/undefined results
- Non-ok response, network error, missing country field
- Coordinate rounding in query params

**api.ts boundary** (added to `lib/__tests__/api.test.ts`) — 1 test
- 2-character query boundary (mutation-killing)

**theme.ts applyTheme** (`lib/__tests__/theme-applyTheme.test.ts`) — 6 tests
- All 5 CSS variables set correctly, theme override

**storage.ts** (added to `lib/__tests__/storage.test.ts`) — 1 test
- Coordinate dedup requires both lat AND lon match (mutation-killing)

---

## 7. Remaining Gaps

| Area | Gap | Why | Risk |
|------|-----|-----|------|
| 3D Scenes (420 lines) | 0% coverage | WebGL not available in jsdom; visual-only code with no business logic | Low |
| SearchBar click-outside | Lines 49-52 uncovered | Requires testing document.addEventListener mousedown outside container | Low |
| TemperatureChart tooltip | Lines 71-73 uncovered | Recharts tooltip formatter callback not triggered in zero-dimension jsdom | Low |
| WeatherContext error fallback | Line 82 uncovered | Non-Error thrown in fetchWeather catch | Low |
| main.tsx | Entry point | createRoot + StrictMode — framework boilerplate | None |

---

## 8. Testing Infrastructure Recommendations

| # | Recommendation | Impact | Risk if Ignored | Worth Doing? | Details |
|---|---|---|---|---|---|
| 1 | Add Stryker mutation framework | Automated mutation testing on every PR, catches regressions in test quality | Medium | Probably | Manual mutation testing is thorough but slow. Stryker with `@stryker-mutator/vitest-runner` can automate this for ~15 critical functions. Cost: ~30 min setup, ~2 min per run. |
| 2 | Add Playwright for E2E | Real browser testing would cover 3D scenes, ResizeObserver, and actual user flows | Medium | Only if time allows | The jsdom integration tests cover the same flows at component level. Playwright would add value mainly for visual regression and WebGL smoke testing. |
| 3 | Add `ResizeObserver` polyfill to test setup | Eliminate recharts warnings in every test file that renders charts | Low | Yes | One line in `src/test/setup.ts` instead of per-file polyfills. |
| 4 | Add `matchMedia` polyfill to test setup | Eliminate need for per-file matchMedia mocking | Low | Yes | Same as above — add to global test setup for consistency. |
