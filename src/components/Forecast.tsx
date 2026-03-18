import { Droplets } from 'lucide-react'
import { useWeather } from '@/context/WeatherContext.tsx'
import { WeatherIcon } from '@/components/WeatherIcon.tsx'
import { formatTemp, formatDayName } from '@/lib/units.ts'

export function Forecast() {
  const { weather, preferences } = useWeather()

  if (!weather) return null

  const unit = preferences.unitPreference
  const isDay = weather.current.isDay

  return (
    <section className="glass-card" aria-label="5-day weather forecast">
      <h3 className="font-display text-heading-3 mb-4 text-secondary">
        5-Day Forecast
      </h3>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
        {weather.daily.slice(0, 6).map((day, i) => (
          <div
            key={day.date}
            className="flex flex-col items-center gap-2 py-3 rounded-xl
              hover:-translate-y-0.5 hover:bg-white/[0.06] transition-all duration-200"
          >
            <time dateTime={day.date} className="text-label text-secondary">
              {formatDayName(day.date, i)}
            </time>

            <WeatherIcon code={day.weatherCode} isDay={i === 0 ? isDay : true} size={28} className="opacity-80" />

            <div className="text-center">
              <span className="font-display text-heading-3 block">
                {formatTemp(day.tempHigh, unit)}
              </span>
              <span className="text-body-sm block text-secondary">
                {formatTemp(day.tempLow, unit)}
              </span>
            </div>

            {day.precipitationProbability > 0 && (
              <div className="flex items-center gap-0.5" style={{ color: 'var(--color-info)' }}>
                <Droplets size={10} aria-hidden="true" />
                <span className="text-caption">{day.precipitationProbability}%</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
