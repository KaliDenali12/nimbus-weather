# Error Recovery & Resilience Audit Report

**Run:** 01
**Date:** 2026-03-18
**Branch:** `nightytidy/run-2026-03-18-1312`
**Auditor:** NightyTidy (automated)
**Tests Before:** 235 passing (25 files)
**Tests After:** 254 passing (27 files) — 19 new resilience tests added

---

## 1. Executive Summary

**Resilience Maturity: Basic → Moderate** (post-fixes)

> **"What happens right now if Open-Meteo goes down for 10 minutes?"**
>
> **Before fixes:** The app hangs indefinitely — loading spinner never resolves. Users stare at a spinner until they manually refresh. Search bar locks up. No timeout fires, no error message appears.
>
> **After fixes:** The app shows a meaningful error message within 10 seconds. Users see "Weather request timed out" and can retry. Search shows "City search timed out" and remains usable.

### Top 5 Resilience Gaps (Pre-Audit)

1. **CRITICAL: No fetch timeouts** — All 3 API calls (`searchCities`, `fetchWeather`, `reverseGeocode`) used bare `fetch()` with no timeout. On a dead network or unresponsive API, the app hangs indefinitely. **→ FIXED**
2. **HIGH: No API response validation** — Malformed JSON from Open-Meteo (missing `current` block, non-numeric temperature) would crash the app with an unhandled TypeError. **→ FIXED**
3. **HIGH: No root error boundary** — Only the 3D scene had an error boundary. Any rendering error in main UI components (CurrentWeather, Forecast, etc.) would crash the entire React tree with a white screen and no recovery option. **→ FIXED**
4. **MEDIUM: Unbounded particle intensity** — `RainParticles` accepted any `intensity` prop and allocated `Float32Array(intensity * 3)`. While currently called with safe values (300-1500), a code change could easily cause massive memory allocation. **→ FIXED**
5. **MEDIUM: Missing coordinate bounds in localStorage validation** — `isValidCity()` checked `Number.isFinite()` but not geographic bounds (-90..90 lat, -180..180 lon), allowing corrupted city data to persist and potentially cause API errors. **→ FIXED**

---

## 2. Timeout Audit

### External Call Inventory

| # | Operation | File | Type | Timeout Before | Timeout After | Notes |
|---|-----------|------|------|----------------|---------------|-------|
| 1 | `searchCities()` → Open-Meteo Geocoding | `lib/api.ts:93` | HTTP GET | **None** | **10s** (`AbortSignal.timeout`) | Was effectively browser-dependent (90s+ or infinite) |
| 2 | `fetchWeather()` → Open-Meteo Forecast | `lib/api.ts:140` | HTTP GET | **None** | **10s** (`AbortSignal.timeout`) | Most critical — blocks initial page load |
| 3 | `reverseGeocode()` → Open-Meteo Geocoding | `lib/api.ts:195` | HTTP GET | **None** | **10s** (`AbortSignal.timeout`) | Non-critical but could delay Antarctica fallback |
| 4 | `getUserLocation()` → Browser Geolocation | `lib/geolocation.ts:18` | Browser API | **8s** | 8s (unchanged) | Already properly configured |
| 5 | `localStorage.getItem/setItem` | `lib/storage.ts` | Sync I/O | N/A | N/A | Synchronous — cannot hang, already in try/catch |

### Timeout Design Decisions

- **10 seconds** chosen for all fetch calls — generous enough to handle slow mobile networks and API cold starts, short enough to avoid "is this thing even working?" frustration.
- Used `AbortSignal.timeout()` (modern Web standard) instead of manual `AbortController` + `setTimeout` — cleaner, no cleanup needed, supported by all modern browsers.
- Timeout errors wrapped in `ApiError` with descriptive messages that distinguish timeout from network errors.

---

## 3. Retry Logic

### Existing Retry Mechanisms

| Operation | Retry Type | Correct? | Issues |
|-----------|-----------|----------|--------|
| Manual retry via "Try Again" button | User-initiated | Yes | No rate limiting, but acceptable for user-triggered action |
| Search retry via re-typing | Implicit | Yes | Debounce (300ms) provides natural rate limiting |

