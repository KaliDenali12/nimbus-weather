import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { WeatherData } from '@/types/index.ts'

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

vi.mock('@/scenes/WeatherScene.tsx', () => ({
  WeatherScene: () => <div data-testid="weather-scene" />,
}))

import App from '@/App.tsx'
import { fetchWeather, searchCities } from '@/lib/api.ts'
import { getUserLocation } from '@/lib/geolocation.ts'
import { applyTheme, getTheme } from '@/lib/theme.ts'

const tokyoWeather: WeatherData = {
  location: { name: 'Tokyo', country: 'Japan', latitude: 35.68, longitude: 139.69, timezone: 'Asia/Tokyo' },
  current: { temperature: 22, feelsLike: 20, humidity: 65, windSpeed: 12, weatherCode: 0, isDay: true },
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

const londonWeather: WeatherData = {
  location: { name: 'London', country: 'United Kingdom', latitude: 51.51, longitude: -0.13, timezone: 'Europe/London' },
  current: { temperature: 12, feelsLike: 10, humidity: 78, windSpeed: 15, weatherCode: 61, isDay: true },
  daily: [
    { date: '2026-03-17', tempHigh: 13, tempLow: 7, weatherCode: 61, precipitationProbability: 80 },
    { date: '2026-03-18', tempHigh: 11, tempLow: 5, weatherCode: 3, precipitationProbability: 40 },
    { date: '2026-03-19', tempHigh: 14, tempLow: 8, weatherCode: 0, precipitationProbability: 10 },
    { date: '2026-03-20', tempHigh: 16, tempLow: 9, weatherCode: 2, precipitationProbability: 20 },
    { date: '2026-03-21', tempHigh: 15, tempLow: 8, weatherCode: 1, precipitationProbability: 15 },
    { date: '2026-03-22', tempHigh: 13, tempLow: 6, weatherCode: 51, precipitationProbability: 60 },
  ],
  alerts: [],
}

function setupSuccessfulGeo() {
  vi.mocked(getUserLocation).mockResolvedValue({
    ok: true,
    position: { latitude: 35.68, longitude: 139.69 },
  })
  vi.mocked(searchCities).mockResolvedValue([
    { id: 1, name: 'Tokyo', latitude: 35.68, longitude: 139.69, country: 'Japan', country_code: 'JP' },
  ])
  vi.mocked(fetchWeather).mockResolvedValue(tokyoWeather)
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('Integration: Full User Workflow', () => {
  it('loads app → shows Tokyo → search London → switch to London', async () => {
    setupSuccessfulGeo()

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Tokyo')).toBeInTheDocument()
    })

    // Now search for London
    vi.mocked(searchCities).mockResolvedValue([
      { id: 10, name: 'London', latitude: 51.51, longitude: -0.13, country: 'United Kingdom', country_code: 'GB', admin1: 'England' },
    ])
    vi.mocked(fetchWeather).mockResolvedValue(londonWeather)

    const input = screen.getByLabelText('Search for a city')
    fireEvent.change(input, { target: { value: 'London' } })

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('option')[0]!)

    // fetchWeather should be called with London coordinates
    await waitFor(() => {
      expect(fetchWeather).toHaveBeenCalledWith(51.51, -0.13, 'London', 'United Kingdom')
    })

    // Country text confirms London weather is shown
    await waitFor(() => {
      expect(screen.getByText('United Kingdom')).toBeInTheDocument()
    })
  })

  it('toggles temperature unit and persists preference', async () => {
    setupSuccessfulGeo()

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Tokyo')).toBeInTheDocument()
    })

    // Initially celsius — main temp display shows 22°
    expect(screen.getByText('°C')).toBeInTheDocument()
    const celsiusTemps = screen.getAllByText('22°')
    expect(celsiusTemps.length).toBeGreaterThanOrEqual(1)

    // Toggle to fahrenheit
    fireEvent.click(screen.getByLabelText('Switch to Fahrenheit'))

    expect(screen.getByText('°F')).toBeInTheDocument()
    // 22°C → 72°F — should appear in main display
    const fahrenheitTemps = screen.getAllByText('72°')
    expect(fahrenheitTemps.length).toBeGreaterThanOrEqual(1)

    // Check localStorage was updated
    const stored = JSON.parse(localStorage.getItem('nimbus-preferences')!)
    expect(stored.unitPreference).toBe('fahrenheit')
  })

  it('toggles dark mode and triggers theme application', async () => {
    setupSuccessfulGeo()

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Tokyo')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Enable dark mode'))

    expect(getTheme).toHaveBeenCalled()
    expect(applyTheme).toHaveBeenCalled()

    const stored = JSON.parse(localStorage.getItem('nimbus-preferences')!)
    expect(stored.darkModeEnabled).toBe(true)
  })

  it('geolocation denied → shows toast → user sees fallback', async () => {
    vi.mocked(getUserLocation).mockResolvedValue({ ok: false, error: 'denied' })
    vi.mocked(fetchWeather).mockResolvedValue({
      ...tokyoWeather,
      location: { ...tokyoWeather.location, name: 'Antarctica', country: 'AQ' },
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Antarctica')).toBeInTheDocument()
    })

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/Location access denied/)).toBeInTheDocument()
  })

  it('API failure → shows error → retry succeeds', async () => {
    vi.mocked(getUserLocation).mockResolvedValue({
      ok: true,
      position: { latitude: 35.68, longitude: 139.69 },
    })
    vi.mocked(searchCities).mockResolvedValue([])
    vi.mocked(fetchWeather).mockRejectedValueOnce(new Error('Server down'))

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
    expect(screen.getByText('Server down')).toBeInTheDocument()

    // Fix the API and retry
    vi.mocked(fetchWeather).mockResolvedValue(tokyoWeather)
    vi.mocked(searchCities).mockResolvedValue([
      { id: 1, name: 'Tokyo', latitude: 35.68, longitude: 139.69, country: 'Japan', country_code: 'JP' },
    ])

    fireEvent.click(screen.getByText('Try Again'))

    await waitFor(() => {
      expect(screen.getByText('Tokyo')).toBeInTheDocument()
    })
  })

  it('recent cities persist across search', async () => {
    setupSuccessfulGeo()

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Tokyo')).toBeInTheDocument()
    })

    vi.mocked(searchCities).mockResolvedValue([
      { id: 10, name: 'London', latitude: 51.51, longitude: -0.13, country: 'United Kingdom', country_code: 'GB', admin1: 'England' },
    ])
    vi.mocked(fetchWeather).mockResolvedValue(londonWeather)

    const input = screen.getByLabelText('Search for a city')
    fireEvent.change(input, { target: { value: 'London' } })

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('option')[0]!)

    // Wait for the city selection API call to complete
    await waitFor(() => {
      expect(fetchWeather).toHaveBeenCalledWith(51.51, -0.13, 'London', 'United Kingdom')
    })

    // Recent cities should persist to localStorage
    const stored = JSON.parse(localStorage.getItem('nimbus-preferences')!)
    expect(stored.recentCities).toHaveLength(1)
    expect(stored.recentCities[0].name).toBe('London')
  })
})
