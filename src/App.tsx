import { useState, useCallback } from 'react'
import { WeatherProvider, useWeather } from '@/context/WeatherContext.tsx'
import { Header } from '@/components/Header.tsx'
import { SearchBar } from '@/components/SearchBar.tsx'
import { RecentCities } from '@/components/RecentCities.tsx'
import { CurrentWeather } from '@/components/CurrentWeather.tsx'
import { Forecast } from '@/components/Forecast.tsx'
import { TemperatureChart } from '@/components/TemperatureChart.tsx'
import { AlertBanner } from '@/components/AlertBanner.tsx'
import { ErrorState } from '@/components/ErrorState.tsx'
import { Toast } from '@/components/Toast.tsx'
import { HourlyForecast } from '@/components/HourlyForecast.tsx'
import { WeatherScene } from '@/scenes/WeatherScene.tsx'
import { SceneErrorBoundary } from '@/components/SceneErrorBoundary.tsx'
import { AppErrorBoundary } from '@/components/AppErrorBoundary.tsx'

function WeatherApp() {
  const { loading, refreshing, error, weather, geoError } = useWeather()
  const [showGeoToast, setShowGeoToast] = useState(true)

  const dismissToast = useCallback(() => setShowGeoToast(false), [])

  // Show app shell immediately — never block the entire UI with a spinner.
  // Initial load: show Header + Search + skeletons.
  // City switch (refreshing): keep old weather data visible with subtle indicator.
  const showSkeletons = loading && !weather
  const showWeatherContent = !error && weather

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
          {/* Search section — always visible */}
          <section aria-label="City search" className="flex flex-col gap-3">
            <SearchBar />
            <RecentCities />
          </section>

          {error && !refreshing ? (
            <ErrorState />
          ) : showSkeletons ? (
            <WeatherSkeletons />
          ) : showWeatherContent ? (
            <div className={`flex flex-col gap-6 transition-opacity duration-200 ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
              {refreshing && (
                <div className="sr-only" role="status" aria-live="polite">
                  Updating weather data...
                </div>
              )}
              <AlertBanner />
              <CurrentWeather />
              <HourlyForecast />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Forecast />
                <TemperatureChart />
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}

function WeatherSkeletons() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading weather data">
      <div className="sr-only">Loading weather data...</div>
      {/* Current weather skeleton */}
      <div className="glass-card animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-9 w-40 rounded-lg bg-white/10" />
            <div className="h-4 w-24 rounded bg-white/10 mt-2" />
            <div className="h-16 w-48 rounded-lg bg-white/10 mt-3" />
            <div className="h-5 w-32 rounded bg-white/10 mt-2" />
          </div>
          <div className="flex flex-row sm:flex-col gap-4 sm:gap-3">
            <div className="h-10 w-24 rounded bg-white/10" />
            <div className="h-10 w-24 rounded bg-white/10" />
            <div className="h-10 w-24 rounded bg-white/10" />
          </div>
        </div>
      </div>

      {/* Hourly forecast skeleton */}
      <div className="glass-card animate-pulse">
        <div className="h-6 w-36 rounded bg-white/10 mb-3" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 min-w-[60px] py-2">
              <div className="h-3 w-8 rounded bg-white/10" />
              <div className="h-5 w-5 rounded-full bg-white/10" />
              <div className="h-4 w-8 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      {/* Forecast + Chart skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card animate-pulse">
          <div className="h-6 w-32 rounded bg-white/10 mb-4" />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 py-3">
                <div className="h-4 w-10 rounded bg-white/10" />
                <div className="h-7 w-7 rounded-full bg-white/10" />
                <div className="h-5 w-10 rounded bg-white/10" />
                <div className="h-4 w-8 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card animate-pulse">
          <div className="h-6 w-40 rounded bg-white/10 mb-4" />
          <div className="h-[200px] w-full rounded-lg bg-white/10" />
        </div>
      </div>
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
