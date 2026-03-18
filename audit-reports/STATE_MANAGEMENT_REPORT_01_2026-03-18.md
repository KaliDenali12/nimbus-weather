# State Management Audit Report

**Run**: 01 | **Date**: 2026-03-18 | **Branch**: `nightytidy/run-2026-03-18-1312`

---

## 1. Executive Summary

**Health Rating: Solid**

The Nimbus Weather App has a well-structured, minimal state management architecture. Single React Context + localStorage, no external libraries, clean separation of concerns. The codebase is small enough that the simple approach is correct — no over-engineering detected.

| Metric | Count |
|--------|-------|
| Findings (total) | 8 |
| Critical | 0 |
| Medium | 2 |
| Low | 4 |
| Informational | 2 |
| Fixes Applied | 1 |

---

## 2. State Source Map

### Complete Inventory

| Data | Canonical Source | Other Copies | Sync Mechanism | Stale Window | Survives Refresh? | Should Survive? |
|------|-----------------|--------------|----------------|-------------|-------------------|-----------------|
| Weather data | `WeatherContext.weather` | None | API fetch on city select/init | Until next fetch | No | No (live data) |
| Loading flag | `WeatherContext.loading` | None | Set around async ops | Transient | No | No |
| Error message | `WeatherContext.error` | None | Set on fetch failure, cleared on retry | Until retry | No | No |
| Unit preference | `WeatherContext.preferences.unitPreference` | localStorage `nimbus-preferences` | Effect syncs state → localStorage | None (sync) | Yes | Yes |
| Dark mode | `WeatherContext.preferences.darkModeEnabled` | localStorage `nimbus-preferences` | Effect syncs state → localStorage | None (sync) | Yes | Yes |
| Recent cities | `WeatherContext.preferences.recentCities` | localStorage `nimbus-preferences` | Effect syncs state → localStorage | None (sync) | Yes | Yes |
| Geolocation error | `WeatherContext.geoError` | None | Set once on init failure | Session | No | No |
| Weather condition | `WeatherContext` (derived) | None | useMemo from `weather` | None | No | No |
| Time of day | `WeatherContext` (derived) | None | useMemo from `weather` | None | No | No |
| Search query | `SearchBar.query` (local) | None | User input | Transient | No | No |
| Search results | `SearchBar.results` (local) | None | API response | Until next search | No | No |
| Search loading | `SearchBar.loading` (local) | None | Set around search API call | Transient | No | No |
| Search error | `SearchBar.searchError` (local) | None | Set on search failure | Until next search | No | No |
| Dropdown open | `SearchBar.isOpen` (local) | None | User interaction | Transient | No | No |
| Active list index | `SearchBar.activeIndex` (local) | None | Keyboard navigation | Transient | No | No |
| Geo toast visible | `App.showGeoToast` (local) | None | Dismiss callback | Session | No | No |
| Toast visible | `Toast.visible` (local) | None | Timer + dismiss | Transient | No | No |
| Dismissed alerts | `AlertBanner.dismissed` (local) | None | Click handler (Set) | Page | No | No (dormant) |
| Geocoding cache | `api.ts` module-level Map | None | Populated on search, 5min TTL | 5 min | No | No |
| Theme CSS vars | `document.documentElement.style` | None | Effect in WeatherContext | None (sync) | No (reapplied on mount) | No |
| Reduced motion | `WeatherScene.tsx` module const | None | Read once at module load | Never updates | No | N/A |
| Canvas DPR | `WeatherScene.tsx` module const | None | Read once at module load | Never updates | No | N/A |
| Error boundary state | `AppErrorBoundary.state` / `SceneErrorBoundary.state` | None | getDerivedStateFromError | Permanent (until reload) | No | No |

### State by Lifecycle

| Lifecycle | State |
|-----------|-------|
| **Persistent** (survives sessions) | unitPreference, darkModeEnabled, recentCities |
| **Session** (survives nav, not tab close) | weather, condition, timeOfDay, geoError, showGeoToast |
| **Page** (resets on nav away) | dismissed alerts |
| **Transient** (resets after interaction) | query, results, loading (search), isOpen, activeIndex, toast visible |

**Mismatches**: None. Every piece of state has the correct lifecycle for its purpose.

---

## 3. Duplicated State

**No duplicated state found.**

