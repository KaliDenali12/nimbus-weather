import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FireflyParticlesProps {
  count?: number
  reducedMotion?: boolean
}

const MAX_FIREFLIES = 100
const SEEDS_PER_PARTICLE = 4

export function FireflyParticles({
  count = 50,
  reducedMotion = false,
}: FireflyParticlesProps) {
  const ref = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.PointsMaterial>(null)
  const clampedCount = Math.min(Math.max(0, count), MAX_FIREFLIES)

  const { geometry, seeds } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(clampedCount * 3)
    const seedArr = new Float32Array(clampedCount * SEEDS_PER_PARTICLE)

    for (let i = 0; i < clampedCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16
      positions[i * 3 + 1] = 0.5 + Math.random() * 4
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16

      const si = i * SEEDS_PER_PARTICLE
      seedArr[si] = Math.random() * Math.PI * 2 // phase
      seedArr[si + 1] = (Math.random() - 0.5) * 0.012 // wanderX (±0.006)
      seedArr[si + 2] = (Math.random() - 0.5) * 0.012 // wanderZ (±0.006)
      seedArr[si + 3] = 0.5 + Math.random() * 1.5 // pulseSpeed 0.5-2.0
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return { geometry: geo, seeds: seedArr }
  }, [clampedCount])

  useFrame(({ clock }) => {
    if (reducedMotion) return
    if (!ref.current) return

    const posAttr = ref.current.geometry.attributes.position
    if (!posAttr) return

    const posArr = posAttr.array as Float32Array
    const t = clock.getElapsedTime()

    for (let i = 0; i < clampedCount; i++) {
      const si = i * SEEDS_PER_PARTICLE
      const phase = seeds[si]
      const wanderX = seeds[si + 1]
      const wanderZ = seeds[si + 2]
      const pulseSpeed = seeds[si + 3]

      posArr[i * 3] += Math.sin(t * pulseSpeed + phase) * wanderX
      posArr[i * 3 + 1] += Math.sin(t * 0.5 + phase) * 0.002
      posArr[i * 3 + 2] += Math.cos(t * pulseSpeed + phase) * wanderZ
    }

    posAttr.needsUpdate = true

    if (materialRef.current) {
      materialRef.current.opacity = 0.4 + Math.sin(t * 1.5) * 0.3
    }
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        size={0.08}
        color="#ccff66"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
