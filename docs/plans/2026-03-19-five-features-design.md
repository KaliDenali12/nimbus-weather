# Nimbus Weather App — Five Feature Implementation Plan

## Context

The Nimbus weather app is a portfolio-grade client-side weather app (React 19 + TypeScript 5.9 + Three.js + Open-Meteo). All core exercise requirements are implemented and working. This plan covers 5 enhancements identified during end-to-end Playwright testing.

**Current state**: 270 tests passing, zero console errors, all core workflows functional. Two visual polish fixes were already applied during testing:
- CSS mask gradient on the 3D scene to prevent bleed-through on lower cards
- Dark mode opacity reduction on the 3D scene for visual coherence

**Exercise reference**: These features address remaining stretch goals and UX gaps from the original exercise spec (by Johnny Lasater, 01/28/26).

---

## Feature 1: Remember Last Viewed City on Reload

### Problem
On every page reload, the app triggers browser geolocation (8s timeout) then falls back to Antarctica. Even though recent cities are stored in localStorage, they're only used as clickable chips — not for initial load.

### Design
- **Priority order on mount**: URL params (Feature 5) > `recentCities[0]` from localStorage > geolocation > Antarctica
- On `selectCity()`, the city is already saved to `recentCities[0]` via `addRecentCity()` — no new storage needed
- In `WeatherContext.initializeLocation()`, check `preferences.recentCities[0]` first. If it exists, load weather for those coords immediately (no geolocation call, no 8s timeout)
- If `recentCities` is empty (first-ever visit), fall through to geolocation as today

### Files to Change
- `src/context/WeatherContext.tsx` — modify `initializeLocation()` to check recent cities first

### Tests
- Unit test: context loads most recent city from preferences on mount
- Unit test: first-ever visit (empty recentCities) still uses geolocation

---

## Feature 2: Loading Shimmer on City Switch

### Problem
When clicking a recent city chip or selecting a search result, there's no visual feedback that loading is happening. The `refreshing` state exists but isn't surfaced on the chips.

### Design
- Add `loadingCityKey: string | null` state to `WeatherContext` (format: `"lat,lon"`)
- Set it at the start of `selectCity()` / `loadWeatherForCoords()`, clear it when data arrives
- Expose `loadingCityKey` from the context
- In `RecentCities.tsx`, compare each chip's `"lat,lon"` to `loadingCityKey` — if it matches, add `animate-pulse opacity-70` classes
- In `SearchBar.tsx`, after selecting a result, the dropdown closes and the chip starts pulsing — no other change needed

### Files to Change
- `src/context/WeatherContext.tsx` — add `loadingCityKey` state, set/clear it
- `src/types/weather.ts` — add `loadingCityKey` to context type
- `src/components/RecentCities.tsx` — consume `loadingCityKey`, apply pulse class

### Tests
- Unit test: `loadingCityKey` is set during city load, cleared after
- Component test: chip renders with pulse class when its key matches

---

## Feature 3: Performance Toggle (Disable 3D Scene)

### Problem
The Three.js 3D scene renders on every device including low-end phones. Users should be able to disable it for better performance/battery life. (Listed as a stretch goal in the PRD.)

### Design
- Add `sceneDisabled: boolean` to `UserPreferences` (default: `false`)
- Add a toggle button in `Header.tsx` using the `Monitor` icon from Lucide (or `Cpu`). Aria label: "Enable/Disable 3D scene"
- In `WeatherScene.tsx`, return `null` when `sceneDisabled` is true
- Persisted in localStorage alongside other preferences
- When disabled, the body gradient background still shows (the app looks fine without the 3D scene since the gradient is weather-driven)

### Files to Change
- `src/types/weather.ts` — add `sceneDisabled` to `UserPreferences`
- `src/lib/storage.ts` — handle `sceneDisabled` in load/save (default `false`)
- `src/context/WeatherContext.tsx` — add `toggleScene` action
- `src/components/Header.tsx` — add toggle button
- `src/scenes/WeatherScene.tsx` — early return when disabled

### Tests
- Unit test: `toggleScene` flips the preference
- Unit test: storage correctly saves/loads `sceneDisabled`
- Component test: WeatherScene returns null when disabled

---

## Feature 4: Hourly Forecast Breakdown

