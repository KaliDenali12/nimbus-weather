import { useState, useCallback } from 'react'
import { WeatherProvider, useWeather } from '@/context/WeatherContext.tsx'
import { Header } from '@/components/Header.tsx'
import { SearchBar } from '@/components/SearchBar.tsx'
import { RecentCities } from '@/components/RecentCities.tsx'
import { CurrentWeather } from '@/components/CurrentWeather.tsx'
import { Forecast } from '@/components/Forecast.tsx'
import { TemperatureChart } from '@/components/TemperatureChart.tsx'
import { AlertBanner } from '@/components/AlertBanner.tsx'
import { LoadingState } from '@/components/LoadingState.tsx'
import { ErrorState } from '@/components/ErrorState.tsx'
import { Toast } from '@/components/Toast.tsx'

function WeatherApp() {
  const { loading, error, geoError } = useWeather()
  const [showGeoToast, setShowGeoToast] = useState(true)

  const dismissToast = useCallback(() => setShowGeoToast(false), [])

  if (loading) return <LoadingState />

  return (
    <div className="relative min-h-screen">
      {/* Geo error toast */}
      {geoError && showGeoToast && (
        <Toast
          message={
            geoError === 'denied'
              ? "Location access denied. We've landed you in Antarctica! Use the search bar to find your city."
              : "Couldn't detect your location. Showing Antarctica for now."
          }
          onDismiss={dismissToast}
        />
      )}

      {/* Main content */}
      <main className="relative z-10 max-w-app mx-auto px-4 sm:px-6 pb-10">
        <Header />

        <div className="flex flex-col gap-6 mt-2">
          {/* Search section */}
          <div className="flex flex-col gap-3">
            <SearchBar />
            <RecentCities />
          </div>

          {error ? (
            <ErrorState />
          ) : (
            <>
              <AlertBanner />
              <CurrentWeather />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Forecast />
                <TemperatureChart />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <WeatherProvider>
      <WeatherApp />
    </WeatherProvider>
  )
}
