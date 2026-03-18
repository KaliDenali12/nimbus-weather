import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(
      '[AppErrorBoundary] Unhandled error — showing recovery UI.',
      '\n  Error:', error.message,
      '\n  Component stack:', info.componentStack,
    )
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '400px', padding: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '15px', opacity: 0.7, marginBottom: '24px' }}>
              An unexpected error occurred. Please reload the page to try again.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
