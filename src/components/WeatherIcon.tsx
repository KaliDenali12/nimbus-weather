import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  Snowflake,
  CloudLightning,
} from 'lucide-react'
import { getWeatherIconName } from '@/lib/weather-codes.ts'

interface WeatherIconProps {
  code: number
  isDay?: boolean
  size?: number
  className?: string
}

const ICON_MAP: Record<string, typeof Sun> = {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  Snowflake,
  CloudLightning,
}

export function WeatherIcon({ code, isDay = true, size = 24, className = '' }: WeatherIconProps) {
  const iconName = getWeatherIconName(code, isDay)
  const Icon = ICON_MAP[iconName] ?? Cloud

  return <Icon size={size} className={className} aria-hidden="true" />
}
