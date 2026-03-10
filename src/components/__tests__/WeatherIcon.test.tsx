import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { WeatherIcon } from '../WeatherIcon.tsx'

describe('WeatherIcon', () => {
  it('renders without crashing for clear day', () => {
    const { container } = render(<WeatherIcon code={0} isDay={true} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders without crashing for clear night', () => {
    const { container } = render(<WeatherIcon code={0} isDay={false} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders for rain codes', () => {
    const { container } = render(<WeatherIcon code={63} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders for snow codes', () => {
    const { container } = render(<WeatherIcon code={73} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders for storm codes', () => {
    const { container } = render(<WeatherIcon code={95} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('applies custom size', () => {
    const { container } = render(<WeatherIcon code={0} size={48} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('48')
  })

  it('sets aria-hidden', () => {
    const { container } = render(<WeatherIcon code={0} />)
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })
})
