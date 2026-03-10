import { useMemo } from 'react'
import type { WeatherCondition } from '@/types/index.ts'

interface GroundProps {
  condition: WeatherCondition
  isNight: boolean
}

export function Ground({ condition, isNight }: GroundProps) {
  const color = useMemo(() => {
    if (condition === 'snow') return isNight ? '#8899aa' : '#d0dce6'
    if (isNight) return '#1a2a1a'
    if (condition === 'storm') return '#2a3a2a'
    if (condition === 'rain' || condition === 'drizzle') return '#3a5a3a'
    return '#4a7a4a'
  }, [condition, isNight])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  )
}
