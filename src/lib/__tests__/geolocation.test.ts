import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserLocation, ANTARCTICA } from '../geolocation.ts'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('getUserLocation', () => {
  it('returns position on success', async () => {
    const mockGetCurrentPosition = vi.fn((success) => {
      success({ coords: { latitude: 40.71, longitude: -74.01 } })
    })

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    })

    const result = await getUserLocation()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.position.latitude).toBe(40.71)
      expect(result.position.longitude).toBe(-74.01)
    }
  })

  it('returns denied error when permission denied', async () => {
    const mockGetCurrentPosition = vi.fn((_success, error) => {
      error({ code: 1, PERMISSION_DENIED: 1, TIMEOUT: 3, POSITION_UNAVAILABLE: 2 })
    })

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    })

    const result = await getUserLocation()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('denied')
    }
  })

  it('returns timeout error', async () => {
    const mockGetCurrentPosition = vi.fn((_success, error) => {
      error({ code: 3, PERMISSION_DENIED: 1, TIMEOUT: 3, POSITION_UNAVAILABLE: 2 })
    })

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    })

    const result = await getUserLocation()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('timeout')
    }
  })

  it('returns unavailable when geolocation not supported', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    const result = await getUserLocation()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('unavailable')
    }
  })
})

describe('ANTARCTICA', () => {
  it('has valid coordinates', () => {
    expect(ANTARCTICA.latitude).toBeLessThan(0)
    expect(ANTARCTICA.name).toBe('Antarctica')
  })
})
