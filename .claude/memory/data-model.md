# Data Model — Nimbus Weather App

## Domain Types (src/types/weather.ts)

### Core Enumerations (string unions)

```typescript
type WeatherCondition = 'clear' | 'partly-cloudy' | 'cloudy' | 'foggy'
                      | 'drizzle' | 'rain' | 'snow' | 'storm'
type TemperatureUnit = 'celsius' | 'fahrenheit'
type TimeOfDay = 'day' | 'night'
```

### Weather Data

```typescript
interface CurrentWeather {
  temperature: number      // Celsius from API
  feelsLike: number        // Celsius
  humidity: number         // Percentage (0-100)
  windSpeed: number        // km/h from API
  weatherCode: number      // WMO code (0-99)
  isDay: boolean           // Derived from API is_day (1/0)
}

interface DailyForecast {
  date: string             // ISO date string (YYYY-MM-DD)
  weatherCode: number
  tempHigh: number         // Celsius
  tempLow: number          // Celsius
  precipitationProbability: number  // 0-100, defaults to 0 if missing
}

interface WeatherAlert {
  event: string
  severity: 'advisory' | 'warning' | 'emergency'
  description: string
}

interface WeatherData {
  current: CurrentWeather
  daily: DailyForecast[]   // 6 items (today + 5)
  alerts: WeatherAlert[]   // Always empty (free tier)
  location: { name: string; country: string; latitude: number; longitude: number; timezone: string }
}
```

### User-Facing Types

```typescript
interface City { name: string; lat: number; lon: number; country: string }

interface GeocodingResult {
  name: string; latitude: number; longitude: number
  country: string; admin1?: string  // State/province
}

interface UserPreferences {
  unitPreference: TemperatureUnit
  darkModeEnabled: boolean
  recentCities: City[]     // Max 5, FIFO with lat/lon dedup
}
```

## localStorage Schema

**Key**: `nimbus-preferences`
**Default**: `{ unitPreference: 'celsius', darkModeEnabled: false, recentCities: [] }`

### Recent Cities Rules
- Max 5 cities
- Deduplication: by lat + lon coordinates
- Ordering: most recently selected first (FIFO)
- On add: remove existing match (if any) → prepend → slice to 5

### Immutability Pattern
All `storage.ts` functions return NEW objects — they never mutate input:
```typescript
addRecentCity(prefs, city)  // Returns new UserPreferences
setUnit(prefs, unit)        // Returns new UserPreferences
toggleDarkMode(prefs)       // Returns new UserPreferences
```

## WeatherContext State

Exposes: `weather` (WeatherData | null), `loading`, `error`, `preferences`, `geoError` ('denied'|'timeout'|'unavailable'|null), derived `condition` + `timeOfDay`, actions: `selectCity`, `searchForCities`, `toggleUnit`, `toggleDark`, `retry`.

## Unit Conversion

All temps stored Celsius, converted on display. Wind: km/h stored, mph shown for Fahrenheit. All rounded to integer.
