# Weather Codes — Nimbus Weather App

## WMO Code → Condition Mapping (src/lib/weather-codes.ts)

| WMO Codes | Condition | Label Examples |
|-----------|-----------|---------------|
| 0 | `clear` | "Clear sky" |
| 1 | `partly-cloudy` | "Mainly clear" |
| 2 | `partly-cloudy` | "Partly cloudy" |
| 3 | `cloudy` | "Overcast" |
| 45, 48 | `foggy` | "Fog", "Depositing rime fog" |
| 51, 53, 55 | `drizzle` | "Light/Moderate/Dense drizzle" |
| 56, 57 | `drizzle` | "Freezing drizzle" |
| 61, 63, 65 | `rain` | "Slight/Moderate/Heavy rain" |
| 66, 67 | `rain` | "Freezing rain" |
| 71, 73, 75 | `snow` | "Slight/Moderate/Heavy snow" |
| 77 | `snow` | "Snow grains" |
| 80, 81, 82 | `rain` | "Rain showers" |
| 85, 86 | `snow` | "Snow showers" |
| 95 | `storm` | "Thunderstorm" |
| 96, 99 | `storm` | "Thunderstorm with hail" |
| All others | `cloudy` | Fallback |

## Functions

### `getWeatherCondition(code: number): WeatherCondition`
Maps WMO code to one of 8 conditions. Uses if/else chain, not a lookup table.

### `getWeatherLabel(code: number): string`
Returns human-readable label. Uses a `Record<number, string>` lookup with `'Unknown'` fallback.

### `getWeatherIconName(code: number, isDay: boolean): string`
Returns Lucide icon name string. Handles day/night variants for clear (Sun/Moon) and partly-cloudy (CloudSun/CloudMoon).

## Icon Mapping (src/components/WeatherIcon.tsx)

`iconMap: Record<string, LucideIcon>` maps icon name strings to Lucide components:

| Icon Name | Lucide Component | Used For |
|-----------|-----------------|----------|
| `Sun` | Sun | Clear day |
| `Moon` | Moon | Clear night |
| `CloudSun` | CloudSun | Partly cloudy day |
| `CloudMoon` | CloudMoon | Partly cloudy night |
| `Cloud` | Cloud | Cloudy, foggy |
| `CloudDrizzle` | CloudDrizzle | Drizzle |
| `CloudRain` | CloudRain | Rain |
| `Snowflake` | Snowflake | Snow |
| `CloudLightning` | CloudLightning | Storm |

## Where Codes Are Used

1. **API response** → `current.weatherCode` and `daily[].weatherCode`
2. **WeatherContext** → `getWeatherCondition(code)` → `condition` state
3. **Theme selection** → `getTheme(condition, timeOfDay, isDark)`
4. **3D scene** → `SceneContent` reads `condition` for particles/lighting
5. **UI display** → `getWeatherLabel(code)` in CurrentWeather
6. **Icons** → `getWeatherIconName(code, isDay)` → WeatherIcon component
