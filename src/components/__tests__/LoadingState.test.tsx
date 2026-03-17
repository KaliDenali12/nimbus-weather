import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingState } from '../LoadingState.tsx'

describe('LoadingState', () => {
  it('renders loading message', () => {
    render(<LoadingState />)
    expect(screen.getByText('Fetching weather data...')).toBeInTheDocument()
  })

  it('has status role for screen readers', () => {
    render(<LoadingState />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has aria-live polite attribute', () => {
    render(<LoadingState />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })

  it('renders spinner icon as decorative', () => {
    const { container } = render(<LoadingState />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})
