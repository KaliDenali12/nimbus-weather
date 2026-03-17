import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { Toast } from '../Toast.tsx'

afterEach(() => {
  vi.useRealTimers()
})

describe('Toast', () => {
  it('renders message text', () => {
    render(<Toast message="Test notification" onDismiss={() => {}} />)
    expect(screen.getByText('Test notification')).toBeInTheDocument()
  })

  it('has status role for accessibility', () => {
    render(<Toast message="Test" onDismiss={() => {}} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('calls onDismiss when X button clicked', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()

    render(<Toast message="Test" onDismiss={onDismiss} />)

    fireEvent.click(screen.getByLabelText('Dismiss notification'))

    act(() => { vi.advanceTimersByTime(200) })
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('auto-dismisses after duration', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()

    render(<Toast message="Test" duration={3000} onDismiss={onDismiss} />)

    act(() => { vi.advanceTimersByTime(3000) })
    act(() => { vi.advanceTimersByTime(200) })
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
