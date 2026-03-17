import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { WeatherProvider, useWeather } from '../WeatherContext.tsx'
import type { WeatherData } from '@/types/index.ts'

// Mock API module
vi.mock('@/lib/api.ts', () => ({
  fetchWeather: vi.fn(),
  searchCities: vi.fn(),
}))

// Mock geolocation module
vi.mock('@/lib/geolocation.ts', () => ({
  getUserLocation: vi.fn(),
  ANTARCTICA: { latitude: -82.86, longitude: 135.0, name: 'Antarctica', country: 'AQ' },
}))

// Mock theme module (applyTheme mutates DOM)
vi.mock('@/lib/theme.ts', () => ({
  getTheme: vi.fn().mockReturnValue({
    bgGradient: 'linear-gradient(to bottom, #87CEEB, #E0F7FA)',
    cardSurface: 'rgba(255,255,255,0.15)',
    cardBorder: 'rgba(255,255,255,0.25)',
    textPrimary: '#1e293b',
    textSecondary: '#475569',
  }),
  applyTheme: vi.fn(),
}))

import { fetchWeather, searchCities } from '@/lib/api.ts'
import { getUserLocation } from '@/lib/geolocation.ts'

const mockWeatherData: WeatherData = {
  location: {
    name: 'Tokyo',
    country: 'Japan',
    latitude: 35.68,
    longitude: 139.69,
    timezone: 'Asia/Tokyo',
  },
  current: {
    temperature: 22,
    feelsLike: 20,
    humidity: 65,
    windSpeed: 12,
    weatherCode: 0,
    isDay: true,
  },
  daily: [
    { date: '2026-03-17', tempHigh: 24, tempLow: 15, weatherCode: 0, precipitationProbability: 10 },
    { date: '2026-03-18', tempHigh: 22, tempLow: 14, weatherCode: 1, precipitationProbability: 20 },
  ],
  alerts: [],
}

