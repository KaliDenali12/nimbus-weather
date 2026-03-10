import { Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { useWeather } from '@/context/WeatherContext.tsx'

const SceneContent = lazy(() => import('@/scenes/SceneContent.tsx'))

export function WeatherScene() {
  const { weather, condition, timeOfDay } = useWeather()

  if (!weather) return null

  // Respect reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div
      className="fixed inset-0 z-0"
      role="img"
      aria-label={`3D weather scene showing ${condition} ${timeOfDay === 'night' ? 'at night' : 'during the day'}`}
    >
      <Canvas
        camera={{ position: [0, 2, 8], fov: 60 }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
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
