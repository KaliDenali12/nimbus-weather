import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AlertBanner } from '../AlertBanner.tsx'
import type { WeatherData, WeatherAlert } from '@/types/index.ts'

const mockAlerts: WeatherAlert[] = [
  {
    id: 'alert-1',
    event: 'Heat Wave Warning',
    description: 'Temperatures will reach 40°C',
    severity: 'warning',
    start: '2026-03-17T00:00:00',
    end: '2026-03-18T00:00:00',
  },
  {
    id: 'alert-2',
    event: 'Severe Thunderstorm',
    description: 'Heavy lightning expected',
    severity: 'emergency',
    start: '2026-03-17T12:00:00',
    end: '2026-03-17T18:00:00',
  },
]

const baseWeather: WeatherData = {
  location: { name: 'Tokyo', country: 'Japan', latitude: 35.68, longitude: 139.69, timezone: 'Asia/Tokyo' },
  current: { temperature: 22, feelsLike: 20, humidity: 65, windSpeed: 12, weatherCode: 0, isDay: true },
  daily: [],
  alerts: [],
}

let mockWeather: WeatherData | null = baseWeather

vi.mock('@/context/WeatherContext.tsx', () => ({
  useWeather: () => ({
    weather: mockWeather,
  }),
}))

beforeEach(() => {
  mockWeather = baseWeather
})

describe('AlertBanner', () => {
  it('renders null when weather is null', () => {
    mockWeather = null
    const { container } = render(<AlertBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('renders null when alerts array is empty', () => {
    mockWeather = { ...baseWeather, alerts: [] }
    const { container } = render(<AlertBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('renders alerts when present', () => {
    mockWeather = { ...baseWeather, alerts: mockAlerts }
    render(<AlertBanner />)
    expect(screen.getByText('Heat Wave Warning')).toBeInTheDocument()
    expect(screen.getByText('Severe Thunderstorm')).toBeInTheDocument()
  })

  it('renders alert descriptions', () => {
    mockWeather = { ...baseWeather, alerts: mockAlerts }
    render(<AlertBanner />)
    expect(screen.getByText('Temperatures will reach 40°C')).toBeInTheDocument()
    expect(screen.getByText('Heavy lightning expected')).toBeInTheDocument()
  })

  it('has alert role for accessibility', () => {
    mockWeather = { ...baseWeather, alerts: mockAlerts }
    render(<AlertBanner />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('dismisses an alert when X button clicked', () => {
    mockWeather = { ...baseWeather, alerts: [mockAlerts[0]!] }
    render(<AlertBanner />)
    expect(screen.getByText('Heat Wave Warning')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Dismiss Heat Wave Warning alert'))

    expect(screen.queryByText('Heat Wave Warning')).not.toBeInTheDocument()
  })

  it('dismisses only the clicked alert, keeping others', () => {
    mockWeather = { ...baseWeather, alerts: mockAlerts }
    render(<AlertBanner />)

    fireEvent.click(screen.getByLabelText('Dismiss Heat Wave Warning alert'))

    expect(screen.queryByText('Heat Wave Warning')).not.toBeInTheDocument()
    expect(screen.getByText('Severe Thunderstorm')).toBeInTheDocument()
  })

  it('renders advisory severity alert', () => {
    const advisory: WeatherAlert = {
      id: 'alert-3',
      event: 'Wind Advisory',
      description: 'Gusty winds expected',
      severity: 'advisory',
      start: '2026-03-17T00:00:00',
      end: '2026-03-17T12:00:00',
    }
    mockWeather = { ...baseWeather, alerts: [advisory] }
    render(<AlertBanner />)
    expect(screen.getByText('Wind Advisory')).toBeInTheDocument()
  })
})
