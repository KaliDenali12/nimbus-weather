import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchCities, fetchWeather, ApiError, clearGeocodingCache, clearForecastCache } from '../api.ts'

const mockGeoResponse = {
  results: [
    { id: 1, name: 'London', latitude: 51.51, longitude: -0.13, country: 'United Kingdom', country_code: 'GB', admin1: 'England' },
    { id: 2, name: 'London', latitude: 42.98, longitude: -81.23, country: 'Canada', country_code: 'CA', admin1: 'Ontario' },
  ],
}

const mockForecastResponse = {
  timezone: 'Europe/London',
  current: {
    temperature_2m: 12.5,
    relative_humidity_2m: 78,
    apparent_temperature: 10.2,
    weather_code: 3,
    wind_speed_10m: 15.3,
    is_day: 1,
  },
  daily: {
    time: ['2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14', '2026-03-15'],
    weather_code: [3, 61, 2, 0, 0, 51],
    temperature_2m_max: [13, 11, 14, 16, 17, 12],
    temperature_2m_min: [7, 5, 8, 9, 10, 6],
    precipitation_probability_max: [10, 80, 20, 0, 5, 60],
  },
}

beforeEach(() => {
  vi.restoreAllMocks()
  clearGeocodingCache()
  clearForecastCache()
})

describe('searchCities', () => {
  it('returns empty array for short queries', async () => {
    expect(await searchCities('')).toEqual([])
    expect(await searchCities('a')).toEqual([])
    expect(await searchCities('  ')).toEqual([])
  })

  it('fetches results for exactly 2-character query (boundary)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGeoResponse),
    } as Response)

    const results = await searchCities('LA')
    expect(results).toHaveLength(2)
  })

  it('fetches and returns results', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGeoResponse),
    } as Response)

    const results = await searchCities('London')
    expect(results).toHaveLength(2)
    expect(results[0]!.name).toBe('London')
    expect(results[0]!.country).toBe('United Kingdom')
  })

  it('returns empty array when no results', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response)

    const results = await searchCities('xyznonexistent')
    expect(results).toEqual([])
  })

  it('throws ApiError on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    await expect(searchCities('London')).rejects.toThrow(ApiError)
  })

  it('returns empty array for excessively long queries', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    const longQuery = 'a'.repeat(201)
    expect(await searchCities(longQuery)).toEqual([])
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('fetchWeather', () => {
  it('fetches and transforms weather data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockForecastResponse),
    } as Response)

    const data = await fetchWeather(51.51, -0.13, 'London', 'United Kingdom')

    expect(data.current.temperature).toBe(12.5)
    expect(data.current.humidity).toBe(78)
    expect(data.current.feelsLike).toBe(10.2)
    expect(data.current.windSpeed).toBe(15.3)
    expect(data.current.weatherCode).toBe(3)
    expect(data.current.isDay).toBe(true)

    expect(data.daily).toHaveLength(6)
    expect(data.daily[0]!.date).toBe('2026-03-10')
    expect(data.daily[0]!.tempHigh).toBe(13)
    expect(data.daily[0]!.precipitationProbability).toBe(10)

    expect(data.location.name).toBe('London')
    expect(data.location.country).toBe('United Kingdom')
    expect(data.location.timezone).toBe('Europe/London')
    expect(data.alerts).toEqual([])
  })

  it('throws ApiError on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as Response)

    await expect(fetchWeather(0, 0, '', '')).rejects.toThrow(ApiError)
  })

  it('handles missing precipitation probability', async () => {
    const response = {
      ...mockForecastResponse,
      daily: { ...mockForecastResponse.daily, precipitation_probability_max: undefined },
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
    } as Response)

    const data = await fetchWeather(0, 0, 'X', 'Y')
    expect(data.daily[0]!.precipitationProbability).toBe(0)
  })

  it('throws ApiError for NaN coordinates', async () => {
    await expect(fetchWeather(NaN, 0, 'X', 'Y')).rejects.toThrow(ApiError)
    await expect(fetchWeather(0, NaN, 'X', 'Y')).rejects.toThrow(ApiError)
  })

  it('throws ApiError for Infinity coordinates', async () => {
    await expect(fetchWeather(Infinity, 0, 'X', 'Y')).rejects.toThrow(ApiError)
    await expect(fetchWeather(0, -Infinity, 'X', 'Y')).rejects.toThrow(ApiError)
  })

  it('throws ApiError for out-of-range latitude', async () => {
    await expect(fetchWeather(91, 0, 'X', 'Y')).rejects.toThrow(ApiError)
    await expect(fetchWeather(-91, 0, 'X', 'Y')).rejects.toThrow(ApiError)
  })

  it('throws ApiError for out-of-range longitude', async () => {
    await expect(fetchWeather(0, 181, 'X', 'Y')).rejects.toThrow(ApiError)
    await expect(fetchWeather(0, -181, 'X', 'Y')).rejects.toThrow(ApiError)
  })

  it('accepts valid boundary coordinates', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockForecastResponse),
    } as Response)

    // All four corners of the valid coordinate space
    await expect(fetchWeather(90, 180, 'X', 'Y')).resolves.toBeDefined()
    await expect(fetchWeather(-90, -180, 'X', 'Y')).resolves.toBeDefined()
    await expect(fetchWeather(0, 0, 'X', 'Y')).resolves.toBeDefined()
  })
})

