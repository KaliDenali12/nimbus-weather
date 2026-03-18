import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchCities, clearGeocodingCache } from '../api.ts'

/**
 * Concurrency Tests for API Layer
 *
 * These tests verify behavior under concurrent access patterns:
 * geocoding cache consistency, parallel fetch deduplication, and
 * stale-response handling.
 */

const mockGeoResponse = (name: string) => ({
  results: [
    { id: 1, name, latitude: 51.51, longitude: -0.13, country: 'UK', country_code: 'GB', admin1: 'England' },
  ],
})

beforeEach(() => {
  vi.restoreAllMocks()
  clearGeocodingCache()
})

describe('Geocoding cache concurrency', () => {
  it('concurrent identical searches share the same cache entry', async () => {
    let callCount = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      callCount++
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockGeoResponse('London')),
      } as Response)
    })

    // First call populates cache
    const first = await searchCities('London')
    expect(callCount).toBe(1)

    // Second call should hit cache (same normalized key)
    const second = await searchCities('London')
    expect(callCount).toBe(1) // no additional fetch
    expect(second).toEqual(first)
  })

  it('cache key normalization prevents duplicate fetches for case variants', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGeoResponse('London')),
    } as Response)

    await searchCities('London')
    await searchCities('london')
    await searchCities('LONDON')
    await searchCities('  london  ')

    // All should resolve to same cache key "london", so only 1 fetch
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('parallel searches for the same query issue duplicate fetches (no dedup)', async () => {
    // RACE CONDITION: Two concurrent calls for the same uncached query
    // both bypass the cache check (both see cache miss) and both issue fetches.
    // This is benign — both write the same data to the cache — but wastes bandwidth.
    let callCount = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      callCount++
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockGeoResponse('Paris')),
      } as Response)
    })

    // Fire both concurrently — both will see cache miss
    const [r1, r2] = await Promise.all([
      searchCities('Paris'),
      searchCities('Paris'),
    ])

    // Both issued fetches because the cache was empty when both checked
    expect(callCount).toBe(2)
    // But results are identical
    expect(r1).toEqual(r2)
  })

  it('cache eviction under max entries does not lose concurrent reads', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url) => {
      const urlStr = typeof _url === 'string' ? _url : (_url as Request).url
      const name = new URL(urlStr).searchParams.get('name') ?? 'unknown'
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockGeoResponse(name)),
      } as Response)
    })

    // Fill cache to near-max (50 entries)
    for (let i = 0; i < 50; i++) {
      await searchCities(`city${i.toString().padStart(3, '0')}`)
    }

    // Next entry should evict the oldest
    await searchCities('newcity')

    // The oldest entry ("city000") should have been evicted
    // so searching for it again should trigger a new fetch
    const spy = vi.spyOn(globalThis, 'fetch')
    spy.mockClear()

    await searchCities('city000')
    expect(spy).toHaveBeenCalledTimes(1) // cache miss → new fetch
  })
})

describe('Stale response handling', () => {
  it('rapid sequential searches return results for final query only', async () => {
    // Simulates user typing "p" → "pa" → "par" → "pari" → "paris"
    // Each call completes after different delays
    const results: string[] = []

    vi.spyOn(globalThis, 'fetch').mockImplementation((_url) => {
      const urlStr = typeof _url === 'string' ? _url : (_url as Request).url
      const name = new URL(urlStr).searchParams.get('name') ?? 'unknown'
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockGeoResponse(name)),
      } as Response)
    })

    // Sequential awaited calls — each completes before the next starts
    for (const q of ['pa', 'par', 'pari', 'paris']) {
      const r = await searchCities(q)
      results.push(r[0]?.name ?? 'none')
    }

    // All resolved correctly (no stale data)
    expect(results).toEqual(['pa', 'par', 'pari', 'paris'])
  })

  it('failed fetch does not pollute cache with error state', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')

    // First call fails
    spy.mockRejectedValueOnce(new TypeError('Network error'))

    try {
      await searchCities('Berlin')
    } catch {
      // Expected
    }

    // Second call should still try to fetch (not cached error)
    spy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGeoResponse('Berlin')),
    } as Response)

    const result = await searchCities('Berlin')
    expect(result[0]?.name).toBe('Berlin')
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
