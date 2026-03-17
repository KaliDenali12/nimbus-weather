import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { WeatherData } from '@/types/index.ts'

// Mock all external dependencies before importing App
vi.mock('@/lib/api.ts', () => ({
  fetchWeather: vi.fn(),
  searchCities: vi.fn(),
}))

vi.mock('@/lib/geolocation.ts', () => ({
  getUserLocation: vi.fn(),
  ANTARCTICA: { latitude: -82.86, longitude: 135.0, name: 'Antarctica', country: 'AQ' },
}))

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

// Mock the entire scenes directory — WebGL is not available in jsdom
vi.mock('@/scenes/WeatherScene.tsx', () => ({
  WeatherScene: () => <div data-testid="weather-scene" />,
}))

import { App } from '@/App.tsx'
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
    { date: '2026-03-19', tempHigh: 20, tempLow: 12, weatherCode: 3, precipitationProbability: 30 },
    { date: '2026-03-20', tempHigh: 18, tempLow: 10, weatherCode: 61, precipitationProbability: 80 },
    { date: '2026-03-21', tempHigh: 19, tempLow: 11, weatherCode: 0, precipitationProbability: 5 },
    { date: '2026-03-22', tempHigh: 21, tempLow: 13, weatherCode: 2, precipitationProbability: 15 },
  ],
  alerts: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('Smoke Tests', () => {
  it('app loads without crashing', async () => {
    vi.mocked(getUserLocation).mockResolvedValue({
      ok: true,
      position: { latitude: 35.68, longitude: 139.69 },
    })
    vi.mocked(searchCities).mockResolvedValue([
      { id: 1, name: 'Tokyo', latitude: 35.68, longitude: 139.69, country: 'Japan', country_code: 'JP' },
    ])
    vi.mocked(fetchWeather).mockResolvedValue(mockWeatherData)

    const { container } = render(<App />)

    expect(container.firstChild).not.toBeNull()
  })

  it('shows loading state initially then resolves to main content', async () => {
    vi.mocked(getUserLocation).mockResolvedValue({
      ok: true,
      position: { latitude: 35.68, longitude: 139.69 },
    })
    vi.mocked(searchCities).mockResolvedValue([])
    vi.mocked(fetchWeather).mockResolvedValue(mockWeatherData)

    render(<App />)

    // Loading state should appear
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Fetching weather data...')).toBeInTheDocument()

    // Then resolves to main content
    await waitFor(() => {
      expect(screen.getByText('Nimbus')).toBeInTheDocument()
    })
  })

  it('main page renders with weather data and key sections', async () => {
    vi.mocked(getUserLocation).mockResolvedValue({
      ok: true,
      position: { latitude: 35.68, longitude: 139.69 },
    })
    vi.mocked(searchCities).mockResolvedValue([
      { id: 1, name: 'Tokyo', latitude: 35.68, longitude: 139.69, country: 'Japan', country_code: 'JP' },
    ])
    vi.mocked(fetchWeather).mockResolvedValue(mockWeatherData)

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Tokyo')).toBeInTheDocument()
    })

    // Key sections are present
    expect(screen.getByText('Japan')).toBeInTheDocument()
    expect(screen.getByLabelText('Current weather conditions')).toBeInTheDocument()
    expect(screen.getByLabelText('5-day weather forecast')).toBeInTheDocument()
    expect(screen.getByLabelText('Search for a city')).toBeInTheDocument()
  })

  it('API layer is called with correct coordinates', async () => {
    vi.mocked(getUserLocation).mockResolvedValue({
      ok: true,
      position: { latitude: 35.68, longitude: 139.69 },
    })
    vi.mocked(searchCities).mockResolvedValue([
      { id: 1, name: 'Tokyo', latitude: 35.68, longitude: 139.69, country: 'Japan', country_code: 'JP' },
    ])
    vi.mocked(fetchWeather).mockResolvedValue(mockWeatherData)

    render(<App />)

    await waitFor(() => {
      expect(fetchWeather).toHaveBeenCalled()
    })

    expect(fetchWeather).toHaveBeenCalledWith(35.68, 139.69, 'Tokyo', 'Japan')
  })

  it('handles geolocation failure gracefully with Antarctica fallback', async () => {
    vi.mocked(getUserLocation).mockResolvedValue({ ok: false, error: 'denied' })
    vi.mocked(fetchWeather).mockResolvedValue({
      ...mockWeatherData,
      location: { ...mockWeatherData.location, name: 'Antarctica', country: 'AQ' },
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Antarctica')).toBeInTheDocument()
    })

    // Toast should appear for geo error
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('handles API failure with error state and retry button', async () => {
    vi.mocked(getUserLocation).mockResolvedValue({
      ok: true,
      position: { latitude: 35.68, longitude: 139.69 },
    })
    vi.mocked(searchCities).mockResolvedValue([])
    vi.mocked(fetchWeather).mockRejectedValue(new Error('Network error'))

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Weather Unavailable')).toBeInTheDocument()
    })

    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })
})
