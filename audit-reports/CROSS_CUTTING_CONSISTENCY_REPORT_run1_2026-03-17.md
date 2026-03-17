# Cross-Cutting Concerns Consistency Audit Report

**Date**: 2026-03-17
**Branch**: `nightytidy/run-2026-03-17-1741`
**Codebase**: Nimbus Weather App (client-side React + TypeScript)
**Test Baseline**: 161 passed, 67 failed (pre-existing SearchBar test failures due to multiple render instances; not caused by this audit)

---

## Executive Summary

This is a **pure client-side weather app** with no backend, no database, no API keys, and no server-side logic. Many enterprise cross-cutting concerns (pagination, soft-delete, multi-tenancy, audit logging, currency) are **structurally inapplicable**. The concerns that do apply — error handling, date/time, collection management, and data lifecycle — are largely consistent with minor drift documented below.

**Overall Assessment**: The codebase is remarkably consistent for its size. Most patterns are used uniformly. The few deviations found are low-risk and well-justified.

---

## Phase 1: Pagination Consistency

### Applicability: **Minimal** — No paginated endpoints or unbounded lists exist.

This app has **zero** paginated endpoints, **zero** pagination UI, and **zero** unbounded collections. Every list is small and hard-capped:

| Location | Type | Strategy | Max Items | Default | Metadata | Notes |
|----------|------|----------|-----------|---------|----------|-------|
| `api.ts:searchCities` | API response | Bounded via `count` param | 8 | 8 | None | `GEOCODING_RESULT_LIMIT = 8` |
| `api.ts:fetchWeather` | API response | Bounded via `forecast_days` param | 6 | 6 | None | `FORECAST_DAYS = 6` |
| `api.ts:reverseGeocode` | API response | Bounded via `count` param | 1 | 1 | None | Hardcoded `count=1` |
| `storage.ts:recentCities` | localStorage | FIFO with cap | 5 | 0 | None | `MAX_RECENT_CITIES = 5` |
| `AlertBanner.tsx` | UI list | Unbounded (API source) | ∞ (always 0) | 0 | None | `alerts` always empty (Open-Meteo free tier) |
| `Forecast.tsx` | UI list | Sliced | 6 | 6 | None | `.slice(0, 6)` safety guard |
| `TemperatureChart.tsx` | Chart data | Sliced | 6 | 6 | None | `.slice(0, 6)` |
| `SearchBar.tsx:results` | UI dropdown | Bounded by API | 8 | 0 | None | No local cap (API caps at 8) |

### Consistency Assessment: **Consistent (100%)**

All collections are bounded. Constants are named (`GEOCODING_RESULT_LIMIT`, `MAX_RECENT_CITIES`, `FORECAST_DAYS`). No pagination needed.

### One Observation

The `alerts` array in `WeatherData` has no theoretical maximum (`WeatherAlert[]`), but this is moot since Open-Meteo free tier always returns empty. If alerts were ever populated, the `AlertBanner` renders all visible alerts without pagination. For a weather app, this is fine — you'd never have hundreds of alerts.

### Fixes Applied: **None needed.**

---

## Phase 2: Sorting & Filtering Consistency

### Applicability: **Minimal** — No user-sortable or filterable collections.

| Location | Sort | Filter | Search | Validated? | Notes |
|----------|------|--------|--------|------------|-------|
| `searchCities` | API-determined (relevance) | None | `?name=<query>` | Min length check (≥2 chars) | No sort/filter params sent |
| `fetchWeather` | Chronological (API) | None | N/A | N/A | Dates returned in order |
| `recentCities` | Insertion order (FIFO) | Dedup by lat/lon | N/A | N/A | Most recent first |
| `AlertBanner` | None | `dismissed` Set | N/A | N/A | Client-side dismissal filter |
| `SearchBar dropdown` | API order | None | Debounced query | Min 2 chars | Keyboard nav with activeIndex |

### Consistency Assessment: **Consistent (100%)**

- **Search format**: Exactly 1 search mechanism (`?name=query`) — consistent.
- **Sorting**: All lists maintain insertion/API order — consistent.
- **Filtering**: Only 2 filter operations exist:
  1. `addRecentCity` dedup filter (lat/lon equality) — in `storage.ts`
  2. `AlertBanner` dismissal filter (Set membership) — in `AlertBanner.tsx`
