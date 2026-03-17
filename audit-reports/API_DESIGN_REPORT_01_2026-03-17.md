# API Design & Consistency Audit Report

**Run**: 01
**Date**: 2026-03-17
**Branch**: `nightytidy/run-2026-03-17-1741`
**Tests before**: 228 passing (25 files)
**Tests after**: 228 passing (25 files) — no changes made to source code
**Consistency score**: **Good**

---

## 1. Executive Summary

Nimbus Weather App is a **pure client-side** React application. It does **not expose any HTTP API endpoints**. All API interaction is outbound — the app consumes two Open-Meteo REST endpoints via the browser `fetch` API, centralized in a single module (`src/lib/api.ts`).

Because this is a consumer-only API surface (no server, no routes, no middleware, no authentication), many audit phases designed for backend APIs (pagination, rate limiting, versioning, content-type enforcement, idempotency keys) are **not applicable**. This report documents what exists, confirms internal consistency, and identifies the few areas where conventions could be formalized.

| Metric | Value |
|--------|-------|
| Total external endpoints consumed | 2 (geocoding, forecast) |
| Total internal API functions | 3 (`searchCities`, `fetchWeather`, `reverseGeocode`) |
| API functions with issues | 0 |
| Issues fixed | 0 (no code changes needed) |
| Issues documented for review | 2 (minor, informational) |
| Test coverage of API layer | Excellent (41 tests across 3 test files) |
| API Design Guide generated | Yes (`docs/API_DESIGN_GUIDE.md`) |

---

## 2. API Surface Map

### External Endpoints Consumed

| Method | External URL | Internal Function | Auth | Validated? | Paginated? | Tested? | Documented? |
|--------|-------------|-------------------|------|-----------|------------|---------|-------------|
| GET | `geocoding-api.open-meteo.com/v1/search` | `searchCities()` | None (keyless) | Yes (query length) | No (count=8 cap) | Yes (15 tests) | Yes |
| GET | `api.open-meteo.com/v1/forecast` | `fetchWeather()` | None (keyless) | No (trusts caller) | N/A | Yes (14 tests) | Yes |
| GET | `geocoding-api.open-meteo.com/v1/search` | `reverseGeocode()` | None (keyless) | No (best-effort) | No (count=1 cap) | Yes (12 tests) | Yes |

### Internal API-Adjacent Modules

| Module | Purpose | Tested? |
|--------|---------|---------|
| `src/lib/geolocation.ts` | Browser Geolocation API wrapper | Yes (5 tests) |
| `src/lib/storage.ts` | localStorage persistence | Yes (16 tests) |
| `src/context/WeatherContext.tsx` | State management + API orchestration | Yes (9 tests) |
| `src/lib/weather-codes.ts` | WMO code → condition mapping | Yes (21 tests) |
| `src/lib/units.ts` | Unit conversion utilities | Yes (15 tests) |

### Endpoint Grouping Assessment

**Well organized.** All HTTP calls are centralized in `api.ts`. No scattered fetch calls across components. The context layer (`WeatherContext`) acts as the sole orchestration point between API calls and UI state. This is a clean separation of concerns.

---

## 3. Naming Conventions

### Dominant Conventions (Consistent Throughout)

| Category | Convention | Consistency |
|----------|-----------|-------------|
| URL construction | `URL` + `searchParams.set()` | 100% — all 3 functions |
| Base URL naming | `UPPER_SNAKE_CASE` constants | 100% |
| Internal field naming | `camelCase` | 100% |
| External field naming | `snake_case` (from Open-Meteo) | 100% (passthrough for `GeocodingResult`) |
| Boolean naming | `is` prefix (`isDay`, `isDarkMode`) | 100% |
| Type names | `PascalCase` | 100% |
| Function names | `camelCase`, verb-first | 100% |
| Error class | `PascalCase` (`ApiError`) | 100% |

### Minor Inconsistency: Coordinate Field Naming

The `GeocodingResult` type uses `latitude` / `longitude` (full names), while the `City` type uses `lat` / `lon` (abbreviated):

```typescript
// GeocodingResult (types/weather.ts:14-22)
interface GeocodingResult {
  latitude: number
  longitude: number
  // ...
}

// City (types/weather.ts:63-69)
interface City {
  lat: number
  lon: number
  // ...
}
```

