import { Droplets } from 'lucide-react'
import { useWeather } from '@/context/WeatherContext.tsx'
import { WeatherIcon } from '@/components/WeatherIcon.tsx'
import { formatTemp } from '@/lib/units.ts'

function formatHour(isoTime: string): string {
  const date = new Date(isoTime)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', hour12: true })
}

export function HourlyForecast() {
  const { weather, preferences } = useWeather()

  if (!weather || weather.hourly.length === 0) return null

  return (
    <section
      className="glass-card"
      role="region"
      aria-label="Hourly forecast for next 24 hours"
    >
      <h2 className="font-display text-heading-2 mb-3">Hourly Forecast</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
        {weather.hourly.map((hour) => (
          <div
            key={hour.time}
            className="flex flex-col items-center gap-1.5 snap-start min-w-[60px] py-2"
          >
            <span className="text-caption opacity-70">{formatHour(hour.time)}</span>
            <WeatherIcon code={hour.weatherCode} size={20} />
            <span className="text-body-sm font-semibold">
              {formatTemp(hour.temperature, preferences.unitPreference)}
            </span>
            {hour.precipitationProbability > 0 && (
              <div className="flex items-center gap-0.5 opacity-70">
                <Droplets size={10} aria-hidden="true" />
                <span className="text-caption">{hour.precipitationProbability}%</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
