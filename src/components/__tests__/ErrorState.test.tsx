import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorState } from '../ErrorState.tsx'

// Mock useWeather
const mockRetry = vi.fn()
let mockError: string | null = 'Network error'

vi.mock('@/context/WeatherContext.tsx', () => ({
  useWeather: () => ({
    error: mockError,
    retry: mockRetry,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockError = 'Network error'
})

describe('ErrorState', () => {
  it('renders the error heading', () => {
    render(<ErrorState />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('displays the error message from context', () => {
    render(<ErrorState />)
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('displays default message when error is null', () => {
    mockError = null
    render(<ErrorState />)
    expect(
      screen.getByText('Unable to fetch weather data. Check your connection and try again.'),
    ).toBeInTheDocument()
  })

  it('renders Try Again button', () => {
    render(<ErrorState />)
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('calls retry when Try Again button is clicked', () => {
    render(<ErrorState />)
    fireEvent.click(screen.getByText('Try Again'))
    expect(mockRetry).toHaveBeenCalledOnce()
  })

  it('renders CloudOff icon as decorative', () => {
    const { container } = render(<ErrorState />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})