### Retries Added

None. All API operations in this app are user-triggered (search, city selection, retry button). Automatic retry is not warranted because:

1. The app is pure client-side with no background jobs or queues.
2. User can trivially retry by clicking "Try Again" or re-searching.
3. Adding automatic retry would complicate the code without meaningful UX benefit.
4. Open-Meteo free tier has no rate limits, so thundering herd is not a concern.

### Retries Needed But Not Added

None required. The user-initiated retry pattern is appropriate for this application's architecture.

---

## 4. Circuit Breaker & Fallback Assessment

### Current Fallback Behavior

| Dependency | Current Failure Mode | Existing Fallback | Adequate? |
|------------|---------------------|-------------------|-----------|
| Open-Meteo Forecast API | Error message + retry button | Yes — ErrorState component with "Try Again" | Yes |
| Open-Meteo Geocoding API | "Search failed" in dropdown | Yes — error message in search results | Yes |
| Reverse Geocoding | Silent null return | Yes — falls back to "Your Location" | Yes |
| Browser Geolocation | Antarctica fallback + Toast | Yes — full graceful degradation | Yes |
| localStorage | Silent fail with defaults | Yes — app works without persistence | Yes |
| WebGL/Three.js | SceneErrorBoundary returns null | Yes — gradient background remains | Yes |

### Circuit Breaker Recommendations

**Not recommended for this application.** Circuit breakers add value when:
- A failing dependency causes cascading failures to other services
- Request volume is high enough that retries create load problems
- Multiple dependencies share failure blast radius

This is a single-page client-side app with one external dependency (Open-Meteo) and no backend. The existing timeout + error UI pattern is the right level of protection.

---

## 5. Partial Failure & Data Consistency

### Multi-Step Operations Analyzed

| Operation | Steps | Failure Modes | Current Handling | Fixes Applied | Remaining Risk |
|-----------|-------|---------------|------------------|---------------|----------------|
| Initial location load | 1. Geolocation → 2. Reverse geocode → 3. Fetch weather | Step 2 fails: falls back to "Your Location". Step 3 fails: shows error state. | Adequate — each step has independent error handling | Added timeout to step 2-3 | None |
| City selection | 1. Add to recent cities → 2. Save to localStorage → 3. Fetch weather | Step 2 fails: silent (prefs not saved). Step 3 fails: error state shown. | Adequate — localStorage failure is non-critical | None needed | localStorage quota exhaustion is silent (acceptable) |
| Search flow | 1. Debounce → 2. Check cache → 3. Fetch API | Step 3 fails: "Search failed" message | Adequate — cache provides resilience for repeated queries | Added timeout to step 3 | None |

### Data Consistency

- **No database transactions** — pure client-side app with localStorage only.
- **No multi-service writes** — only one external API (read-only).
- **localStorage writes are atomic** — `JSON.stringify` + `setItem` is a single operation.
- **Response validation added** — malformed API data now throws `ApiError('malformed')` instead of causing undefined field access crashes.

---

## 6. Graceful Shutdown

**Not applicable.** This is a client-side React SPA with no:
- Server process to handle SIGTERM/SIGINT
- Database connections to drain
- Message queues to flush
- Background workers to stop

The browser handles all lifecycle management. The only relevant "shutdown" concern is React unmount cleanup, which is already handled:
- SearchBar: `cancelled` flag prevents state updates after unmount ✓
- Toast: `clearTimeout` on unmount ✓
- useDebounce: `clearTimeout` on unmount ✓
- Document event listener: `removeEventListener` on unmount ✓
- R3F animation frames: managed by Canvas lifecycle ✓

---

## 7. Queue & Job Resilience

**Not applicable.** No message queues, background jobs, dead letter queues, or async job processing. Pure client-side, request-response architecture.

---

