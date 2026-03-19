import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadPreferences, savePreferences, addRecentCity, setUnit, toggleDarkMode, toggleScene } from '../storage.ts'
import type { UserPreferences, City } from '@/types/index.ts'

const mockCity: City = { name: 'Tokyo', lat: 35.68, lon: 139.69, country: 'Japan' }
const mockCity2: City = { name: 'London', lat: 51.51, lon: -0.13, country: 'UK' }

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('loadPreferences', () => {
  it('returns defaults when no data stored', () => {
    const prefs = loadPreferences()
    expect(prefs.unitPreference).toBe('celsius')
    expect(prefs.darkModeEnabled).toBe(false)
    expect(prefs.recentCities).toEqual([])
  })

  it('loads saved preferences', () => {
    const saved: UserPreferences = {
      unitPreference: 'fahrenheit',
      darkModeEnabled: true,
      sceneDisabled: false,
      recentCities: [mockCity],
    }
    localStorage.setItem('nimbus-preferences', JSON.stringify(saved))

    const prefs = loadPreferences()
    expect(prefs.unitPreference).toBe('fahrenheit')
    expect(prefs.darkModeEnabled).toBe(true)
    expect(prefs.recentCities).toHaveLength(1)
    expect(prefs.recentCities[0]!.name).toBe('Tokyo')
  })

  it('handles corrupted JSON gracefully', () => {
    localStorage.setItem('nimbus-preferences', 'not json')
    const prefs = loadPreferences()
    expect(prefs.unitPreference).toBe('celsius')
  })

  it('caps recent cities at 5', () => {
    const cities = Array.from({ length: 8 }, (_, i) => ({
      name: `City${i}`, lat: i, lon: i, country: 'X',
    }))
    localStorage.setItem('nimbus-preferences', JSON.stringify({
      recentCities: cities,
    }))
    const prefs = loadPreferences()
    expect(prefs.recentCities).toHaveLength(5)
  })

  it('handles missing fields with defaults', () => {
    localStorage.setItem('nimbus-preferences', JSON.stringify({}))
    const prefs = loadPreferences()
    expect(prefs.unitPreference).toBe('celsius')
    expect(prefs.darkModeEnabled).toBe(false)
    expect(prefs.recentCities).toEqual([])
  })

  it('filters out invalid city objects from recentCities', () => {
    localStorage.setItem('nimbus-preferences', JSON.stringify({
      recentCities: [
        { name: 'Tokyo', lat: 35.68, lon: 139.69, country: 'Japan' },
        { name: '', lat: 0, lon: 0, country: 'X' },         // empty name
        { lat: 0, lon: 0, country: 'X' },                    // missing name
        { name: 'Bad', lat: NaN, lon: 0, country: 'X' },     // NaN lat
        { name: 'Bad', lat: 0, lon: Infinity, country: 'X' },// Infinity lon
        'not an object',                                       // wrong type
        null,                                                  // null
        { name: 'NoCountry', lat: 0, lon: 0 },               // missing country
      ],
    }))
    const prefs = loadPreferences()
    expect(prefs.recentCities).toHaveLength(1)
    expect(prefs.recentCities[0]!.name).toBe('Tokyo')
  })
})

describe('savePreferences', () => {
  it('saves preferences to localStorage', () => {
    const prefs: UserPreferences = {
      unitPreference: 'fahrenheit',
      darkModeEnabled: true,
      sceneDisabled: false,
      recentCities: [mockCity],
    }
    savePreferences(prefs)
    const stored = JSON.parse(localStorage.getItem('nimbus-preferences')!)
    expect(stored.unitPreference).toBe('fahrenheit')
  })

  it('handles localStorage errors gracefully', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded')
    })
    expect(() => savePreferences(loadPreferences())).not.toThrow()
  })
})