### Problem
The app only shows daily forecast data. Hourly data for the current day would add significant value (temperature progression throughout the day, when rain starts/stops, etc.).

### Design

**API**: Open-Meteo free tier supports hourly data. Add to the forecast request:
```
&hourly=temperature_2m,weather_code,precipitation_probability
```

**Data model**: Add to `types/weather.ts`:
```typescript
interface HourlyForecast {
  time: string        // ISO datetime
  temperature: number // in Celsius (raw from API)
  weatherCode: number
  precipitationProbability: number
}
```
Add `hourly: HourlyForecast[]` to `WeatherData`.

**API parsing**: In `api.ts`, parse the hourly arrays from the response. Filter to next 24 hours from current time (Open-Meteo returns 7 days of hourly data — we only need 24h).

**Component**: New `HourlyForecast.tsx`:
- Horizontal scrollable row (overflow-x-auto with snap)
- Each hour shows: time (e.g., "3 PM"), weather icon, temperature
- Glass card styling consistent with existing cards
- Placed between `CurrentWeather` and the forecast/chart grid in `App.tsx`
- Accessible: `role="region"`, `aria-label="Hourly forecast for next 24 hours"`

**Responsive**: On mobile, the row scrolls horizontally. On desktop, it still scrolls but more hours are visible.

### Files to Change
- `src/types/weather.ts` — add `HourlyForecast` interface, add to `WeatherData`
- `src/lib/api.ts` — add hourly params to request, parse response, filter to 24h
- `src/components/HourlyForecast.tsx` — new component
- `src/App.tsx` — add `HourlyForecast` between CurrentWeather and the grid
- `src/App.tsx` (WeatherSkeletons) — add skeleton for hourly row

### Tests
- Unit test: API correctly parses hourly data
- Unit test: filtering to next 24 hours works across midnight
- Component test: renders correct number of hourly slots
- Component test: respects unit preference for temperature display

---

## Feature 5: URL-based City Routing

### Problem
Users can't share a link to a specific city's weather. Refreshing the page loses the current city (now addressed by Feature 1, but URL sharing adds another dimension).

### Design

**URL format**: `?lat=51.51&lon=-0.13&city=London&country=United+Kingdom`

**On city select** (`selectCity` in WeatherContext):
- Call `history.replaceState()` to update URL with the selected city's params
- Use `replaceState` (not `pushState`) to avoid polluting browser history with every city switch

**On mount** (in `initializeLocation`):
- Parse `window.location.search` for `lat`, `lon`, `city`, `country`
- If valid lat/lon found, use those coords (with city/country for display name)
- Priority: URL params > recentCities[0] > geolocation > Antarctica

**Validation**: lat must be -90..90, lon must be -180..180. Invalid params are ignored (fall through to next priority).

**Clear URL**: When geolocation or Antarctica fallback is used, don't add params to URL.

### Files to Change
- `src/context/WeatherContext.tsx` — parse URL on mount, update URL on city select
- New utility: `src/lib/url.ts` — `parseCityFromUrl()` and `updateUrlWithCity()` functions

### Tests
- Unit test: `parseCityFromUrl` correctly extracts valid city params
- Unit test: `parseCityFromUrl` returns null for invalid/missing params
- Unit test: `updateUrlWithCity` calls `history.replaceState` with correct params

---

## Implementation Order

These features have some dependencies, so the order matters:

1. **Feature 1** (Remember City) — changes `initializeLocation()`, must be done before Feature 5
2. **Feature 5** (URL Routing) — extends `initializeLocation()` with URL priority
3. **Feature 3** (Performance Toggle) — independent, touches Header/WeatherScene
4. **Feature 2** (Loading Shimmer) — independent, touches context + RecentCities
5. **Feature 4** (Hourly Forecast) — largest feature, touches API/types/new component

Features 2, 3, and 4 are independent of each other and could be parallelized after 1 and 5 are done.

---

## Acceptance Criteria

- All 270 existing tests still pass
- New tests added for each feature
- `npm run build` succeeds with no TypeScript errors
- `npm run lint` passes
- Manual Playwright verification of each feature
- Dark mode works correctly with all new UI elements
- Mobile responsive for hourly forecast scroll
- No console errors or warnings
