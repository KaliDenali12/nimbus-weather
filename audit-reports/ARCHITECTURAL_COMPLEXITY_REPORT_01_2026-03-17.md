# Architectural Complexity Audit Report

**Run:** 01
**Date:** 2026-03-17
**Branch:** `nightytidy/run-2026-03-17-1741`
**Files Analyzed:** 33 source files (~2,940 non-test lines), 25 test files (~3,480 lines)
**Scope:** Full architectural complexity audit — dependency graph, data flow, patterns, quantification

---

## 1. Executive Summary

**Overall Complexity Assessment: Lean**

This is a well-architected, minimally complex codebase. The architecture is appropriate for a client-side weather app with 3D visuals: 4 clean layers (components → context → lib → types), no unnecessary abstraction, no over-engineering, and no cargo-culted patterns. A new developer can understand the entire system by reading ~10 files.

**Single Biggest Complexity Tax:** The `WeatherContext.tsx` monolith (182 lines) serves as the sole orchestration point for all state, side effects, and actions. This is actually appropriate for the app's scale — splitting it would create more complexity than it removes. The "tax" is minimal.

**Top 3 Simplification Opportunities:**
1. **Remove dead `reverseGeocode` function** (api.ts:92-115) — 24 lines of production code + ~80 lines of tests for a function that is never called outside tests. Effort: trivial.
2. **Remove `AlertBanner` component** (69 lines) + `WeatherAlert` type (8 lines) — renders an always-empty array because Open-Meteo free tier provides no alerts. The component is fully implemented UI for a data source that doesn't exist. Effort: trivial.
3. **Collapse `searchForCities` wrapper** in `WeatherContext.tsx:137-140` — a `useCallback` that wraps `searchCities` with an identical signature, adding a layer for no reason. Effort: trivial.

**Verdict:** This codebase does not have an architectural complexity problem. The few findings below are minor cleanup items, not structural issues. The architecture is right-sized for the problem domain.

---

## 2. Structural Complexity Map

### 2.1 Dependency Graph Summary

#### Hub Modules (files imported by the most other files)

| File | Import Count | Role | Verdict |
|------|-------------|------|---------|
| `types/index.ts` (→ `types/weather.ts`) | 11 | Type definitions barrel | **Justified** — central type definitions, appropriate hub |
| `context/WeatherContext.tsx` | 9 | State provider + `useWeather` hook | **Justified** — single context for a single-page app |
| `lib/units.ts` | 3 | Temperature/wind formatting | **Justified** — shared utility |
| `lib/weather-codes.ts` | 3 | WMO code mapping | **Justified** — shared utility |

**Assessment:** No junk-drawer hub modules. Both hub files serve clear, singular purposes. The type barrel (`types/index.ts`) re-exports from a single file (`types/weather.ts`), which is appropriate ergonomics without hiding complexity.

#### Deepest Import Chains

The longest import chain from entry point to leaf:

```
main.tsx → App.tsx → WeatherContext.tsx → api.ts → types/index.ts → weather.ts
```

**Depth: 6 files, 5 imports.** Every file in the chain does meaningful work:
- `main.tsx`: React root creation
- `App.tsx`: Layout composition
- `WeatherContext.tsx`: State orchestration + side effects
- `api.ts`: HTTP requests + response transformation
- `types/index.ts`: Barrel re-export
- `weather.ts`: Type definitions

**Indirection ratio: 1.0** (all files earn their place, though `types/index.ts` is a forwarding layer — acceptable for types).

The 3D scene chain is equally clean:
```
App.tsx → WeatherScene.tsx → SceneContent.tsx → RainParticles.tsx (leaf)
```
**Depth: 4 files.** All do meaningful work.

#### Circular Dependencies

**None found.** The dependency graph is a clean DAG:
- Types flow one direction: `types/` → consumed by everything
- Data flows one direction: `lib/` → consumed by `context/` → consumed by `components/`
- 3D scene components consume `types/` directly (no circular dependency with context)
- `SceneContent.tsx` has a `default export` (the only default export in the codebase) because it's lazy-loaded via `React.lazy()` — justified

#### Orphaned Modules

| File | Imported By (non-test) | Status |
|------|----------------------|--------|
| `lib/api.ts:reverseGeocode` | Nothing (only tests) | **Dead code** — exported function never used in production |