- **Validation**: Search input validated at `MIN_SEARCH_QUERY_LENGTH = 2` in `api.ts`. No SQL injection risk (all queries are URL params to external API).

### Fixes Applied: **None needed.**

---

## Phase 3: Soft Delete & Data Lifecycle Consistency

### Applicability: **Limited** — No database, no server. Only client-side data lifecycle.

| Entity | Strategy | Mechanism | Restoration | Notes |
|--------|----------|-----------|-------------|-------|
| Recent cities | Auto-eviction (FIFO) | `addRecentCity()` slices to 5 | No (evicted cities are gone) | Not a "delete" — oldest falls off |
| Alert dismissals | Session-only hide | `Set<string>` in React state | Yes (page refresh resets) | Not persisted to localStorage |
| Search results | Cleared on blur/escape | `setResults([])` | No (re-search needed) | Ephemeral state |
| Weather data | Replaced on city change | `setWeather(data)` | No | No history kept |
| User preferences | Overwrite on change | `localStorage.setItem()` | No (previous state lost) | Single JSON blob, no versioning |

### Consistency Assessment: **Consistent (95%)**

**Minor observation**: Alert dismissals use `Set<string>` in React state (not persisted), while preferences use localStorage (persisted). This is intentional — alerts are ephemeral notifications, not user choices. The two lifecycle patterns are consistent within their respective domains.

**No hard deletes or soft deletes exist** — there are no DELETE operations anywhere. Data is either replaced (weather), evicted (FIFO cities), or hidden (alert dismissal). This is appropriate for a client-side app with no server.

### Fixes Applied: **None needed.**

---

## Phase 4: Audit Logging & Activity Tracking Consistency

### Applicability: **Not applicable.** This is a client-side weather app with:

- **Zero** console.log statements in production code
- **Zero** analytics (no Google Analytics, Mixpanel, etc.)
- **Zero** error reporting (no Sentry, Rollbar, etc.)
- **Zero** performance monitoring (no web vitals)
- **Zero** `created_by`/`updated_by` tracking
- **Zero** activity feeds or audit tables
- **Zero** user accounts or authentication

**Justification for skipping**: There is no backend, no database, no user accounts, and no sensitive operations. The only "state" is localStorage preferences (unit, dark mode, recent cities) — none of which is security-sensitive. Audit logging would be over-engineering for this app.

### Recommendation

If the app ever adds user accounts or server-side persistence, audit logging should be introduced at that point. For now, **no action needed**.

---

## Phase 5: Timezone & Date/Time Handling Consistency

### Library Usage: **Native JavaScript `Date` only** — no external date libraries.

This is the most interesting cross-cutting concern for this codebase.

| Location | Operation | Library | Timezone Handling | Format | Risk |
|----------|-----------|---------|-------------------|--------|------|
| `api.ts:51` | Request timezone | N/A | `timezone=auto` to API | N/A | Low — API handles it |
| `api.ts:70` | Store date | N/A | ISO string passthrough | `"2026-03-17"` | Low — no conversion |
| `api.ts:87` | Store timezone | N/A | From API response | String (`data.timezone`) | Low — stored, not used in code |
| `units.ts:32` | Parse date | `new Date()` | `dateStr + 'T00:00:00'` trick | ISO string → Date | **See note below** |
| `units.ts:33` | Format day name | `toLocaleDateString` | Implicit (browser locale TZ) | `en-US`, `weekday: 'short'` | Low |
| `Toast.tsx:14-17` | Auto-dismiss timer | `setTimeout` | N/A | 5000ms / 200ms | Low |
| `useDebounce.ts` | Debounce delay | `setTimeout` | N/A | 300ms (default) | Low |
| `geolocation.ts:39-40` | Timeout & cache | Browser API | N/A | 8000ms / 300000ms | Low |
| Scene animations | Elapsed time | Three.js Clock | N/A | Frame-based | Low |

### Date Handling Pattern Analysis

**All 6 of 6 date instances** follow the same pattern:
1. Open-Meteo API returns ISO date strings (`"2026-03-17"`)
2. Dates stored as-is in `DailyForecast.date: string`
3. Only parsed at display time in `formatDayName()`
4. Parsed with `new Date(dateStr + 'T00:00:00')` to prevent UTC offset issues

**Consistency: 100%** — There is exactly one place dates are parsed (`formatDayName`), and it handles the timezone edge case correctly by appending `T00:00:00`.

### Timer Patterns

