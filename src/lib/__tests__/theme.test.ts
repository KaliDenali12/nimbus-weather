import { describe, it, expect } from 'vitest'
import { getTheme } from '../theme.ts'

describe('getTheme', () => {
  it('returns clear-day theme', () => {
    const theme = getTheme('clear', 'day', false)
    expect(theme.bgGradient).toContain('#1e5faa')
    expect(theme.textPrimary).toBe('#ffffff')
  })

  it('returns clear-night theme', () => {
    const theme = getTheme('clear', 'night', false)
    expect(theme.bgGradient).toContain('#0b1224')
    expect(theme.textPrimary).toBe('#e2e8f0')
  })

  it('returns dark mode theme regardless of condition', () => {
    const clearDay = getTheme('clear', 'day', true)
    const rainNight = getTheme('rain', 'night', true)
    expect(clearDay.bgGradient).toBe(rainNight.bgGradient)
    expect(clearDay.bgGradient).toContain('#09090b')
  })

  it('returns snow-day theme with dark text', () => {
    const theme = getTheme('snow', 'day', false)
    expect(theme.textPrimary).toBe('#1a2533')
  })

  it('returns storm theme', () => {
    const theme = getTheme('storm', 'day', false)
    expect(theme.bgGradient).toContain('#12121f')
  })

  it('returns rain-day theme', () => {
    const theme = getTheme('rain', 'day', false)
    expect(theme.bgGradient).toContain('#1c3550')
  })

  it('returns cloudy-day theme', () => {
    const theme = getTheme('cloudy', 'day', false)
    expect(theme.bgGradient).toContain('#5a6a7a')
  })

  it('returns cloudy-night theme', () => {
    const theme = getTheme('cloudy', 'night', false)
    expect(theme.bgGradient).toContain('#1a2535')
  })

  it('falls back to clear-day for unknown combo', () => {
    // @ts-expect-error: testing fallback with invalid condition
    const theme = getTheme('hurricane', 'day', false)
    expect(theme.bgGradient).toContain('#1e5faa')
  })

  it('returns different themes for day vs night', () => {
    const day = getTheme('rain', 'day', false)
    const night = getTheme('rain', 'night', false)
    expect(day.bgGradient).not.toBe(night.bgGradient)
  })

  it('has all required properties in every theme', () => {
    const conditions = ['clear', 'partly-cloudy', 'cloudy', 'foggy', 'drizzle', 'rain', 'snow', 'storm'] as const
    const times = ['day', 'night'] as const

    for (const c of conditions) {
      for (const t of times) {
        const theme = getTheme(c, t, false)
        expect(theme.bgGradient).toBeTruthy()
        expect(theme.cardSurface).toBeTruthy()
        expect(theme.cardBorder).toBeTruthy()
        expect(theme.textPrimary).toBeTruthy()
        expect(theme.textSecondary).toBeTruthy()
      }
    }
  })
})
