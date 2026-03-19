import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TemperatureChart } from '../TemperatureChart.tsx'
import type { WeatherData, UserPreferences } from '@/types/index.ts'

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
  hourly: [],
  alerts: [],
}

let mockWeather: WeatherData | null = mockWeatherData
let mockPreferences: UserPreferences = {
  unitPreference: 'celsius',
  darkModeEnabled: false,
  sceneDisabled: false,
  recentCities: [],
}

vi.mock('@/context/WeatherContext.tsx', () => ({
  useWeather: () => ({
    weather: mockWeather,
    preferences: mockPreferences,
  }),
}))

beforeEach(() => {
  mockWeather = mockWeatherData
  mockPreferences = {
    unitPreference: 'celsius',
    darkModeEnabled: false,
    sceneDisabled: false,
    recentCities: [],
  }
})

describe('TemperatureChart', () => {
  it('renders null when weather is null', () => {
    mockWeather = null
    const { container } = render(<TemperatureChart />)
    expect(container.firstChild).toBeNull()
  })

  it('renders section with accessible label', () => {
    render(<TemperatureChart />)
    expect(screen.getByLabelText('Temperature trend chart')).toBeInTheDocument()
  })

  it('renders section heading', () => {
    render(<TemperatureChart />)
    expect(screen.getByText('Temperature Trend')).toBeInTheDocument()
  })

  it('renders the chart container', () => {
    const { container } = render(<TemperatureChart />)
    // Recharts renders a ResponsiveContainer
    const chartDiv = container.querySelector('.recharts-responsive-container')
    expect(chartDiv).toBeInTheDocument()
  })
})
