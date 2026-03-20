import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reverseGeocode } from '../api.ts'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('reverseGeocode', () => {
  it('returns city name and country for valid coordinates', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        city: 'Tokyo',
        countryName: 'Japan',
      }),
    } as Response)

    const result = await reverseGeocode(35.68, 139.69)
    expect(result).toEqual({ name: 'Tokyo', country: 'Japan' })
  })

  it('falls back to locality when city is empty', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        city: '',
        locality: 'Shibuya',
        countryName: 'Japan',
      }),
    } as Response)

    const result = await reverseGeocode(35.68, 139.69)
    expect(result).toEqual({ name: 'Shibuya', country: 'Japan' })
  })

  it('falls back to principalSubdivision when city and locality are empty', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        city: '',
        locality: '',
        principalSubdivision: 'California',
        countryName: 'United States',
      }),
    } as Response)

    const result = await reverseGeocode(36.7, -119.8)
    expect(result).toEqual({ name: 'California', country: 'United States' })
  })

  it('returns null when all name fields are empty', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        city: '',
        locality: '',
        principalSubdivision: '',
        countryName: 'Unknown',
      }),
    } as Response)

    const result = await reverseGeocode(0, 0)
    expect(result).toBeNull()
  })

  it('returns null when API returns non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    const result = await reverseGeocode(0, 0)
    expect(result).toBeNull()
  })

  it('returns null when fetch throws (network error)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network failure'))

    const result = await reverseGeocode(0, 0)
    expect(result).toBeNull()
  })

  it('defaults country to empty string when missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        city: 'Unknown Place',
      }),
    } as Response)

    const result = await reverseGeocode(10, 20)
    expect(result).toEqual({ name: 'Unknown Place', country: '' })
  })

  it('passes coordinates as query parameters', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ city: 'Test' }),
    } as Response)

    await reverseGeocode(35.6895, 139.6917)

    const calledUrl = fetchSpy.mock.calls[0]![0] as string
    expect(calledUrl).toContain('latitude=35.6895')
    expect(calledUrl).toContain('longitude=139.6917')
  })
})
