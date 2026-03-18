import type { GeocodingResult, WeatherData, DailyForecast, CurrentWeather } from '@/types/index.ts'

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_RESULT_LIMIT = 8
const FORECAST_DAYS = 6 // today + 5 days
const MIN_SEARCH_QUERY_LENGTH = 2
const MAX_SEARCH_QUERY_LENGTH = 200
const GEOCODING_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const GEOCODING_CACHE_MAX_ENTRIES = 50

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const geocodingCache = new Map<string, CacheEntry<GeocodingResult[]>>()

/** Clear the geocoding cache. Exposed for testing. */
export function clearGeocodingCache(): void {
  geocodingCache.clear()
}

function isValidCoordinate(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  )
}

/** Raw shape of the Open-Meteo geocoding API response */
interface GeocodingApiResponse {
  results?: GeocodingResult[]
}

/** Raw shape of the Open-Meteo forecast API "current" block */
interface ForecastCurrentBlock {
  temperature_2m: number
  apparent_temperature: number
  relative_humidity_2m: number
  wind_speed_10m: number
  weather_code: number
  is_day: number
}

/** Raw shape of the Open-Meteo forecast API "daily" block */
interface ForecastDailyBlock {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_probability_max?: number[]
}

/** Raw shape of the Open-Meteo forecast API response */
interface ForecastApiResponse {
  current: ForecastCurrentBlock
  daily: ForecastDailyBlock
  timezone?: string
}

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function searchCities(query: string): Promise<GeocodingResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < MIN_SEARCH_QUERY_LENGTH) return []
  if (trimmed.length > MAX_SEARCH_QUERY_LENGTH) return []

  const cacheKey = trimmed.toLowerCase()
  const now = Date.now()
  const cached = geocodingCache.get(cacheKey)
  if (cached && now - cached.timestamp < GEOCODING_CACHE_TTL) {
    return cached.data
  }

  const url = new URL(GEOCODING_URL)
  url.searchParams.set('name', trimmed)
  url.searchParams.set('count', GEOCODING_RESULT_LIMIT.toString())
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  const res = await fetch(url.toString())
  if (!res.ok) throw new ApiError('Failed to search cities', res.status)

  const data: GeocodingApiResponse = await res.json()
  const results = data.results ?? []

  // Evict oldest entries if cache is full
  if (geocodingCache.size >= GEOCODING_CACHE_MAX_ENTRIES) {
    const oldestKey = geocodingCache.keys().next().value
    if (oldestKey !== undefined) geocodingCache.delete(oldestKey)
  }
  geocodingCache.set(cacheKey, { data: results, timestamp: now })

  return results
}

export async function fetchWeather(
  lat: number,
  lon: number,
  cityName: string,
  country: string,
): Promise<WeatherData> {
  if (!isValidCoordinate(lat, lon)) {
    throw new ApiError('Invalid coordinates: latitude must be -90..90, longitude must be -180..180')
  }

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

  const data: ForecastApiResponse = await res.json()

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
  if (!isValidCoordinate(lat, lon)) return null

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
    const data: GeocodingApiResponse = await res.json()
    const result = data.results?.[0]
    if (result) return { name: result.name, country: result.country ?? '' }
  } catch {
    // Non-critical: reverse geocode is a best-effort enhancement for location names
  }
  return null
}
