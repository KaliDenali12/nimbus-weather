# Bug Hunt Report — Run 1 (2026-03-18)

## Executive Summary

| Metric | Value |
|--------|-------|
| Files scanned | 28 source files + 28 test files |
| Total findings | 6 |
| Critical bugs | 0 |
| High-priority | 1 |
| Medium-priority | 2 |
| Low-priority | 3 |
| Bugs fixed | 0 (none met all fix criteria) |
| Tests passing | 260/260 |

The codebase is remarkably clean. No critical or security bugs were found. The highest-priority finding is a UX issue where forecast icons use the current time-of-day rather than assuming daytime for future days. All findings are document-only due to business logic ambiguity or requiring design decisions.

---

## High-Priority Findings

### H-01: Forecast icons use current time-of-day for all future days

- **Severity**: HIGH (Medium confidence — 70%)
- **File**: `src/components/Forecast.tsx:12,31`
- **What's wrong**: `const isDay = weather.current.isDay` is used for ALL forecast day icons. If the user views the forecast at night, every future day's icon shows the night variant (e.g., Moon instead of Sun for a clear Wednesday).
- **Trigger**: View the 5-day forecast at nighttime with clear weather in the forecast.
- **Impact**: Misleading forecast icons. A sunny Wednesday shows a moon icon because it's currently 10 PM.
- **Suggested fix**: For forecast entries at index > 0 (future days), default `isDay` to `true` since daily forecasts represent daytime conditions. For index 0 (today), use the current `isDay`.
- **Why not fixed**: This is a UX/design decision. Open-Meteo daily forecast doesn't include is_day per day. The fix requires a product decision about whether to always show day icons for future days.

---

## Medium-Priority Findings

### M-01: `prefersReducedMotion` is evaluated once at module load and never re-checked

- **Severity**: MEDIUM (High confidence — 90%)
- **File**: `src/scenes/WeatherScene.tsx:7-9`
- **What's wrong**: `prefersReducedMotion` is computed at module-load time as a module-level constant. If the user toggles their OS accessibility setting (prefers-reduced-motion) while the app is running, the 3D scene won't respond to the change.
- **Trigger**: Open the app with reduced motion OFF, then toggle the OS reduced-motion setting ON. The 3D scene continues animating.
- **Impact**: Accessibility violation — users who enable reduced motion mid-session see animations continue.
- **Suggested fix**: Use a `useMediaQuery` hook or `matchMedia.addEventListener('change', ...)` to reactively track the media query.
- **Why not fixed**: This is a deliberate performance optimization (avoid re-evaluating on every render). Fixing it requires adding a React hook or effect, which changes the component architecture beyond a minimal bug fix.

### M-02: `initializeLocation` uses coordinate strings as city name search query

- **Severity**: MEDIUM (High confidence — 90%)
- **File**: `src/context/WeatherContext.tsx:114-116`
- **What's wrong**: When the browser provides geolocation coordinates, the app searches for a city name by passing `"35.68 139.69"` as a text query to the geocoding search endpoint. Open-Meteo's geocoding API searches by city NAME, not coordinates. This query format is unlikely to return meaningful results for most coordinates.
- **Trigger**: Allow browser geolocation. The city name resolution relies on coordinate strings matching city names, which rarely works.
- **Impact**: Most geolocation users will see "Your Location" instead of their actual city name. The `reverseGeocode()` function exists in `api.ts` for this purpose but is never called from production code.
- **Suggested fix**: Replace the `searchCities()` call with `reverseGeocode()` (which already exists), or use a proper reverse geocoding strategy.
- **Why not fixed**: The fallback to "Your Location" is graceful. Changing the initialization flow is a behavior change that could affect the UX. The existing `reverseGeocode()` has its own limitations (it also uses name search as a heuristic). Requires a product/architecture decision.

---

## Low-Priority Findings

### L-01: Geocoding cache can exceed `GEOCODING_CACHE_MAX_ENTRIES` under concurrent writes

