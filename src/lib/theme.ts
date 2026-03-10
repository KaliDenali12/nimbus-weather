import type { WeatherCondition, TimeOfDay, WeatherTheme } from '@/types/index.ts'

type ThemeKey = `${WeatherCondition}-${TimeOfDay}`

const themes: Record<string, WeatherTheme> = {
  'clear-day': {
    bgGradient: 'linear-gradient(135deg, #1e5faa 0%, #5b9bd5 40%, #8bbaf0 100%)',
    cardSurface: 'rgba(255, 255, 255, 0.14)',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
  },
  'clear-night': {
    bgGradient: 'linear-gradient(135deg, #0b1224 0%, #1a1847 50%, #2b2670 100%)',
    cardSurface: 'rgba(255, 255, 255, 0.07)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#e2e8f0',
    textSecondary: 'rgba(226, 232, 240, 0.6)',
  },
  'partly-cloudy-day': {
    bgGradient: 'linear-gradient(135deg, #3a7bc8 0%, #6d9fd9 50%, #a3c4e8 100%)',
    cardSurface: 'rgba(255, 255, 255, 0.15)',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.68)',
  },
  'partly-cloudy-night': {
    bgGradient: 'linear-gradient(135deg, #0f1a2e 0%, #1e2d4a 50%, #2d3f5c 100%)',
    cardSurface: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#e2e8f0',
    textSecondary: 'rgba(226, 232, 240, 0.58)',
  },
  'cloudy-day': {
    bgGradient: 'linear-gradient(135deg, #5a6a7a 0%, #8494a7 50%, #b0bec9 100%)',
    cardSurface: 'rgba(255, 255, 255, 0.16)',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.65)',
  },
  'cloudy-night': {
    bgGradient: 'linear-gradient(135deg, #1a2535 0%, #2d3d50 50%, #3f5168 100%)',
    cardSurface: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#e2e8f0',
    textSecondary: 'rgba(226, 232, 240, 0.55)',
  },
  'foggy-day': {
    bgGradient: 'linear-gradient(135deg, #7a8a9a 0%, #9aacba 50%, #c0cdd8 100%)',
    cardSurface: 'rgba(255, 255, 255, 0.14)',
    cardBorder: 'rgba(255, 255, 255, 0.10)',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.60)',
  },
  'foggy-night': {
    bgGradient: 'linear-gradient(135deg, #1a2535 0%, #2d3d50 50%, #3f5168 100%)',
    cardSurface: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#e2e8f0',
    textSecondary: 'rgba(226, 232, 240, 0.55)',
  },
  'drizzle-day': {
    bgGradient: 'linear-gradient(135deg, #3a5a75 0%, #4d7a95 50%, #6d9ab5 100%)',
    cardSurface: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(255, 255, 255, 0.10)',
    textPrimary: '#f0f4f8',
    textSecondary: 'rgba(240, 244, 248, 0.65)',
  },
  'drizzle-night': {
    bgGradient: 'linear-gradient(135deg, #0c1820 0%, #162530 50%, #1e3545 100%)',
    cardSurface: 'rgba(255, 255, 255, 0.07)',
    cardBorder: 'rgba(255, 255, 255, 0.07)',
    textPrimary: '#c8d6e0',
    textSecondary: 'rgba(200, 214, 224, 0.55)',
  },
  'rain-day': {
    bgGradient: 'linear-gradient(135deg, #1c3550 0%, #2a4d6b 50%, #3f6d8c 100%)',
    cardSurface: 'rgba(255, 255, 255, 0.10)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#e2e8f0',
    textSecondary: 'rgba(226, 232, 240, 0.6)',
  },
  'rain-night': {
    bgGradient: 'linear-gradient(135deg, #0a1520 0%, #14202f 50%, #1c2e42 100%)',
    cardSurface: 'rgba(255, 255, 255, 0.06)',
    cardBorder: 'rgba(255, 255, 255, 0.06)',
    textPrimary: '#c8d6e0',
    textSecondary: 'rgba(200, 214, 224, 0.55)',
  },
  'snow-day': {
    bgGradient: 'linear-gradient(135deg, #d8e4ee 0%, #c0cdd8 50%, #8a9baa 100%)',
    cardSurface: 'rgba(0, 0, 0, 0.07)',
    cardBorder: 'rgba(0, 0, 0, 0.06)',
    textPrimary: '#1a2533',
    textSecondary: 'rgba(26, 37, 51, 0.6)',
  },
  'snow-night': {
    bgGradient: 'linear-gradient(135deg, #1a2535 0%, #2d3d50 50%, #506478 100%)',
    cardSurface: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#e2e8f0',
    textSecondary: 'rgba(226, 232, 240, 0.55)',
  },
  'storm-day': {
    bgGradient: 'linear-gradient(135deg, #12121f 0%, #22223a 50%, #323252 100%)',
    cardSurface: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.07)',
    textPrimary: '#d4d4e0',
    textSecondary: 'rgba(212, 212, 224, 0.55)',
  },
  'storm-night': {
    bgGradient: 'linear-gradient(135deg, #12121f 0%, #22223a 50%, #323252 100%)',
    cardSurface: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.07)',
    textPrimary: '#d4d4e0',
    textSecondary: 'rgba(212, 212, 224, 0.55)',
  },
}

const darkModeTheme: WeatherTheme = {
  bgGradient: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)',
  cardSurface: 'rgba(255, 255, 255, 0.05)',
  cardBorder: 'rgba(255, 255, 255, 0.06)',
  textPrimary: '#e4e4e7',
  textSecondary: 'rgba(228, 228, 231, 0.55)',
}

export function getTheme(
  condition: WeatherCondition,
  timeOfDay: TimeOfDay,
  isDarkMode: boolean,
): WeatherTheme {
  if (isDarkMode) return darkModeTheme
  const key: ThemeKey = `${condition}-${timeOfDay}`
  return themes[key] ?? themes['clear-day']!
}

/** Apply theme CSS variables to the document root */
export function applyTheme(theme: WeatherTheme): void {
  const root = document.documentElement
  root.style.setProperty('--bg-gradient', theme.bgGradient)
  root.style.setProperty('--card-surface', theme.cardSurface)
  root.style.setProperty('--card-border', theme.cardBorder)
  root.style.setProperty('--text-primary', theme.textPrimary)
  root.style.setProperty('--text-secondary', theme.textSecondary)
}
