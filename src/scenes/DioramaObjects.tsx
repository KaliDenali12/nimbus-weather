import { useMemo } from 'react'
import type { WeatherCondition } from '@/types/index.ts'

interface DioramaObjectsProps {
  condition: WeatherCondition
  isNight: boolean
}

/** Simple stylized tree with optional canopy color override (e.g. snow-covered) */
function Tree({ position, scale = 1, canopyColor }: { position: [number, number, number]; scale?: number; canopyColor?: string }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 8]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.8} />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, 1.1, 0]}>
        <coneGeometry args={[0.5, 1.2, 8]} />
        <meshStandardMaterial color={canopyColor ?? '#2d6a2d'} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <coneGeometry args={[0.35, 0.8, 8]} />
        <meshStandardMaterial color={canopyColor ?? '#3a8a3a'} roughness={0.7} />
      </mesh>
    </group>
  )
}

/** Simple house */
function House({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Walls */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1, 0.8, 0.8]} />
        <meshStandardMaterial color="#c8a882" roughness={0.8} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 1, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.75, 0.5, 4]} />
        <meshStandardMaterial color="#8b4513" roughness={0.7} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.2, 0.41]}>
        <boxGeometry args={[0.2, 0.4, 0.02]} />
        <meshStandardMaterial color="#5a3a1a" />
      </mesh>
      {/* Window (warm glow at night) */}
      <mesh position={[0.3, 0.5, 0.41]}>
        <boxGeometry args={[0.15, 0.15, 0.02]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

export function DioramaObjects({ condition, isNight: _isNight }: DioramaObjectsProps) {
  const treeColor = useMemo(() => {
    if (condition === 'snow') return '#dde8ee'
    return undefined // use default green
  }, [condition])

  return (
    <group>
      {/* Trees */}
      {treeColor ? (
        // Snow-covered trees: override canopy color
        <group>
          <Tree position={[-3, -0.5, -2]} scale={0.9} canopyColor={treeColor} />
          <Tree position={[-1.5, -0.5, -4]} scale={1.1} canopyColor={treeColor} />
          <Tree position={[2, -0.5, -3]} scale={1.0} canopyColor={treeColor} />
          <Tree position={[4, -0.5, -1]} scale={0.8} canopyColor={treeColor} />
          <Tree position={[-2, -0.5, 1]} scale={1.0} canopyColor={treeColor} />
        </group>
      ) : (
        <>
          <Tree position={[-3, -0.5, -2]} scale={0.9} />
          <Tree position={[-1.5, -0.5, -4]} scale={1.1} />
          <Tree position={[2, -0.5, -3]} />
          <Tree position={[4, -0.5, -1]} scale={0.8} />
          <Tree position={[-2, -0.5, 1]} scale={1.0} />
        </>
      )}

      {/* House */}
      <House position={[0.5, -0.5, -1]} />
    </group>
  )
}
