# Test Hardening Report

**Run**: 01
**Date**: 2026-03-17
**Branch**: `nightytidy/run-2026-03-17-1741`
**Suite Before**: 24 files, 202 tests
**Suite After**: 25 files, 228 tests
**Status**: All 228 tests passing (5/5 runs verified)

---

## 1. Summary

| Metric | Count |
|--------|-------|
| Flaky tests found (actively failing across runs) | 0 |
| Latent flaky patterns found and fixed | 7 |
| Previously disabled tests re-enabled | 0 |
| API endpoints mapped | 3 (client-side Open-Meteo consumers) |
| Contract tests written | 26 |
| Documentation discrepancies found | 2 |
| Polyfill consolidation (files deduplicated) | 3 |

---

## 2. Flaky Tests Fixed

No tests actively flaked across 5 consecutive runs. However, **7 latent flaky patterns** were found via code analysis and fixed. These patterns would cause non-deterministic failures under parallel execution, system load, or if assertions threw before cleanup code.

| # | Test File | Root Cause | Fix Applied |
|---|-----------|-----------|-------------|
| 1 | `src/hooks/__tests__/useDebounce.test.ts` | `vi.useFakeTimers()` cleanup at end of test body — if assertion throws, timers leak to next test | Added `afterEach(() => vi.useRealTimers())` at file level; removed inline cleanup |
| 2 | `src/components/__tests__/Toast.test.tsx` | Same: `vi.useFakeTimers()` + `vi.useRealTimers()` inline without guaranteed execution | Added `afterEach(() => vi.useRealTimers())` at file level; removed inline cleanup |
| 3 | `src/components/__tests__/SceneErrorBoundary.test.tsx` | `vi.spyOn(console, 'error')` with manual `spy.mockRestore()` at end — corrupts console for subsequent tests if assertion fails | Added `afterEach(() => vi.restoreAllMocks())`; removed manual `spy.mockRestore()` calls |
| 4 | `src/lib/__tests__/storage.test.ts` (matchMedia) | `window.matchMedia = vi.fn()` mutation without try-finally — if test throws, global matchMedia is corrupted | Wrapped in try-finally block; added `afterEach(() => vi.restoreAllMocks())` |
| 5 | `src/lib/__tests__/storage.test.ts` (Storage spy) | `vi.spyOn(Storage.prototype, 'setItem')` with inline `vi.restoreAllMocks()` after assertion — not guaranteed on failure | Moved cleanup to `afterEach`; removed inline `vi.restoreAllMocks()` |
| 6 | `src/context/__tests__/WeatherContext.test.tsx` | `vi.spyOn(console, 'error')` with manual `spy.mockRestore()` — same pattern as #3 | Added `afterEach(() => vi.restoreAllMocks())`; removed manual restore |
| 7 | `src/test/setup.ts` + 3 test files | ResizeObserver and matchMedia polyfills duplicated in `smoke.test.tsx`, `integration.test.tsx`, and `TemperatureChart.test.tsx` — multiple independent `beforeAll` definitions creating order-dependent global state | Consolidated both polyfills into `src/test/setup.ts` (runs before every test file); removed 3 duplicate `beforeAll` blocks |

---

## 3. Flaky Tests Unresolved

None. All identified patterns were fixed.

---

## 4. API Endpoint Map

This is a **pure client-side app** with no backend. The "API" layer consists of 3 functions in `src/lib/api.ts` that consume the Open-Meteo free-tier API:

| Function | Open-Meteo Endpoint | Method | Auth | Contract Test Status |
|----------|---------------------|--------|------|---------------------|
| `searchCities(query)` | `GET geocoding-api.open-meteo.com/v1/search` | GET | None (free) | 8 tests |
| `fetchWeather(lat, lon, city, country)` | `GET api.open-meteo.com/v1/forecast` | GET | None (free) | 12 tests |
| `reverseGeocode(lat, lon)` | `GET geocoding-api.open-meteo.com/v1/search` | GET | None (free) | 5 tests |
| `ApiError` (error class) | N/A | N/A | N/A | 2 tests |

**Total contract tests: 26** (new file: `src/lib/__tests__/api-contracts.test.ts`)

### Query Parameters Verified

**searchCities:**
- `name`: query string (trimmed, min 2 chars enforced client-side)
- `count`: 8
- `language`: en
- `format`: json

**fetchWeather:**
- `latitude`, `longitude`: numeric coordinates
- `current`: `temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day`
- `daily`: `weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max`
- `timezone`: auto
- `forecast_days`: 6

**reverseGeocode:**
- `name`: `{lat.toFixed(1)},{lon.toFixed(1)}` (coordinates rounded to 1 decimal)
- `count`: 1

---

## 5. Documentation Discrepancies

