import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Forecast } from '../Forecast.tsx'
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
    { date: '2026-03-18', tempHigh: 22, tempLow: 14, weatherCode: 1, precipitationProbability: 0 },
    { date: '2026-03-19', tempHigh: 20, tempLow: 12, weatherCode: 61, precipitationProbability: 80 },
    { date: '2026-03-20', tempHigh: 18, tempLow: 10, weatherCode: 71, precipitationProbability: 60 },
    { date: '2026-03-21', tempHigh: 19, tempLow: 11, weatherCode: 0, precipitationProbability: 0 },
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

describe('Forecast', () => {
  it('renders null when weather is null', () => {
    mockWeather = null
    const { container } = render(<Forecast />)
    expect(container.firstChild).toBeNull()
  })

  it('renders section with accessible label', () => {
    render(<Forecast />)
    expect(screen.getByLabelText('5-day weather forecast')).toBeInTheDocument()
  })

  it('renders section heading', () => {
    render(<Forecast />)
    expect(screen.getByText('5-Day Forecast')).toBeInTheDocument()
  })

  it('renders Today for the first day', () => {
    render(<Forecast />)
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('renders Tomorrow for the second day', () => {
    render(<Forecast />)
    expect(screen.getByText('Tomorrow')).toBeInTheDocument()
  })

  it('renders high and low temperatures in celsius', () => {
    render(<Forecast />)
    // First day: tempHigh=24 → "24°", tempLow=15 → "15°"
    expect(screen.getByText('24°')).toBeInTheDocument()
    expect(screen.getByText('15°')).toBeInTheDocument()
  })

  it('renders precipitation probability when > 0', () => {
    render(<Forecast />)
    // Third day has 80% precipitation probability
    expect(screen.getByText('80%')).toBeInTheDocument()
  })

  it('does not render precipitation when probability is 0', () => {
    render(<Forecast />)
    // Second day has 0% precipitation — should not show "0%"
    const allTexts = screen.queryAllByText('0%')
    expect(allTexts).toHaveLength(0)
  })

  it('renders temperatures in fahrenheit when selected', () => {
    mockPreferences = { ...mockPreferences, unitPreference: 'fahrenheit' }
    render(<Forecast />)
    // First day: tempHigh=24°C → Math.round(24*9/5+32)=75°F, tempLow=15°C → Math.round(15*9/5+32)=59°F
    expect(screen.getByText('75°')).toBeInTheDocument()
    expect(screen.getByText('59°')).toBeInTheDocument()
  })

  it('renders exactly 6 forecast days', () => {
    render(<Forecast />)
    // 6 days should render (today + 5)
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Tomorrow')).toBeInTheDocument()
    // Other days render as short weekday names
  })
})
