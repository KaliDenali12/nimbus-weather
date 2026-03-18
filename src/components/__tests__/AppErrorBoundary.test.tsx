import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AppErrorBoundary } from '../AppErrorBoundary.tsx'

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test crash')
  return <div>App is running</div>
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('AppErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <AppErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </AppErrorBoundary>,
    )
    expect(screen.getByText('App is running')).toBeInTheDocument()
  })

  it('renders recovery UI when child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AppErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </AppErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Reload Page')).toBeInTheDocument()
    expect(screen.queryByText('App is running')).not.toBeInTheDocument()
  })

  it('logs error details to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AppErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </AppErrorBoundary>,
    )

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AppErrorBoundary]'),
      expect.any(String),
      expect.stringContaining('Test crash'),
      expect.any(String),
      expect.anything(),
    )
  })

  it('reload button calls window.location.reload', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    })

    render(
      <AppErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </AppErrorBoundary>,
    )

    fireEvent.click(screen.getByText('Reload Page'))
    expect(reloadMock).toHaveBeenCalledTimes(1)
  })
})