## 8. Cascading Failure Risk Map

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│                                                         │
│  ┌─────────┐     ┌───────────────────────────────────┐  │
│  │ Geoloc  │────▶│        WeatherContext              │  │
│  │ API     │     │  (single source of truth)          │  │
│  └─────────┘     │                                    │  │
│       │          │  ┌─────────┐  ┌──────────────────┐ │  │
│       │          │  │ weather │  │   preferences    │ │  │
│  fallback:       │  │  data   │  │ (localStorage)   │ │  │
│  Antarctica      │  └────▲────┘  └──────────────────┘ │  │
│                  └───────│────────────────────────────┘  │
│                          │                               │
│               ┌──────────┴──────────┐                    │
│               │  Open-Meteo API     │ ◀── SINGLE         │
│               │  (Geocoding +       │     EXTERNAL       │
│               │   Forecast)         │     DEPENDENCY     │
│               └─────────────────────┘                    │
│                                                          │
│  Blast radius if Open-Meteo is down:                     │
│  • Weather data: unavailable (error UI shown)            │
│  • Search: fails with message                            │
│  • 3D scene: not affected (uses cached weather data)     │
│  • Preferences: not affected (localStorage)              │
│  • App structure: not affected (renders error state)     │
└─────────────────────────────────────────────────────────┘
```

**Critical path with no fallback:** Open-Meteo Forecast API → weather data display. If this fails on initial load, the app shows only the error state. However, with the newly added 10s timeout, this path now fails fast and shows an actionable error message.

**Blast radius per dependency:**
- **Open-Meteo down:** Weather display and search unavailable. App structure, preferences, 3D scene all continue working. User sees error + retry button.
- **localStorage unavailable:** App works fully but doesn't remember preferences or recent cities between sessions. Zero user-visible errors.
- **WebGL unavailable:** 3D scene doesn't render. Gradient background remains. All weather data and interactions work normally.
- **Geolocation unavailable:** Falls back to Antarctica. User can search for their city. Toast explains the situation.

---

## 9. Recommendations

| # | Recommendation | Impact | Risk if Ignored | Worth Doing? | Details |
|---|---|---|---|---|---|
| 1 | Add service worker for offline/cache-first | Users see cached weather when offline instead of error | Low | Only if time allows | Would require SW infrastructure + cache strategy. Nice-to-have but significant effort for a portfolio app. |
| 2 | Add WebGL context loss recovery | 3D scene recovers without page reload after GPU context loss | Low | Only if time allows | `canvas.addEventListener('webglcontextlost', ...)` with `webglcontextrestored`. Rare edge case on desktop, more common on mobile. Currently handled by SceneErrorBoundary (renders null). |
| 3 | Add `window.onerror` / `unhandledrejection` logging | Captures errors that escape React error boundaries | Low | Probably | A few lines in `main.tsx` to catch truly unhandled errors. Useful for debugging but not critical since AppErrorBoundary now catches render errors. |

---

## Changes Made

### Files Modified

| File | Change |
|------|--------|
| `src/lib/api.ts` | Added 10s `AbortSignal.timeout` to all 3 fetch calls. Added timeout → `ApiError` conversion with descriptive messages. Added response shape validation for `fetchWeather`. Added safe defaults (`?? 0`) for optional daily forecast fields. Exported `FETCH_TIMEOUT_MS` constant. |
| `src/App.tsx` | Wrapped `WeatherProvider` + `WeatherApp` in new `AppErrorBoundary`. |
| `src/scenes/RainParticles.tsx` | Added `MAX_PARTICLES = 3000` cap. Intensity clamped to `[0, 3000]`. |
| `src/lib/storage.ts` | Added geographic bounds validation (`-90..90` lat, `-180..180` lon) to `isValidCity()`. |

### Files Created

| File | Purpose |
|------|---------|
| `src/components/AppErrorBoundary.tsx` | Root-level error boundary with styled recovery UI and reload button. |
| `src/lib/__tests__/api-resilience.test.ts` | 15 tests covering timeout handling, network error conversion, and response validation. |
| `src/components/__tests__/AppErrorBoundary.test.tsx` | 4 tests covering error boundary rendering, logging, and reload behavior. |

### Test Results

- **Before:** 235 tests, 25 files, all passing
- **After:** 254 tests, 27 files, all passing (+19 new tests, +2 new test files)
- **No regressions** — all existing tests pass unchanged