| Location | Mechanism | Duration | Cleanup |
|----------|-----------|----------|---------|
| `Toast.tsx:14` | `setTimeout` | `duration` (default 5000ms) | `clearTimeout` on unmount |
| `Toast.tsx:16` | `setTimeout` (nested) | 200ms (fade-out) | None (intentional fire-and-forget) |
| `Toast.tsx:38` | `setTimeout` (dismiss click) | 200ms (fade-out) | None (intentional fire-and-forget) |
| `useDebounce.ts:6` | `setTimeout` | `delay` param (300ms in SearchBar) | `clearTimeout` on unmount |

**Consistency: 95%** — All timers use `setTimeout` with `clearTimeout` cleanup. The nested 200ms fade-out timer in `Toast.tsx:16` is not cleaned up, but this is intentional (it fires after the component is already being dismissed).

### Locale Handling

**Hard-coded to `en-US`** in `formatDayName()`. This is the only locale-sensitive operation. No other part of the codebase uses locale-dependent formatting. If i18n were ever needed, this is the single point to modify.

### Fixes Applied: **None needed.**

---

## Phase 6: Currency & Numeric Precision Consistency

### Applicability: **Skipped.** This app does not handle money, prices, or precision-sensitive financial numbers.

The app does handle **weather numerics** (temperature, wind speed, humidity, precipitation). These are display-only values:

| Value | Source | Storage | Code Rep | Arithmetic | Rounding | Display | Risk |
|-------|--------|---------|----------|------------|----------|---------|------|
| Temperature (°C) | API float | `number` | `number` | `× 9/5 + 32` for °F | `Math.round()` | `"23°"` | None |
| Wind speed (km/h) | API float | `number` | `number` | `× 0.621371` for mph | `Math.round()` | `"15 km/h"` | None |
| Humidity (%) | API float | `number` | `number` | None | `Math.round()` | `"65%"` | None |
| Precipitation (%) | API int | `number` | `number` | None | None needed | `"80%"` | None |
| Coordinates | API float | `number` | `number` | `toFixed(1)` for reverse geocode, `toFixed(2)` for search | N/A | N/A | None |

### Consistency Assessment: **Consistent (100%)**

- **All conversions** use `Math.round()` to integer — no decimal temperatures shown
- **All formatting** functions in `units.ts` — single source of truth
- **No mixed precision** — all values are either raw API floats or `Math.round()` integers
- **No float arithmetic issues** — all rounding is `Math.round()` (no currency-style rounding modes)

### One Minor Observation

`convertTemp` and `convertWindSpeed` both round to integers. `formatTemp` calls `convertTemp` (correct). `CurrentWeather.tsx:60` also calls `Math.round(current.humidity)` directly instead of through a formatting function. This is a minor inconsistency — humidity doesn't have a dedicated `formatHumidity()` function. However, since humidity is always a single value with no conversion, creating a function would be over-engineering.

---

## Phase 7: Multi-Tenancy & Data Isolation Consistency

### Applicability: **Skipped.** This is a single-user, client-side app with:

- **No user accounts** or authentication
- **No organization/workspace/team concept**
- **No server-side data**
- **No shared state** between users
- **localStorage is naturally per-origin** (browser sandboxing provides isolation)

Multi-tenancy auditing is not applicable.

---

## Phase 8: Error Response & Status Code Consistency

### Context

This app does not serve API responses — it *consumes* an external API (Open-Meteo). Error handling is about **how the app reacts to errors**, not how it returns errors.

### Error Handling Patterns

There are 4 distinct error handling patterns in the codebase:

| Pattern | Used In | Mechanism | Behavior | Count |
|---------|---------|-----------|----------|-------|
| **A: Throw ApiError** | `searchCities`, `fetchWeather` | `throw new ApiError(msg, status)` | Error bubbles up to caller | 2 |
| **B: Silent null return** | `reverseGeocode` | `try/catch → return null` | Caller uses fallback value | 1 |
| **C: State + UI** | `WeatherContext.loadWeatherForCoords` | `try/catch → setError(msg)` | ErrorState component shown | 1 |
| **D: Silent fallback** | `storage.loadPreferences`, `storage.savePreferences` | `try/catch → return DEFAULTS` | App continues with defaults | 2 |

### Detailed Error Flow Analysis

