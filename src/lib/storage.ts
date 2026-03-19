import type { City, TemperatureUnit, UserPreferences } from '@/types/index.ts'

const STORAGE_KEY = 'nimbus-preferences'
const MAX_RECENT_CITIES = 5
const MAX_CITY_NAME_LENGTH = 200

function isValidCity(item: unknown): item is City {
  if (typeof item !== 'object' || item === null) return false
  const obj = item as Record<string, unknown>
  return (
    typeof obj.name === 'string' &&
    obj.name.length > 0 &&
    obj.name.length <= MAX_CITY_NAME_LENGTH &&
    typeof obj.lat === 'number' &&
    Number.isFinite(obj.lat) &&
    obj.lat >= -90 && obj.lat <= 90 &&
    typeof obj.lon === 'number' &&
    Number.isFinite(obj.lon) &&
    obj.lon >= -180 && obj.lon <= 180 &&
    typeof obj.country === 'string'
  )
}

const DEFAULTS: UserPreferences = {
  unitPreference: 'celsius',
  darkModeEnabled: false,
  sceneDisabled: false,
  recentCities: [],
}

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return { ...DEFAULTS }
    }
    const obj = parsed as Record<string, unknown>
    return {
      unitPreference:
        obj.unitPreference === 'celsius' || obj.unitPreference === 'fahrenheit'
          ? obj.unitPreference
          : DEFAULTS.unitPreference,
      darkModeEnabled:
        typeof obj.darkModeEnabled === 'boolean'
          ? obj.darkModeEnabled
          : DEFAULTS.darkModeEnabled,
      sceneDisabled:
        typeof obj.sceneDisabled === 'boolean'
          ? obj.sceneDisabled
          : DEFAULTS.sceneDisabled,
      recentCities: Array.isArray(obj.recentCities)
        ? (obj.recentCities as unknown[]).filter(isValidCity).slice(0, MAX_RECENT_CITIES)
        : [],
    }
  } catch {
    // Corrupted or unreadable localStorage — fall back to defaults
    return { ...DEFAULTS }
  }
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function addRecentCity(prefs: UserPreferences, city: City): UserPreferences {
  const filtered = prefs.recentCities.filter(
    (c) => !(c.lat === city.lat && c.lon === city.lon),
  )
  const recentCities = [city, ...filtered].slice(0, MAX_RECENT_CITIES)
  return { ...prefs, recentCities }
}

export function setUnit(prefs: UserPreferences, unit: TemperatureUnit): UserPreferences {
  return { ...prefs, unitPreference: unit }
}

export function toggleDarkMode(prefs: UserPreferences): UserPreferences {
  return { ...prefs, darkModeEnabled: !prefs.darkModeEnabled }
}

export function toggleScene(prefs: UserPreferences): UserPreferences {
  return { ...prefs, sceneDisabled: !prefs.sceneDisabled }
}