describe('addRecentCity', () => {
  it('adds a city to the front', () => {
    const prefs = loadPreferences()
    const updated = addRecentCity(prefs, mockCity)
    expect(updated.recentCities[0]!.name).toBe('Tokyo')
  })

  it('deduplicates by coordinates', () => {
    const prefs: UserPreferences = {
      ...loadPreferences(),
      recentCities: [mockCity, mockCity2],
    }
    const updated = addRecentCity(prefs, mockCity) // re-add Tokyo
    expect(updated.recentCities).toHaveLength(2)
    expect(updated.recentCities[0]!.name).toBe('Tokyo')
  })

  it('does not remove cities that share only lat or only lon', () => {
    // Cities share lat but differ in lon — both should be kept
    const sameLatCity: City = { name: 'SameLat', lat: 35.68, lon: 0, country: 'X' }
    // Cities share lon but differ in lat — both should be kept
    const sameLonCity: City = { name: 'SameLon', lat: 0, lon: 139.69, country: 'X' }
    const prefs: UserPreferences = {
      ...loadPreferences(),
      recentCities: [sameLatCity, sameLonCity],
    }
    const updated = addRecentCity(prefs, mockCity) // Tokyo: lat=35.68, lon=139.69
    // All 3 should be present — dedup requires BOTH lat AND lon to match
    expect(updated.recentCities).toHaveLength(3)
    expect(updated.recentCities[0]!.name).toBe('Tokyo')
    expect(updated.recentCities.find(c => c.name === 'SameLat')).toBeDefined()
    expect(updated.recentCities.find(c => c.name === 'SameLon')).toBeDefined()
  })

  it('caps at 5 cities', () => {
    const prefs: UserPreferences = {
      ...loadPreferences(),
      recentCities: Array.from({ length: 5 }, (_, i) => ({
        name: `City${i}`, lat: i, lon: i, country: 'X',
      })),
    }
    const updated = addRecentCity(prefs, mockCity)
    expect(updated.recentCities).toHaveLength(5)
    expect(updated.recentCities[0]!.name).toBe('Tokyo')
  })
})

describe('setUnit', () => {
  it('updates unit preference', () => {
    const prefs = loadPreferences()
    const updated = setUnit(prefs, 'fahrenheit')
    expect(updated.unitPreference).toBe('fahrenheit')
  })

  it('does not mutate original', () => {
    const prefs = loadPreferences()
    const updated = setUnit(prefs, 'fahrenheit')
    expect(prefs.unitPreference).toBe('celsius')
    expect(updated.unitPreference).toBe('fahrenheit')
  })
})

describe('toggleDarkMode', () => {
  it('toggles from false to true', () => {
    const prefs = loadPreferences()
    expect(toggleDarkMode(prefs).darkModeEnabled).toBe(true)
  })

  it('toggles from true to false', () => {
    const prefs = { ...loadPreferences(), darkModeEnabled: true }
    expect(toggleDarkMode(prefs).darkModeEnabled).toBe(false)
  })
})

describe('loadPreferences — sceneDisabled', () => {
  it('returns sceneDisabled: false by default when not in localStorage', () => {
    const prefs = loadPreferences()
    expect(prefs.sceneDisabled).toBe(false)
  })

  it('correctly loads sceneDisabled: true when stored', () => {
    localStorage.setItem('nimbus-preferences', JSON.stringify({
      sceneDisabled: true,
    }))
    const prefs = loadPreferences()
    expect(prefs.sceneDisabled).toBe(true)
  })

  it('defaults to false when sceneDisabled has invalid type', () => {
    localStorage.setItem('nimbus-preferences', JSON.stringify({
      sceneDisabled: 'yes',
    }))
    const prefs = loadPreferences()
    expect(prefs.sceneDisabled).toBe(false)
  })
})

describe('toggleScene', () => {
  it('flips sceneDisabled from false to true', () => {
    const prefs = loadPreferences()
    expect(toggleScene(prefs).sceneDisabled).toBe(true)
  })

  it('flips sceneDisabled from true to false', () => {
    const prefs = { ...loadPreferences(), sceneDisabled: true }
    expect(toggleScene(prefs).sceneDisabled).toBe(false)
  })
})
