# Codebase Cleanup Report

**Project**: Nimbus Weather App
**Date**: 2026-03-17
**Run**: 01
**Branch**: `nightytidy/run-2026-03-17-1741`
**Baseline**: 228 tests, 25 test files, all passing

---

## 1. Summary

| Metric | Value |
|--------|-------|
| Total files modified | 18 |
| Lines added | 46 |
| Lines removed | 32 |
| Net line change | +14 (new constants + utility class) |
| Unused dependencies removed | 1 (`@testing-library/user-event`) |
| Commits made | 5 |
| Tests affected | 0 (all 228 pass throughout) |
| Build status | Clean (`tsc --noEmit` passes) |

---

## 2. Dead Code Removed

### Unused Dependencies

| Package | Type | Evidence | Action |
|---------|------|----------|--------|
| `@testing-library/user-event` | devDependency | Zero imports across all 25 test files and source files. Tests exclusively use `fireEvent` from `@testing-library/react`. | **Removed** from `package.json` |

### No Dead Code Found in Source

The codebase is exceptionally clean:
- **0 unused exports**: Every exported function, type, and constant is imported somewhere
- **0 unused imports**: Every import is referenced in its file
- **0 orphaned files**: Every source file is imported by at least one other file or is an entry point
- **0 commented-out code blocks**: All comments are explanatory, not dead code
- **0 TODO/FIXME/HACK/XXX/TEMP markers**: None found in any file

---

## 3. Duplication Reduced

### Implemented: Inline Style Consolidation

**12 instances** of `style={{ color: 'var(--text-secondary)' }}` across 7 component files were replaced with a single `.text-secondary` CSS utility class in `index.css`.

| File | Occurrences Replaced |
|------|---------------------|
| `CurrentWeather.tsx` | 4 |
| `Forecast.tsx` | 3 |
| `TemperatureChart.tsx` | 1 |
| `AlertBanner.tsx` | 1 |
| `ErrorState.tsx` | 1 |
| `LoadingState.tsx` | 1 |
| `SearchBar.tsx` | 1 |

### Documented But Not Changed (Higher Risk)

| Duplication | Files | Why Not Fixed |
|-------------|-------|---------------|
| Particle geometry creation (~85% identical) | `RainParticles.tsx`, `SnowParticles.tsx` | The files differ in animation behavior (sine drift for snow, linear fall for rain). Extracting a shared factory would couple their evolution and adds abstraction for only 2 consumers — violates YAGNI. |
| Test mock setup patterns | 6 component test files share similar `vi.mock('@/context/WeatherContext.tsx')` blocks | Each test needs slightly different mock return shapes. A shared test utility would require importing and overriding, adding indirection without reducing total code. |
| Mock weather data objects | `CurrentWeather.test.tsx`, `Forecast.test.tsx`, `AlertBanner.test.tsx`, `WeatherContext.test.tsx` | Each test augments the base data differently (daily arrays, alerts). A shared fixture would need to be super-setted and then pruned per test, adding complexity. |
| Glassmorphism inline styles | `SearchBar.tsx` dropdown, `Toast.tsx`, `TemperatureChart.tsx` tooltip | Each uses slightly different opacity/blur values for distinct visual contexts. Standardizing would require a design decision about whether they should match. |

---

## 4. Consistency Changes

### Import Ordering (Fixed)

| File | Issue | Fix |
|------|-------|-----|
| `Forecast.tsx` | `Droplets` from `lucide-react` placed after internal `@/` imports | Moved external import before internal imports |

### Export Convention (Fixed)

| File | Issue | Fix |
|------|-------|-----|
| `App.tsx` | `export default function App()` — project convention is named exports | Changed to `export function App()` |
| `main.tsx` | `import App from './App.tsx'` — updated consumer | Changed to `import { App } from './App.tsx'` |
| `smoke.test.tsx` | `import App from '@/App.tsx'` — updated consumer | Changed to `import { App } from '@/App.tsx'` |
| `integration.test.tsx` | `import App from '@/App.tsx'` — updated consumer | Changed to `import { App } from '@/App.tsx'` |

**Note**: `SceneContent.tsx` retains its `export default` because `React.lazy()` requires default exports for dynamic imports. This is the correct exception.

### Constants Naming (Fixed)

| File | Before | After | Rationale |
|------|--------|-------|-----------|
| `storage.ts` | `const defaults` | `const DEFAULTS` | Aligns with UPPER_SNAKE_CASE convention for module-level constants |
| `AlertBanner.tsx` | `const severityStyles` | `const SEVERITY_STYLES` | Same |
| `WeatherIcon.tsx` | `const iconMap` | `const ICON_MAP` | Same |

### Verified Consistent (No Changes Needed)

| Category | Status |
|----------|--------|
| File naming (PascalCase/kebab-case) | Fully compliant |
| String quotes (single) | Fully compliant |
| `import type` usage | Fully compliant |
| Function declaration style | All use `function` declarations consistently (not arrow functions) |
| Error handling patterns | Context-appropriate: ApiError throws, storage silent-catches, geolocation discriminated unions |

---

## 5. Configuration & Feature Flags

### Feature Flags: None Found

The codebase has:
- Zero `process.env` or `import.meta.env` references
- Zero hardcoded boolean feature gates
- Zero LaunchDarkly/Flagsmith/feature flag library usage
- No conditional compilation patterns

The only "toggle" is user preference for dark mode, which is runtime state, not a feature flag.

### Configuration Constants Extracted

