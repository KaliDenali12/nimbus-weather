# File Decomposition & Module Structure Report

**Run**: 01
**Date**: 2026-03-17
**Branch**: `nightytidy/run-2026-03-17-1741`
**Baseline Tests**: 228 passed (25 test files)
**Baseline Build**: Vite build succeeds (6.18s)

---

## 1. Executive Summary

All 33 non-test source files were analyzed. **No file exceeds the 300-line conservative split threshold.** The largest source file is `WeatherContext.tsx` at 184 lines, and the average file size is 89 lines. The codebase is already well-decomposed — no splits were necessary or performed. All 228 tests continue to pass.

**Files analyzed**: 33 (non-test source files)
**Files over 300 lines**: 0
**Files split**: 0
**Files skipped**: 0 (none qualified)
**Tests passing**: 228/228

---

## 2. File Size Inventory

### Non-Test Source Files (sorted by line count descending)

| # | File | Lines | Primary Responsibility | Exports |
|---|------|-------|----------------------|---------|
| 1 | `src/context/WeatherContext.tsx` | 184 | Global state: weather data, prefs, actions | 2 (context, provider) |
| 2 | `src/components/SearchBar.tsx` | 177 | City search with autocomplete dropdown | 1 |
| 3 | `src/index.css` | 153 | Tailwind directives, CSS vars, glassmorphism | N/A (CSS) |
| 4 | `src/lib/theme.ts` | 146 | 16 weather themes + dark mode + apply logic | 3 |
| 5 | `src/scenes/SceneContent.tsx` | 122 | 3D scene orchestrator: lighting, particles, objects | 1 |
| 6 | `src/lib/api.ts` | 115 | Open-Meteo geocoding + forecast API calls | 3 |
| 7 | `src/scenes/DioramaObjects.tsx` | 104 | Tree + House 3D meshes with snow variant | 1 |
| 8 | `src/components/TemperatureChart.tsx` | 94 | Recharts temperature chart component | 1 |
| 9 | `src/types/weather.ts` | 86 | All domain type definitions | ~15 types |
| 10 | `src/components/CurrentWeather.tsx` | 80 | Current weather display card | 1 |
| 11 | `src/App.tsx` | 79 | Root layout: WeatherProvider → WeatherApp | 2 |
| 12 | `src/lib/weather-codes.ts` | 72 | WMO code → condition/label/icon mapping | 3 |
| 13 | `src/components/AlertBanner.tsx` | 69 | Weather alert display (currently always empty) | 1 |
| 14 | `src/lib/storage.ts` | 56 | localStorage: prefs + recent cities | 4 |
| 15 | `src/components/Forecast.tsx` | 53 | 7-day forecast display | 1 |
| 16 | `src/lib/geolocation.ts` | 52 | Browser geolocation with fallback | 1 |
| 17 | `src/scenes/SnowParticles.tsx` | 48 | Snow particle system | 1 |
| 18 | `src/scenes/RainParticles.tsx` | 47 | Rain particle system | 1 |
| 19 | `src/components/Toast.tsx` | 46 | Toast notification component | 1 |
| 20 | `src/scenes/SimpleCloud.tsx` | 42 | Cloud mesh (4 overlapping spheres) | 1 |
| 21 | `src/components/WeatherIcon.tsx` | 40 | Weather condition → icon mapping | 1 |
| 22 | `src/scenes/WeatherScene.tsx` | 39 | Canvas wrapper, lazy-loads SceneContent | 1 |
| 23 | `src/components/Header.tsx` | 37 | App header with settings toggles | 1 |
| 24 | `src/lib/units.ts` | 34 | Temp/wind conversion + day formatting | 4 |
| 25 | `src/components/SceneErrorBoundary.tsx` | 25 | Error boundary for WebGL crashes | 1 |
| 26 | `src/components/RecentCities.tsx` | 25 | Recent cities chip list | 1 |
| 27 | `src/scenes/Ground.tsx` | 24 | Weather-reactive ground plane | 1 |
| 28 | `src/components/ErrorState.tsx` | 23 | Error display with retry button | 1 |
| 29 | `src/components/LoadingState.tsx` | 16 | Loading spinner | 1 |
| 30 | `src/types/index.ts` | 13 | Barrel re-export for types | N/A |
| 31 | `src/hooks/useDebounce.ts` | 12 | Generic debounce hook | 1 |
| 32 | `src/main.tsx` | 10 | StrictMode + createRoot entry | 0 |
| 33 | `src/vite-env.d.ts` | 2 | Vite type reference | N/A |

### Test Files (for reference, not candidates for splitting)

| File | Lines |
|------|-------|
| `src/lib/__tests__/api-contracts.test.ts` | 494 |
| `src/context/__tests__/WeatherContext.test.tsx` | 312 |
| `src/components/__tests__/SearchBar.test.tsx` | 273 |
| `src/__tests__/integration.test.tsx` | 238 |
| `src/__tests__/smoke.test.tsx` | 179 |
| `src/lib/__tests__/storage.test.ts` | 169 |
| `src/lib/__tests__/api.test.ts` | 132 |
| All other test files | <120 each |

