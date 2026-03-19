import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CurrentWeather } from '../CurrentWeather.tsx'
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
    temperature: 22.3,
    feelsLike: 20.1,
    humidity: 65.4,
    windSpeed: 12.7,
    weatherCode: 0,
    isDay: true,
  },
  daily: [],
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

describe('CurrentWeather', () => {
  it('renders null when weather is null', () => {
    mockWeather = null
    const { container } = render(<CurrentWeather />)
    expect(container.firstChild).toBeNull()
  })

  it('renders location name and country', () => {
    render(<CurrentWeather />)
    expect(screen.getByText('Tokyo')).toBeInTheDocument()
    expect(screen.getByText('Japan')).toBeInTheDocument()
  })

  it('renders temperature in celsius', () => {
    render(<CurrentWeather />)
    // formatTemp(22.3, 'celsius') = Math.round(22.3) = 22, so "22°"
    expect(screen.getByText('22°')).toBeInTheDocument()
  })

  it('renders temperature in fahrenheit', () => {
    mockPreferences = { ...mockPreferences, unitPreference: 'fahrenheit' }
    render(<CurrentWeather />)
    // formatTemp(22.3, 'fahrenheit') = Math.round(22.3 * 9/5 + 32) = Math.round(72.14) = 72, so "72°"
    expect(screen.getByText('72°')).toBeInTheDocument()
  })

  it('renders feels like temperature', () => {
    render(<CurrentWeather />)
    expect(screen.getByText('FEELS LIKE')).toBeInTheDocument()
    // formatTemp(20.1, 'celsius') = "20°"
    expect(screen.getByText('20°')).toBeInTheDocument()
  })

  it('renders humidity percentage', () => {
    render(<CurrentWeather />)
    expect(screen.getByText('HUMIDITY')).toBeInTheDocument()
    expect(screen.getByText('65%')).toBeInTheDocument()
  })

  it('renders wind speed in km/h', () => {
    render(<CurrentWeather />)
    expect(screen.getByText('WIND')).toBeInTheDocument()
    expect(screen.getByText('13 km/h')).toBeInTheDocument()
  })

  it('renders wind speed in mph when fahrenheit', () => {
    mockPreferences = { ...mockPreferences, unitPreference: 'fahrenheit' }
    render(<CurrentWeather />)
    // convertWindSpeed(12.7, 'fahrenheit') = Math.round(12.7 * 0.621371) = 8
    expect(screen.getByText('8 mph')).toBeInTheDocument()
  })

  it('renders weather label', () => {
    render(<CurrentWeather />)
    expect(screen.getByText('Clear Sky')).toBeInTheDocument()
  })

  it('has correct aria-label for accessibility', () => {
    render(<CurrentWeather />)
    expect(screen.getByLabelText('Current weather conditions')).toBeInTheDocument()
  })

  it('renders decorative icons with aria-hidden', () => {
    const { container } = render(<CurrentWeather />)
    const svgs = container.querySelectorAll('svg[aria-hidden="true"]')
    // Thermometer, Droplets, Wind icons are all decorative
    expect(svgs.length).toBeGreaterThanOrEqual(3)
  })
})
