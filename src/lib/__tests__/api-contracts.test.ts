import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchCities, fetchWeather, reverseGeocode, ApiError, clearGeocodingCache } from '../api.ts'
import type { GeocodingResult, WeatherData, CurrentWeather, DailyForecast } from '@/types/index.ts'

/**
 * API Contract Tests
 *
 * These tests verify that api.ts correctly transforms Open-Meteo API responses
 * into the app's internal TypeScript interfaces. They validate:
 * - Response structure matches WeatherData, GeocodingResult types
 * - All required fields are present and correctly typed
 * - URL construction sends correct parameters to Open-Meteo
 * - Error responses produce correct ApiError instances
 * - Edge cases in response parsing are handled
 */

beforeEach(() => {
  vi.restoreAllMocks()
  clearGeocodingCache()
})

// --- Realistic Open-Meteo response fixtures ---

const OPEN_METEO_GEOCODING_RESPONSE = {
  results: [
    {
      id: 2643743,
      name: 'London',
      latitude: 51.50853,
      longitude: -0.12574,
      elevation: 25.0,
      feature_code: 'PPLC',
      country_code: 'GB',
      admin1_id: 6269131,
      admin2_id: 2648110,
      admin3_id: 7535661,
      admin4_id: 0,
      timezone: 'Europe/London',
      population: 7556900,
      postcodes: ['EC1A', 'EC1M', 'EC1N'],
      country_id: 2635167,
      country: 'United Kingdom',
      admin1: 'England',
      admin2: 'Greater London',
      admin3: 'City of London',
    },
    {
      id: 6058560,
      name: 'London',
      latitude: 42.98339,
      longitude: -81.23304,
      elevation: 252.0,
      feature_code: 'PPL',
      country_code: 'CA',
      admin1_id: 6093943,
      timezone: 'America/Toronto',
      population: 346765,
      country_id: 6251999,
      country: 'Canada',
      admin1: 'Ontario',
    },
  ],
  generationtime_ms: 1.234,
}

const OPEN_METEO_FORECAST_RESPONSE = {
  latitude: 51.5,
  longitude: -0.120000124,
  generationtime_ms: 0.123,
  utc_offset_seconds: 0,
  timezone: 'Europe/London',
  timezone_abbreviation: 'GMT',
  elevation: 27.0,
  current_units: {
    time: 'iso8601',
    interval: 'seconds',
    temperature_2m: '°C',
    relative_humidity_2m: '%',
    apparent_temperature: '°C',
    weather_code: 'wmo code',
    wind_speed_10m: 'km/h',
    is_day: '',
  },
  current: {
    time: '2026-03-17T14:00',
    interval: 900,
    temperature_2m: 12.5,
    relative_humidity_2m: 78,
    apparent_temperature: 10.2,
    weather_code: 3,
    wind_speed_10m: 15.3,
    is_day: 1,
  },
  daily_units: {
    time: 'iso8601',
    weather_code: 'wmo code',
    temperature_2m_max: '°C',
    temperature_2m_min: '°C',
    precipitation_probability_max: '%',
  },
  daily: {
    time: ['2026-03-17', '2026-03-18', '2026-03-19', '2026-03-20', '2026-03-21', '2026-03-22'],
    weather_code: [3, 61, 2, 0, 0, 51],
    temperature_2m_max: [13.2, 11.8, 14.5, 16.1, 17.3, 12.0],
    temperature_2m_min: [7.1, 5.3, 8.2, 9.0, 10.4, 6.5],
    precipitation_probability_max: [10, 80, 20, 0, 5, 60],
  },
}