// Test consumer component that exposes context values
function TestConsumer() {
  const ctx = useWeather()
  return (
    <div>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <span data-testid="city">{ctx.weather?.location.name ?? 'none'}</span>
      <span data-testid="condition">{ctx.condition}</span>
      <span data-testid="time">{ctx.timeOfDay}</span>
      <span data-testid="unit">{ctx.preferences.unitPreference}</span>
      <span data-testid="dark">{String(ctx.preferences.darkModeEnabled)}</span>
      <span data-testid="error">{ctx.error ?? 'none'}</span>
      <span data-testid="geo-error">{ctx.geoError ?? 'none'}</span>
      <button data-testid="toggle-unit" onClick={ctx.toggleUnit}>toggle unit</button>
      <button data-testid="toggle-dark" onClick={ctx.toggleDark}>toggle dark</button>
      <button data-testid="retry" onClick={ctx.retry}>retry</button>
      <button
        data-testid="select-city"
        onClick={() => ctx.selectCity({ name: 'London', lat: 51.51, lon: -0.13, country: 'UK' })}
      >
        select city
      </button>
    </div>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('WeatherContext', () => {
  it('throws when useWeather is called outside provider', () => {
    // Suppress React error boundary console output
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow(
      'useWeather must be used within a WeatherProvider',
    )
  })

  it('loads weather via geolocation on mount', async () => {
    vi.mocked(getUserLocation).mockResolvedValue({
      ok: true,
      position: { latitude: 35.68, longitude: 139.69 },
    })
    vi.mocked(searchCities).mockResolvedValue([
      { id: 1, name: 'Tokyo', latitude: 35.68, longitude: 139.69, country: 'Japan', country_code: 'JP' },
    ])
    vi.mocked(fetchWeather).mockResolvedValue(mockWeatherData)

    render(
      <WeatherProvider>
        <TestConsumer />
      </WeatherProvider>,
    )

    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true')

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(screen.getByTestId('city').textContent).toBe('Tokyo')
    expect(screen.getByTestId('condition').textContent).toBe('clear')
    expect(screen.getByTestId('time').textContent).toBe('day')
  })

  it('falls back to Antarctica when geolocation denied', async () => {
    vi.mocked(getUserLocation).mockResolvedValue({ ok: false, error: 'denied' })
    vi.mocked(fetchWeather).mockResolvedValue({
      ...mockWeatherData,
      location: { ...mockWeatherData.location, name: 'Antarctica', country: 'AQ' },
    })

    render(
      <WeatherProvider>
        <TestConsumer />
      </WeatherProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(screen.getByTestId('geo-error').textContent).toBe('denied')
    expect(screen.getByTestId('city').textContent).toBe('Antarctica')
  })

  it('sets error state when fetchWeather fails', async () => {
    vi.mocked(getUserLocation).mockResolvedValue({
      ok: true,
      position: { latitude: 35.68, longitude: 139.69 },
    })
    vi.mocked(searchCities).mockResolvedValue([])
    vi.mocked(fetchWeather).mockRejectedValue(new Error('Network error'))

    render(
      <WeatherProvider>
        <TestConsumer />
      </WeatherProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(screen.getByTestId('error').textContent).toBe('Unable to fetch weather data. Please check your connection and try again.')
  })

  it('toggles unit preference', async () => {
    vi.mocked(getUserLocation).mockResolvedValue({
      ok: true,
      position: { latitude: 0, longitude: 0 },
    })
    vi.mocked(searchCities).mockResolvedValue([])
    vi.mocked(fetchWeather).mockResolvedValue(mockWeatherData)

    render(
      <WeatherProvider>
        <TestConsumer />
      </WeatherProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(screen.getByTestId('unit').textContent).toBe('celsius')

    act(() => {
      fireEvent.click(screen.getByTestId('toggle-unit'))
    })

    expect(screen.getByTestId('unit').textContent).toBe('fahrenheit')
  })

  it('toggles dark mode', async () => {
    vi.mocked(getUserLocation).mockResolvedValue({
      ok: true,
      position: { latitude: 0, longitude: 0 },
    })
    vi.mocked(searchCities).mockResolvedValue([])
    vi.mocked(fetchWeather).mockResolvedValue(mockWeatherData)

    render(
      <WeatherProvider>
        <TestConsumer />
      </WeatherProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    const initialDark = screen.getByTestId('dark').textContent

    act(() => {
      fireEvent.click(screen.getByTestId('toggle-dark'))
    })

    expect(screen.getByTestId('dark').textContent).not.toBe(initialDark)
  })

  it('selects a city and updates weather', async () => {
    vi.mocked(getUserLocation).mockResolvedValue({
      ok: true,
      position: { latitude: 0, longitude: 0 },
    })
    vi.mocked(searchCities).mockResolvedValue([])
    vi.mocked(fetchWeather)
      .mockResolvedValueOnce(mockWeatherData)
      .mockResolvedValueOnce({
        ...mockWeatherData,
        location: { ...mockWeatherData.location, name: 'London', country: 'UK' },
      })

    render(
      <WeatherProvider>
        <TestConsumer />
      </WeatherProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    act(() => {
      fireEvent.click(screen.getByTestId('select-city'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('city').textContent).toBe('London')
    })

    expect(fetchWeather).toHaveBeenCalledWith(51.51, -0.13, 'London', 'UK')
  })

  it('persists preferences to localStorage', async () => {
    vi.mocked(getUserLocation).mockResolvedValue({
      ok: true,
      position: { latitude: 0, longitude: 0 },
    })
    vi.mocked(searchCities).mockResolvedValue([])
    vi.mocked(fetchWeather).mockResolvedValue(mockWeatherData)

    render(
      <WeatherProvider>
        <TestConsumer />
      </WeatherProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    act(() => {
      fireEvent.click(screen.getByTestId('toggle-unit'))
    })

    const stored = JSON.parse(localStorage.getItem('nimbus-preferences')!)
    expect(stored.unitPreference).toBe('fahrenheit')
  })

  it('retries location initialization', async () => {
    vi.mocked(getUserLocation).mockResolvedValue({
      ok: true,
      position: { latitude: 0, longitude: 0 },
    })
    vi.mocked(searchCities).mockResolvedValue([])
    vi.mocked(fetchWeather).mockResolvedValue(mockWeatherData)

    render(
      <WeatherProvider>
        <TestConsumer />
      </WeatherProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    act(() => {
      fireEvent.click(screen.getByTestId('retry'))
    })

    // getUserLocation should be called again
    await waitFor(() => {
      expect(getUserLocation).toHaveBeenCalledTimes(2)
    })
  })
})
