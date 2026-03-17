import type { GeocodingResult, WeatherData, DailyForecast, CurrentWeather } from '@/types/index.ts'

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_RESULT_LIMIT = 8
const FORECAST_DAYS = 6 // today + 5 days
const MIN_SEARCH_QUERY_LENGTH = 2

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function searchCities(query: string): Promise<GeocodingResult[]> {
  if (query.trim().length < MIN_SEARCH_QUERY_LENGTH) return []

  const url = new URL(GEOCODING_URL)
  url.searchParams.set('name', query.trim())
  url.searchParams.set('count', GEOCODING_RESULT_LIMIT.toString())
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  const res = await fetch(url.toString())
  if (!res.ok) throw new ApiError('Failed to search cities', res.status)

  const data = await res.json()
  return (data.results ?? []) as GeocodingResult[]
}

export async function fetchWeather(
  lat: number,
  lon: number,
  cityName: string,
  country: string,
): Promise<WeatherData> {
  const url = new URL(FORECAST_URL)
  url.searchParams.set('latitude', lat.toString())
  url.searchParams.set('longitude', lon.toString())
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
  )
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
  )
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('forecast_days', FORECAST_DAYS.toString())

  const res = await fetch(url.toString())
  if (!res.ok) throw new ApiError('Failed to fetch weather data', res.status)

  const data = await res.json()

  const current: CurrentWeather = {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,
  }

  const daily: DailyForecast[] = data.daily.time.map(
    (date: string, i: number) => ({
      date,
      weatherCode: data.daily.weather_code[i],
      tempHigh: data.daily.temperature_2m_max[i],
      tempLow: data.daily.temperature_2m_min[i],
      precipitationProbability: data.daily.precipitation_probability_max?.[i] ?? 0,
    }),
  )

  return {
    current,
    daily,
    alerts: [], // Open-Meteo free tier doesn't provide alerts
    location: {
      name: cityName,
      country,
      latitude: lat,
      longitude: lon,
      timezone: data.timezone ?? 'UTC',
    },
  }
}

/** Reverse geocode coordinates to city name using Open-Meteo */
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<{ name: string; country: string } | null> {
  // Open-Meteo doesn't have a reverse geocoding endpoint,
  // so we search with coords rounded to get the nearest city.
  const url = new URL(GEOCODING_URL)
  url.searchParams.set('name', `${lat.toFixed(1)},${lon.toFixed(1)}`)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  try {
    const res = await fetch(url.toString())
    if (!res.ok) return null
    const data = await res.json()
    const result = data.results?.[0]
    if (result) return { name: result.name, country: result.country ?? '' }
  } catch {
    // Silently fail — we'll use fallback naming
  }
  return null
}
