import type { City, TemperatureUnit, UserPreferences } from '@/types/index.ts'

const STORAGE_KEY = 'nimbus-preferences'
const MAX_RECENT_CITIES = 5

const DEFAULTS: UserPreferences = {
  unitPreference: 'celsius',
  darkModeEnabled: false,
  recentCities: [],
}

function getSystemDarkMode(): boolean {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS, darkModeEnabled: getSystemDarkMode() }
    const parsed = JSON.parse(raw) as Partial<UserPreferences>
    return {
      unitPreference: parsed.unitPreference ?? DEFAULTS.unitPreference,
      darkModeEnabled: parsed.darkModeEnabled ?? DEFAULTS.darkModeEnabled,
      recentCities: Array.isArray(parsed.recentCities)
        ? parsed.recentCities.slice(0, MAX_RECENT_CITIES)
        : [],
    }
  } catch {
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
