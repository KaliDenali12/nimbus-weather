import type { TemperatureUnit } from '@/types/index.ts'

/** Convert Celsius to the target unit */
export function convertTemp(celsius: number, unit: TemperatureUnit): number {
  if (unit === 'fahrenheit') return Math.round(celsius * 9 / 5 + 32)
  return Math.round(celsius)
}

/** Display temperature with unit symbol */
export function formatTemp(celsius: number, unit: TemperatureUnit): string {
  const value = convertTemp(celsius, unit)
  return `${value}°`
}

/** Convert km/h to mph if using fahrenheit */
export function convertWindSpeed(kmh: number, unit: TemperatureUnit): number {
  if (unit === 'fahrenheit') return Math.round(kmh * 0.621371)
  return Math.round(kmh)
}

/** Format wind speed with unit */
export function formatWindSpeed(kmh: number, unit: TemperatureUnit): string {
  const value = convertWindSpeed(kmh, unit)
  const label = unit === 'fahrenheit' ? 'mph' : 'km/h'
  return `${value} ${label}`
}

/** Format day name from ISO date string */
export function formatDayName(dateStr: string, index: number): string {
  if (index === 0) return 'Today'
  if (index === 1) return 'Tomorrow'
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}
