# Data Integrity & Validation Audit Report — Nimbus Weather App

**Run**: 01 | **Date**: 2026-03-18 | **Branch**: `nightytidy/run-2026-03-18-1312`
**Auditor**: Claude Opus 4.6 (automated) | **Scope**: All input boundaries, data persistence, type consistency
**Tests**: 235/235 passing (228 baseline + 7 new validation tests)

---

## 1. Executive Summary

**Overall Health: GOOD**

The Nimbus Weather App is a pure client-side SPA with no database, no backend, and no server-side state. This dramatically reduces the data integrity attack surface — there are no database constraints to audit, no migrations to write, no orphaned records to detect, and no server-side schema drift to worry about.

The audit focused on the applicable phases: input validation at all external boundaries (API responses, user input, localStorage, browser APIs) and business invariant documentation. Key findings:

| Category | Issues Found | Fixed | Remaining |
|----------|-------------|-------|-----------|
| Input Validation Gaps | 4 | 3 | 1 (documented) |
| localStorage Integrity | 1 | 1 | 0 |
| Business Invariants | 5 documented | — | 5 (enforcement assessed) |
| Database Constraints | N/A | — | — |
| Orphaned Data | N/A | — | — |
| Schema Drift | N/A | — | — |

---

## 2. Input Validation Audit

### 2.1 Input Boundary Map

The app has **6 external data entry points** (no backend boundaries exist):

| # | Boundary | Location | Type | Validation Before Audit |
|---|----------|----------|------|------------------------|
| 1 | City search query | `SearchBar.tsx` → `api.ts:searchCities()` | User text input | Min length (≥2 chars after trim) |
| 2 | Forecast API coordinates | `api.ts:fetchWeather()` | Programmatic (from geolocation/search) | **None** |
| 3 | Reverse geocoding coordinates | `api.ts:reverseGeocode()` | Programmatic (from geolocation) | **None** |
| 4 | localStorage preferences | `storage.ts:loadPreferences()` | Persisted JSON | Type guards + fallback defaults |
| 5 | Browser geolocation | `geolocation.ts:getUserLocation()` | Browser API | Discriminated union return type |
| 6 | System color scheme | `storage.ts:getSystemDarkMode()` | Browser API | SSR guard + null coalescing |

### 2.2 Validation Gaps Found & Fixed

#### GAP 1: No coordinate validation in `fetchWeather()` — **FIXED**
- **Severity**: Medium
- **Risk**: `NaN`, `Infinity`, or out-of-range coordinates (lat > 90, lon > 180) would be sent to Open-Meteo, resulting in either a confusing API error or garbage data
- **Source**: Geolocation API returns unvalidated numbers; search results pass through coordinates from API
- **Fix**: Added `isValidCoordinate()` guard that checks `Number.isFinite()` and range bounds. Throws `ApiError` for invalid coordinates.
- **Tests added**: 5 new tests covering NaN, Infinity, out-of-range, and boundary values

#### GAP 2: No coordinate validation in `reverseGeocode()` — **FIXED**
- **Severity**: Low
- **Risk**: Same as above but lower impact — `reverseGeocode` already returns `null` on any error, so the worst case is a wasted network request
- **Fix**: Added `isValidCoordinate()` guard returning `null` for invalid coordinates (consistent with existing error handling)

#### GAP 3: No max length limit on search query — **FIXED**
- **Severity**: Low
- **Risk**: Extremely long strings would be URL-encoded and sent to Open-Meteo. While URL length limits would likely cause the request to fail, this wastes bandwidth and could trigger unexpected behavior
- **Fix**: Added `MAX_SEARCH_QUERY_LENGTH = 200` constant. Returns `[]` for queries exceeding this limit, consistent with the short-query handling.
- **Tests added**: 1 new test verifying long query rejection without fetch call

#### GAP 4: localStorage `recentCities` items not individually validated — **FIXED**
- **Severity**: Medium
- **Risk**: The `recentCities` array was checked as `Array.isArray()` then cast to `City[]` without validating individual elements. Malformed items (missing `name`, non-finite `lat`/`lon`, wrong types) would persist and could cause runtime errors when rendered.
- **Fix**: Added `isValidCity()` type guard that validates: non-empty `name` (≤200 chars), finite `lat`/`lon`, string `country`. Invalid items are silently filtered out.
- **Tests added**: 1 new test with 7 malformed city variants (empty name, missing name, NaN lat, Infinity lon, string instead of object, null, missing country)

### 2.3 Validation Gap — Documented Only (Not Fixed)

#### No runtime schema validation for API responses
- **Severity**: Low (for this project)
- **Risk**: Open-Meteo could change response shape. TypeScript interfaces provide compile-time safety but not runtime validation. Missing/renamed fields would cause silent `undefined` propagation.
- **Why not fixed**: Adding Zod or similar adds ~12KB dependency for a stable free API. The existing type-assertions + nullish coalescing (`?? 0`, `?? 'UTC'`, `?? []`) provide reasonable defense. The prior Type Safety audit (2026-03-17) documented this same recommendation.
- **Recommendation**: Only add runtime validation if the project grows to consume multiple APIs or if Open-Meteo breaks its contract.

