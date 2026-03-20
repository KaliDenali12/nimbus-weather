import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface LightningFlashProps {
  frequency?: number
  reducedMotion?: boolean
}

export function LightningFlash({
  frequency = 5,
  reducedMotion = false,
}: LightningFlashProps) {
  const lightRef = useRef<THREE.PointLight>(null)
  const nextFlashTimeRef = useRef(Math.random() * frequency)
  const flashPhaseRef = useRef(-1)
  const flashStartRef = useRef(0)

  useFrame(({ clock }) => {
    if (reducedMotion) return
    if (!lightRef.current) return

    const time = clock.getElapsedTime()
    const light = lightRef.current

    if (flashPhaseRef.current === -1) {
      light.intensity = 0

      if (time > nextFlashTimeRef.current) {
        flashPhaseRef.current = 0
        flashStartRef.current = time
        light.position.x = Math.random() * 12 - 6
      }
      return
    }

    const elapsed = time - flashStartRef.current

    if (elapsed < 0.05) {
      light.intensity = 3
    } else if (elapsed < 0.1) {
      light.intensity = 0
    } else if (elapsed < 0.15) {
      light.intensity = 4
    } else if (elapsed < 0.25) {
      light.intensity = 0.5
    } else {
      light.intensity = 0
      flashPhaseRef.current = -1
      nextFlashTimeRef.current = time + frequency * (0.5 + Math.random())
    }
  })

  return (
    <pointLight
      ref={lightRef}
      intensity={0}
      color="#ffffff"
      distance={30}
      decay={1}
      position={[Math.random() * 12 - 6, 9, -5]}
    />
  )
}
