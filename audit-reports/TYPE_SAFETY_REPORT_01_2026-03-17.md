# Type Safety & Error Handling Hardening Report

**Run**: 01
**Date**: 2026-03-17
**Branch**: `nightytidy/run-2026-03-17-1741`
**Tests passing**: Yes (228/228 — 115 lib + 113 component/integration)

---

## 1. Summary

| Metric | Count |
|--------|-------|
| `any` types removed | 0 (none existed) |
| Type assertions replaced with typed interfaces | 2 (`api.ts` — API response casts) |
| Non-null assertions replaced with null checks | 4 (`RainParticles.tsx`, `SnowParticles.tsx`) |
| `@ts-ignore` / `@ts-expect-error` removed | 0 (only 1 existed — intentional test case) |
| Return type annotations added | 0 (all public functions already annotated) |
| Empty catch blocks fixed | 0 (none existed) |
| Error handling improvements | 4 files |
| Bug discovered and fixed | 1 (`storage.ts` — catch path ignored system dark mode) |
| Tests still passing | **Yes** |

---

## 2. Type Safety Improvements Made

| File | Change | Risk Level | Before → After |
|------|--------|------------|----------------|
| `src/lib/api.ts` | Added `GeocodingApiResponse`, `ForecastApiResponse`, `ForecastCurrentBlock`, `ForecastDailyBlock` interfaces | Medium | `data.results ?? []) as GeocodingResult[]` → `const data: GeocodingApiResponse = await res.json(); return data.results ?? []` |
| `src/lib/api.ts` | Typed forecast response | Medium | Untyped `data` with implicit `any` field access → `const data: ForecastApiResponse = await res.json()` with typed field access |
| `src/lib/api.ts` | Typed reverse geocode response | Low | Untyped `data` → `const data: GeocodingApiResponse = await res.json()` |
| `src/lib/storage.ts` | Replaced `as Partial<UserPreferences>` with runtime validation | Medium | Type assertion on `JSON.parse` → `unknown` parse + structural validation of each field |
| `src/lib/storage.ts` | Hardened `getSystemDarkMode()` | Low | Assumed `matchMedia` returns non-null → Optional chaining with nullish coalescing fallback |
| `src/scenes/RainParticles.tsx` | Replaced 2 non-null assertions (`!`) with null guard | Low | `attributes.position!.array` → `const posAttr = ...; if (!posAttr) return` |
| `src/scenes/SnowParticles.tsx` | Replaced 2 non-null assertions (`!`) with null guard | Low | Same pattern as RainParticles |

---

## 3. Type Safety Improvements Recommended (Not Implemented)

### Structural improvements that would benefit from team discussion:

1. **Runtime schema validation at API boundaries** — The typed interfaces added in this pass give TypeScript compile-time safety, but the actual API responses from Open-Meteo are still trusted at runtime. A library like Zod would add runtime validation. **Trade-off**: Adds a dependency (~12KB) for a stable free API that rarely changes shape. Recommended only if the API is known to break or if the project grows to include multiple API providers.

2. **Branded types for lat/lon** — `latitude` and `longitude` are both `number`, making accidental swapping possible. Branded types (`type Latitude = number & { __brand: 'lat' }`) would catch this at compile time. **Trade-off**: Adds ceremony for a low-probability bug. The current codebase consistently uses named parameters that make the intent clear.

3. **The remaining `as Float32Array` assertions in particle files** — These remain because Three.js's `BufferAttribute.array` is typed as `TypedArray` (a union of all typed array types), but we specifically created them with `new Float32Array(...)`. The assertion is always correct. **Trade-off**: Could be avoided with a wrapper function that creates and returns the typed attribute, but that adds abstraction for no runtime benefit.

---

## 4. Error Handling Fixes Made

| File | Issue | Fix Applied |
|------|-------|-------------|
| `src/components/SceneErrorBoundary.tsx` | Missing `componentDidCatch` — 3D scene errors were silently swallowed with zero observability | Added `componentDidCatch(error, info)` that logs error + component stack via `console.error` |
| `src/context/WeatherContext.tsx` | Overly broad catch — all API errors shown as generic message, `ApiError.status` field unused | Added structural HTTP status detection: server errors (5xx) now show "Weather service temporarily unavailable" instead of raw error message |
| `src/components/SearchBar.tsx` | Silent error swallowing — `.catch(() => { setResults([]) })` made API failures indistinguishable from "no results" | Added `searchError` state; dropdown now shows "Search failed — check your connection" instead of "No cities found" when API call fails |
| `src/lib/storage.ts` | Catch path returned `{ ...DEFAULTS }` with `darkModeEnabled: false`, ignoring system preference | Catch now calls `getSystemDarkMode()` for consistency with the no-data-stored happy path |
| `src/lib/api.ts` | `reverseGeocode` catch comment was vague ("Silently fail") | Improved to explain *why* silent failure is acceptable: "Non-critical: reverse geocode is a best-effort enhancement for location names" |