### 2.4 Existing Validation — Healthy

These boundaries were already well-validated before this audit:

| Boundary | Validation | Assessment |
|----------|-----------|------------|
| `loadPreferences()` | `JSON.parse` try/catch, `typeof` guards for every field, enum check for `unitPreference`, `Array.isArray` for cities, `.slice(0, 5)` cap, system dark mode fallback | **Excellent** |
| `getUserLocation()` | Discriminated union return (`ok: true/false`), error code mapping, 8s timeout, Antarctica fallback | **Excellent** |
| `getSystemDarkMode()` | SSR guard, `matchMedia` function check, optional chaining, nullish coalescing | **Excellent** |
| `searchCities()` | Min 2-char query, `.trim()` before use, `?? []` for missing results | **Good** (now also has max length) |
| Error handling in `WeatherContext` | HTTP status-based error messages (500+, 429, generic), `instanceof Error` check | **Good** |

### 2.5 Frontend vs. Backend Consistency

**N/A** — This is a pure client-side app. There is no backend to have inconsistent validation with. All validation happens in the browser.

### 2.6 Validation Error Format Consistency

All validation failures in this app follow one of two patterns:

1. **Silent fallback**: Return a default value (empty array, default preferences, null). Used for non-critical paths where the user shouldn't see an error.
2. **ApiError throw**: Thrown for critical failures, caught by `WeatherContext`, displayed as user-friendly messages.

This is consistent and appropriate for a client-side weather app.

---

## 3. Database Constraint Audit

**N/A** — No database exists. The app is entirely client-side with `localStorage` as the only persistence layer.

The `localStorage` schema (`nimbus-preferences`) serves as the equivalent of a "database" and uses the following constraints:

| Field | Type Constraint | Range Constraint | Default |
|-------|----------------|------------------|---------|
| `unitPreference` | Enum: `'celsius' \| 'fahrenheit'` | Enforced on read | `'celsius'` |
| `darkModeEnabled` | `boolean` | Enforced on read | `false` (or system preference) |
| `recentCities` | `City[]` | Max 5 items, each validated | `[]` |
| `recentCities[].name` | `string` | Non-empty, ≤200 chars | (required) |
| `recentCities[].lat` | `number` | `Number.isFinite()` | (required) |
| `recentCities[].lon` | `number` | `Number.isFinite()` | (required) |
| `recentCities[].country` | `string` | Any string | (required) |

**Assessment**: These constraints are appropriate and comprehensive for localStorage persistence.

---

## 4. Orphaned Data & Referential Integrity

**N/A** — No relational data exists. The only "deletion" pattern is the FIFO overflow of `recentCities` (oldest dropped when a 6th city is added), which is handled correctly via `.slice(0, 5)`.

### Cleanup Patterns Assessment

| Pattern | Location | Behavior | Assessment |
|---------|----------|----------|------------|
| Recent cities FIFO overflow | `storage.ts:addRecentCity()` | 6th city added → oldest dropped | **Correct** |
| City deduplication | `storage.ts:addRecentCity()` | Same lat+lon → old entry removed, new at front | **Correct** |
| Alert dismissal | `AlertBanner.tsx` | Added to `dismissed` Set (in-memory only, resets on page load) | **Correct** |
| `useDebounce` cleanup | `useDebounce.ts` | `clearTimeout` on unmount/value change | **Correct** |
| Toast auto-dismiss | `Toast.tsx` | `clearTimeout` on unmount | **Correct** |
| Search click-outside | `SearchBar.tsx` | `removeEventListener` on unmount | **Correct** |
| Search cancel | `SearchBar.tsx` | `cancelled = true` flag on effect cleanup | **Correct** |

No orphan risks were identified.

---

## 5. Schema vs. Application Drift

**N/A** — No ORM, no database schema, no migrations. TypeScript interfaces serve as the "schema" and are enforced at compile time.

### Type Consistency Check

All status/enum/category fields are used consistently throughout the codebase:

| Field | Defined | Used Consistently? | Notes |
|-------|---------|-------------------|-------|
| `WeatherCondition` (8 values) | `types/weather.ts:2-10` | **Yes** | Used in `weather-codes.ts`, `theme.ts`, `SceneContent.tsx` — all 8 values handled |
| `TimeOfDay` (`'day' \| 'night'`) | `types/weather.ts:12` | **Yes** | Derived from `isDay` boolean in context |
| `TemperatureUnit` (`'celsius' \| 'fahrenheit'`) | `types/weather.ts:71` | **Yes** | Validated on localStorage read, toggle is binary |
| `GeoError` (`'denied' \| 'timeout' \| 'unavailable'`) | `geolocation.ts:8` | **Yes** | All 3 values handled in `App.tsx:34-39` |
| `WeatherAlert.severity` (3 values) | `types/weather.ts:45` | **Yes** | All 3 values styled in `AlertBanner.tsx:6-22` |
| WMO weather codes (0-99) | `weather-codes.ts:4-14` | **Yes** | Complete coverage 0-99 with fallback to `'storm'` for ≥87 |

