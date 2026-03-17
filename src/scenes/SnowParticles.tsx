import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 600

export function SnowParticles() {
  const ref = useRef<THREE.Points>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = Math.random() * 15
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const posAttr = ref.current.geometry.attributes.position
    if (!posAttr) return
    const t = state.clock.getElapsedTime()
    const posArr = posAttr.array as Float32Array
    for (let i = 0; i < COUNT; i++) {
      posArr[i * 3] += Math.sin(t + i) * 0.002
      posArr[i * 3 + 1] -= 0.02
      if (posArr[i * 3 + 1] < -1) {
        posArr[i * 3 + 1] = 15
        posArr[i * 3] = (Math.random() - 0.5) * 20
      }
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.1}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}
