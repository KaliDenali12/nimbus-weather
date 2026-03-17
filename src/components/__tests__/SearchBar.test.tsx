import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SearchBar } from '../SearchBar.tsx'
import type { GeocodingResult } from '@/types/index.ts'

const mockSearchForCities = vi.fn()
const mockSelectCity = vi.fn()

const mockResults: GeocodingResult[] = [
  { id: 1, name: 'London', latitude: 51.51, longitude: -0.13, country: 'United Kingdom', country_code: 'GB', admin1: 'England' },
  { id: 2, name: 'London', latitude: 42.98, longitude: -81.23, country: 'Canada', country_code: 'CA', admin1: 'Ontario' },
]

vi.mock('@/context/WeatherContext.tsx', () => ({
  useWeather: () => ({
    searchForCities: mockSearchForCities,
    selectCity: mockSelectCity,
  }),
}))

// Helper: flush all pending microtasks
function flushMicrotasks() {
  return act(async () => {})
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('SearchBar', () => {
  it('renders search input with correct placeholder', () => {
    render(<SearchBar />)
    expect(screen.getByPlaceholderText('Search for a city...')).toBeInTheDocument()
  })

  it('has combobox role for accessibility', () => {
    render(<SearchBar />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('has correct aria-label', () => {
    render(<SearchBar />)
    expect(screen.getByLabelText('Search for a city')).toBeInTheDocument()
  })

  it('does not search for short queries', async () => {
    render(<SearchBar />)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'a' } })
    act(() => { vi.advanceTimersByTime(300) })
    await flushMicrotasks()

    expect(mockSearchForCities).not.toHaveBeenCalled()
  })

  it('searches after debounce delay', async () => {
    mockSearchForCities.mockResolvedValue(mockResults)
    render(<SearchBar />)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'London' } })

    // Before debounce
    expect(mockSearchForCities).not.toHaveBeenCalled()

    // After debounce
    act(() => { vi.advanceTimersByTime(300) })
    await flushMicrotasks()

    expect(mockSearchForCities).toHaveBeenCalledWith('London')
  })

  it('shows results dropdown when results arrive', async () => {
    mockSearchForCities.mockResolvedValue(mockResults)
    render(<SearchBar />)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'London' } })
    act(() => { vi.advanceTimersByTime(300) })
    await flushMicrotasks()

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('shows "No cities found" when results are empty', async () => {
    mockSearchForCities.mockResolvedValue([])
    render(<SearchBar />)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'xyznonexistent' } })
    act(() => { vi.advanceTimersByTime(300) })
    await flushMicrotasks()

    expect(screen.getByText('No cities found')).toBeInTheDocument()
  })

  it('selects a city and calls selectCity', async () => {
    mockSearchForCities.mockResolvedValue(mockResults)
    render(<SearchBar />)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'London' } })
    act(() => { vi.advanceTimersByTime(300) })
    await flushMicrotasks()

    fireEvent.click(screen.getAllByRole('option')[0]!)

    expect(mockSelectCity).toHaveBeenCalledWith({
      name: 'London',
      lat: 51.51,
      lon: -0.13,
      country: 'United Kingdom',
      admin1: 'England',
    })
  })

  it('clears input after selecting a city', async () => {
    mockSearchForCities.mockResolvedValue(mockResults)
    render(<SearchBar />)
    const input = screen.getByRole('combobox') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'London' } })
    act(() => { vi.advanceTimersByTime(300) })
    await flushMicrotasks()

    fireEvent.click(screen.getAllByRole('option')[0]!)
    expect(input.value).toBe('')
  })

  it('shows clear button when query is non-empty', () => {
    render(<SearchBar />)
    const input = screen.getByRole('combobox')

    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'test' } })

    expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
  })

  it('clears input when clear button clicked', () => {
    render(<SearchBar />)
    const input = screen.getByRole('combobox') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'test' } })
    fireEvent.click(screen.getByLabelText('Clear search'))

    expect(input.value).toBe('')
  })

  it('navigates results with ArrowDown key', async () => {
    mockSearchForCities.mockResolvedValue(mockResults)
    render(<SearchBar />)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'London' } })
    act(() => { vi.advanceTimersByTime(300) })
    await flushMicrotasks()

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(screen.getAllByRole('option')[0]!).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(screen.getAllByRole('option')[1]!).toHaveAttribute('aria-selected', 'true')
  })

  it('wraps around when ArrowDown at end of list', async () => {
    mockSearchForCities.mockResolvedValue(mockResults)
    render(<SearchBar />)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'London' } })
    act(() => { vi.advanceTimersByTime(300) })
    await flushMicrotasks()

    fireEvent.keyDown(input, { key: 'ArrowDown' }) // index 0
    fireEvent.keyDown(input, { key: 'ArrowDown' }) // index 1
    fireEvent.keyDown(input, { key: 'ArrowDown' }) // wraps to index 0
    expect(screen.getAllByRole('option')[0]!).toHaveAttribute('aria-selected', 'true')
  })

  it('navigates up with ArrowUp key', async () => {
    mockSearchForCities.mockResolvedValue(mockResults)
    render(<SearchBar />)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'London' } })
    act(() => { vi.advanceTimersByTime(300) })
    await flushMicrotasks()

    // ArrowUp from -1 should go to last item
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(screen.getAllByRole('option')[1]!).toHaveAttribute('aria-selected', 'true')
  })

  it('selects with Enter key', async () => {
    mockSearchForCities.mockResolvedValue(mockResults)
    render(<SearchBar />)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'London' } })
    act(() => { vi.advanceTimersByTime(300) })
    await flushMicrotasks()

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockSelectCity).toHaveBeenCalledWith(expect.objectContaining({
      name: 'London',
      country: 'United Kingdom',
    }))
  })

  it('closes dropdown with Escape key', async () => {
    mockSearchForCities.mockResolvedValue(mockResults)
    render(<SearchBar />)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'London' } })
    act(() => { vi.advanceTimersByTime(300) })
    await flushMicrotasks()

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('displays region and country in results', async () => {
    mockSearchForCities.mockResolvedValue(mockResults)
    render(<SearchBar />)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'London' } })
    act(() => { vi.advanceTimersByTime(300) })
    await flushMicrotasks()

    expect(screen.getByText(/England, United Kingdom/)).toBeInTheDocument()
    expect(screen.getByText(/Ontario, Canada/)).toBeInTheDocument()
  })

  it('handles search API error gracefully', async () => {
    mockSearchForCities.mockRejectedValue(new Error('Network error'))
    render(<SearchBar />)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'London' } })
    act(() => { vi.advanceTimersByTime(300) })
    await flushMicrotasks()

    // Should not crash — results stay empty
    expect(mockSearchForCities).toHaveBeenCalled()
  })

  it('does not trigger Enter without active selection', async () => {
    mockSearchForCities.mockResolvedValue(mockResults)
    render(<SearchBar />)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'London' } })
    act(() => { vi.advanceTimersByTime(300) })
    await flushMicrotasks()

    // Enter without ArrowDown — activeIndex is -1
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockSelectCity).not.toHaveBeenCalled()
  })
})