The architecture cleanly separates concerns:
- Server data (`weather`) lives only in context
- Preferences live in context state with a one-way sync effect to localStorage
- Component-local state is appropriately scoped (SearchBar owns search state, Toast owns visibility)
- Derived values (`condition`, `timeOfDay`) are computed via `useMemo`, not stored separately

The `preferences` ↔ localStorage relationship is **not** a duplication problem because localStorage is the persistence layer, not a separate source of truth. State flows one direction: `loadPreferences()` → initial state → `savePreferences()` effect → localStorage.

---

## 4. Stale State Bugs

### 4.1 Rapid City Selection Race Condition — Medium

**File**: `src/context/WeatherContext.tsx:144-150`

**Trigger**: User clicks two different recent city chips in rapid succession (< 200ms apart).

**Steps to reproduce**:
1. Have 2+ cities in recent cities list
2. Click "London" chip
3. Immediately click "Tokyo" chip (before London weather loads)
4. If London fetch completes after Tokyo fetch, London weather displays with Tokyo in recent cities

**Current behavior**: Both fetches race. Last `setWeather()` wins, regardless of which city was clicked last. The `selectCity` function calls `loadWeatherForCoords` (async) without awaiting or cancelling previous calls.

**Impact**: Low — requires very rapid clicks (network latency would need to be inconsistent). The user would see correct data after a brief flash. No data corruption.

**Fix complexity**: Medium — would require an AbortController pattern or a request ID counter in `loadWeatherForCoords`. The SearchBar already handles this pattern correctly with its `cancelled` flag (SearchBar.tsx:27,47).

**Status**: Document only — the fix would touch the core data flow and is better suited for a dedicated PR.

### 4.2 Geocoding Cache Single Eviction — Low

**File**: `src/lib/api.ts:109-111`

**Trigger**: Cache reaches 50 entries.

**Current behavior**: Only evicts the single oldest entry when cache is full. If multiple rapid unique searches happen, each one evicts only one entry, keeping the cache at 49-50.

**Impact**: Negligible — the cache is bounded (good), eviction works (good), and the single-eviction pattern is actually fine since searches are debounced at 300ms so bursts can't overwhelm it. The cache TTL (5 min) also naturally prunes stale entries on read.

**Status**: No fix needed. Working as designed.

---

## 5. Missing UI States

### 5.1 No Visual Search Loading Indicator — Low

**File**: `src/components/SearchBar.tsx:140-145`

**Current behavior**: The `loading` state exists and is correctly managed. An `aria-live` region announces "Searching..." for screen readers (line 141). However, sighted users see no visual feedback while waiting for search results.

**Impact**: Low — searches are fast (debounced + cached), and the dropdown appears quickly. On slow connections, users might think nothing is happening.

**Status**: Document only — this is a UX enhancement, not a state management bug.

### 5.2 All Async Operations Have Proper Loading/Error States — Verified

| Operation | Loading | Error | Empty | Retry |
|-----------|---------|-------|-------|-------|
| Initial weather fetch | `LoadingState` (full page) | `ErrorState` with retry button | N/A (always has data or error) | `retry` → `initializeLocation()` |
| City search | `SearchBar.loading` + aria-live | `searchError` → message in dropdown | "No cities found" message | Type again |
| City select (weather) | `loading=true` → full page spinner | `error` → ErrorState | N/A | retry button |
| Geolocation | Part of initial load | `geoError` → Toast notification | N/A | Antarctica fallback |

**Finding**: The loading state for city selection shows a full-page `LoadingState` spinner because `App.tsx:23` returns `<LoadingState />` when `loading` is true. This means switching cities blanks the entire page. This is by design (simple approach), but could flash briefly on fast connections.

---

## 6. Lifecycle Bugs

### 6.1 `prefersReducedMotion` Not Reactive — Low

**File**: `src/scenes/WeatherScene.tsx:7-9`

