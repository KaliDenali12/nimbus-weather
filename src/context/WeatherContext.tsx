import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  toggleScene as toggleScenePrefs,
} from '@/lib/storage.ts'
import { getWeatherCondition } from '@/lib/weather-codes.ts'
import { getTheme, applyTheme } from '@/lib/theme.ts'
import { parseCityFromUrl, updateUrlWithCity, clearUrlParams } from '@/lib/url.ts'

interface WeatherContextValue {
  weather: WeatherData | null
  loading: boolean
  refreshing: boolean
  error: string | null
  preferences: UserPreferences
  geoError: 'denied' | 'timeout' | 'unavailable' | null
  loadingCityKey: string | null
  condition: WeatherCondition
  timeOfDay: TimeOfDay
  selectCity: (city: City) => void
  searchForCities: (query: string) => Promise<GeocodingResult[]>
  toggleUnit: () => void
  toggleDark: () => void
  toggleScene: () => void
  retry: () => void
}

function getHttpStatus(error: Error): number | undefined {
  if ('status' in error && typeof (error as Record<string, unknown>).status === 'number') {
    return (error as Record<string, unknown>).status as number
  }
  return undefined
}

const WeatherContext = createContext<WeatherContextValue | null>(null)

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences)
  const [geoError, setGeoError] = useState<WeatherContextValue['geoError']>(null)
  const [loadingCityKey, setLoadingCityKey] = useState<string | null>(null)
  const hasWeatherRef = useRef(false)

  const condition: WeatherCondition = useMemo(
    () => weather ? getWeatherCondition(weather.current.weatherCode) : 'clear',
    [weather],
  )
  const timeOfDay: TimeOfDay = useMemo(
    () => weather ? (weather.current.isDay ? 'day' : 'night') : 'day',
    [weather],
  )

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
      // If we already have weather data, this is a refresh (city switch).
      // Keep old data visible — only show full loading on initial load.
      if (hasWeatherRef.current) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setLoadingCityKey(`${lat},${lon}`)
      setError(null)
      try {
        const data = await fetchWeather(lat, lon, name, country)
        setWeather(data)
        hasWeatherRef.current = true
      } catch (e) {
        if (e instanceof Error) {
          const status = getHttpStatus(e)
          if (status !== undefined && status >= 500) {
            setError('The weather service is temporarily unavailable. Please try again in a few minutes.')
          } else if (status !== undefined && status === 429) {
            setError('Too many requests. Please wait a moment and try again.')
          } else {
            setError('Unable to fetch weather data. Please check your connection and try again.')
          }
        } else {
          setError('Unable to fetch weather data. Please check your connection and try again.')
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
        setLoadingCityKey(null)
      }
    },
    [],
  )

  const initializeLocation = useCallback(async () => {
    setLoading(true)

    // Priority: URL params > recentCities[0] > geolocation > Antarctica
    const urlCity = parseCityFromUrl()
    if (urlCity) {
      await loadWeatherForCoords(urlCity.lat, urlCity.lon, urlCity.name, urlCity.country)
      return
    }

    const prefs = loadPreferences()
    const lastCity = prefs.recentCities[0]
    if (lastCity) {
      await loadWeatherForCoords(lastCity.lat, lastCity.lon, lastCity.name, lastCity.country)
      return
    }

    // No URL or recent city — clear any stale URL params
    clearUrlParams()

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
      updateUrlWithCity(city)
      loadWeatherForCoords(city.lat, city.lon, city.name, city.country)
    },
    [loadWeatherForCoords],
  )

  const searchForCities = useCallback(
    (query: string) => searchCities(query),
    [],
  )

  const toggleUnit = useCallback(() => {
    setPreferences((prev) =>
      setUnit(prev, prev.unitPreference === 'celsius' ? 'fahrenheit' : 'celsius'),
    )
  }, [])

  const toggleDark = useCallback(() => {
    setPreferences(toggleDarkMode)
  }, [])

  const toggleSceneAction = useCallback(() => {
    setPreferences(toggleScenePrefs)
  }, [])

  const retry = useCallback(() => {
    initializeLocation()
  }, [initializeLocation])

  const contextValue = useMemo<WeatherContextValue>(() => ({
    weather,
    loading,
    refreshing,
    error,
    preferences,
    geoError,
    loadingCityKey,
    condition,
    timeOfDay,
    selectCity,
    searchForCities,
    toggleUnit,
    toggleDark,
    toggleScene: toggleSceneAction,
    retry,
  }), [weather, loading, refreshing, error, preferences, geoError, loadingCityKey, condition, timeOfDay,
    selectCity, searchForCities, toggleUnit, toggleDark, toggleSceneAction, retry])

  return (
    <WeatherContext.Provider value={contextValue}>
      {children}
    </WeatherContext.Provider>
  )
}

export function useWeather(): WeatherContextValue {
  const ctx = useContext(WeatherContext)
  if (!ctx) throw new Error('useWeather must be used within a WeatherProvider')
  return ctx
}
