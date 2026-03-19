import { Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { useWeather } from '@/context/WeatherContext.tsx'

const SceneContent = lazy(() => import('@/scenes/SceneContent.tsx'))

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const canvasDpr = typeof window !== 'undefined'
  ? Math.min(window.devicePixelRatio, 2)
  : 1

const cameraConfig = { position: [0, 2, 8] as const, fov: 60 }
const glConfig = { antialias: true, alpha: true }
const canvasStyle = { background: 'transparent' }

export function WeatherScene() {
  const { weather, condition, timeOfDay, preferences } = useWeather()

  if (!weather) return null

  const isDark = preferences.darkModeEnabled

  return (
    <div
      className={`fixed inset-0 z-0 transition-opacity duration-slow ${isDark ? 'opacity-30' : 'opacity-100'}`}
      style={{ maskImage: 'linear-gradient(to bottom, black 35%, transparent 75%)', WebkitMaskImage: 'linear-gradient(to bottom, black 35%, transparent 75%)' }}
      role="img"
      aria-label={`3D weather scene showing ${condition} ${timeOfDay === 'night' ? 'at night' : 'during the day'}`}
    >
      <Canvas
        camera={cameraConfig}
        dpr={canvasDpr}
        gl={glConfig}
        style={canvasStyle}
      >
        <Suspense fallback={null}>
          <SceneContent
            condition={condition}
            timeOfDay={timeOfDay}
            reducedMotion={prefersReducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
