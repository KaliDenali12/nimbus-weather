import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SimpleCloudProps {
  position: [number, number, number]
  scale?: number
  opacity?: number
  speed?: number
}

/** A simple cloud made of overlapping spheres */
export function SimpleCloud({ position, scale = 1, opacity = 0.4, speed = 0.2 }: SimpleCloudProps) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current || speed === 0) return
    const t = state.clock.getElapsedTime()
    ref.current.position.x = position[0] + Math.sin(t * speed) * 0.5
  })

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#cccccc" transparent opacity={opacity} roughness={1} />
      </mesh>
      <mesh position={[1.2, 0.2, 0]}>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshStandardMaterial color="#cccccc" transparent opacity={opacity} roughness={1} />
      </mesh>
      <mesh position={[-1, 0.1, 0.3]}>
        <sphereGeometry args={[0.9, 12, 12]} />
        <meshStandardMaterial color="#cccccc" transparent opacity={opacity} roughness={1} />
      </mesh>
      <mesh position={[0.5, 0.4, -0.2]}>
        <sphereGeometry args={[0.7, 12, 12]} />
        <meshStandardMaterial color="#dddddd" transparent opacity={opacity} roughness={1} />
      </mesh>
    </group>
  )
}
