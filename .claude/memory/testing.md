# Testing — Nimbus Weather App

## Overview

- **Framework**: Vitest 3.2.x + @testing-library/react 16.3.x + jsdom
- **Test count**: 87 tests, 9 files, ~1.2s runtime
- **Setup**: `src/test/setup.ts` imports `@testing-library/jest-dom`
- **Config**: `vite.config.ts` → `test.globals: true`, `test.environment: 'jsdom'`

## Test Distribution

| File | Module | Tests | Focus |
|------|--------|-------|-------|
| `lib/__tests__/weather-codes.test.ts` | WMO codes | 21 | All code ranges, labels, day/night icons |
| `lib/__tests__/units.test.ts` | Conversions | 15 | C/F, wind, rounding, negatives, day names |
| `lib/__tests__/storage.test.ts` | localStorage | 14 | Load/save, dedup, cap 5, corruption, errors |
| `lib/__tests__/theme.test.ts` | Theming | 11 | All conditions x time, dark override, fallback |
| `lib/__tests__/api.test.ts` | API calls | 7 | Search, fetch, errors, missing precipitation |
| `components/__tests__/WeatherIcon.test.tsx` | Icons | 7 | SVG render, size, aria-hidden |
| `lib/__tests__/geolocation.test.ts` | Geolocation | 5 | Success, denied, timeout, unavailable, const |
| `components/__tests__/Toast.test.tsx` | Toast | 4 | Message, role, click dismiss, auto-dismiss |
| `hooks/__tests__/useDebounce.test.ts` | Debounce | 3 | Initial value, delayed update, timer reset |

## Patterns

- **Pure functions** (lib/): Direct assertion, no rendering needed
- **Components**: `render()` + `screen.getBy*()` + assertions
- **Hooks**: `renderHook()` + `act()` for state updates
- **API mocking**: `vi.spyOn(globalThis, 'fetch')` with mock Response objects
- **localStorage mocking**: `vi.spyOn(Storage.prototype, 'getItem'/'setItem')`
- **Fake timers**: `vi.useFakeTimers()` → `vi.advanceTimersByTime()` → `vi.useRealTimers()`

## Known Pitfalls

1. **`userEvent` + `vi.useFakeTimers()`** — causes 5s timeout. Use `fireEvent` instead.
2. **Geolocation mock** — must mock `navigator.geolocation.getCurrentPosition` callback style.
3. **localStorage tests** — always call `localStorage.clear()` in beforeEach or use fresh spies.

## Gaps (Not Yet Tested)

- WeatherContext integration (complex: geolocation + API + state)
- SearchBar keyboard navigation
- 3D scene rendering (requires WebGL mock)
- App.tsx full render
- Accessibility (no axe-core/jest-axe integration)
- Error boundaries (none implemented)

## Running Tests

```bash
npm run test              # Single run
npm run test:watch        # Watch mode
npm run test:coverage     # With v8 coverage
npx vitest run <file>     # Single file
```
