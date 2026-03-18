import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchCities, fetchWeather, reverseGeocode, ApiError, clearGeocodingCache, clearForecastCache, FETCH_TIMEOUT_MS } from '../api.ts'

/**
 * API Resilience Tests
 *
 * These tests verify timeout handling, response validation, and error recovery
 * added during the error recovery audit.
 */

beforeEach(() => {
  vi.restoreAllMocks()
  clearGeocodingCache()
  clearForecastCache()
})

const VALID_FORECAST_RESPONSE = {
  timezone: 'UTC',
  current: {
    temperature_2m: 20,
    relative_humidity_2m: 50,
    apparent_temperature: 18,
    weather_code: 0,
    wind_speed_10m: 10,
    is_day: 1,
  },
  daily: {
    time: ['2026-03-18'],
    weather_code: [0],
    temperature_2m_max: [22],
    temperature_2m_min: [15],
    precipitation_probability_max: [5],
  },
}

// ==========================================
// Timeout Tests
// ==========================================

describe('Fetch Timeouts', () => {
  it('exports FETCH_TIMEOUT_MS constant', () => {
    expect(FETCH_TIMEOUT_MS).toBe(10_000)
  })

  it('searchCities passes AbortSignal.timeout to fetch', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    } as Response)

    await searchCities('London')

    expect(spy).toHaveBeenCalledTimes(1)
    const options = spy.mock.calls[0]![1] as RequestInit
    expect(options.signal).toBeDefined()
  })

  it('searchCities throws ApiError on timeout (DOMException TimeoutError)', async () => {
    const timeoutError = new DOMException('The operation was aborted due to timeout', 'TimeoutError')
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(timeoutError)

    try {
      await searchCities('London')
      expect.unreachable('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).message).toContain('timed out')
    }
  })

  it('searchCities throws ApiError on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'))

    try {
      await searchCities('London')
      expect.unreachable('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).message).toContain('Network error')
    }
  })

  it('fetchWeather passes AbortSignal.timeout to fetch', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(VALID_FORECAST_RESPONSE),
    } as Response)

    await fetchWeather(0, 0, 'Test', 'Country')

    expect(spy).toHaveBeenCalledTimes(1)
    const options = spy.mock.calls[0]![1] as RequestInit
    expect(options.signal).toBeDefined()
  })

  it('fetchWeather throws ApiError on timeout', async () => {
    const timeoutError = new DOMException('The operation was aborted due to timeout', 'TimeoutError')
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(timeoutError)

    try {
      await fetchWeather(0, 0, 'Test', 'Country')
      expect.unreachable('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).message).toContain('timed out')
    }
  })

  it('fetchWeather throws ApiError on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'))

    try {
      await fetchWeather(0, 0, 'Test', 'Country')
      expect.unreachable('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).message).toContain('Network error')
    }
  })

  it('reverseGeocode passes AbortSignal.timeout to fetch', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    } as Response)

    await reverseGeocode(0, 0)

    const options = spy.mock.calls[0]![1] as RequestInit
    expect(options.signal).toBeDefined()
  })

  it('reverseGeocode returns null on timeout (does not throw)', async () => {
    const timeoutError = new DOMException('timeout', 'TimeoutError')
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(timeoutError)

    const result = await reverseGeocode(0, 0)
    expect(result).toBeNull()
  })
})

// ==========================================
// Response Validation Tests
// ==========================================

describe('fetchWeather: Response Validation', () => {
  it('throws ApiError when response is missing current block', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ daily: VALID_FORECAST_RESPONSE.daily }),
    } as Response)

    await expect(fetchWeather(0, 0, 'X', 'Y')).rejects.toThrow('malformed')
  })

  it('throws ApiError when current block has non-numeric temperature', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ...VALID_FORECAST_RESPONSE,
        current: { ...VALID_FORECAST_RESPONSE.current, temperature_2m: 'not a number' },
      }),
    } as Response)

    await expect(fetchWeather(0, 0, 'X', 'Y')).rejects.toThrow('malformed')
  })

  it('throws ApiError when daily.time is not an array', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ...VALID_FORECAST_RESPONSE,
        daily: { ...VALID_FORECAST_RESPONSE.daily, time: 'not-array' },
      }),
    } as Response)

    await expect(fetchWeather(0, 0, 'X', 'Y')).rejects.toThrow('malformed')
  })

  it('throws ApiError when response is missing daily block', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        current: VALID_FORECAST_RESPONSE.current,
      }),
    } as Response)

    await expect(fetchWeather(0, 0, 'X', 'Y')).rejects.toThrow('malformed')
  })

  it('safely defaults missing optional fields in current weather', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        current: {
          temperature_2m: 15,
          is_day: 1,
          // missing: apparent_temperature, relative_humidity_2m, wind_speed_10m, weather_code
        },
        daily: VALID_FORECAST_RESPONSE.daily,
      }),
    } as Response)

    const data = await fetchWeather(0, 0, 'X', 'Y')

    expect(data.current.temperature).toBe(15)
    expect(data.current.feelsLike).toBe(15) // falls back to temperature
    expect(data.current.humidity).toBe(0)
    expect(data.current.windSpeed).toBe(0)
    expect(data.current.weatherCode).toBe(0)
  })

  it('safely defaults missing daily array fields', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        current: VALID_FORECAST_RESPONSE.current,
        daily: {
          time: ['2026-03-18'],
          // missing: weather_code, temperature_2m_max, temperature_2m_min
        },
      }),
    } as Response)

    const data = await fetchWeather(0, 0, 'X', 'Y')

    expect(data.daily).toHaveLength(1)
    expect(data.daily[0]!.weatherCode).toBe(0)
    expect(data.daily[0]!.tempHigh).toBe(0)
    expect(data.daily[0]!.tempLow).toBe(0)
    expect(data.daily[0]!.precipitationProbability).toBe(0)
  })
})
