import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface LeafParticlesProps {
  intensity?: number
  speed?: number
  reducedMotion?: boolean
}

const MAX_PARTICLES = 200
const LEAF_COLORS = [0x5a7a3a, 0x8b6914, 0xc4622d, 0x6b8e23, 0xa0522d]

export function LeafParticles({
  intensity = 50,
  speed = 0.5,
  reducedMotion = false,
}: LeafParticlesProps) {
  const ref = useRef<THREE.Points>(null)
  const count = Math.min(Math.max(0, intensity), MAX_PARTICLES)

  const { geometry, seeds } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const seedArr = new Float32Array(count * 2)
    const color = new THREE.Color()

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = Math.random() * 15
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20

      color.set(LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)])
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      seedArr[i * 2] = Math.random() * Math.PI * 2
      seedArr[i * 2 + 1] = 0.5 + Math.random() * 1.5
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    return { geometry: geo, seeds: seedArr }
  }, [count])

  useFrame((state) => {
    if (reducedMotion) return
    if (!ref.current) return
    const posAttr = ref.current.geometry.attributes.position
    if (!posAttr) return

    const t = state.clock.getElapsedTime()
    const posArr = posAttr.array as Float32Array

    for (let i = 0; i < count; i++) {
      const phase = seeds[i * 2]
      const speedMul = seeds[i * 2 + 1]

      posArr[i * 3] += Math.sin(t * speed + phase) * 0.015 * speedMul
      posArr[i * 3 + 1] -= 0.01 * speed * speedMul
      posArr[i * 3 + 2] += Math.cos(t * speed * 0.7 + phase) * 0.008 * speedMul

      if (posArr[i * 3 + 1] < -1) {
        posArr[i * 3] = (Math.random() - 0.5) * 20
        posArr[i * 3 + 1] = 15
        posArr[i * 3 + 2] = (Math.random() - 0.5) * 20
      }
    }

    posAttr.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
      />
    </points>
  )
}