function mockFetchResponse(body: unknown, ok = true, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

// ==========================================
// searchCities — Contract Tests
// ==========================================

describe('searchCities: Response Contract', () => {
  it('returns array conforming to GeocodingResult[] interface', async () => {
    mockFetchResponse(OPEN_METEO_GEOCODING_RESPONSE)

    const results = await searchCities('London')

    // Verify array structure
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBe(2)

    // Verify each result conforms to GeocodingResult interface
    for (const result of results) {
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('latitude')
      expect(result).toHaveProperty('longitude')
      expect(result).toHaveProperty('country')
      expect(result).toHaveProperty('country_code')

      expect(typeof result.id).toBe('number')
      expect(typeof result.name).toBe('string')
      expect(typeof result.latitude).toBe('number')
      expect(typeof result.longitude).toBe('number')
      expect(typeof result.country).toBe('string')
      expect(typeof result.country_code).toBe('string')
    }
  })

  it('preserves optional admin1 field when present', async () => {
    mockFetchResponse(OPEN_METEO_GEOCODING_RESPONSE)

    const results = await searchCities('London')

    expect(results[0]!.admin1).toBe('England')
    expect(results[1]!.admin1).toBe('Ontario')
  })

  it('passes through extra Open-Meteo fields without breaking the contract', async () => {
    mockFetchResponse(OPEN_METEO_GEOCODING_RESPONSE)

    const results = await searchCities('London')

    // The result should still work even though Open-Meteo sends extra fields
    // (elevation, feature_code, population, etc.) not in our GeocodingResult type
    const result = results[0]! as GeocodingResult
    expect(result.id).toBe(2643743)
    expect(result.name).toBe('London')
  })

  it('constructs correct URL with all required query parameters', async () => {
    const spy = mockFetchResponse(OPEN_METEO_GEOCODING_RESPONSE)

    await searchCities('Tokyo')

    const calledUrl = spy.mock.calls[0]![0] as string
    const url = new URL(calledUrl)

    expect(url.origin).toBe('https://geocoding-api.open-meteo.com')
    expect(url.pathname).toBe('/v1/search')
    expect(url.searchParams.get('name')).toBe('Tokyo')
    expect(url.searchParams.get('count')).toBe('8')
    expect(url.searchParams.get('language')).toBe('en')
    expect(url.searchParams.get('format')).toBe('json')
  })

  it('trims whitespace from query before sending', async () => {
    const spy = mockFetchResponse(OPEN_METEO_GEOCODING_RESPONSE)

    await searchCities('  London  ')

    const calledUrl = spy.mock.calls[0]![0] as string
    const url = new URL(calledUrl)
    expect(url.searchParams.get('name')).toBe('London')
  })

  it('returns empty array for missing results key', async () => {
    mockFetchResponse({ generationtime_ms: 0.5 })

    const results = await searchCities('xyznonexistent')
    expect(results).toEqual([])
  })

  it('returns empty array for null results', async () => {
    mockFetchResponse({ results: null })

    const results = await searchCities('test')
    expect(results).toEqual([])
  })

  it('throws ApiError with status for non-ok response', async () => {
    mockFetchResponse(null, false, 503)

    try {
      await searchCities('London')
      expect.unreachable('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).message).toBe('Failed to search cities')
      expect((err as ApiError).status).toBe(503)
    }
  })

  it('enforces minimum 2-character query without calling fetch', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')

    expect(await searchCities('')).toEqual([])
    expect(await searchCities('a')).toEqual([])
    expect(await searchCities(' ')).toEqual([])
    expect(await searchCities('  ')).toEqual([])

    expect(spy).not.toHaveBeenCalled()
  })
})

// ==========================================
// fetchWeather — Contract Tests
// ==========================================

describe('fetchWeather: Response Contract', () => {
  it('returns WeatherData conforming to the interface', async () => {
    mockFetchResponse(OPEN_METEO_FORECAST_RESPONSE)

    const data = await fetchWeather(51.51, -0.13, 'London', 'United Kingdom')

    // Top-level structure
    expect(data).toHaveProperty('current')
    expect(data).toHaveProperty('daily')
    expect(data).toHaveProperty('alerts')
    expect(data).toHaveProperty('location')
  })

  it('correctly maps current weather fields from Open-Meteo naming', async () => {
    mockFetchResponse(OPEN_METEO_FORECAST_RESPONSE)

    const data = await fetchWeather(51.51, -0.13, 'London', 'UK')
    const current: CurrentWeather = data.current

    // Open-Meteo field → app field mapping
    expect(current.temperature).toBe(12.5)       // temperature_2m
    expect(current.feelsLike).toBe(10.2)          // apparent_temperature
    expect(current.humidity).toBe(78)              // relative_humidity_2m
    expect(current.windSpeed).toBe(15.3)           // wind_speed_10m
    expect(current.weatherCode).toBe(3)            // weather_code
    expect(current.isDay).toBe(true)               // is_day (1 → true)

    // Type checks
    expect(typeof current.temperature).toBe('number')
    expect(typeof current.feelsLike).toBe('number')
    expect(typeof current.humidity).toBe('number')
    expect(typeof current.windSpeed).toBe('number')
    expect(typeof current.weatherCode).toBe('number')
    expect(typeof current.isDay).toBe('boolean')
  })

  it('converts is_day integer to boolean correctly', async () => {
    // is_day = 1 → true
    mockFetchResponse(OPEN_METEO_FORECAST_RESPONSE)
    const dayData = await fetchWeather(0, 0, 'X', 'Y')
    expect(dayData.current.isDay).toBe(true)

    // is_day = 0 → false
    const nightResponse = {
      ...OPEN_METEO_FORECAST_RESPONSE,
      current: { ...OPEN_METEO_FORECAST_RESPONSE.current, is_day: 0 },
    }
    mockFetchResponse(nightResponse)
    const nightData = await fetchWeather(0, 0, 'X', 'Y')
    expect(nightData.current.isDay).toBe(false)
  })

  it('correctly maps daily forecast array from Open-Meteo column format', async () => {
    mockFetchResponse(OPEN_METEO_FORECAST_RESPONSE)

    const data = await fetchWeather(51.51, -0.13, 'London', 'UK')
    const daily: DailyForecast[] = data.daily

    expect(daily).toHaveLength(6)

    // First day verification (index 0)
    expect(daily[0]!.date).toBe('2026-03-17')
    expect(daily[0]!.weatherCode).toBe(3)
    expect(daily[0]!.tempHigh).toBe(13.2)
    expect(daily[0]!.tempLow).toBe(7.1)
    expect(daily[0]!.precipitationProbability).toBe(10)

    // Last day verification (index 5)
    expect(daily[5]!.date).toBe('2026-03-22')
    expect(daily[5]!.weatherCode).toBe(51)
    expect(daily[5]!.tempHigh).toBe(12.0)
    expect(daily[5]!.tempLow).toBe(6.5)
    expect(daily[5]!.precipitationProbability).toBe(60)

    // Type checks for each daily entry
    for (const day of daily) {
      expect(typeof day.date).toBe('string')
      expect(typeof day.weatherCode).toBe('number')
      expect(typeof day.tempHigh).toBe('number')
      expect(typeof day.tempLow).toBe('number')
      expect(typeof day.precipitationProbability).toBe('number')
    }
  })

  it('defaults precipitationProbability to 0 when Open-Meteo omits it', async () => {
    const response = {
      ...OPEN_METEO_FORECAST_RESPONSE,
      daily: {
        ...OPEN_METEO_FORECAST_RESPONSE.daily,
        precipitation_probability_max: undefined,
      },
    }
    mockFetchResponse(response)

    const data = await fetchWeather(0, 0, 'X', 'Y')

    for (const day of data.daily) {
      expect(day.precipitationProbability).toBe(0)
    }
  })

  it('correctly constructs location from function arguments (not response)', async () => {
    mockFetchResponse(OPEN_METEO_FORECAST_RESPONSE)

    const data = await fetchWeather(51.51, -0.13, 'London', 'United Kingdom')

    // Location comes from function args, not the API response body
    expect(data.location.name).toBe('London')
    expect(data.location.country).toBe('United Kingdom')
    expect(data.location.latitude).toBe(51.51)
    expect(data.location.longitude).toBe(-0.13)

    // Timezone comes from the API response
    expect(data.location.timezone).toBe('Europe/London')
  })

  it('defaults timezone to UTC when Open-Meteo omits it', async () => {
    const response = { ...OPEN_METEO_FORECAST_RESPONSE, timezone: undefined }
    mockFetchResponse(response)

    const data = await fetchWeather(0, 0, 'X', 'Y')
    expect(data.location.timezone).toBe('UTC')
  })

  it('always returns empty alerts array (Open-Meteo free tier limitation)', async () => {
    mockFetchResponse(OPEN_METEO_FORECAST_RESPONSE)

    const data = await fetchWeather(0, 0, 'X', 'Y')
    expect(data.alerts).toEqual([])
    expect(Array.isArray(data.alerts)).toBe(true)
  })

  it('constructs correct forecast URL with all required parameters', async () => {
    const spy = mockFetchResponse(OPEN_METEO_FORECAST_RESPONSE)

    await fetchWeather(51.51, -0.13, 'London', 'UK')

    const calledUrl = spy.mock.calls[0]![0] as string
    const url = new URL(calledUrl)

    expect(url.origin).toBe('https://api.open-meteo.com')
    expect(url.pathname).toBe('/v1/forecast')
    expect(url.searchParams.get('latitude')).toBe('51.51')
    expect(url.searchParams.get('longitude')).toBe('-0.13')
    expect(url.searchParams.get('timezone')).toBe('auto')
    expect(url.searchParams.get('forecast_days')).toBe('6')

    // Verify current weather parameters
    const currentParams = url.searchParams.get('current')!
    expect(currentParams).toContain('temperature_2m')
    expect(currentParams).toContain('relative_humidity_2m')
    expect(currentParams).toContain('apparent_temperature')
    expect(currentParams).toContain('weather_code')
    expect(currentParams).toContain('wind_speed_10m')
    expect(currentParams).toContain('is_day')

    // Verify daily parameters
    const dailyParams = url.searchParams.get('daily')!
    expect(dailyParams).toContain('weather_code')
    expect(dailyParams).toContain('temperature_2m_max')
    expect(dailyParams).toContain('temperature_2m_min')
    expect(dailyParams).toContain('precipitation_probability_max')
  })

  it('throws ApiError with status for non-ok response', async () => {
    mockFetchResponse(null, false, 429)

    try {
      await fetchWeather(0, 0, 'X', 'Y')
      expect.unreachable('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).message).toBe('Failed to fetch weather data')
      expect((err as ApiError).status).toBe(429)
    }
  })
})

// ==========================================
// reverseGeocode — Contract Tests
// ==========================================

describe('reverseGeocode: Response Contract', () => {
  it('returns {name, country} for valid response', async () => {
    mockFetchResponse({
      results: [{ name: 'Tokyo', country: 'Japan', latitude: 35.68, longitude: 139.69 }],
    })

    const result = await reverseGeocode(35.68, 139.69)

    expect(result).not.toBeNull()
    expect(result).toHaveProperty('name')
    expect(result).toHaveProperty('country')
    expect(typeof result!.name).toBe('string')
    expect(typeof result!.country).toBe('string')
  })

  it('constructs URL with rounded coordinates and count=1', async () => {
    const spy = mockFetchResponse({ results: [] })

    await reverseGeocode(35.6895, 139.6917)

    const calledUrl = spy.mock.calls[0]![0] as string
    const url = new URL(calledUrl)

    expect(url.origin).toBe('https://geocoding-api.open-meteo.com')
    expect(url.pathname).toBe('/v1/search')
    expect(url.searchParams.get('count')).toBe('1')
    expect(url.searchParams.get('name')).toContain('35.7')
    expect(url.searchParams.get('name')).toContain('139.7')
  })

  it('returns null for non-ok response (does not throw)', async () => {
    mockFetchResponse(null, false, 500)

    const result = await reverseGeocode(0, 0)
    expect(result).toBeNull()
  })

  it('returns null for network error (does not throw)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network failure'))

    const result = await reverseGeocode(0, 0)
    expect(result).toBeNull()
  })

  it('defaults country to empty string when Open-Meteo omits it', async () => {
    mockFetchResponse({ results: [{ name: 'Unknown Place' }] })

    const result = await reverseGeocode(0, 0)
    expect(result!.country).toBe('')
  })
})

// ==========================================
// ApiError — Contract Tests
// ==========================================

describe('ApiError: Shape Contract', () => {
  it('extends Error with optional status property', () => {
    const err = new ApiError('test message', 404)

    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.message).toBe('test message')
    expect(err.name).toBe('ApiError')
    expect(err.status).toBe(404)
  })

  it('allows status to be undefined', () => {
    const err = new ApiError('test message')

    expect(err.status).toBeUndefined()
    expect(err.message).toBe('test message')
  })
})
