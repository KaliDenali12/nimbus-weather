import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type {
  WeatherData,
  City,
  UserPreferences,
  WeatherCondition,
  TimeOfDay,
  GeocodingResult,
} from '@/types/index.ts'
import { fetchWeather, searchCities } from '@/lib/api.ts'
import { getUserLocation, ANTARCTICA } from '@/lib/geolocation.ts'
import {
  loadPreferences,
  savePreferences,
  addRecentCity,
  setUnit,
  toggleDarkMode,
} from '@/lib/storage.ts'
import { getWeatherCondition } from '@/lib/weather-codes.ts'
import { getTheme, applyTheme } from '@/lib/theme.ts'

interface WeatherContextValue {
  weather: WeatherData | null
  loading: boolean
  error: string | null
  preferences: UserPreferences
  geoError: 'denied' | 'timeout' | 'unavailable' | null
  condition: WeatherCondition
  timeOfDay: TimeOfDay
  selectCity: (city: City) => void
  searchForCities: (query: string) => Promise<GeocodingResult[]>
  toggleUnit: () => void
  toggleDark: () => void
  retry: () => void
}

const WeatherContext = createContext<WeatherContextValue | null>(null)

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences)
  const [geoError, setGeoError] = useState<WeatherContextValue['geoError']>(null)

  const condition: WeatherCondition = weather
    ? getWeatherCondition(weather.current.weatherCode)
    : 'clear'
  const timeOfDay: TimeOfDay = weather
    ? weather.current.isDay ? 'day' : 'night'
    : 'day'

  // Apply theme whenever condition, time, or dark mode changes
  useEffect(() => {
    const theme = getTheme(condition, timeOfDay, preferences.darkModeEnabled)
    applyTheme(theme)
  }, [condition, timeOfDay, preferences.darkModeEnabled])

  // Save preferences whenever they change
  useEffect(() => {
    savePreferences(preferences)
  }, [preferences])

  const loadWeatherForCoords = useCallback(
    async (lat: number, lon: number, name: string, country: string) => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchWeather(lat, lon, name, country)
        setWeather(data)
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : 'Unable to fetch weather data. Check your connection and try again.',
        )
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const initializeLocation = useCallback(async () => {
    setLoading(true)
    const result = await getUserLocation()

    if (result.ok) {
      // Try to get a city name for these coords via the API
      const { latitude, longitude } = result.position
      try {
        const nearby = await searchCities(
          `${latitude.toFixed(2)} ${longitude.toFixed(2)}`,
        )
        const city = nearby[0]
        await loadWeatherForCoords(
          latitude,
          longitude,
          city?.name ?? 'Your Location',
          city?.country ?? '',
        )
      } catch {
        await loadWeatherForCoords(latitude, longitude, 'Your Location', '')
      }
    } else {
      setGeoError(result.error)
      // Fall back to Antarctica
      await loadWeatherForCoords(
        ANTARCTICA.latitude,
        ANTARCTICA.longitude,
        ANTARCTICA.name,
        ANTARCTICA.country,
      )
    }
  }, [loadWeatherForCoords])

  // Initialize on mount
  useEffect(() => {
    initializeLocation()
  }, [initializeLocation])

  const selectCity = useCallback(
    (city: City) => {
      setPreferences((prev) => addRecentCity(prev, city))
      loadWeatherForCoords(city.lat, city.lon, city.name, city.country)
    },
    [loadWeatherForCoords],
  )

  const searchForCities = useCallback(async (query: string) => {
    return searchCities(query)
  }, [])

  const toggleUnit = useCallback(() => {
    setPreferences((prev) =>
      setUnit(prev, prev.unitPreference === 'celsius' ? 'fahrenheit' : 'celsius'),
    )
  }, [])

  const toggleDark = useCallback(() => {
    setPreferences((prev) => toggleDarkMode(prev))
  }, [])

  const retry = useCallback(() => {
    initializeLocation()
  }, [initializeLocation])

  return (
    <WeatherContext.Provider
      value={{
        weather,
        loading,
        error,
        preferences,
        geoError,
        condition,
        timeOfDay,
        selectCity,
        searchForCities,
        toggleUnit,
        toggleDark,
        retry,
      }}
    >
      {children}
    </WeatherContext.Provider>
  )
}

export function useWeather(): WeatherContextValue {
  const ctx = useContext(WeatherContext)
  if (!ctx) throw new Error('useWeather must be used within a WeatherProvider')
  return ctx
}
