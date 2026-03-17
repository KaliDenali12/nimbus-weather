import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log 3D scene errors for debugging; the gradient background remains visible as fallback.
    // In production, this would be sent to an error reporting service.
    console.error(
      '[SceneErrorBoundary] WebGL/3D scene crashed — falling back to gradient background.',
      '\n  Error:', error.message,
      '\n  Component stack:', info.componentStack,
    )
  }

  render() {
    if (this.state.hasError) {
      // Silent fallback — the gradient background is still visible
      return null
    }
    return this.props.children
  }
}
