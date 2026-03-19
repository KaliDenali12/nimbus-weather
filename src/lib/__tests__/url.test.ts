import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseCityFromUrl, updateUrlWithCity, clearUrlParams } from '../url.ts'
import type { City } from '@/types/index.ts'

function setSearchParams(params: Record<string, string>): void {
  const search = new URLSearchParams(params).toString()
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search: search ? `?${search}` : '', pathname: '/' },
    writable: true,
  })
}

beforeEach(() => {
  setSearchParams({})
  vi.spyOn(history, 'replaceState')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('parseCityFromUrl', () => {
  it('extracts valid city params from URL', () => {
    setSearchParams({ lat: '35.68', lon: '139.69', city: 'Tokyo', country: 'Japan' })

    const result = parseCityFromUrl()

    expect(result).toEqual({ lat: 35.68, lon: 139.69, name: 'Tokyo', country: 'Japan' })
  })

  it('returns empty string for country when not provided', () => {
    setSearchParams({ lat: '51.51', lon: '-0.13', city: 'London' })

    const result = parseCityFromUrl()

    expect(result).toEqual({ lat: 51.51, lon: -0.13, name: 'London', country: '' })
  })

  it('returns null when lat is missing', () => {
    setSearchParams({ lon: '139.69', city: 'Tokyo' })

    expect(parseCityFromUrl()).toBeNull()
  })

  it('returns null when lon is missing', () => {
    setSearchParams({ lat: '35.68', city: 'Tokyo' })

    expect(parseCityFromUrl()).toBeNull()
  })

  it('returns null when city is missing', () => {
    setSearchParams({ lat: '35.68', lon: '139.69' })

    expect(parseCityFromUrl()).toBeNull()
  })

  it('returns null when no params are present', () => {
    expect(parseCityFromUrl()).toBeNull()
  })

  it('returns null when lat is out of range (> 90)', () => {
    setSearchParams({ lat: '91', lon: '0', city: 'Nowhere' })

    expect(parseCityFromUrl()).toBeNull()
  })

  it('returns null when lat is out of range (< -90)', () => {
    setSearchParams({ lat: '-91', lon: '0', city: 'Nowhere' })

    expect(parseCityFromUrl()).toBeNull()
  })

  it('returns null when lon is out of range (> 180)', () => {
    setSearchParams({ lat: '0', lon: '181', city: 'Nowhere' })

    expect(parseCityFromUrl()).toBeNull()
  })

  it('returns null when lon is out of range (< -180)', () => {
    setSearchParams({ lat: '0', lon: '-181', city: 'Nowhere' })

    expect(parseCityFromUrl()).toBeNull()
  })

  it('returns null when lat is NaN', () => {
    setSearchParams({ lat: 'abc', lon: '0', city: 'Nowhere' })

    expect(parseCityFromUrl()).toBeNull()
  })

  it('returns null when lon is NaN', () => {
    setSearchParams({ lat: '0', lon: 'xyz', city: 'Nowhere' })

    expect(parseCityFromUrl()).toBeNull()
  })

  it('accepts boundary values for lat and lon', () => {
    setSearchParams({ lat: '90', lon: '180', city: 'Edge' })

    expect(parseCityFromUrl()).toEqual({ lat: 90, lon: 180, name: 'Edge', country: '' })

    setSearchParams({ lat: '-90', lon: '-180', city: 'Edge' })

    expect(parseCityFromUrl()).toEqual({ lat: -90, lon: -180, name: 'Edge', country: '' })
  })
})

describe('updateUrlWithCity', () => {
  it('calls history.replaceState with correct params', () => {
    const city: City = { name: 'Tokyo', lat: 35.68, lon: 139.69, country: 'Japan' }

    updateUrlWithCity(city)

    expect(history.replaceState).toHaveBeenCalledOnce()
    const url = (history.replaceState as ReturnType<typeof vi.fn>).mock.calls[0][2] as string
    const params = new URLSearchParams(url.slice(1))
    expect(params.get('lat')).toBe('35.68')
    expect(params.get('lon')).toBe('139.69')
    expect(params.get('city')).toBe('Tokyo')
    expect(params.get('country')).toBe('Japan')
  })

  it('omits country param when country is empty string', () => {
    const city: City = { name: 'London', lat: 51.51, lon: -0.13, country: '' }

    updateUrlWithCity(city)

    const url = (history.replaceState as ReturnType<typeof vi.fn>).mock.calls[0][2] as string
    const params = new URLSearchParams(url.slice(1))
    expect(params.has('country')).toBe(false)
    expect(params.get('city')).toBe('London')
  })
})

describe('clearUrlParams', () => {
  it('removes search params when they exist', () => {
    setSearchParams({ lat: '0', lon: '0', city: 'Test' })

    clearUrlParams()

    expect(history.replaceState).toHaveBeenCalledWith(null, '', '/')
  })

  it('does not call replaceState when no search params exist', () => {
    setSearchParams({})

    clearUrlParams()

    expect(history.replaceState).not.toHaveBeenCalled()
  })
})
