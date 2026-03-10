import { describe, it, expect } from 'vitest'
import { convertTemp, formatTemp, convertWindSpeed, formatWindSpeed, formatDayName } from '../units.ts'

describe('convertTemp', () => {
  it('returns rounded celsius when unit is celsius', () => {
    expect(convertTemp(22.7, 'celsius')).toBe(23)
    expect(convertTemp(-3.2, 'celsius')).toBe(-3)
  })

  it('converts celsius to fahrenheit correctly', () => {
    expect(convertTemp(0, 'fahrenheit')).toBe(32)
    expect(convertTemp(100, 'fahrenheit')).toBe(212)
    expect(convertTemp(-40, 'fahrenheit')).toBe(-40)
  })

  it('rounds fahrenheit result', () => {
    expect(convertTemp(22.5, 'fahrenheit')).toBe(73) // 72.5 rounds to 73
  })
})

describe('formatTemp', () => {
  it('formats celsius with degree symbol', () => {
    expect(formatTemp(22.7, 'celsius')).toBe('23°')
  })

  it('formats fahrenheit with degree symbol', () => {
    expect(formatTemp(0, 'fahrenheit')).toBe('32°')
  })

  it('handles negative temperatures', () => {
    expect(formatTemp(-10, 'celsius')).toBe('-10°')
    expect(formatTemp(-10, 'fahrenheit')).toBe('14°')
  })
})

describe('convertWindSpeed', () => {
  it('returns rounded km/h for celsius', () => {
    expect(convertWindSpeed(15.7, 'celsius')).toBe(16)
  })

  it('converts to mph for fahrenheit', () => {
    expect(convertWindSpeed(100, 'fahrenheit')).toBe(62)
  })

  it('handles zero', () => {
    expect(convertWindSpeed(0, 'celsius')).toBe(0)
    expect(convertWindSpeed(0, 'fahrenheit')).toBe(0)
  })
})

describe('formatWindSpeed', () => {
  it('formats with km/h for celsius', () => {
    expect(formatWindSpeed(15, 'celsius')).toBe('15 km/h')
  })

  it('formats with mph for fahrenheit', () => {
    expect(formatWindSpeed(16, 'fahrenheit')).toBe('10 mph')
  })
})

describe('formatDayName', () => {
  it('returns "Today" for index 0', () => {
    expect(formatDayName('2026-03-10', 0)).toBe('Today')
  })

  it('returns "Tomorrow" for index 1', () => {
    expect(formatDayName('2026-03-11', 1)).toBe('Tomorrow')
  })

  it('returns abbreviated day name for other indices', () => {
    const result = formatDayName('2026-03-12', 2) // Thursday
    expect(result).toBe('Thu')
  })

  it('returns correct day for weekend', () => {
    const result = formatDayName('2026-03-14', 4) // Saturday
    expect(result).toBe('Sat')
  })
})