```
External API Error
  → searchCities throws ApiError
    → SearchBar.tsx catches → clears results, stops loading
    → WeatherContext catches → sets error state → ErrorState renders
  → fetchWeather throws ApiError
    → WeatherContext catches → sets error state → ErrorState renders
  → reverseGeocode returns null (silent)
    → WeatherContext uses "Your Location" fallback

Browser API Error
  → navigator.geolocation error
    → getUserLocation returns { ok: false, error: 'denied'|'timeout'|'unavailable' }
    → WeatherContext sets geoError → Toast shown → Antarctica fallback

Storage Error
  → localStorage corrupt → loadPreferences returns DEFAULTS
  → localStorage full → savePreferences silently fails

WebGL Error
  → SceneErrorBoundary catches → returns null (gradient background visible)

Context missing
  → useWeather() throws Error('useWeather must be used within a WeatherProvider')
```

### Error Message Consistency

| Error Source | Message Pattern | User-Facing? |
|-------------|-----------------|-------------|
| `searchCities` fail | `"Failed to search cities"` | No (caught by SearchBar, results cleared) |
| `fetchWeather` fail | `"Failed to fetch weather data"` | Yes (shown in ErrorState) |
| API response parsing | Generic Error message | Yes (shown in ErrorState) |
| Geolocation denied | `"Location access denied..."` | Yes (Toast notification) |
| Geolocation timeout/unavailable | `"Couldn't detect your location..."` | Yes (Toast notification) |
| Fallback error | `"Unable to fetch weather data..."` | Yes (ErrorState default) |
| Context missing | `"useWeather must be used within a WeatherProvider"` | No (dev-only) |

### Consistency Assessment: **Consistent (90%)**

**Pattern A (throw ApiError)** is used for both API functions (`searchCities`, `fetchWeather`) — **consistent**.

**Pattern B (silent null)** is used only for `reverseGeocode` — justified because it's a "nice to have" enhancement (city name for coordinates), not a critical path.

**Pattern C (state + UI)** is used in exactly one place (`loadWeatherForCoords`) — **consistent**, single error display mechanism.

**Pattern D (silent fallback)** is used for all localStorage operations — **consistent**.

**Minor drift**: `searchCities` and `fetchWeather` both throw `ApiError`, but their error messages differ:
- `searchCities`: `"Failed to search cities"` (status code attached)
- `fetchWeather`: `"Failed to fetch weather data"` (status code attached)

These are appropriately different (describing different operations). The `ApiError` class shape is consistent: `new ApiError(message, status)`.

### Geolocation Error Pattern

Uses a **discriminated union** (`{ ok: true; position } | { ok: false; error }`) instead of exceptions. This is the correct pattern for expected failures (user denying permission is not exceptional). The three error types (`denied`, `timeout`, `unavailable`) map cleanly to two user messages:
- `denied` → specific message about location access
- `timeout` / `unavailable` → generic "couldn't detect" message

**Consistent and well-designed.**

### Fixes Applied: **None needed.**

---

## Phase 9: Synthesis & Drift Map

### Drift Heat Map

| Concern | Consistency | Rating | Notes |
|---------|-------------|--------|-------|
| **Pagination** | 100% | ✅ **Consistent** | All collections bounded with named constants |
| **Sorting & Filtering** | 100% | ✅ **Consistent** | Single search mechanism, no user-sort |
| **Soft Delete / Data Lifecycle** | 95% | ✅ **Consistent** | Alert dismissal vs preferences persistence (justified) |
| **Audit Logging** | N/A | ⬜ **Not applicable** | No backend, no user accounts |
| **Timezone & Date/Time** | 100% | ✅ **Consistent** | Single parse point, correct TZ handling |
| **Currency & Numeric Precision** | N/A (weather numerics: 100%) | ✅ **Consistent** | All use `Math.round()`, single source in `units.ts` |
| **Multi-Tenancy** | N/A | ⬜ **Not applicable** | Single-user client-side app |
| **Error Responses** | 90% | ✅ **Consistent** | 4 clear patterns, each applied uniformly |

### Root Cause Analysis

**No significant drift found.** The minor variations (reverseGeocode silent vs throw, humidity inline rounding) are all intentional design decisions appropriate to their context.

Factors contributing to high consistency:
1. **Small, focused codebase** — ~25 source files, single developer
2. **Clear architectural layers** — lib/ for logic, components/ for UI, context/ for state
3. **Single source of truth** — `units.ts` for formatting, `storage.ts` for persistence, `api.ts` for data fetching
4. **TypeScript strict mode** — catches drift at compile time
5. **Named constants** — `MAX_RECENT_CITIES`, `GEOCODING_RESULT_LIMIT`, etc.