**Assessment**: This is **intentional and appropriate**. `GeocodingResult` mirrors the Open-Meteo API response shape (where the API uses `latitude`/`longitude`). `City` is a compact internal type used for localStorage persistence and UI state, where brevity is preferred. The mapping occurs in `SearchBar.tsx:59-65` where `result.latitude` → `city.lat`.

**Verdict**: No action needed. This is a deliberate design choice, not an inconsistency.

### URL Consistency

Not applicable — the app does not define its own URL routes/endpoints. It consumes Open-Meteo's URL scheme, which is consistently `snake_case` and well-structured.

---

## 4. HTTP Method & Status Code Correctness

### Method Usage

All three API functions use `GET` requests via `fetch()`. This is correct — all operations are read-only queries with no side effects.

| Function | Method | Purpose | Correct? |
|----------|--------|---------|----------|
| `searchCities` | GET | Read cities by name | Yes |
| `fetchWeather` | GET | Read weather forecast | Yes |
| `reverseGeocode` | GET | Read city by coordinates | Yes |

No POST, PUT, PATCH, or DELETE calls exist. No data mutation occurs via HTTP. This is correct for a client-side weather consumer.

### Status Code Handling

The app checks `res.ok` (which covers 200-299 range) and throws on failure. It does **not** differentiate between specific error status codes (400, 403, 404, 429, 500, etc.) in its control flow — all non-ok responses are treated identically with a generic user-facing error message.

**Assessment**: This is **acceptable** for a consumer app. The app cannot meaningfully handle a 429 (rate limit) differently from a 500 (server error) — both result in "show error, let user retry." The HTTP status is preserved in `ApiError.status` for debugging if needed.

**Informational note**: If the app ever needs to display different messages for "API is down" vs "rate limited" vs "bad request", the status differentiation infrastructure is already in place via `ApiError.status`.

---

## 5. Error Response Consistency

### Error Format

The app uses a single, consistent error class across all API functions:

```typescript
class ApiError extends Error {
  status?: number  // HTTP status code
  name = 'ApiError'
  message: string  // Human-readable description
}
```

### Error Handling Strategies

| Strategy | Functions | Behavior | Consistent? |
|----------|-----------|----------|-------------|
| Throw `ApiError` | `searchCities`, `fetchWeather` | Caller must catch | Yes |
| Return `null` | `reverseGeocode` | Caller checks for null | Yes |

**Assessment**: The two strategies are clearly separated by function purpose:
- **Primary functions** (data the app needs to render) throw errors
- **Auxiliary functions** (nice-to-have data) return null

This is a deliberate, well-documented pattern. The `reverseGeocode` JSDoc comment explains the rationale.

### Error Message Quality

| Function | Error Message | Quality |
|----------|--------------|---------|
| `searchCities` | "Failed to search cities" | Good — actionable, not technical |
| `fetchWeather` | "Failed to fetch weather data" | Good — actionable, not technical |
| `reverseGeocode` | N/A (returns null) | Good — silent failure is appropriate |
| Context fallback | "Unable to fetch weather data. Check your connection and try again." | Good — includes next step |

No sensitive information (stack traces, SQL errors, internal paths) is ever exposed. Error messages are user-facing quality.

### Error Propagation

```
api.ts (throws ApiError) → WeatherContext (catches, stores in state) → ErrorState (displays with retry button)
```

This is a clean, consistent three-tier error propagation pattern.

---

## 6. Pagination

### Assessment: Not Applicable

The app does not implement pagination because:

1. **City search** is capped at `count=8` results — this is an intentional UI cap, not a missing pagination feature. 8 search suggestions is the right UX for a dropdown.
2. **Weather forecast** returns exactly 6 days — fixed, not paginated.
3. **Recent cities** is capped at 5 in localStorage — not a list endpoint.

No unbounded list results exist. No pagination is needed.

---

## 7. Request Validation

### Validation Coverage

| Function | Input Validation | Assessment |
|----------|-----------------|------------|
| `searchCities(query)` | `query.trim().length < 2` → return `[]` | Good — prevents unnecessary API calls |
| `fetchWeather(lat, lon, name, country)` | None | Acceptable — numeric coords from trusted sources (geolocation API or geocoding results) |
| `reverseGeocode(lat, lon)` | None (rounds coords to 1 decimal) | Acceptable — best-effort function |

