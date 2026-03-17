import { CloudOff } from 'lucide-react'
import { useWeather } from '@/context/WeatherContext.tsx'

export function ErrorState() {
  const { error, retry } = useWeather()

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="glass-card text-center max-w-md">
        <CloudOff size={48} className="mx-auto mb-4 opacity-40" aria-hidden="true" />
        <h2 className="font-display text-heading-2 mb-2">
          Weather Unavailable
        </h2>
        <p className="text-body mb-6 text-secondary">
          {error ?? 'Unable to fetch weather data. Please check your connection and try again.'}
        </p>
        <button className="glass-button px-6 py-2.5" onClick={retry}>
          Try Again
        </button>
      </div>
    </div>
  )
}
