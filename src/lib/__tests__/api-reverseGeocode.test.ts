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
        results: [{ name: 'Tokyo', country: 'Japan' }],
      }),
    } as Response)

    const result = await reverseGeocode(35.68, 139.69)
    expect(result).toEqual({ name: 'Tokyo', country: 'Japan' })
  })

  it('returns null when API responds with no results', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    } as Response)

    const result = await reverseGeocode(0, 0)
    expect(result).toBeNull()
  })

  it('returns null when API responds with undefined results', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
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
        results: [{ name: 'Unknown Place' }],
      }),
    } as Response)

    const result = await reverseGeocode(10, 20)
    expect(result).toEqual({ name: 'Unknown Place', country: '' })
  })

  it('passes rounded coordinates in the search query', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    } as Response)

    await reverseGeocode(35.6895, 139.6917)

    const calledUrl = fetchSpy.mock.calls[0]![0] as string
    expect(calledUrl).toContain('name=35.7')
    expect(calledUrl).toContain('count=1')
  })
})