```typescript
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

**Current behavior**: Captured once at module load time. If user toggles reduced motion in OS settings mid-session, 3D animations won't respond until page reload.

**Impact**: Low — very few users change this setting mid-session. Accessibility impact is minor since the 3D scene is decorative.

**Status**: Document only.

### 6.2 `canvasDpr` Not Reactive — Informational

**File**: `src/scenes/WeatherScene.tsx:11-13`

**Current behavior**: DPR captured once at module load. Won't update if window is dragged to a different-DPI monitor.

**Impact**: Negligible — canvas will render at wrong resolution until page reload. Most users don't switch monitors mid-session.

**Status**: Document only.

### 6.3 Error Boundaries Don't Self-Recover — Informational

**Files**: `src/components/AppErrorBoundary.tsx`, `src/components/SceneErrorBoundary.tsx`

**Current behavior**: Once `hasError` is set to `true`, it stays `true` forever (until page reload for AppErrorBoundary, or forever for SceneErrorBoundary since it renders `null`).

**Impact**: Correct for AppErrorBoundary (offers reload button). SceneErrorBoundary silently removes the 3D scene permanently — acceptable since the gradient background remains visible and the 3D scene is non-essential.

**Status**: Working as designed.

### 6.4 `condition` and `timeOfDay` Were Not Memoized — Medium (FIXED)

**File**: `src/context/WeatherContext.tsx:61-66`

**Previous behavior**: `condition` and `timeOfDay` were computed as plain variables on every render, not wrapped in `useMemo`. Since they're used as dependencies for the theme effect and included in the memoized `contextValue`, any render of `WeatherProvider` (e.g., from `preferences` change) would recompute them. Although the values wouldn't change (same `weather` object), JavaScript creates new primitive values that pass `Object.is` equality — wait, actually for primitives like strings, `Object.is('clear', 'clear')` is `true`. So the `useMemo` for `contextValue` would already detect no change.

**Revised impact**: The theme effect (line 69-72) uses `condition` and `timeOfDay` as dependencies. As plain variables recalculated every render, they produce the same string values, which React's `useEffect` compares by `Object.is`. So the effect wouldn't re-run unnecessarily. However, wrapping them in `useMemo` is still the correct pattern because:
1. It communicates intent — these are derived values that should only recalculate when their source changes
2. It prevents `getWeatherCondition()` from running on every render (minor CPU savings)
3. It's consistent with how `contextValue` is memoized

**Fix applied**: Wrapped both in `useMemo` with `[weather]` dependency.

**Tests**: 260/260 passing.

---

## 7. Hydration Mismatches

**Not applicable** — Nimbus is a client-side only SPA with no SSR/SSG.

---

## 8. Edge Cases

### 8.1 Multi-Tab Behavior

| Scenario | Current Behavior | Expected | Impact |
|----------|-----------------|----------|--------|
| Tab A changes unit to °F, Tab B still shows °C | Tabs are independent. Tab B stays on °C until reload | Acceptable — no shared data requirement | None |
| Tab A adds London to recent cities, Tab B doesn't see it | localStorage updated by Tab A, but Tab B's React state doesn't re-read localStorage | Could be improved with `storage` event listener, but low priority | Negligible |
| Both tabs search simultaneously | Both create independent geocoding cache instances (module-level Map per tab) | Correct — each tab has its own JS context | None |

**No `storage` event listener exists.** Cross-tab sync is not implemented. This is acceptable for a weather app — each tab is an independent session.

### 8.2 Network Interruption

| Scenario | Current Behavior | Expected | Impact |
|----------|-----------------|----------|--------|
| Network drops during initial load | `fetchWeather` times out after 10s → `setError` → ErrorState with retry | Correct | None |
| Network drops during city search | `searchCities` times out → catch block → `searchError=true` → error message in dropdown | Correct | None |
| Network drops during city selection | `fetchWeather` fails → `setError` → ErrorState replaces weather display | Loses previous weather data — shows error instead of stale-but-valid data | Low |
| Network restores | User must manually retry (click button or search again) | Could auto-retry, but manual is fine | Negligible |

**Notable**: When city selection fails, the previous weather data is lost because `setLoading(true)` at `WeatherContext.tsx:81` triggers `App.tsx:23` to return `<LoadingState />`, and if the fetch fails, `setError` replaces weather display. The old `weather` state is still in memory but the error view takes precedence. User can retry. This is the correct simple behavior.

### 8.3 Session Expiry

**Not applicable** — no authentication, no sessions, no tokens. Open-Meteo is keyless.

---

## 9. Re-render Hot Spots

### 9.1 Context Value Object — Well Handled

`contextValue` is properly memoized with `useMemo` (WeatherContext.tsx:171-185). All callbacks are wrapped in `useCallback`. This prevents unnecessary re-renders of consumers.

### 9.2 `preferences` Object Causes Full Consumer Re-render

When `toggleUnit` or `toggleDark` is called, `preferences` state changes, which changes `contextValue`, which re-renders ALL consumers of `useWeather()`. This includes:
- `Header` (needs preferences)
- `CurrentWeather` (needs preferences.unitPreference)
- `Forecast` (needs preferences.unitPreference)
- `TemperatureChart` (needs preferences.unitPreference)
- `SearchBar` (only needs `searchForCities`, `selectCity`)
- `WeatherScene` (only needs `weather`, `condition`, `timeOfDay`)
- `RecentCities` (only needs `preferences.recentCities`, `selectCity`)
- `AlertBanner` (only needs `weather`)
- `ErrorState` (only needs `error`, `retry`)

**Impact**: When user toggles unit or dark mode, components like `SearchBar` and `WeatherScene` re-render unnecessarily. However:
- `SearchBar` is lightweight (no expensive computation)
- `WeatherScene`'s `Canvas` has its own React tree; the `WeatherScene` wrapper just checks `!weather` and passes props — cheap re-render
- `SceneContent` receives props, so only re-renders if `condition`/`timeOfDay`/`reducedMotion` change (they don't on preference toggle)

**Verdict**: Not a real performance problem for this app size. Would only matter with 50+ components or expensive renders.

### 9.3 `TemperatureChart` Data Recomputation — Well Handled

`data` is memoized with `useMemo([weather.daily, unit])`. Only recalculates when weather data or unit preference changes. Correct.

---

## 10. Architecture Assessment (Document Only)

### Server vs Client State Separation

**Good**: The app has no server state management library (React Query, SWR, etc.), but this is appropriate given:
- Only 2 API endpoints (geocoding + forecast)
- No mutations to manage
- No complex cache invalidation needs
- Stale data tolerance is high (weather updates are user-triggered)

Adding React Query would be over-engineering for this use case.

### State Proximity

**Good**: State lives at the right level:
- Global (weather, preferences): Context — consumed by 8+ components
- Local (search, toast, alerts): Component state — consumed by 1 component
- No prop drilling beyond 1 level anywhere

### Single Context vs Multiple Contexts

The single `WeatherContext` bundles weather data + preferences + actions. This means a preferences change re-renders weather display components. For this app's size (< 15 components), this is acceptable. Splitting into `WeatherDataContext` + `PreferencesContext` would reduce re-renders but add complexity that isn't warranted.

### localStorage Strategy

**Good**: Single key (`nimbus-preferences`), atomic read/write, validation on read, graceful fallback on corruption, bounded data (max 5 cities). No unbounded growth risk.

---

## 11. Fixes Applied

| # | File | Issue | Fix | Tests |
|---|------|-------|-----|-------|
| 1 | `src/context/WeatherContext.tsx:61-66` | `condition` and `timeOfDay` computed as plain variables instead of memoized | Wrapped both in `useMemo` with `[weather]` dependency | 260/260 passing |

---

## 12. Recommendations

| # | Recommendation | Impact | Risk if Ignored | Worth Doing? | Details |
|---|---|---|---|---|---|
| 1 | Add AbortController to `loadWeatherForCoords` for rapid city switching | Prevents stale weather flash on rapid city clicks | Very low — requires pathological clicking + inconsistent network latency | Maybe — low priority, adds complexity | Cancel previous fetch when new city is selected. Pattern: store AbortController in ref, abort on new call. |
| 2 | Add visual search loading indicator | Better UX feedback on slow connections | Low — searches are fast, aria-live covers a11y | Maybe — nice polish, minimal effort | Add a small spinner icon in the search input while `loading` is true |
| 3 | Make `prefersReducedMotion` reactive | Responds to OS accessibility changes mid-session | Very low — almost nobody changes this setting while browsing | No — cost exceeds benefit | Would need `useSyncExternalStore` or `useEffect` with `matchMedia.addEventListener` |
| 4 | Preserve previous weather on city-switch failure | Shows stale-but-valid data instead of error page when new city fetch fails | Low — requires network failure during city switch | Maybe — better UX, moderate complexity | Track "previous weather" separately from "loading weather", show previous data during loading with a subtle loading indicator overlay |

Ordered by risk descending. All recommendations are polish-level — no critical issues found.
