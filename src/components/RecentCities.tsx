import { useCallback } from 'react'
import { MapPin } from 'lucide-react'
import { useWeather } from '@/context/WeatherContext.tsx'
import { fetchWeather } from '@/lib/api.ts'
import type { City } from '@/types/index.ts'

export function RecentCities() {
  const { preferences, selectCity, loadingCityKey } = useWeather()
  const { recentCities } = preferences

  // Prefetch weather on hover — warms the forecast cache so click is instant
  const prefetchCity = useCallback((city: City) => {
    fetchWeather(city.lat, city.lon, city.name, city.country).catch(() => {
      // Prefetch is best-effort — ignore errors silently
    })
  }, [])

  if (recentCities.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Recent cities">
      {recentCities.map((city) => {
        const isLoading = loadingCityKey === `${city.lat},${city.lon}`
        return (
        <button
          key={`${city.lat}-${city.lon}`}
          role="listitem"
          className={`glass-chip flex items-center gap-1.5 ${isLoading ? 'animate-pulse opacity-70' : ''}`}
          onClick={() => selectCity(city)}
          onMouseEnter={() => prefetchCity(city)}
          onFocus={() => prefetchCity(city)}
          aria-label={`View weather for ${city.name}, ${city.country}`}
        >
          <MapPin size={11} className="opacity-50" aria-hidden="true" />
          <span>{city.name}</span>
        </button>
        )
      })}
    </div>
  )
}
