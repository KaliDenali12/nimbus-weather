import { Droplets, Wind, Thermometer } from 'lucide-react'
import { useWeather } from '@/context/WeatherContext.tsx'
import { WeatherIcon } from '@/components/WeatherIcon.tsx'
import { formatTemp, formatWindSpeed } from '@/lib/units.ts'
import { getWeatherLabel } from '@/lib/weather-codes.ts'

export function CurrentWeather() {
  const { weather, preferences } = useWeather()

  if (!weather) return null

  const { current, location } = weather
  const unit = preferences.unitPreference

  return (
    <section className="glass-card" aria-label="Current weather conditions">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Location & Temperature */}
        <div>
          <h2 className="font-display text-display-lg tracking-[-0.5px]">
            {location.name}
          </h2>
          <p className="text-body-sm mt-0.5 text-secondary">
            {location.country}
          </p>

          <div className="flex items-end gap-3 mt-3">
            <span className="font-display text-display-xl tracking-[-1.5px] leading-none">
              {formatTemp(current.temperature, unit)}
            </span>
            <WeatherIcon code={current.weatherCode} isDay={current.isDay} size={48} className="mb-2 opacity-80" />
          </div>

          <p className="text-body mt-1 font-medium">
            {getWeatherLabel(current.weatherCode)}
          </p>
        </div>

        {/* Right: Details */}
        <div className="flex flex-row sm:flex-col gap-4 sm:gap-3">
          <div className="flex items-center gap-2">
            <Thermometer size={16} className="opacity-60" aria-hidden="true" />
            <div>
              <p className="text-caption uppercase tracking-[1.5px] text-secondary">
                FEELS LIKE
              </p>
              <p className="text-body font-medium">
                {formatTemp(current.feelsLike, unit)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Droplets size={16} className="opacity-60" aria-hidden="true" />
            <div>
              <p className="text-caption uppercase tracking-[1.5px] text-secondary">
                HUMIDITY
              </p>
              <p className="text-body font-medium">
                {Math.round(current.humidity)}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Wind size={16} className="opacity-60" aria-hidden="true" />
            <div>
              <p className="text-caption uppercase tracking-[1.5px] text-secondary">
                WIND
              </p>
              <p className="text-body font-medium">
                {formatWindSpeed(current.windSpeed, unit)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
