import type { WeatherCondition } from '@/types/index.ts'

/** Maps WMO weather code to a condition category */
export function getWeatherCondition(code: number): WeatherCondition {
  if (code === 0) return 'clear'
  if (code <= 3) return 'partly-cloudy'
  if (code <= 44) return 'cloudy'
  if (code <= 49) return 'foggy'
  if (code <= 59) return 'drizzle'
  if (code <= 69) return 'rain'
  if (code <= 79) return 'snow'
  if (code <= 84) return 'rain' // rain showers
  if (code <= 86) return 'snow' // snow showers
  return 'storm' // 95-99: thunderstorm
}

/** Human-readable label for a WMO weather code */
export function getWeatherLabel(code: number): string {
  const labels: Record<number, string> = {
    0: 'Clear Sky',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing Rime Fog',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    56: 'Freezing Drizzle',
    57: 'Dense Freezing Drizzle',
    61: 'Slight Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    66: 'Freezing Rain',
    67: 'Heavy Freezing Rain',
    71: 'Slight Snow',
    73: 'Moderate Snow',
    75: 'Heavy Snow',
    77: 'Snow Grains',
    80: 'Slight Rain Showers',
    81: 'Moderate Rain Showers',
    82: 'Violent Rain Showers',
    85: 'Slight Snow Showers',
    86: 'Heavy Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Slight Hail',
    99: 'Thunderstorm with Heavy Hail',
  }
  return labels[code] ?? 'Unknown'
}

/** Icon name from lucide-react based on WMO code + day/night */
export function getWeatherIconName(code: number, isDay: boolean): string {
  const condition = getWeatherCondition(code)
  switch (condition) {
    case 'clear':
      return isDay ? 'Sun' : 'Moon'
    case 'partly-cloudy':
      return isDay ? 'CloudSun' : 'CloudMoon'
    case 'cloudy':
      return 'Cloud'
    case 'foggy':
      return 'CloudFog'
    case 'drizzle':
      return 'CloudDrizzle'
    case 'rain':
      return 'CloudRain'
    case 'snow':
      return 'Snowflake'
    case 'storm':
      return 'CloudLightning'
  }
}
