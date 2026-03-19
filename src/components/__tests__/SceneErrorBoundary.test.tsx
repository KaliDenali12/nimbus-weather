import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type React from 'react'
import { SceneErrorBoundary } from '../SceneErrorBoundary.tsx'

function ThrowingComponent(): React.JSX.Element {
  throw new Error('WebGL crashed')
}

function WorkingComponent() {
  return <div data-testid="child">Working content</div>
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SceneErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <SceneErrorBoundary>
        <WorkingComponent />
      </SceneErrorBoundary>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renders null (silent fallback) when child throws', () => {
    // Suppress React error boundary console output
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { container } = render(
      <SceneErrorBoundary>
        <ThrowingComponent />
      </SceneErrorBoundary>,
    )

    expect(container.firstChild).toBeNull()
  })

  it('catches error and sets hasError state', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <SceneErrorBoundary>
        <ThrowingComponent />
      </SceneErrorBoundary>,
    )

    // The fact that we get null (not a thrown error) confirms getDerivedStateFromError works
    expect(screen.queryByTestId('child')).not.toBeInTheDocument()
  })
})
