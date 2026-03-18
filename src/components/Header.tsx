import { Sun, Moon, Thermometer } from 'lucide-react'
import { useWeather } from '@/context/WeatherContext.tsx'

export function Header() {
  const { preferences, toggleUnit, toggleDark } = useWeather()

  return (
    <header className="flex items-center justify-between py-4">
      <h1 className="font-display text-heading-1 tracking-[-0.5px]">
        Nimbus
      </h1>

      <nav aria-label="Settings" className="flex items-center gap-2">
        <button
          className="glass-button flex items-center gap-1.5"
          onClick={toggleUnit}
          aria-label={`Switch to ${preferences.unitPreference === 'celsius' ? 'Fahrenheit' : 'Celsius'}`}
        >
          <Thermometer size={16} aria-hidden="true" />
          <span>{preferences.unitPreference === 'celsius' ? '°C' : '°F'}</span>
        </button>

        <button
          className="glass-button flex items-center gap-1.5"
          onClick={toggleDark}
          aria-label={`${preferences.darkModeEnabled ? 'Disable' : 'Enable'} dark mode`}
        >
          {preferences.darkModeEnabled ? (
            <Sun size={16} aria-hidden="true" />
          ) : (
            <Moon size={16} aria-hidden="true" />
          )}
        </button>
      </nav>
    </header>
  )
}
