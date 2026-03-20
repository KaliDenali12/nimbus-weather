import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import type { WeatherCondition, TimeOfDay } from '@/types/index.ts'
import { RainParticles } from '@/scenes/RainParticles.tsx'
import { SnowParticles } from '@/scenes/SnowParticles.tsx'
import { SimpleCloud } from '@/scenes/SimpleCloud.tsx'
import { Ground } from '@/scenes/Ground.tsx'
import { DioramaObjects } from '@/scenes/DioramaObjects.tsx'
import { LeafParticles } from '@/scenes/LeafParticles.tsx'
import { DustParticles } from '@/scenes/DustParticles.tsx'
import { FireflyParticles } from '@/scenes/FireflyParticles.tsx'
import { FogParticles } from '@/scenes/FogParticles.tsx'
import { LightningFlash } from '@/scenes/LightningFlash.tsx'

const RAIN_INTENSITY: Record<string, number> = {
  storm: 1500,
  drizzle: 300,
  default: 800,
}

interface SceneContentProps {
  condition: WeatherCondition
  timeOfDay: TimeOfDay
  reducedMotion: boolean
}

export default function SceneContent({ condition, timeOfDay, reducedMotion }: SceneContentProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (reducedMotion || !groupRef.current) return
    const t = state.clock.getElapsedTime()
    groupRef.current.rotation.y = Math.sin(t * 0.1) * 0.02
  })

  const isNight = timeOfDay === 'night'
  const isRain = condition === 'rain' || condition === 'drizzle' || condition === 'storm'
  const isSnow = condition === 'snow'
  const showClouds = condition === 'cloudy' || condition === 'partly-cloudy' || condition === 'foggy' || isRain
  const showLeaves = condition === 'clear' || condition === 'partly-cloudy' || condition === 'cloudy' || condition === 'drizzle'
  const showDust = (condition === 'clear' || condition === 'partly-cloudy') && !isNight
  const showFireflies = (condition === 'clear' || condition === 'partly-cloudy') && isNight
  const showFog = condition === 'foggy' || condition === 'storm'
  const showLightning = condition === 'storm'

  const ambientIntensity = useMemo(() => {
    if (isNight) return 0.15
    if (condition === 'storm') return 0.2
    if (isRain) return 0.3
    if (showClouds) return 0.4
    return 0.5
  }, [isNight, condition, isRain, showClouds])

  const directionalIntensity = useMemo(() => {
    if (isNight) return 0.3
    if (condition === 'storm') return 0.2
    if (isRain) return 0.4
    if (condition === 'clear') return 1.2
    return 0.6
  }, [isNight, condition, isRain])

  const lightColor = useMemo(() => {
    if (isNight) return '#4466aa'
    if (condition === 'storm') return '#667799'
    if (isSnow) return '#ccd8e8'
    if (condition === 'clear') return '#ffddaa'
    return '#ffffff'
  }, [isNight, condition, isSnow])

  const cloudSpeed = reducedMotion ? 0 : 0.2
  const rainIntensity = RAIN_INTENSITY[condition] ?? RAIN_INTENSITY.default

  return (
    <group ref={groupRef}>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={[5, 8, 3]}
        intensity={directionalIntensity}
        color={lightColor}
        castShadow={false}
      />

      {isNight && (
        <Stars
          radius={50}
          depth={50}
          count={1500}
          factor={3}
          saturation={0}
          fade
          speed={reducedMotion ? 0 : 0.5}
        />
      )}

      {showClouds && (
        <>
          <SimpleCloud position={[-4, 5, -3]} speed={cloudSpeed} opacity={0.4} />
          <SimpleCloud position={[3, 6, -5]} speed={cloudSpeed * 0.75} opacity={0.35} scale={1.2} />
          {(condition === 'storm' || condition === 'cloudy') && (
            <SimpleCloud position={[0, 4, -2]} speed={cloudSpeed * 1.5} opacity={0.6} scale={1.4} />
          )}
        </>
      )}

      {isRain && !reducedMotion && <RainParticles intensity={rainIntensity} />}
      {isSnow && !reducedMotion && <SnowParticles windSpeed={0} />}

      {showLeaves && !reducedMotion && (
        <LeafParticles
          intensity={condition === 'cloudy' ? 70 : condition === 'partly-cloudy' ? 50 : condition === 'drizzle' ? 30 : 40}
          speed={condition === 'cloudy' ? 1.0 : condition === 'partly-cloudy' ? 0.5 : condition === 'drizzle' ? 0.4 : 0.3}
          reducedMotion={reducedMotion}
        />
      )}

      {showDust && !reducedMotion && (
        <DustParticles
          count={condition === 'clear' ? 150 : 100}
          reducedMotion={reducedMotion}
        />
      )}

      {showFireflies && !reducedMotion && (
        <FireflyParticles
          count={condition === 'clear' ? 50 : 30}
          reducedMotion={reducedMotion}
        />
      )}

      {showFog && !reducedMotion && (
        <FogParticles
          density={condition === 'foggy' ? 200 : 80}
          speed={condition === 'foggy' ? 0.3 : 0.6}
          reducedMotion={reducedMotion}
        />
      )}

      {showLightning && !reducedMotion && (
        <LightningFlash frequency={5} reducedMotion={reducedMotion} />
      )}

      {condition === 'clear' && !isNight && (
        <mesh position={[7, 6, -4]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.8} />
        </mesh>
      )}

      {condition === 'clear' && isNight && (
        <mesh position={[6, 5, -3]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#dde4f0" transparent opacity={0.9} />
        </mesh>
      )}

      <Ground condition={condition} isNight={isNight} />
      <DioramaObjects condition={condition} isNight={isNight} />

      {(condition === 'foggy' || condition === 'storm') && (
        <fog attach="fog" args={['#667788', 5, 20]} />
      )}
    </group>
  )
}
