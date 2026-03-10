/** WMO Weather interpretation codes mapped to condition names */
export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'foggy'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'storm'

export type TimeOfDay = 'day' | 'night'

export interface GeocodingResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  admin1?: string // state/region
  country_code: string
}

export interface CurrentWeather {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number // km/h
  weatherCode: number
  isDay: boolean
}

export interface DailyForecast {
  date: string // ISO date string
  weatherCode: number
  tempHigh: number
  tempLow: number
  precipitationProbability: number
}

export interface WeatherAlert {
  id: string
  event: string
  description: string
  severity: 'advisory' | 'warning' | 'emergency'
  start: string
  end: string
}

export interface WeatherData {
  current: CurrentWeather
  daily: DailyForecast[]
  alerts: WeatherAlert[]
  location: {
    name: string
    country: string
    latitude: number
    longitude: number
    timezone: string
  }
}

export interface City {
  name: string
  lat: number
  lon: number
  country: string
  admin1?: string
}

export type TemperatureUnit = 'celsius' | 'fahrenheit'

export interface UserPreferences {
  unitPreference: TemperatureUnit
  darkModeEnabled: boolean
  recentCities: City[]
}

/** Theme palette values driven by weather condition + time of day */
export interface WeatherTheme {
  bgGradient: string
  cardSurface: string
  cardBorder: string
  textPrimary: string
  textSecondary: string
}
