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
import { WeatherScene } from '@/scenes/WeatherScene.tsx'
import { SceneErrorBoundary } from '@/components/SceneErrorBoundary.tsx'
import { AppErrorBoundary } from '@/components/AppErrorBoundary.tsx'

function WeatherApp() {
  const { loading, error, geoError } = useWeather()
  const [showGeoToast, setShowGeoToast] = useState(true)

  const dismissToast = useCallback(() => setShowGeoToast(false), [])

  if (loading) return <LoadingState />

  return (
    <div className="relative min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:glass-button focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>

      {/* 3D Background Scene */}
      <SceneErrorBoundary>
        <WeatherScene />
      </SceneErrorBoundary>

      {/* Geo error toast */}
      {geoError && showGeoToast && (
        <Toast
          message={
            geoError === 'denied'
              ? "Location access was not granted. We've landed you in Antarctica! Use the search bar to find your city."
              : geoError === 'timeout'
                ? "Location detection timed out. Showing Antarctica for now — try searching for your city."
                : "Location detection is not available. Use the search bar to find your city."
          }
          onDismiss={dismissToast}
        />
      )}

      {/* Main content */}
      <main id="main-content" className="relative z-10 max-w-app mx-auto px-4 sm:px-6 pb-10">
        <Header />

        <div className="flex flex-col gap-6 mt-2">
          {/* Search section */}
          <section aria-label="City search" className="flex flex-col gap-3">
            <SearchBar />
            <RecentCities />
          </section>

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

export function App() {
  return (
    <AppErrorBoundary>
      <WeatherProvider>
        <WeatherApp />
      </WeatherProvider>
    </AppErrorBoundary>
  )
}