### Validation Behavior

- **Consistent**: Short queries return `[]` without making a network request
- **Location**: Validation occurs at the API function boundary (in `api.ts`), not in components
- **Additional UI validation**: `SearchBar` debounces input by 300ms and checks `debouncedQuery.trim().length < 2` before calling (redundant but harmless — defense in depth)

### Informational Note

`fetchWeather` does not validate that `lat`/`lon` are within valid ranges (-90 to 90, -180 to 180). This is low risk because:
- Coordinates always come from either the browser geolocation API or Open-Meteo geocoding results (both trusted sources)
- Open-Meteo would return an error for invalid coordinates anyway
- Adding validation here would violate YAGNI

---

## 8. Miscellaneous API Quality

### Rate Limiting

**Not applicable.** Open-Meteo's free tier has generous rate limits and no API key requirement. The app adds implicit rate limiting via:
- 300ms search debounce (prevents rapid-fire geocoding calls)
- User-initiated actions only (no polling or background refresh)

### Versioning

**Not applicable.** The app does not expose versioned endpoints. It consumes Open-Meteo's `/v1/` API, which is stable.

### Content Types

All responses are parsed with `res.json()`. Open-Meteo always returns JSON. No `Content-Type` header validation is performed — acceptable for a known, trusted API provider.

### Idempotency

All API calls are `GET` requests (inherently idempotent). No write operations exist. Not applicable.

### Caching

- **Browser geolocation**: Cached for 5 minutes via `maximumAge: 300000`
- **API responses**: No explicit caching. Each city selection triggers a fresh weather fetch. This is acceptable — weather data should be current, and the API is free with no rate concerns.

### Security

- No API keys or secrets in the codebase (Open-Meteo is keyless)
- No `.env` files needed or present
- No CORS issues (Open-Meteo allows cross-origin requests)
- No user authentication — no auth boundaries to review
- No sensitive data stored (weather data, city preferences)

---

## 9. API Style Guide

Generated at `docs/API_DESIGN_GUIDE.md`. This guide codifies the dominant patterns observed in the codebase:

1. URL construction with `URL` + `searchParams`
2. `camelCase` internal fields, `snake_case` → `camelCase` mapping at API boundary
3. `ApiError` class for HTTP errors
4. Throw vs return-null error strategies
5. Input validation at API function boundary
6. Response transformation and default values
7. Testing patterns (unit + contract + integration)

---

## 10. Recommendations

The API layer is well-designed, consistent, and thoroughly tested. The codebase demonstrates a clear, intentional architecture for API consumption. There are no bugs, no security issues, and no inconsistencies that warrant code changes.

| # | Recommendation | Impact | Risk if Ignored | Worth Doing? | Details |
|---|---|---|---|---|---|
| 1 | Add `AbortController` support to API functions | Prevents stale responses from superseding fresh ones during rapid city switching | Low | Only if time allows | Currently the `SearchBar` uses a `cancelled` boolean flag to discard stale results, but the underlying fetch still completes. Adding `AbortController` to `searchCities` would cancel in-flight requests, saving bandwidth on slow connections. Very minor optimization. |
| 2 | Add coordinate range validation to `fetchWeather` | Catches programming errors at the API boundary instead of at Open-Meteo | Low | Only if time allows | `lat` must be [-90, 90] and `lon` must be [-180, 180]. Currently coordinates always come from trusted sources (geolocation API, geocoding results), so invalid values can't reach `fetchWeather` in practice. This would only catch bugs during development. |

No critical, high, or medium-risk recommendations. The API surface is clean.

---

## Appendix: Test Coverage of API Layer

| Test File | Tests | Coverage Area |
|-----------|-------|---------------|
| `api.test.ts` | 8 | Core functionality: search, fetch, errors, edge cases |
| `api-contracts.test.ts` | 26 | Response structure, field mapping, URL construction, type coercion |
| `api-reverseGeocode.test.ts` | 7 | Reverse geocoding: happy path, errors, coord rounding, defaults |
| **Total** | **41** | **Comprehensive** |

All 41 API-specific tests pass. The API layer has the highest test density of any module in the codebase.
