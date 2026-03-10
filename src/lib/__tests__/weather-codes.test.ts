import { describe, it, expect } from 'vitest'
import { getWeatherCondition, getWeatherLabel, getWeatherIconName } from '../weather-codes.ts'

describe('getWeatherCondition', () => {
  it('returns clear for code 0', () => {
    expect(getWeatherCondition(0)).toBe('clear')
  })

  it('returns partly-cloudy for codes 1-3', () => {
    expect(getWeatherCondition(1)).toBe('partly-cloudy')
    expect(getWeatherCondition(2)).toBe('partly-cloudy')
    expect(getWeatherCondition(3)).toBe('partly-cloudy')
  })

  it('returns cloudy for codes 4-44', () => {
    expect(getWeatherCondition(4)).toBe('cloudy')
    expect(getWeatherCondition(44)).toBe('cloudy')
  })

  it('returns foggy for codes 45-49', () => {
    expect(getWeatherCondition(45)).toBe('foggy')
    expect(getWeatherCondition(48)).toBe('foggy')
  })

  it('returns drizzle for codes 50-59', () => {
    expect(getWeatherCondition(51)).toBe('drizzle')
    expect(getWeatherCondition(55)).toBe('drizzle')
  })

  it('returns rain for codes 60-69', () => {
    expect(getWeatherCondition(61)).toBe('rain')
    expect(getWeatherCondition(65)).toBe('rain')
  })

  it('returns snow for codes 70-79', () => {
    expect(getWeatherCondition(71)).toBe('snow')
    expect(getWeatherCondition(77)).toBe('snow')
  })

  it('returns rain for rain showers 80-84', () => {
    expect(getWeatherCondition(80)).toBe('rain')
    expect(getWeatherCondition(82)).toBe('rain')
  })

  it('returns snow for snow showers 85-86', () => {
    expect(getWeatherCondition(85)).toBe('snow')
    expect(getWeatherCondition(86)).toBe('snow')
  })

  it('returns storm for codes 95-99', () => {
    expect(getWeatherCondition(95)).toBe('storm')
    expect(getWeatherCondition(99)).toBe('storm')
  })
})

describe('getWeatherLabel', () => {
  it('returns correct label for known codes', () => {
    expect(getWeatherLabel(0)).toBe('Clear Sky')
    expect(getWeatherLabel(61)).toBe('Slight Rain')
    expect(getWeatherLabel(95)).toBe('Thunderstorm')
  })

  it('returns Unknown for unrecognized codes', () => {
    expect(getWeatherLabel(999)).toBe('Unknown')
  })
})

describe('getWeatherIconName', () => {
  it('returns Sun for clear day', () => {
    expect(getWeatherIconName(0, true)).toBe('Sun')
  })

  it('returns Moon for clear night', () => {
    expect(getWeatherIconName(0, false)).toBe('Moon')
  })

  it('returns CloudSun for partly-cloudy day', () => {
    expect(getWeatherIconName(2, true)).toBe('CloudSun')
  })

  it('returns CloudMoon for partly-cloudy night', () => {
    expect(getWeatherIconName(2, false)).toBe('CloudMoon')
  })

  it('returns CloudRain for rain', () => {
    expect(getWeatherIconName(63, true)).toBe('CloudRain')
  })

  it('returns Snowflake for snow', () => {
    expect(getWeatherIconName(73, true)).toBe('Snowflake')
  })

  it('returns CloudLightning for storm', () => {
    expect(getWeatherIconName(95, true)).toBe('CloudLightning')
  })

  it('returns CloudFog for foggy', () => {
    expect(getWeatherIconName(45, true)).toBe('CloudFog')
  })

  it('returns CloudDrizzle for drizzle', () => {
    expect(getWeatherIconName(51, true)).toBe('CloudDrizzle')
  })
})