The `reverseGeocode` function (api.ts:92-115) is defined and exported but only imported by test files (`api-contracts.test.ts`, `api-reverseGeocode.test.ts`). It is never called from any production code path. This is dead code with ~80 lines of dedicated tests.

### 2.2 Layer Analysis Per Operation

#### Core User Operations Traced

| # | Operation | Full Call Path | Files Touched | Meaningful Layers | Indirection Ratio |
|---|-----------|---------------|---------------|-------------------|-------------------|
| 1 | **App loads → weather displayed** | `main.tsx` → `App.tsx` → `WeatherContext.tsx` (useEffect → `initializeLocation` → `getUserLocation` → `searchCities` → `loadWeatherForCoords` → `fetchWeather`) → `theme.ts:applyTheme` → component renders | 5 files | 5 | **1.0** |
| 2 | **Search for city** | `SearchBar.tsx` → `useWeather().searchForCities` → `WeatherContext.tsx` → `api.ts:searchCities` | 3 files | 2.5* | **1.2** |
| 3 | **Select city** | `SearchBar.tsx` → `useWeather().selectCity` → `WeatherContext.tsx` (addRecentCity + loadWeatherForCoords) → `storage.ts` + `api.ts:fetchWeather` | 4 files | 4 | **1.0** |
| 4 | **Toggle temperature unit** | `Header.tsx` → `useWeather().toggleUnit` → `WeatherContext.tsx` → `storage.ts:setUnit` → `savePreferences` | 3 files | 3 | **1.0** |
| 5 | **Toggle dark mode** | `Header.tsx` → `useWeather().toggleDark` → `WeatherContext.tsx` → `storage.ts:toggleDarkMode` → `savePreferences` → `theme.ts:applyTheme` (via useEffect) | 4 files | 4 | **1.0** |
| 6 | **Click recent city** | `RecentCities.tsx` → `useWeather().selectCity` → (same as #3) | 4 files | 4 | **1.0** |
| 7 | **Retry after error** | `ErrorState.tsx` → `useWeather().retry` → `WeatherContext.tsx:initializeLocation` → (same as #1) | 3 files | 3 | **1.0** |

*Operation #2 has 2.5 meaningful layers because `WeatherContext.tsx:searchForCities` is a `useCallback` wrapper around `searchCities` that adds no logic — it's a forwarding call. See Finding F-01.

**Glue Code Lines:** ~5 total across the entire codebase (the `searchForCities` wrapper in context, and the `retry` wrapper). This is negligible.

### 2.3 Abstraction Inventory

| # | Abstraction | Type | Location | Implementations | Justification | Verdict |
|---|-------------|------|----------|----------------|---------------|---------|
| A-01 | `WeatherContextValue` interface | Interface | `WeatherContext.tsx:29-42` | 1 | Defines the context shape for consumers | **Keep** — standard React context pattern |
| A-02 | `types/index.ts` barrel | Re-export | `types/index.ts` | 1 source file | Ergonomic import path | **Keep** — single-file barrel is fine |
| A-03 | `ApiError` class | Custom error | `api.ts:9-16` | 1 | Typed API errors with status code | **Keep** — enables typed error handling |
| A-04 | `WeatherTheme` interface | Interface | `types/weather.ts:79-86` | 16 + 1 (dark mode) | Theme palette definition | **Keep** — serves the theming system |
| A-05 | `WeatherAlert` type | Interface | `types/weather.ts:41-48` | 0 (never populated) | Alert data from API | **Flag** — see Finding F-02 |
| A-06 | `GeoPosition` interface | Interface | `geolocation.ts:3-6` | 1 | Geolocation coords type | **Keep** — discriminated union result type |
| A-07 | `SceneErrorBoundary` class | Error boundary | `SceneErrorBoundary.tsx` | 1 | WebGL crash protection | **Keep** — essential for 3D resilience |
| A-08 | `ICON_MAP` record | String→Component map | `WeatherIcon.tsx:22-33` | 10 icons | Dynamic icon selection | **Keep** — cleaner than a switch |
| A-09 | `SEVERITY_STYLES` record | Config object | `AlertBanner.tsx:6-22` | 3 severities | Alert styling | **Flag** — dead code (alerts array always empty) |

**Summary:** 9 abstractions inventoried. 7 are justified and appropriate. 2 are flagged because they serve a feature (weather alerts) that has no data source.

**Interfaces with one implementation:** 0 problematic. All interfaces either have multiple implementations (WeatherTheme has 17) or define the shape of data consumed externally (types, context value).

**Factories creating one type:** 0. No factory pattern used anywhere.

**Strategy/plugin patterns:** 0. No strategy pattern.

**Event/observer systems:** 0. No custom event emitters. React's built-in useEffect reactivity is the only observer pattern.

**DI containers:** 0. No dependency injection. Dependencies are imported directly.

**Generic types with one instantiation:** `useDebounce<T>` — generic hook, but this is idiomatic React. Used with `string` only, but making it generic costs nothing and improves reusability. **Keep.**

**Wrapper classes that don't adapt:** 0.

**Configuration that never changes:** `GEOLOCATION_TIMEOUT` (8000ms), `MAX_RECENT_CITIES` (5), `GEOCODING_RESULT_LIMIT` (8), `FORECAST_DAYS` (6), `MIN_SEARCH_QUERY_LENGTH` (2). All are appropriately extracted as named constants — this is good practice, not over-configuration.

### 2.4 Directory Structure Assessment

```
src/
├── components/       (12 files, avg 54 lines)  ← UI components
│   └── __tests__/    (11 test files)           ← colocated tests
├── scenes/           (7 files, avg 61 lines)   ← 3D scene components
├── lib/              (6 files, avg 79 lines)   ← Pure utilities
│   └── __tests__/    (7 test files)            ← colocated tests
├── context/          (1 file)                  ← State management
│   └── __tests__/    (1 test file)
├── hooks/            (1 file)                  ← Custom hooks
│   └── __tests__/    (1 test file)
├── types/            (2 files)                 ← Type definitions
├── test/             (1 file)                  ← Test setup
├── __tests__/        (2 files)                 ← Integration/smoke tests
├── App.tsx
├── main.tsx
├── index.css
└── vite-env.d.ts
```

**Assessment: Clean and well-organized.**

- Directory structure maps directly to the architecture. No drift detected.
- Related files are co-located: tests sit in `__tests__/` next to their subjects.
- No catch-all directories. `lib/` has 6 focused files, not 30+ unrelated utilities.
- Nesting depth matches architecture depth (1 level of directories, matching 1 layer of abstraction).
- The `scenes/` directory cleanly separates 3D rendering from business logic.
- `hooks/` has one file (`useDebounce.ts`) — could live in `lib/` but the separation is conventional for React projects and doesn't hurt.
- `context/` has one file — same reasoning.

**No restructuring recommended.**

---

## 3. Data Flow Complexity

### 3.1 Data Transformation Chains

#### Weather Data: API → Display

```
Open-Meteo JSON response
  ↓ (fetchWeather transforms: api.ts:58-89)
  ↓ Reshapes: response.current → CurrentWeather, response.daily → DailyForecast[]
  ↓ Meaningful work: field renaming (snake_case → camelCase), type coercion (isDay: 1→true), default values
WeatherData (domain type)
  ↓ (stored in WeatherContext state)
  ↓ No transformation — passed as-is
Components consume via useWeather()
  ↓ (formatTemp, formatWindSpeed in units.ts)
  ↓ Meaningful work: unit conversion (C→F), rounding, string formatting
Displayed string
```

**Transformation count: 2** (API response → domain type, domain type → display string).
**Both transformations do meaningful work.** There is no "copy fields between identical shapes" layer. The API response shape and the domain type are genuinely different (different naming conventions, different types).

#### City/Search Data: API → Selection

```
User types query
  ↓ (useDebounce: 300ms)
  ↓ Meaningful work: debounce prevents excess API calls
searchCities(query) → Open-Meteo geocoding API
  ↓ (api.ts:18-32)
  ↓ Minimal transformation: unwrap data.results, cast to GeocodingResult[]
GeocodingResult[] displayed in SearchBar dropdown
  ↓ User selects → handleSelect creates City from GeocodingResult
  ↓ Meaningful work: maps GeocodingResult fields to City shape (latitude→lat, longitude→lon)
City passed to selectCity → stored in recentCities (localStorage)
```

**Transformation count: 2** (API response → GeocodingResult, GeocodingResult → City).
**Both justified.** `GeocodingResult` preserves API field names for type safety; `City` uses shorter names for storage efficiency.

**Notable:** The `GeocodingResult` → `City` mapping (SearchBar.tsx:59-64) is done inline in the `handleSelect` callback. This is the right place for it — no unnecessary mapping layer.

### 3.2 State Management Assessment

#### Sources of Truth

| Data | Source of Truth | Other Locations | Sync Mechanism |
|------|---------------|-----------------|----------------|
| Weather data | `WeatherContext.weather` state | None | Single source |
| User preferences | `WeatherContext.preferences` state | `localStorage` | `useEffect` auto-saves on change |
| Loading state | `WeatherContext.loading` state | None | Single source |
| Error state | `WeatherContext.error` state | None | Single source |
| Geo error | `WeatherContext.geoError` state | None | Single source |
| Weather condition | Derived: `getWeatherCondition(weather.current.weatherCode)` | None | Computed in render |
| Time of day | Derived: `weather.current.isDay` | None | Computed in render |
| Search query | `SearchBar` local state | None | Single source |
| Search results | `SearchBar` local state | None | Single source |
| Toast visibility | `App` local state | None | Single source |
| Alert dismissals | `AlertBanner` local state | None | Single source |

**Assessment: Exemplary.**

- **Zero state duplication.** Every piece of data has exactly one source of truth.
- **Derived state is computed, not stored.** `condition` and `timeOfDay` are computed inline from `weather` — no manual sync needed.
- **localStorage sync is one-directional and clean:** preferences state → `useEffect` → `savePreferences()`. Preferences are loaded once on mount via `useState(loadPreferences)`.
- **Global state is minimal.** Only data that multiple components need lives in context. Search state, toast visibility, and alert dismissals are correctly scoped as local state.
- **No state management library.** `useState` + `useContext` is exactly right for this app's complexity. Redux/Zustand would be over-engineering.

### 3.3 Configuration Layer Map

| Layer | Location | What's Configured | Verdict |
|-------|----------|-------------------|---------|
| Build config | `vite.config.ts` | Bundling, aliases, test setup | **Appropriate** |
| Tailwind config | `tailwind.config.js` | Design tokens (fonts, sizes, spacing) | **Appropriate** |
| API constants | `lib/api.ts` (top of file) | URLs, limits, result counts | **Appropriate** — named constants, not a config file |
| Geolocation constants | `lib/geolocation.ts` | Timeout, cache age | **Appropriate** |
| Storage constants | `lib/storage.ts` | Storage key, max recent cities | **Appropriate** |
| Theme data | `lib/theme.ts` | 16 weather themes + dark mode | **Appropriate** — data, not config |
| CSS variables | `index.css` | Default theme values (overridden at runtime) | **Appropriate** |
| Deploy config | `netlify.toml` | Headers, redirects | **Appropriate** |

**Configuration layers: 1** (build tools). Everything else is just named constants within source files, which is the simplest possible approach.

**No environment variables.** No `.env` files. No runtime configuration. No feature flags. No configuration overrides. This is exactly right for a client-side app with a free, keyless API.

---

## 4. Pattern Complexity

### 4.1 Premature Generalization

| # | Pattern | Location | Introduced | Ever Used? | Maintenance Cost | Recommendation |
|---|---------|----------|-----------|------------|------------------|----------------|
| P-01 | `WeatherAlert` type + `AlertBanner` component + `SEVERITY_STYLES` | `types/weather.ts:41-48`, `components/AlertBanner.tsx` (69 lines) | Commit `15191a8` (initial build) | **Never** — `alerts` array is always `[]` | Low (~77 lines of code + 110 lines of tests) | **Remove** or **Accept** (see analysis) |
| P-02 | `reverseGeocode` function | `lib/api.ts:92-115` | Commit `15191a8` (initial build) | **Never** — not called from production code | Low (~24 lines + ~80 lines of tests) | **Remove** |
| P-03 | `useDebounce<T>` generic type parameter | `hooks/useDebounce.ts` | Commit `15191a8` | Only with `string` | Zero (generic is free in TS) | **Accept** — idiomatic, zero cost |

**Analysis of P-01 (AlertBanner):**
The `AlertBanner` component is a fully-implemented UI for weather alerts (3 severity levels, dismissal state, styled cards). However, the Open-Meteo free tier provides no alert data, so `weather.alerts` is always `[]` (hardcoded in `api.ts:81`). The component exits early on line 31 (`if (visibleAlerts.length === 0) return null`) on every render.

This is a borderline case. The component was presumably built with the expectation that alerts might become available (via a future API or data source). The cost is low — it renders nothing and the code is clean. However, it is dead UI code that will never execute until the data source changes. **Recommendation: Accept with documentation, or remove and re-add when an alert data source is available.** The current approach (keeping it) is defensible.

**Analysis of P-02 (reverseGeocode):**
The `reverseGeocode` function in `api.ts` has no production callers. It's tested by `api-reverseGeocode.test.ts` and `api-contracts.test.ts`, but never imported by any non-test file. This is genuinely dead code. The function implements a workaround (searching by coordinates since Open-Meteo has no reverse geocoding endpoint), suggesting it was planned for use but never connected to the initialization flow (which uses `searchCities` with coordinate strings instead). **Recommendation: Remove.**

### 4.2 Unnecessary Indirection Patterns

| # | Pattern | Location | Simpler Alternative | Risk of Change |
|---|---------|----------|---------------------|----------------|
| F-01 | `searchForCities` useCallback wrapper | `WeatherContext.tsx:137-140` | Pass `searchCities` from `api.ts` directly (or just import it in SearchBar) | Low |
| F-02 | `retry` useCallback wrapper | `WeatherContext.tsx:152-154` | Pass `initializeLocation` directly | Low |

**F-01 Detail:** `WeatherContext.tsx:137-140` defines:
```typescript
const searchForCities = useCallback(
  (query: string) => searchCities(query),
  [],
)
```
This wraps `searchCities` from `api.ts` with an identical signature. The `useCallback` with `[]` deps means it returns a stable reference to a function that... calls another stable function. The wrapper adds nothing. However, it does serve a purpose: it exposes `searchForCities` through the context API, maintaining the principle that all data operations go through the context. Removing it would mean `SearchBar` imports from `api.ts` directly, bypassing the context — which is arguably fine for a pure read-only search, but breaks the pattern.

**Verdict on F-01:** This is a **design choice, not a complexity problem**. The wrapper costs 4 lines and maintains a consistent API surface. **Accept.**

**F-02 Detail:** `WeatherContext.tsx:152-154` defines:
```typescript
const retry = useCallback(() => {
  initializeLocation()
}, [initializeLocation])
```
This wraps `initializeLocation` in a useCallback. It could be `const retry = initializeLocation` since `initializeLocation` is already a stable `useCallback`. However, the explicit naming provides semantic clarity (`retry` vs `initializeLocation`). The Code Elegance report already flagged this and decided to keep it. **Accept.**

### 4.3 Cargo-Culted Patterns

**None found.**

This codebase does not exhibit any cargo-culted patterns:
- No CQRS, no DDD ceremony, no microservice patterns
- No repository pattern wrapping anything
- No clean architecture layers beyond what's needed
- No unnecessary interfaces, factories, or providers
- The React context pattern is used correctly and minimally
- Error boundaries are used only where needed (WebGL)
- TypeScript strict mode is genuine (not just enabled-but-ignored)

### 4.4 Organic Growth Tangles

**None found.**

The codebase was built in a focused sequence of commits:
1. `0fe3cea` — scaffold + core infrastructure
2. `15191a8` — all UI components
3. `d8f4c05` — 3D weather scene
4. Subsequent commits are refinements, not bolted-on features

There are no "old way and new way" coexisting, no workarounds routing around the architecture, and no `// temporary` comments. The architecture is coherent and self-consistent.

---

## 5. Complexity Quantification

### 5.1 Indirection Scores Per Operation

| Operation | Files Touched | Meaningful Layers | Indirection Ratio | Glue Lines | Rating |
|-----------|--------------|-------------------|-------------------|------------|--------|
| App load → weather display | 5 | 5 | **1.0** | 0 | :green_circle: |
| Search for city | 3 | 2.5 | **1.2** | 4 | :green_circle: |
| Select city | 4 | 4 | **1.0** | 0 | :green_circle: |
| Toggle unit | 3 | 3 | **1.0** | 0 | :green_circle: |
| Toggle dark mode | 4 | 4 | **1.0** | 0 | :green_circle: |
| Click recent city | 4 | 4 | **1.0** | 0 | :green_circle: |
| Retry after error | 3 | 3 | **1.0** | 0 | :green_circle: |

**Average indirection ratio: 1.03.** This is exceptional. Every file in every call path does meaningful work.

### 5.2 Abstraction Overhead Inventory

| Category | Count | Estimated Lines | Notes |
|----------|-------|----------------|-------|
| Interfaces with one implementation | 0 problematic | 0 | All interfaces have multiple implementations or define external contracts |
| Factories creating one type | 0 | 0 | No factory pattern used |
| Wrapper classes | 0 | 0 | No wrapper classes |
| Generic types with one instantiation | 1 (`useDebounce<T>`) | 0 (free) | Generic type parameter is zero-cost |
| Event emissions with one listener | 0 | 0 | No custom events |
| Config options that never varied | 5 constants | 0 (beneficial) | Named constants improve readability |
| Dead production code | 2 items | ~93 lines | `reverseGeocode` (24) + `AlertBanner` system (69) |
| Dead test code for dead features | 2 test files | ~190 lines | Tests for `reverseGeocode` + `AlertBanner` |

**Total abstraction tax: ~0 lines** (no unnecessary abstractions).
**Total dead code: ~93 production lines + ~190 test lines = ~283 lines** (4.4% of total codebase).

### 5.3 Onboarding Complexity Per Area

| Area | Files to Read | Layers to Understand | Patterns to Know | Tribal Knowledge | Rating |
|------|--------------|---------------------|-----------------|-----------------|--------|
| **Core data flow** (search → display) | 4 (App, Context, api, types) | 3 (component → context → lib) | React Context | None | **Simple** |
| **Theming system** | 3 (theme.ts, index.css, Context) | 2 (theme data → CSS vars) | CSS custom properties | None | **Simple** |
| **Storage/preferences** | 2 (storage.ts, Context) | 2 (state → localStorage) | None | None | **Simple** |
| **3D scene** | 7 (WeatherScene, SceneContent, particles, clouds, ground, diorama) | 2 (canvas → scene objects) | R3F, Three.js BufferGeometry | `SceneContent` uses default export for lazy loading | **Moderate** |
| **Search with autocomplete** | 2 (SearchBar, useDebounce) | 1 (self-contained component) | Combobox ARIA pattern | None | **Simple** |
| **Unit conversion** | 1 (units.ts) | 1 (pure functions) | None | None | **Simple** |

**Overall onboarding estimate:** A new developer familiar with React + TypeScript could understand the entire codebase in **2-4 hours**. The 3D scene requires R3F/Three.js knowledge, adding ~1 hour for unfamiliar developers.

---

## 6. Simplification Roadmap

### 6.1 Full Finding List

| # | Finding | Category | Effort | Risk | Impact | Priority |
|---|---------|----------|--------|------|--------|----------|
| F-01 | `searchForCities` wrapper in Context | Accept | — | — | — | — |
| F-02 | `retry` wrapper in Context | Accept | — | — | — | — |
| F-03 | Dead `reverseGeocode` function in api.ts | Remove | Trivial (<1h) | Low | 24 prod + ~80 test lines removed | This week |
| F-04 | `AlertBanner` + `WeatherAlert` dead UI code | Accept (or Remove) | Trivial (<1h) | Low | 69 prod + 110 test lines removed | Backlog |
| F-05 | `_isNight` unused prop in DioramaObjects | Accept | — | — | — | — |
| F-06 | `Math.random()` in render (DioramaObjects snow trees) | Accept | — | — | — | — |
| F-07 | `SceneContent` default export (only default export in codebase) | Accept | — | — | — | — |

### 6.2 This Week (Trivial Removals)

1. **Remove `reverseGeocode` function** from `lib/api.ts:92-115`.
   - Delete the function definition (24 lines)
   - Delete `src/lib/__tests__/api-reverseGeocode.test.ts` (82 lines)
   - Remove the `reverseGeocode` import from `src/lib/__tests__/api-contracts.test.ts` and any tests using it
   - Risk: Low — function has zero production callers
   - Impact: Removes dead code and its test maintenance burden

### 6.3 This Month

No medium-effort simplifications identified.

### 6.4 This Quarter

No larger restructuring needed.

### 6.5 Backlog

1. **Decide on AlertBanner**: Either remove the component + types (if alerts will never be available) or document it as "ready for future alert data source." Current state is harmless but the component renders nothing on every page load.
   - If removing: delete `AlertBanner.tsx` (69 lines), `AlertBanner.test.tsx` (110 lines), `WeatherAlert` type from `weather.ts`, the `alerts: []` hardcoded array from `api.ts:81`, and the `<AlertBanner />` from `App.tsx:58`
   - If keeping: add a comment in `api.ts:81` explaining that this is a placeholder for a future data source
   - Risk: Low either way

### 6.6 Dependencies Between Simplifications

None. All findings are independent and can be addressed in any order.

---

## 7. Accepted Complexity

These items were evaluated and determined to be justified:

| Item | Why It's Justified |
|------|-------------------|
| **`WeatherContext.tsx` (182 lines) as single orchestration point** | The app has one page, one data source, and ~5 actions. A single context is simpler than splitting into multiple providers or adding a state library. The file is well under 200 lines. |
| **`searchForCities` wrapper in context** | Maintains consistent API surface where all data operations go through context. 4 lines of cost for architectural consistency. |
| **`retry` wrapper in context** | Provides semantic naming (`retry` vs `initializeLocation`). 3 lines of cost for readability. |
| **`types/index.ts` barrel re-export** | Single-file barrel is standard React/TS practice. Simplifies imports without hiding complexity. |
| **`ApiError` custom error class** | Carries HTTP status code information. Worth the 8 lines. |
| **`SceneErrorBoundary` class component** | Error boundaries require class components in React. The class is 25 lines and provides WebGL crash resilience. |
| **`useDebounce<T>` generic parameter** | Zero-cost generics are idiomatic TypeScript. Used with `string` only, but the generic doesn't hurt. |
| **`SceneContent` default export** | Required by `React.lazy()`. The only default export in the codebase, clearly justified. |
| **`_isNight` unused prop in DioramaObjects** | Reserved for future use (house window glow at night). Low cost to keep. Could be removed if the feature is never planned. |
| **`Math.random()` in render (DioramaObjects)** | Creates visual variety in snow tree scales. Technically impure but harmless in a 3D scene where per-frame variation is acceptable. |
| **16 theme objects in `theme.ts`** | 8 conditions × 2 times of day = 16 themes. This is data, not over-engineering. The `Record<ThemeKey>` type ensures completeness. |
| **Named constants for magic numbers** | `GEOLOCATION_TIMEOUT`, `MAX_RECENT_CITIES`, etc. These are good practice, not over-configuration. |

---

## 8. Recommendations

### 8.1 Priority-Ordered Next Steps

1. **Remove `reverseGeocode` dead code** — trivial, no risk, cleans up ~100 lines including tests
2. **Document the AlertBanner decision** — either remove it or add a comment explaining it's a placeholder. Don't leave it ambiguous.
3. **No other code changes recommended** — the architecture is clean

### 8.2 What Existing Overnight Prompts Should Target

| Prompt | Recommendation |
|--------|---------------|
| **Code Elegance** | Already ran (01). Found and fixed 6 minor issues. No further work needed on this pass. |
| **File Decomposition** | Already ran (01). All files under 300 lines. No splits needed. |
| **Codebase Cleanup** | Could target `reverseGeocode` removal and `AlertBanner` decision. |
| **Cross-Cutting Consistency** | Already ran (01). No issues found. |

### 8.3 Conventions to Prevent New Unnecessary Complexity

The codebase already follows strong conventions. To maintain this:

1. **Don't add state management libraries.** `useState` + `useContext` is sufficient for this app's scale. Only add Zustand/Redux if the app grows to 3+ independent data sources with cross-cutting concerns.
2. **Don't add abstraction layers preemptively.** No repository patterns, no service layers, no adapters unless there are genuinely multiple implementations.
3. **Don't create barrel files** beyond `types/index.ts`. Direct imports are clearer for a codebase this size.
4. **Keep the single-context pattern** until there's a measurable performance problem (excessive re-renders across unrelated component trees).
5. **Don't add configuration infrastructure** (env vars, config files, feature flags) unless the app needs deployment-time configurability. Currently everything is hardcoded and that's correct.

### 8.4 Abstraction Decision Framework

Before adding any new abstraction, ask:

1. **Does this abstraction have more than one implementation today?** If no, don't add the interface/factory/provider.
2. **Will this abstraction have more than one implementation within the next 3 months, based on concrete plans (not hypotheticals)?** If no, inline it.
3. **Does this abstraction reduce the number of files a developer needs to read to understand a feature?** If it increases the count, it's adding complexity.
4. **Can I explain what this abstraction does in one sentence?** If it takes a paragraph, the abstraction may be too clever.
5. **If I deleted this abstraction and inlined its behavior, would any test break in a way that exposes a real behavior change?** If no, the abstraction is ceremony.

---

*Report generated by architectural complexity audit. No source files were modified.*
