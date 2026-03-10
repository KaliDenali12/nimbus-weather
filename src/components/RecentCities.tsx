import { MapPin } from 'lucide-react'
import { useWeather } from '@/context/WeatherContext.tsx'

export function RecentCities() {
  const { preferences, selectCity } = useWeather()
  const { recentCities } = preferences

  if (recentCities.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Recent cities">
      {recentCities.map((city) => (
        <button
          key={`${city.lat}-${city.lon}`}
          role="listitem"
          className="glass-chip flex items-center gap-1.5"
          onClick={() => selectCity(city)}
        >
          <MapPin size={11} className="opacity-50" aria-hidden="true" />
          <span>{city.name}</span>
        </button>
      ))}
    </div>
  )
}
