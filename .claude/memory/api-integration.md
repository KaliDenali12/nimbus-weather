# API Integration — Nimbus Weather App

## Endpoints

### Geocoding (City Search)
- **URL**: `https://geocoding-api.open-meteo.com/v1/search`
- **Params**: `name`, `count` (8), `language` (en), `format` (json)
- **Returns**: `{ results: GeocodingResult[] }` — each has name, lat, lon, country, admin1
- **Min query**: 2 chars (returns `[]` for shorter)
- **Used in**: `searchCities()` in `lib/api.ts`

### Forecast (Weather Data)
- **URL**: `https://api.open-meteo.com/v1/forecast`
- **Params**: latitude, longitude, current fields, daily fields, timezone=auto, forecast_days=6
- **Current fields**: temperature_2m, relative_humidity_2m, apparent_temperature, weather_code, wind_speed_10m, is_day
- **Daily fields**: weather_code, temperature_2m_max, temperature_2m_min, precipitation_probability_max
- **Used in**: `fetchWeather()` in `lib/api.ts`

## Response Transformation

API response is transformed to domain types in `fetchWeather()`:

```
data.current → CurrentWeather { temperature, feelsLike, humidity, windSpeed, weatherCode, isDay }
data.daily   → DailyForecast[] { date, weatherCode, tempHigh, tempLow, precipitationProbability }
```

**Note**: `is_day` comes as `1` or `0` from API, converted to boolean.
**Note**: `precipitation_probability_max` may be missing — defaults to 0 via `?.[i] ?? 0`.

## Error Handling

```typescript
class ApiError extends Error {
  status?: number
  // Field declared explicitly (not param property) due to erasableSyntaxOnly
}
```

- Non-2xx response → throw `ApiError` with status
- Caught in `WeatherContext.loadWeatherForCoords()` → sets `error` state
- `reverseGeocode()` silently returns `null` on any failure (non-critical)

## Free Tier Limitations

- **No alerts**: `alerts` array is always empty (UI component exists but unused)
- **No hourly data**: Only daily forecast available
- **No historical data**: Current + forecast only
- **No rate limiting documented**: But be respectful (debounce search at 300ms)
- **6-day forecast max**: today + 5 days

## Reverse Geocoding Workaround

Open-Meteo has no reverse geocoding endpoint. `reverseGeocode()` in api.ts searches with `lat.toFixed(1),lon.toFixed(1)` as the query string. This is a rough heuristic and may not always find the correct city name.

## Search Flow

1. User types in SearchBar → `useDebounce(query, 300)` → debounced value
2. When debounced value changes & length >= 2 → `searchForCities(query)`
3. Results displayed in dropdown with country/admin1 disambiguation
4. Selection → `selectCity(city)` → `fetchWeather(lat, lon, name, country)`
5. City added to `recentCities` in preferences

## Geolocation Flow

1. App mount → `initializeLocation()` in WeatherContext
2. `getUserLocation()` — 8s timeout, returns discriminated union
3. On success → `searchCities()` with rounded coords to get city name → `fetchWeather()`
4. On failure → `setGeoError()` + fallback to `ANTARCTICA` constant (-82.86, 135.0)