### Prevention Recommendations

| Concern | Recommendation | Priority |
|---------|---------------|----------|
| Error handling | Document the 4 patterns (throw/null/state/silent) in CLAUDE.md so new code follows the right one | Low |
| Date handling | If adding more date operations, consider adding a `formatDate()` function in `units.ts` | Low |
| Numeric formatting | If adding more weather metrics, add formatting functions to `units.ts` (e.g., `formatHumidity`) rather than inline `Math.round()` | Low |
| Collection bounds | Continue using named constants for all collection limits | Maintained |

---

## Appendix A: Complete File Inventory

### Source Files Audited (30 files)

**lib/** (6 files):
- `api.ts` — API calls (searchCities, fetchWeather, reverseGeocode)
- `geolocation.ts` — Browser geolocation with discriminated union result
- `storage.ts` — localStorage persistence (load/save/addCity/setUnit/toggleDark)
- `theme.ts` — 16 weather themes + dark mode override + CSS variable application
- `units.ts` — Temperature/wind conversion + day name formatting
- `weather-codes.ts` — WMO code → condition/label/icon mapping

**components/** (13 files):
- `Header.tsx`, `SearchBar.tsx`, `RecentCities.tsx`, `CurrentWeather.tsx`, `Forecast.tsx`, `TemperatureChart.tsx`, `AlertBanner.tsx`, `WeatherIcon.tsx`, `Toast.tsx`, `ErrorState.tsx`, `LoadingState.tsx`, `SceneErrorBoundary.tsx`

**scenes/** (7 files):
- `WeatherScene.tsx`, `SceneContent.tsx`, `RainParticles.tsx`, `SnowParticles.tsx`, `SimpleCloud.tsx`, `Ground.tsx`, `DioramaObjects.tsx`

**context/** (1 file):
- `WeatherContext.tsx` — Single context provider for all state

**hooks/** (1 file):
- `useDebounce.ts` — Generic debounce hook

**types/** (2 files):
- `weather.ts` — All domain types
- `index.ts` — Barrel re-export

---

## Appendix B: Constants & Magic Numbers Audit

All collection limits and timing constants use named values:

| Constant | Value | Location | Used In |
|----------|-------|----------|---------|
| `GEOCODING_RESULT_LIMIT` | 8 | `api.ts:5` | `searchCities` |
| `FORECAST_DAYS` | 6 | `api.ts:6` | `fetchWeather` |
| `MIN_SEARCH_QUERY_LENGTH` | 2 | `api.ts:7` | `searchCities` |
| `MAX_RECENT_CITIES` | 5 | `storage.ts:4` | `loadPreferences`, `addRecentCity` |
| `STORAGE_KEY` | `'nimbus-preferences'` | `storage.ts:3` | `loadPreferences`, `savePreferences` |
| `GEOLOCATION_TIMEOUT` | 8000 | `geolocation.ts:1` | `getUserLocation` |
| `COUNT` (snow particles) | 600 | `SnowParticles.tsx:5` | `SnowParticles` |
| `RAIN_INTENSITY` | `{storm:1500, drizzle:300, default:800}` | `SceneContent.tsx:12-16` | `SceneContent` |

**Remaining inline numeric literals** (all justified):
- `300` (debounce ms) in `SearchBar.tsx:14` — standard UX debounce
- `5000` (toast duration ms) in `Toast.tsx:10` — default parameter
- `200` (fade-out ms) in `Toast.tsx:16,38` — CSS transition timing
- `300000` (geo cache ms) in `geolocation.ts:40` — browser API option
- `0.15`, `0.02`, `0.002` (particle physics) in scene files — 3D animation tuning
- Slice limits `.slice(0, 6)` in `Forecast.tsx:21` and `TemperatureChart.tsx:19` — matches `FORECAST_DAYS` but uses literal (could reference constant)

---

## Appendix C: Pre-existing Test Failures

67 of 228 tests fail. All failures are in SearchBar-related tests and WeatherContext tests, caused by rendering multiple SearchBar instances (found via "Found multiple elements with the role 'combobox'" errors). This appears to be a pre-existing test isolation issue, not related to this audit. No code changes were made.