---

## 5. Error Handling Infrastructure Assessment

### Current state

| Aspect | Status | Notes |
|--------|--------|-------|
| Custom error class | **Good** | `ApiError extends Error` with optional `status` field |
| Discriminated unions for errors | **Excellent** | `getUserLocation()` returns `{ ok: true; position } \| { ok: false; error }` — no throwing |
| Error boundaries (React) | **Good** (improved) | `SceneErrorBoundary` for WebGL; now logs errors. No global boundary exists. |
| `finally` blocks | **Good** | `loadWeatherForCoords` properly uses `finally` for loading state cleanup |
| Error propagation | **Good** | API functions throw structured errors; context catches and converts to user-facing messages |
| Error monitoring | **Missing** | No Sentry, LogRocket, or equivalent. `console.error` is the only observability mechanism |

### What's good
- Zero `throw "string"` patterns — all errors are proper `Error` objects
- Cancellation handling in SearchBar via cleanup function with `cancelled` flag
- Defensive null checks on all Three.js refs before accessing properties
- Geolocation errors returned as values (discriminated union), not thrown

### What's missing
- **Global error boundary** around `<App />` — an unhandled error in any component outside the 3D scene will blank-screen the app. This is the highest remaining risk.
- **Error monitoring service** — production errors are invisible unless reproduced locally

---

## 6. Bugs Discovered

### BUG: `loadPreferences()` catch path ignores system dark mode preference

**File**: `src/lib/storage.ts`
**Severity**: Low (cosmetic, but inconsistent user experience)
**Root cause**: The catch block in `loadPreferences()` returned `{ ...DEFAULTS }` which hardcodes `darkModeEnabled: false`. The happy path (no saved data) returned `{ ...DEFAULTS, darkModeEnabled: getSystemDarkMode() }`. This meant that users with corrupted localStorage who had system dark mode enabled would see light mode flash before any interaction.
**Fix**: Catch now returns `{ ...DEFAULTS, darkModeEnabled: getSystemDarkMode() }`, matching the no-data path.

### BUG (latent): `getSystemDarkMode()` could throw if `matchMedia` returns null/undefined

**File**: `src/lib/storage.ts`
**Severity**: Low (only triggers in edge-case environments)
**Root cause**: The original implementation did `window.matchMedia('...').matches` without checking if `matchMedia` returns a valid `MediaQueryList`. In some test environments and edge-case browsers, `matchMedia` can be defined as a function but return `undefined`.
**Fix**: Added optional chaining: `window.matchMedia('...')?.matches ?? false`

---

## 7. Recommendations

| # | Recommendation | Impact | Risk if Ignored | Worth Doing? | Details |
|---|---|---|---|---|---|
| 1 | Add global error boundary around `<App />` | Prevents blank screen on unhandled component errors | **High** | Yes | Currently, any error outside the 3D scene's `SceneErrorBoundary` will crash the entire React tree with no user feedback. A global boundary with "Something went wrong, reload" fallback would prevent this. |
| 2 | Add error monitoring (Sentry or similar) | Production error visibility | **Medium** | Probably | The `componentDidCatch` log added in this pass only helps if someone is watching the console. A monitoring service would surface errors proactively. For a portfolio project, free-tier Sentry would suffice. |
| 3 | Add runtime schema validation for API responses | Catches API contract changes at runtime | **Low** | Only if time allows | The typed interfaces added in this pass are compile-time only. Zod would add runtime validation but introduces a dependency for a stable API. Worth it only if adding more API providers or if Open-Meteo changes its contract. |

---

## 8. tsconfig.json Assessment

The project's `tsconfig.app.json` is already very strict:

- `strict: true` — Enables all strict type checks
- `noUnusedLocals: true` — No dead variables
- `noUnusedParameters: true` — No dead parameters
- `erasableSyntaxOnly: true` — No enums, no parameter properties
- `verbatimModuleSyntax: true` — Enforces explicit `type` imports

**No additional strict options are recommended.** The configuration is already at maximum strictness for this project's needs.