| Constant | File | Value | Purpose |
|----------|------|-------|---------|
| `GEOCODING_RESULT_LIMIT` | `api.ts` | `8` | Max search results from Open-Meteo geocoding |
| `FORECAST_DAYS` | `api.ts` | `6` | Today + 5 days of forecast data |
| `MIN_SEARCH_QUERY_LENGTH` | `api.ts` | `2` | Minimum chars before triggering API search |
| `RAIN_INTENSITY` | `SceneContent.tsx` | `{ storm: 1500, drizzle: 300, default: 800 }` | Rain particle counts by weather condition |

### Quick Win: Non-Null Assertion Removed

| File | Line | Before | After |
|------|------|--------|-------|
| `theme.ts` | 135 | `themes['clear-day']!` | `themes['clear-day']` |

The `!` was unnecessary — `'clear-day'` is a key that always exists in the `themes` object literal. TypeScript's `Record<string, T>` type returns `T | undefined` for any key access, but the nullish coalescing (`??`) already handles the edge case.

### Configuration Sprawl Findings

| Config | Location | Issue | Action |
|--------|----------|-------|--------|
| API URLs | `api.ts` | Well-named (`GEOCODING_URL`, `FORECAST_URL`) | No action needed |
| Storage key | `storage.ts` | Well-named (`STORAGE_KEY`) | No action needed |
| Max cities | `storage.ts` | Well-named (`MAX_RECENT_CITIES`) | No action needed |
| Geolocation timeout | `geolocation.ts` | Well-named (`GEOLOCATION_TIMEOUT`) | No action needed |
| Antarctica fallback | `geolocation.ts` | Well-named (`ANTARCTICA`) | No action needed |
| Snow particle count | `SnowParticles.tsx` | Well-named (`COUNT`) | No action needed |
| Debounce delay | `SearchBar.tsx` | Inline literal `300` | Documented in report only — low impact |
| 3D geometry values | `DioramaObjects.tsx` | ~30 undocumented magic numbers | Documented in report only — visual constants that rarely change |
| Toast duration | `Toast.tsx` | Default parameter `duration = 5000` | Appropriate default, well-documented |

### Default Value Audit

| Config | Default | Assessment |
|--------|---------|------------|
| `unitPreference` | `'celsius'` | Appropriate — globally sensible default |
| `darkModeEnabled` | `false` (falls back to system preference on first visit) | Appropriate — defers to OS preference |
| `recentCities` | `[]` | Appropriate |
| `RainParticles intensity` | `800` | Appropriate — mid-range value |
| `SimpleCloud speed/opacity/scale` | `0.2 / 0.4 / 1` | Appropriate |
| `Toast duration` | `5000ms` | Standard UX pattern |
| `Geolocation timeout` | `8000ms` | Appropriate — generous but not excessive |

No dangerous defaults found. No missing defaults that could cause crashes.

### TODO/FIXME/HACK Inventory

**Zero markers found.** The codebase contains no TODO, FIXME, HACK, XXX, or TEMP comments.

---

## 6. Couldn't Touch

| Item | Reason |
|------|--------|
| Particle system code duplication (Rain/Snow) | ~85% structural similarity but meaningfully different animation behavior. Extraction would create premature abstraction for 2 consumers. |
| Test mock patterns duplication | Each test needs slightly different mock shapes. A shared fixture would add indirection without reducing complexity. |
| `SceneContent.tsx` default export | Required by `React.lazy()` for code splitting. Cannot change to named export without breaking the lazy import pattern. |
| `DioramaObjects._isNight` unused parameter | Intentionally destructured with `_` prefix — likely reserved for future night-mode visual changes (e.g., house window glow). Removing would break the prop interface contract. |
| 3D geometry magic numbers (~30 values) | Tree positions, mesh dimensions, light coordinates. These are visual tuning constants that don't benefit from being named — they'd only move the problem to a constants file. |
| Glassmorphism inline style differences | Dropdown, Toast, and chart tooltip use slightly different `rgba` values. Standardizing requires a design decision about visual hierarchy. |

---

## 7. Recommendations

| # | Recommendation | Impact | Risk if Ignored | Worth Doing? | Details |
|---|---|---|---|---|---|
| 1 | Extract shared test mock data to a `src/test/fixtures.ts` file | Reduces ~60 lines of duplicated mock weather objects across 4 test files | Low | Only if time allows | Would need careful design to allow per-test overrides without adding complexity. Not worth doing unless the mock shapes diverge further. |
| 2 | Consolidate glassmorphism popup styles into a CSS class (`.glass-popup`) | Eliminates 3 similar inline style blocks in SearchBar, Toast, TemperatureChart | Low | Probably | Requires design sign-off on whether dropdown, toast, and tooltip should share identical glass values. Currently they differ slightly (opacity 0.9 vs 0.95, border opacity 0.08 vs 0.1). |
| 3 | Add `textColor` extension to Tailwind config for CSS variables | Would allow `text-[var(--text-secondary)]` without the custom utility class | Low | Only if time allows | The `.text-secondary` utility class already solves this. Tailwind JIT handles arbitrary values, but a configured token is more discoverable. |
| 4 | Consider removing `@types/node` if `vite.config.ts` is refactored | `@types/node` is only needed because `vite.config.ts` uses `path` and `__dirname` | Low | No | Vite provides `resolve.alias` without `path` — could use `fileURLToPath(import.meta.url)` instead. But the current approach works fine and is well-established. |