describe('hourly data parsing', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetchWeather includes hourly data in response', async () => {
    const responseWithHourly = {
      ...mockForecastResponse,
      hourly: {
        time: [
          '2026-03-19T12:00',
          '2026-03-19T13:00',
          '2026-03-19T14:00',
        ],
        temperature_2m: [14.2, 15.0, 14.8],
        weather_code: [3, 61, 2],
        precipitation_probability: [10, 80, 20],
      },
    }

    // Set time before the hourly entries so they all pass the >= now filter
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-03-19T11:00:00'))

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responseWithHourly),
    } as Response)

    const data = await fetchWeather(51.51, -0.13, 'London', 'United Kingdom')

    expect(data.hourly).toHaveLength(3)
    expect(data.hourly[0]).toEqual({
      time: '2026-03-19T12:00',
      temperature: 14.2,
      weatherCode: 3,
      precipitationProbability: 10,
    })
    expect(data.hourly[1]).toEqual({
      time: '2026-03-19T13:00',
      temperature: 15.0,
      weatherCode: 61,
      precipitationProbability: 80,
    })
    expect(data.hourly[2]).toEqual({
      time: '2026-03-19T14:00',
      temperature: 14.8,
      weatherCode: 2,
      precipitationProbability: 20,
    })
  })

  it('hourly data is filtered to next 24 hours from now', async () => {
    // Generate 48 hours of hourly data starting at 2026-03-19T00:00
    const times: string[] = []
    const temps: number[] = []
    const codes: number[] = []
    const precips: number[] = []
    for (let h = 0; h < 48; h++) {
      const hour = h % 24
      const day = 19 + Math.floor(h / 24)
      times.push(`2026-03-${day}T${String(hour).padStart(2, '0')}:00`)
      temps.push(10 + h)
      codes.push(0)
      precips.push(0)
    }

    const responseWithHourly = {
      ...mockForecastResponse,
      hourly: {
        time: times,
        temperature_2m: temps,
        weather_code: codes,
        precipitation_probability: precips,
      },
    }

    // Set current time to 2026-03-19T10:00 — expect hours 10..23 on day 19 + 00..09 on day 20 = 24 entries
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-03-19T10:00:00'))

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responseWithHourly),
    } as Response)

    const data = await fetchWeather(51.51, -0.13, 'London', 'United Kingdom')

    expect(data.hourly).toHaveLength(24)
    // First entry should be the 10:00 hour (index 10 in our generated data)
    expect(data.hourly[0]!.time).toBe('2026-03-19T10:00')
    expect(data.hourly[0]!.temperature).toBe(20) // 10 + 10
    // Last entry should be 09:00 on the next day (index 33 in our generated data)
    expect(data.hourly[23]!.time).toBe('2026-03-20T09:00')
    expect(data.hourly[23]!.temperature).toBe(43) // 10 + 33
  })

  it('hourly data is empty array when API returns no hourly block', async () => {
    // mockForecastResponse has no hourly property
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockForecastResponse),
    } as Response)

    const data = await fetchWeather(51.51, -0.13, 'London', 'United Kingdom')

    expect(data.hourly).toEqual([])
  })
})
