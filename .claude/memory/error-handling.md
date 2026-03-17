# Error Handling — Nimbus Weather App

## Error Flow Overview

```
API failure → ApiError thrown → WeatherContext catches → error state → ErrorState component
Geo failure → { ok: false, error } → geoError state → Toast + Antarctica fallback
Storage failure → try/catch → silent fail → defaults returned
Search failure → caught in SearchBar → results stay empty
```

## Layer-by-Layer Patterns

### API Layer (src/lib/api.ts)

```typescript
class ApiError extends Error {
  status?: number
  // Explicit field + constructor assignment (erasableSyntaxOnly constraint)
}
```

| Function | Error Behavior |
|----------|---------------|
| `searchCities()` | Throws `ApiError` on non-2xx. Returns `[]` for query < 2 chars. |
| `fetchWeather()` | Throws `ApiError` on non-2xx. |
| `reverseGeocode()` | Returns `null` on any failure (try/catch, silent). Non-critical. |

### Geolocation (src/lib/geolocation.ts)

Returns discriminated union — never throws:
```typescript
{ ok: true, position: { latitude, longitude } }
{ ok: false, error: 'denied' | 'timeout' | 'unavailable' }
```

- 8-second timeout via `GEOLOCATION_TIMEOUT` constant
- `PositionError.PERMISSION_DENIED` → `'denied'`
- `PositionError.TIMEOUT` → `'timeout'`
- All other → `'unavailable'`

### Storage (src/lib/storage.ts)

| Function | Error Behavior |
|----------|---------------|
| `loadPreferences()` | Try/catch JSON.parse. Returns defaults on any error. |
| `savePreferences()` | Try/catch setItem. Silent fail (quota exceeded, etc.). |

### WeatherContext (src/context/WeatherContext.tsx)

Central error handler for the app:
- `loadWeatherForCoords()`: try/catch wraps `fetchWeather()`. On error: `setError(message)`, `setLoading(false)`.
- `initializeLocation()`: Handles geo result. On `{ ok: false }`: `setGeoError(type)`, falls back to Antarctica.
- Error message extraction: `e instanceof Error ? e.message : 'Unable to fetch...'`

### SearchBar (src/components/SearchBar.tsx)

- Search errors: caught silently in useEffect (no console.log)
- Stale results prevented: `cancelled` flag set on cleanup
- Empty state: "No cities found" shown in dropdown

## UI Error States

| State | Component | User Action |
|-------|-----------|------------|
| API failure | `ErrorState` | "Try Again" button → `retry()` → `initializeLocation()` |
| Geo denied | `Toast` | "Location access was denied" — auto-dismiss, user can search |
| Geo timeout | `Toast` | "Location detection timed out" — auto-dismiss, Antarctic fallback |
| Geo unavailable | `Toast` | "Location unavailable" — auto-dismiss |
| No search results | SearchBar dropdown | "No cities found" text |

## Error Boundaries

- **SceneErrorBoundary** (`src/components/SceneErrorBoundary.tsx`) wraps `WeatherScene` in `App.tsx`
- Class component (React error boundaries require class)
- On WebGL crash: `getDerivedStateFromError()` → renders `null` (silent fallback — gradient background remains)
- Uses erasableSyntaxOnly-compliant pattern: `state: State = { hasError: false }` as field declaration

## What's Missing

- **No retry with backoff** — single retry only via manual "Try Again"
- **No offline detection** — no `navigator.onLine` check or service worker
- **No error logging** — errors are shown to user but not tracked/reported
