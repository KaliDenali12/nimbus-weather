import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface DustParticlesProps {
  count?: number
  reducedMotion?: boolean
}

const MAX_PARTICLES = 500

export function DustParticles({ count = 150, reducedMotion = false }: DustParticlesProps) {
  const ref = useRef<THREE.Points>(null)
  const clampedCount = Math.min(Math.max(0, count), MAX_PARTICLES)

  const { geometry, seeds } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(clampedCount * 3)
    const seedArr = new Float32Array(clampedCount * 3)

    for (let i = 0; i < clampedCount; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 20
      positions[i3 + 1] = Math.random() * 8
      positions[i3 + 2] = (Math.random() - 0.5) * 20

      seedArr[i3] = Math.random() * Math.PI * 2
      seedArr[i3 + 1] = (Math.random() - 0.5) * 0.008
      seedArr[i3 + 2] = 0.001 + Math.random() * 0.003
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
    const elapsed = clock.getElapsedTime()

    for (let i = 0; i < clampedCount; i++) {
      const i3 = i * 3
      const phase = seeds[i3]
      const driftX = seeds[i3 + 1]
      const floatY = seeds[i3 + 2]

      posArr[i3] += Math.sin(elapsed + phase) * driftX
      posArr[i3 + 1] += floatY
      posArr[i3 + 2] += Math.cos(elapsed + phase) * driftX * 0.5

      if (posArr[i3 + 1] > 10) {
        posArr[i3] = (Math.random() - 0.5) * 20
        posArr[i3 + 1] = -0.5 + Math.random() * 2
        posArr[i3 + 2] = (Math.random() - 0.5) * 20
      }
    }

    posAttr.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        color="#ffe4a0"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  )
}
