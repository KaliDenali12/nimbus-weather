import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecentCities } from '../RecentCities.tsx'
import type { UserPreferences, City } from '@/types/index.ts'

const mockSelectCity = vi.fn()
const tokyo: City = { name: 'Tokyo', lat: 35.68, lon: 139.69, country: 'Japan' }
const london: City = { name: 'London', lat: 51.51, lon: -0.13, country: 'UK' }

let mockPreferences: UserPreferences = {
  unitPreference: 'celsius',
  darkModeEnabled: false,
  recentCities: [tokyo, london],
}

vi.mock('@/context/WeatherContext.tsx', () => ({
  useWeather: () => ({
    preferences: mockPreferences,
    selectCity: mockSelectCity,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockPreferences = {
    unitPreference: 'celsius',
    darkModeEnabled: false,
    recentCities: [tokyo, london],
  }
})

describe('RecentCities', () => {
  it('renders null when no recent cities', () => {
    mockPreferences = { ...mockPreferences, recentCities: [] }
    const { container } = render(<RecentCities />)
    expect(container.firstChild).toBeNull()
  })

  it('renders recent city names as buttons', () => {
    render(<RecentCities />)
    expect(screen.getByText('Tokyo')).toBeInTheDocument()
    expect(screen.getByText('London')).toBeInTheDocument()
  })

  it('renders list with accessible role', () => {
    render(<RecentCities />)
    expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Recent cities')
  })

  it('renders each city as a listitem', () => {
    render(<RecentCities />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
  })

  it('calls selectCity with correct city when clicked', () => {
    render(<RecentCities />)
    fireEvent.click(screen.getByText('Tokyo'))
    expect(mockSelectCity).toHaveBeenCalledWith(tokyo)
  })

  it('calls selectCity with second city when clicked', () => {
    render(<RecentCities />)
    fireEvent.click(screen.getByText('London'))
    expect(mockSelectCity).toHaveBeenCalledWith(london)
  })
})
