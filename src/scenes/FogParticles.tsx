import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FogParticlesProps {
  density?: number
  speed?: number
  reducedMotion?: boolean
}

const MAX_PARTICLES = 500

export function FogParticles({
  density = 200,
  speed = 0.3,
  reducedMotion = false,
}: FogParticlesProps) {
  const ref = useRef<THREE.Points>(null)
  const clampedDensity = Math.min(Math.max(0, density), MAX_PARTICLES)

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(clampedDensity * 3)
    for (let i = 0; i < clampedDensity; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25
      positions[i * 3 + 1] = 0.5 + Math.random() * 3
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [clampedDensity])

  useFrame(() => {
    if (reducedMotion) return
    if (!ref.current) return
    const posAttr = ref.current.geometry.attributes.position
    if (!posAttr) return
    const posArr = posAttr.array as Float32Array
    for (let i = 0; i < clampedDensity; i++) {
      posArr[i * 3] += speed * 0.01
      if (posArr[i * 3] > 12.5) {
        posArr[i * 3] = -12.5
        posArr[i * 3 + 1] = 0.5 + Math.random() * 3
        posArr[i * 3 + 2] = (Math.random() - 0.5) * 25
      }
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.4}
        color="#aabbcc"
        transparent
        opacity={0.15}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
