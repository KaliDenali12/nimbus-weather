import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface RainParticlesProps {
  intensity?: number
}

const MAX_PARTICLES = 3000

export function RainParticles({ intensity = 800 }: RainParticlesProps) {
  const ref = useRef<THREE.Points>(null)
  const clampedIntensity = Math.min(Math.max(0, intensity), MAX_PARTICLES)

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(clampedIntensity * 3)
    for (let i = 0; i < clampedIntensity; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = Math.random() * 15
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [clampedIntensity])

  useFrame(() => {
    if (!ref.current) return
    const posAttr = ref.current.geometry.attributes.position
    if (!posAttr) return
    const posArr = posAttr.array as Float32Array
    for (let i = 0; i < clampedIntensity; i++) {
      posArr[i * 3 + 1] -= 0.15
      if (posArr[i * 3 + 1] < -1) {
        posArr[i * 3 + 1] = 15
      }
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        color="#aaccff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}
