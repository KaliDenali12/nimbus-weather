import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../Header.tsx'

const mockToggleUnit = vi.fn()
const mockToggleDark = vi.fn()
let mockPreferences = {
  unitPreference: 'celsius' as const,
  darkModeEnabled: false,
  sceneDisabled: false,
  recentCities: [],
}

vi.mock('@/context/WeatherContext.tsx', () => ({
  useWeather: () => ({
    preferences: mockPreferences,
    toggleUnit: mockToggleUnit,
    toggleDark: mockToggleDark,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockPreferences = {
    unitPreference: 'celsius',
    darkModeEnabled: false,
    sceneDisabled: false,
    recentCities: [],
  }
})

describe('Header', () => {
  it('renders app title', () => {
    render(<Header />)
    expect(screen.getByText('Nimbus')).toBeInTheDocument()
  })

  it('shows °C when unit is celsius', () => {
    render(<Header />)
    expect(screen.getByText('°C')).toBeInTheDocument()
  })

  it('shows °F when unit is fahrenheit', () => {
    mockPreferences = { ...mockPreferences, unitPreference: 'fahrenheit' }
    render(<Header />)
    expect(screen.getByText('°F')).toBeInTheDocument()
  })

  it('calls toggleUnit when temperature button clicked', () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Switch to Fahrenheit'))
    expect(mockToggleUnit).toHaveBeenCalledOnce()
  })

  it('has correct aria-label for unit toggle in fahrenheit mode', () => {
    mockPreferences = { ...mockPreferences, unitPreference: 'fahrenheit' }
    render(<Header />)
    expect(screen.getByLabelText('Switch to Celsius')).toBeInTheDocument()
  })

  it('calls toggleDark when dark mode button clicked', () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Enable dark mode'))
    expect(mockToggleDark).toHaveBeenCalledOnce()
  })

  it('has correct aria-label when dark mode is enabled', () => {
    mockPreferences = { ...mockPreferences, darkModeEnabled: true }
    render(<Header />)
    expect(screen.getByLabelText('Disable dark mode')).toBeInTheDocument()
  })
})