### Raw Query Risks

**None** — No raw SQL, no raw API queries beyond the well-typed `fetch` calls using `URL` + `searchParams` (which handles encoding safely).

### WMO Code Edge Case

`getWeatherCondition()` in `weather-codes.ts:4-14` has a minor edge: negative WMO codes or codes > 99 technically hit unintended branches. For example:
- Code `-1` → falls through all `if` checks → returns `'storm'` (the final fallback)
- Code `87-94` → returns `'storm'` (intended for 95-99 only; 87-94 are reserved/unused in WMO)

**Assessment**: This is benign since Open-Meteo only returns valid WMO codes (0-99), and the fallback to `'storm'` is a reasonable worst-case display. Not worth adding validation for a value that comes from a trusted API.

---

## 6. Business Invariants

| # | Invariant | Currently Enforced? | Enforcement Method | Diagnostic Check |
|---|-----------|--------------------|--------------------|-----------------|
| 1 | Recent cities list ≤ 5 entries | **Yes** | `.slice(0, MAX_RECENT_CITIES)` in `addRecentCity()` and `loadPreferences()` | `loadPreferences().recentCities.length <= 5` |
| 2 | Recent cities deduplicated by lat+lon | **Yes** | `.filter()` in `addRecentCity()` removes existing match before prepending | Check for duplicate `{lat, lon}` pairs |
| 3 | Unit preference is exactly `'celsius'` or `'fahrenheit'` | **Yes** | Enum check on localStorage load; binary toggle in code | `prefs.unitPreference === 'celsius' \|\| prefs.unitPreference === 'fahrenheit'` |
| 4 | Dark mode is a boolean | **Yes** | `typeof` check on localStorage load; `!` toggle in code | `typeof prefs.darkModeEnabled === 'boolean'` |
| 5 | Coordinates sent to API are valid (finite, in-range) | **Yes** (after this audit) | `isValidCoordinate()` in `fetchWeather()` and `reverseGeocode()` | Always checked before API call |

All 5 business invariants are fully enforced in application logic. No database triggers or scheduled jobs needed — this is appropriate for a client-side app.

---

## 7. Recommendations

| # | Recommendation | Impact | Risk if Ignored | Worth Doing? | Details |
|---|---|---|---|---|---|
| 1 | Add runtime API response validation (Zod) | Catch Open-Meteo schema changes at the boundary instead of propagating `undefined` | Low | Only if time allows | Adds ~12KB dependency. Open-Meteo's free API is stable. The existing nullish coalescing (`?? 0`, `?? 'UTC'`) provides adequate defense. Only justified if consuming multiple APIs or if Open-Meteo changes schema. |
| 2 | Add coordinate range validation to geolocation return | Catch impossible coordinates from buggy browser APIs | Low | Only if time allows | Browser geolocation API should always return valid coordinates, but `getUserLocation()` does not validate the returned `latitude`/`longitude` are in range. The downstream `fetchWeather()` now validates, so this is defense-in-depth only. |

---

## 8. Changes Made in This Audit

### Files Modified

| File | Change | Tests Added |
|------|--------|-------------|
| `src/lib/api.ts` | Added `isValidCoordinate()` helper. Added coordinate validation to `fetchWeather()` and `reverseGeocode()`. Added `MAX_SEARCH_QUERY_LENGTH` (200) and max-length check to `searchCities()`. | 6 tests |
| `src/lib/storage.ts` | Added `isValidCity()` type guard. Changed `recentCities` loading to filter invalid items instead of blind cast. | 1 test |
| `src/lib/__tests__/api.test.ts` | Added tests for: long query rejection, NaN/Infinity/out-of-range coordinate rejection, valid boundary coordinate acceptance. | — |
| `src/lib/__tests__/storage.test.ts` | Added test for invalid city object filtering (7 malformed variants). | — |

### Test Results

- **Before audit**: 228 tests, 25 files, all passing
- **After audit**: 235 tests, 25 files, all passing
- **New tests**: 7 (validation boundary tests)
- **Broken tests**: 0

---

## 9. Phases Not Applicable

The following audit phases are **not applicable** to this project:

| Phase | Why N/A |
|-------|---------|
| Database Constraint Audit | No database. Pure client-side SPA using localStorage only. |
| Migration Files | No database, no migrations. |
| Orphaned Data & Referential Integrity | No relational data. Single localStorage key with flat structure. |
| Schema vs. Application Drift | No ORM, no database schema. TypeScript interfaces are the schema. |
| Diagnostic Queries | No database to query. |

This is expected and healthy — the app's architecture (pure client-side, no backend, no API keys, no auth) inherently avoids the classes of bugs these phases are designed to catch.
