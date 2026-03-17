import { describe, it, expect, beforeEach } from 'vitest'
import { applyTheme } from '../theme.ts'
import type { WeatherTheme } from '@/types/index.ts'

const testTheme: WeatherTheme = {
  bgGradient: 'linear-gradient(135deg, #1e5faa 0%, #5b9bd5 40%, #8bbaf0 100%)',
  cardSurface: 'rgba(255, 255, 255, 0.14)',
  cardBorder: 'rgba(255, 255, 255, 0.12)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
}

beforeEach(() => {
  // Reset CSS custom properties
  const root = document.documentElement
  root.style.removeProperty('--bg-gradient')
  root.style.removeProperty('--card-surface')
  root.style.removeProperty('--card-border')
  root.style.removeProperty('--text-primary')
  root.style.removeProperty('--text-secondary')
})

describe('applyTheme', () => {
  it('sets --bg-gradient CSS variable', () => {
    applyTheme(testTheme)
    expect(document.documentElement.style.getPropertyValue('--bg-gradient')).toBe(testTheme.bgGradient)
  })

  it('sets --card-surface CSS variable', () => {
    applyTheme(testTheme)
    expect(document.documentElement.style.getPropertyValue('--card-surface')).toBe(testTheme.cardSurface)
  })

  it('sets --card-border CSS variable', () => {
    applyTheme(testTheme)
    expect(document.documentElement.style.getPropertyValue('--card-border')).toBe(testTheme.cardBorder)
  })

  it('sets --text-primary CSS variable', () => {
    applyTheme(testTheme)
    expect(document.documentElement.style.getPropertyValue('--text-primary')).toBe(testTheme.textPrimary)
  })

  it('sets --text-secondary CSS variable', () => {
    applyTheme(testTheme)
    expect(document.documentElement.style.getPropertyValue('--text-secondary')).toBe(testTheme.textSecondary)
  })

  it('overrides previously set theme', () => {
    applyTheme(testTheme)

    const darkTheme: WeatherTheme = {
      bgGradient: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)',
      cardSurface: 'rgba(255, 255, 255, 0.05)',
      cardBorder: 'rgba(255, 255, 255, 0.06)',
      textPrimary: '#e4e4e7',
      textSecondary: 'rgba(228, 228, 231, 0.55)',
    }
    applyTheme(darkTheme)

    expect(document.documentElement.style.getPropertyValue('--bg-gradient')).toBe(darkTheme.bgGradient)
    expect(document.documentElement.style.getPropertyValue('--text-primary')).toBe(darkTheme.textPrimary)
  })
})