---

## 3. Splits Executed

**None.** No source file exceeded the 300-line threshold.

---

## 4. Splits Attempted but Reverted

**None.** No splits were attempted.

---

## 5. Files Skipped (with Reasoning)

No files qualified for splitting. The top 5 largest files and why they don't need decomposition:

| File | Lines | Why Not Split |
|------|-------|---------------|
| `WeatherContext.tsx` | 184 | Single responsibility: one context with related state, actions, and provider. Splitting state from actions would create tight coupling between fragments. |
| `SearchBar.tsx` | 177 | Single component with keyboard navigation, dropdown, and ARIA. All parts are tightly coupled to shared state (query, results, selection index). |
| `index.css` | 153 | CSS file — not a module. Contains Tailwind directives + theme vars + utility classes. Already well-organized with clear sections. |
| `theme.ts` | 146 | Theme data (objects) + `applyTheme` function. Could theoretically separate data from logic, but both are tightly coupled and the file is small. |
| `SceneContent.tsx` | 122 | Single 3D scene orchestrator. Subcomponents (particles, clouds, objects) are already extracted into separate files. |

---

## 6. Structural Observations (Documentation Only)

### Directory Structure
The project follows a clean hybrid structure: layer-based at the top level (`components/`, `lib/`, `scenes/`, `context/`, `hooks/`, `types/`) with colocation of tests via `__tests__/` directories. This is well-organized and appropriate for the project size (~33 source files).

**No directory restructuring recommended.** The current structure maps cleanly to the architecture:
- `components/` — UI components (12 files, avg 54 lines)
- `scenes/` — 3D/Three.js components (7 files, avg 61 lines)
- `lib/` — Pure utility modules (6 files, avg 79 lines)
- `context/` — State management (1 file)
- `hooks/` — Custom hooks (1 file)
- `types/` — Type definitions (2 files)

### Barrel File Assessment
The project uses a single barrel file: `types/index.ts` re-exporting from `types/weather.ts`. This is appropriate — types are the one area where barrel files improve ergonomics without hiding circular dependencies. No additional barrel files are needed.

### Shared Module Opportunities
No shared module extraction needed. The `lib/` directory already serves this purpose effectively, with each utility file (`api.ts`, `theme.ts`, `units.ts`, etc.) being self-contained and imported directly.

---

## 7. File Size Distribution

| Range | Count | Files |
|-------|-------|-------|
| 0–50 lines | 15 | LoadingState, ErrorState, Ground, RecentCities, SceneErrorBoundary, units, SimpleCloud, WeatherScene, Header, WeatherIcon, Toast, RainParticles, SnowParticles, useDebounce, main, vite-env, types/index |
| 51–100 lines | 9 | geolocation, storage, Forecast, AlertBanner, weather-codes, App, CurrentWeather, weather.ts, TemperatureChart |
| 101–200 lines | 7 | DioramaObjects, api, SceneContent, theme, index.css, SearchBar, WeatherContext |
| 201–300 lines | 0 | — |
| 301–500 lines | 0 | — |
| 500+ lines | 0 | — |

**Median file size**: ~48 lines
**Average file size**: 89 lines
**Largest file**: 184 lines (`WeatherContext.tsx`)

---

## 8. Recommendations

The codebase is already well-decomposed. No file decomposition work is needed at this time.

| # | Observation | Context |
|---|-------------|---------|
| 1 | Test file `api-contracts.test.ts` is 494 lines | Large but appropriate — comprehensive contract tests for API responses. Test files are excluded from splitting per the rules, and this file tests a single module. |
| 2 | `WeatherContext.tsx` (184 lines) is the single largest non-test file | Currently well within bounds. If additional state/actions are added in the future, consider extracting a `useWeatherReducer` hook or splitting into `weather-actions.ts` + `weather-provider.tsx`. Not worth doing now. |
| 3 | Pre-existing TypeScript build errors in test files | 4 type errors in `Header.test.tsx`, `SceneErrorBoundary.test.tsx`, and `api-contracts.test.ts` cause `tsc -b` to fail. These are unrelated to file structure but worth fixing in a separate pass. |
| 4 | Test runner heap issues with default pool | Tests require `--pool=forks` or `--no-file-parallelism` to avoid OOM on this machine. Consider adding this to `vitest.config.ts` for reliability. |

---

## 9. Pre-Existing Issues Noted

These are not file decomposition concerns but were discovered during the audit:

1. **`npm run build` fails** due to TypeScript errors in test files (pre-existing on this branch):
   - `Header.test.tsx:42,54` — Type `"fahrenheit"` not assignable to `"celsius"`
   - `SceneErrorBoundary.test.tsx:5` — Cannot find namespace `JSX`
   - `api-contracts.test.ts:3` — Unused import `WeatherData`

2. **`npm run test` OOMs** with default Vitest pool on this Node.js version (v24.13.1). Works with `--pool=forks`.

---

*Report generated by file decomposition pass. No source files were modified.*