- **Severity**: LOW (High confidence — 95%)
- **File**: `src/lib/api.ts:109-113`
- **What's wrong**: When multiple concurrent uncached searches complete simultaneously, each checks `geocodingCache.size >= 50` before writing. If 5 concurrent searches all see `size=49`, all pass the check and each adds an entry, resulting in 53 entries (evicted 1 + added 5). The cache eviction only removes 1 entry per write.
- **Trigger**: Rapid typing that triggers 5+ concurrent debounced API calls for different queries.
- **Impact**: Benign — a few extra cache entries (worst case ~55 instead of 50). Memory impact is negligible for geocoding results. The cache still functions correctly for reads.
- **Suggested fix**: Use a `while` loop to evict until under limit, or implement a proper LRU with size tracking.
- **Why not fixed**: Impact is negligible. The debounce (300ms) makes concurrent uncached searches unlikely in practice. Fix would add complexity for minimal benefit.

### L-02: WMO codes 87-94 fall through to `'storm'` condition

- **Severity**: LOW (Low confidence — 50%)
- **File**: `src/lib/weather-codes.ts:14`
- **What's wrong**: The `getWeatherCondition` function uses cascading `if (code <= N)` checks. After checking codes up to 86 (snow showers), the catch-all `return 'storm'` at line 14 handles codes 87-99. WMO only defines codes 95, 96, 99 as thunderstorm. Codes 87-94 are undefined in the WMO spec but would be classified as `'storm'`.
- **Trigger**: API returns a code between 87-94 (which Open-Meteo doesn't produce in practice).
- **Impact**: None in practice — Open-Meteo only returns valid WMO codes. Defensive concern only.
- **Suggested fix**: Add `if (code >= 95)` before the storm return, and return `'cloudy'` as a safer default for unknown codes.
- **Why not fixed**: The trigger condition can't occur with the current API. Fixing it changes behavior for an impossible input.

### L-03: Snow conditions don't show clouds in the 3D scene

- **Severity**: LOW (Low confidence — 40%)
- **File**: `src/scenes/SceneContent.tsx:36`
- **What's wrong**: `showClouds` is `true` for cloudy, partly-cloudy, foggy, and rain conditions, but NOT for snow. In reality, snowfall almost always occurs with cloudy skies. The 3D scene shows snow particles without cloud objects.
- **Trigger**: Weather condition is `'snow'`.
- **Impact**: Visual accuracy — snow falls from an empty sky in the 3D scene. Purely cosmetic.
- **Suggested fix**: Add `|| isSnow` to the `showClouds` condition.
- **Why not fixed**: This appears to be an intentional aesthetic choice. The snow particles themselves provide the visual effect. Adding clouds could clutter the snowy scene. Requires a design decision.

---

## State Machine Analysis

### Application State: Loading → Ready/Error

| State | Transitions | Guard |
|-------|-------------|-------|
| `loading=true` (initial) | → `loading=false, weather=data` (success) | `fetchWeather` resolves |
| `loading=true` (initial) | → `loading=false, error=msg` (failure) | `fetchWeather` rejects |
| Ready | → `loading=true` (via `selectCity` or `retry`) | User action |
| Error | → `loading=true` (via `retry`) | User clicks "Try Again" |

**No stuck states found.** All transitions are guarded. The `finally` block in `loadWeatherForCoords` ensures `loading` is always set to `false`.

### Geolocation State: Requesting → OK/Error

| State | Transitions |
|-------|-------------|
| Requesting | → OK (position available) |
| Requesting | → Error (denied/timeout/unavailable) → Antarctica fallback |

**No stuck states found.** All geolocation error codes are mapped. The promise always resolves (never rejects).

---

## Data Flow Findings

### Flow 1: Geolocation → City Name Resolution → Weather Fetch

```
getUserLocation()
  → OK: searchCities("35.68 139.69") → likely empty results → "Your Location"
  → Error: ANTARCTICA fallback → fetchWeather(-82.86, 135.0, "Antarctica", "Antarctica")
```

**Issue**: The city name resolution step (M-02) is largely ineffective. The fallback "Your Location" name works but is suboptimal.

### Flow 2: Search → Select City → Fetch Weather + Update Recent Cities

```
SearchBar: query → debounce(300ms) → searchCities(query) → results
  → user clicks → selectCity(city) → addRecentCity + fetchWeather
  → savePreferences (via useEffect)
```

**No issues found.** Race conditions in search are properly handled with the `cancelled` flag pattern.

### Flow 3: Preferences → localStorage persistence

```
setPreferences() → useEffect([preferences]) → savePreferences()
```

**No issues found.** Preferences are saved on every change. Silent failure on localStorage errors is appropriate.

---

## Test Suite Observations

### Test Quality

- **260 tests across 28 files** — comprehensive coverage
- **No skipped tests** (no `// BUG`, `// FIXME`, `// flaky` patterns)
- **No tautological tests** — all assertions verify meaningful behavior
- **Proper mock isolation** — `beforeEach` cleanup, `vi.restoreAllMocks()`
- **Edge case coverage** — NaN, Infinity, boundary coordinates, empty arrays, corrupted JSON, concurrent access

### Minor Test Quality Notes

1. **Recharts warnings in tests** — Multiple test files emit "width(0) and height(0)" warnings from Recharts. These are benign (jsdom doesn't support layout) but noisy.
2. **React `act()` warning** in smoke tests — One "update not wrapped in act" warning. Benign in this context (async state update during mount).

### Coverage Gaps (Non-Critical)

- **WeatherScene.tsx** — No direct unit tests (3D components are hard to test; covered by error boundary tests and integration tests)
- **SceneContent.tsx** — No direct tests (same reason as above)
- **Toast auto-dismiss race condition** — Tests cover auto-dismiss and manual dismiss separately, but don't test the interaction (what if the auto-dismiss timer fires AFTER manual dismiss calls `onDismiss`). Looking at the code, this is safe because `clearTimeout` in `dismiss()` cancels the auto-dismiss timer.

---

## Bug Density Map

| File/Module | Findings |
|-------------|----------|
| `src/components/Forecast.tsx` | 1 (H-01: forecast icons) |
| `src/scenes/WeatherScene.tsx` | 1 (M-01: static reduced motion) |
| `src/context/WeatherContext.tsx` | 1 (M-02: city name resolution) |
| `src/lib/api.ts` | 1 (L-01: cache size) |
| `src/lib/weather-codes.ts` | 1 (L-02: code gap) |
| `src/scenes/SceneContent.tsx` | 1 (L-03: snow clouds) |

No bug clustering detected. Findings are spread evenly across different modules.

---

## Bugs Fixed Table

| File | Bug | Fix | Confidence | Tests Pass? | Commit |
|------|-----|-----|------------|-------------|--------|
| — | — | — | — | — | — |

*No bugs met all fix criteria (≥90% confidence, mechanical fix, tests exist, no behavior change).*

---

## Recommendations

### Patterns to Address

1. **Forecast icon time-of-day** (H-01) — The most impactful finding. Consider always showing day icons for future forecast days (index > 0). This is a common convention in weather apps.

2. **Reactive reduced-motion** (M-01) — Consider using `matchMedia.addEventListener('change', handler)` to track the media query reactively. This is an accessibility improvement.

3. **City name resolution** (M-02) — The existing `reverseGeocode()` function is never called from production code. Either integrate it into the initialization flow or remove it as dead code (previous audits have recommended removal).

### Tests to Write

- Test that `Forecast` renders day icons for future days regardless of current `isDay` (once H-01 is fixed)
- Integration test for `prefersReducedMotion` change detection (once M-01 is fixed)
- Test for geocoding cache size under concurrent access (L-01)