| # | What Docs Say | What Code Does | Severity |
|---|--------------|----------------|----------|
| 1 | CLAUDE.md states `ANTARCTICA.country` is `'AQ'` (country code) | `src/lib/geolocation.ts:52` sets `country: 'Antarctica'` (full name) | Low — cosmetic mismatch between docs and code |
| 2 | CLAUDE.md Known Gotcha #5 says "Use `fireEvent` instead in tests with fake timers" | This is correct advice but was being applied inconsistently — some tests used `fireEvent` with fake timers but lacked guaranteed `afterEach` cleanup | Low — advice is correct, implementation was incomplete |

---

## 6. Undocumented Behavior

| # | Behavior | Where |
|---|----------|-------|
| 1 | `searchCities` returns the raw Open-Meteo `results` array with extra fields (elevation, population, timezone, postcodes, etc.) that aren't in the `GeocodingResult` TypeScript type — they pass through silently | `src/lib/api.ts:28` — `as GeocodingResult[]` cast doesn't strip extra fields |
| 2 | `fetchWeather` always returns `alerts: []` — hardcoded because Open-Meteo free tier has no alerts endpoint. The `WeatherAlert` type and `AlertBanner` component exist but can never receive real data | `src/lib/api.ts:78` |
| 3 | `reverseGeocode` uses the geocoding search endpoint with coordinates-as-text (not a real reverse geocode). It searches `"35.7,139.7"` as a text query. This is fragile and may return unrelated results for some coordinates | `src/lib/api.ts:97` |
| 4 | `fetchWeather` constructs `location` from function arguments, not from the API response. The API response's `latitude`/`longitude` (which may differ slightly due to grid snapping) are ignored | `src/lib/api.ts:75-86` |
| 5 | `fetchWeather` defaults `timezone` to `'UTC'` when the API response omits it, via `data.timezone ?? 'UTC'` | `src/lib/api.ts:84` |
| 6 | `searchCities` client-side enforces min 2-char query before making any network call — no fetch is issued for empty/single-char inputs | `src/lib/api.ts:16` |
| 7 | Test hardcoded dates (`2026-03-17` through `2026-03-22`) in mock data across 5+ test files are not relative to current date — tests will continue to work but mock data will become increasingly stale over time | Multiple test files |

---

## 7. Recommendations

| # | Recommendation | Impact | Risk if Ignored | Worth Doing? | Details |
|---|---|---|---|---|---|
| 1 | Use relative dates in test mock data | Prevents test data staleness; makes tests self-documenting | Low | Only if time allows | Current hardcoded dates (2026-03-17) work fine now. If any future logic compares mock dates to `new Date()`, tests will silently break. Could use a helper like `getTestDate(offsetDays)` but current tests don't need it. |
| 2 | Add `afterEach(() => vi.restoreAllMocks())` to global test setup | Eliminates an entire class of flaky patterns project-wide | Medium | Yes | Would prevent any future test from accidentally leaking mocked globals. Minimal performance impact. Add to `src/test/setup.ts`. Not done in this pass because it could mask unintentional mock leaks in existing tests. |
| 3 | Avoid the inline-cleanup-at-end-of-test pattern | Prevents future flaky test introductions | Medium | Yes | Establish a team convention: never put `vi.useRealTimers()` or `spy.mockRestore()` at the end of a test body. Always use `afterEach`. Document in CLAUDE.md conventions. |
| 4 | Add response validation to `api.ts` | Catches silent contract drift if Open-Meteo changes response shape | Low | Probably | Currently, `api.ts` trusts the API response completely — a missing field (e.g., `data.current.temperature_2m` → `undefined`) propagates silently as `NaN` in the UI. A lightweight schema check (or at minimum, null checks) would surface issues faster. |

---

## 8. Files Modified

| File | Change |
|------|--------|
| `src/test/setup.ts` | Added ResizeObserver and matchMedia polyfills (consolidated from 3 files) |
| `src/hooks/__tests__/useDebounce.test.ts` | Added `afterEach` for timer cleanup; removed inline `vi.useRealTimers()` |
| `src/components/__tests__/Toast.test.tsx` | Added `afterEach` for timer cleanup; removed inline `vi.useRealTimers()` |
| `src/components/__tests__/SceneErrorBoundary.test.tsx` | Added `afterEach` for mock cleanup; removed manual `spy.mockRestore()` |
| `src/lib/__tests__/storage.test.ts` | Added `afterEach` for mock cleanup; wrapped matchMedia in try-finally |
| `src/context/__tests__/WeatherContext.test.tsx` | Added `afterEach` for mock cleanup; removed manual `spy.mockRestore()` |
| `src/__tests__/smoke.test.tsx` | Removed duplicated ResizeObserver/matchMedia polyfills |
| `src/__tests__/integration.test.tsx` | Removed duplicated ResizeObserver/matchMedia polyfills |
| `src/components/__tests__/TemperatureChart.test.tsx` | Removed duplicated ResizeObserver polyfill |
| `src/lib/__tests__/api-contracts.test.ts` | **NEW** — 26 API contract tests |
