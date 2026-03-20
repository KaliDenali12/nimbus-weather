# 3D Scene Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the 3D weather scene visually engaging for every weather condition by adding per-condition particle effects and repositioning diorama objects to flank the UI cards.

**Architecture:** Individual particle component per weather effect (matching existing RainParticles/SnowParticles pattern). Each is a standalone R3F component with a `useFrame` animation loop and BufferGeometry particles. SceneContent orchestrates which components render based on condition/timeOfDay. Diorama objects pushed to screen edges (x < -4 left, x > 4 right).

**Tech Stack:** React 19, Three.js, @react-three/fiber 9, @react-three/drei 10, TypeScript 5.9

---

### Task 1: Reposition DioramaObjects to Flank UI Cards

**Files:**
- Modify: `src/scenes/DioramaObjects.tsx` (full rewrite of layout)

**Step 1: Rewrite DioramaObjects with 2 houses and 8 trees on screen edges**

```tsx
import { useMemo } from 'react'
import type { WeatherCondition } from '@/types/index.ts'

interface DioramaObjectsProps {
  condition: WeatherCondition
  isNight: boolean
}

function Tree({ position, scale = 1, canopyColor }: { position: [number, number, number]; scale?: number; canopyColor?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 8]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.8} />
      </mesh>
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

function House({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1, 0.8, 0.8]} />
        <meshStandardMaterial color="#c8a882" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.75, 0.5, 4]} />
        <meshStandardMaterial color="#8b4513" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.2, 0.41]}>
        <boxGeometry args={[0.2, 0.4, 0.02]} />
        <meshStandardMaterial color="#5a3a1a" />
      </mesh>
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
    return undefined
  }, [condition])

  return (
    <group>
      {/* LEFT SIDE — House + 4 trees */}
      <House position={[-5.5, -0.5, 0.5]} />
      <Tree position={[-7, -0.5, -1]} scale={0.9} canopyColor={treeColor} />
      <Tree position={[-6, -0.5, 1.5]} scale={1.1} canopyColor={treeColor} />
      <Tree position={[-4.5, -0.5, -2]} scale={1.0} canopyColor={treeColor} />
      <Tree position={[-4, -0.5, 0]} scale={0.8} canopyColor={treeColor} />

      {/* RIGHT SIDE — House + 4 trees */}
      <House position={[5.5, -0.5, 0]} scale={0.9} />
      <Tree position={[4.5, -0.5, -1.5]} scale={1.0} canopyColor={treeColor} />
      <Tree position={[5, -0.5, 1]} scale={0.8} canopyColor={treeColor} />
      <Tree position={[6.5, -0.5, -0.5]} scale={1.1} canopyColor={treeColor} />
      <Tree position={[7, -0.5, 1.5]} scale={0.9} canopyColor={treeColor} />
    </group>
  )
}
```

**Step 2: Run build to verify no type errors**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Visual check — run dev server, verify houses and trees visible on left/right sides**

Run: `npm run dev`
Expected: Two houses and trees flanking the card area on both sides

**Step 4: Commit**

```bash
git add src/scenes/DioramaObjects.tsx
git commit -m "feat: reposition diorama objects to flank UI cards on left and right sides"
```

---

### Task 2: Move Sun and Moon to Right Side

**Files:**
- Modify: `src/scenes/SceneContent.tsx:100-112` (sun and moon position)

**Step 1: Update sun position from `[5, 7, -8]` to `[7, 6, -4]`**

Change lines 100-105:
```tsx
{condition === 'clear' && !isNight && (
  <mesh position={[7, 6, -4]}>
    <sphereGeometry args={[0.8, 16, 16]} />
    <meshBasicMaterial color="#ffd700" transparent opacity={0.8} />
  </mesh>
)}
```

**Step 2: Update moon position from `[-4, 6, -6]` to `[6, 5, -3]`**

Change lines 107-112:
```tsx
{condition === 'clear' && isNight && (
  <mesh position={[6, 5, -3]}>
    <sphereGeometry args={[0.5, 16, 16]} />
    <meshBasicMaterial color="#dde4f0" transparent opacity={0.9} />
  </mesh>
)}
```

**Step 3: Run build to verify no errors**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/scenes/SceneContent.tsx
git commit -m "feat: move sun and moon to right side of scene for visibility"
```

---

### Task 3: Create LeafParticles Component

**Files:**
- Create: `src/scenes/LeafParticles.tsx`

**Step 1: Create the leaf particle system**

```tsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface LeafParticlesProps {
  intensity?: number
  speed?: number
  reducedMotion?: boolean
}

const LEAF_COLORS = [0x5a7a3a, 0x8b6914, 0xc4622d, 0x6b8e23, 0xa0522d]

export function LeafParticles({ intensity = 50, speed = 0.5, reducedMotion = false }: LeafParticlesProps) {
  const ref = useRef<THREE.Points>(null)
  const count = Math.min(Math.max(0, intensity), 200)

  const { geometry, seeds } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const seedArr = new Float32Array(count * 2) // per-particle phase + speed variation

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = Math.random() * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20

      const color = new THREE.Color(LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)])
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      seedArr[i * 2] = Math.random() * Math.PI * 2 // phase offset
      seedArr[i * 2 + 1] = 0.5 + Math.random() * 1.0 // speed multiplier
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return { geometry: geo, seeds: seedArr }
  }, [count])

  useFrame((state) => {
    if (reducedMotion || !ref.current) return
    const t = state.clock.getElapsedTime()
    const posAttr = ref.current.geometry.attributes.position
    if (!posAttr) return
    const posArr = posAttr.array as Float32Array

    for (let i = 0; i < count; i++) {
      const phase = seeds[i * 2]
      const speedMul = seeds[i * 2 + 1]

      // Horizontal sine-wave drift
      posArr[i * 3] += Math.sin(t * speed * speedMul + phase) * 0.008
      // Slow vertical fall
      posArr[i * 3 + 1] -= 0.008 * speedMul * speed
      // Gentle z drift
      posArr[i * 3 + 2] += Math.cos(t * speed * 0.7 + phase) * 0.003

      // Reset when fallen below ground
      if (posArr[i * 3 + 1] < -1) {
        posArr[i * 3] = (Math.random() - 0.5) * 20
        posArr[i * 3 + 1] = 10 + Math.random() * 2
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
```

**Step 2: Run build to verify no type errors**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/scenes/LeafParticles.tsx
git commit -m "feat: add LeafParticles component for swirling leaf effect"
```

---

### Task 4: Create DustParticles Component

**Files:**
- Create: `src/scenes/DustParticles.tsx`

**Step 1: Create the dust mote particle system**

```tsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface DustParticlesProps {
  count?: number
  reducedMotion?: boolean
}

export function DustParticles({ count = 150, reducedMotion = false }: DustParticlesProps) {
  const ref = useRef<THREE.Points>(null)
  const clampedCount = Math.min(Math.max(0, count), 500)

  const { geometry, seeds } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(clampedCount * 3)
    const seedArr = new Float32Array(clampedCount * 3) // phase, speedX, speedY

    for (let i = 0; i < clampedCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = Math.random() * 8
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20

      seedArr[i * 3] = Math.random() * Math.PI * 2
      seedArr[i * 3 + 1] = (Math.random() - 0.5) * 0.004
      seedArr[i * 3 + 2] = 0.001 + Math.random() * 0.003 // upward float speed
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return { geometry: geo, seeds: seedArr }
  }, [clampedCount])

  useFrame((state) => {
    if (reducedMotion || !ref.current) return
    const t = state.clock.getElapsedTime()
    const posAttr = ref.current.geometry.attributes.position
    if (!posAttr) return
    const posArr = posAttr.array as Float32Array

    for (let i = 0; i < clampedCount; i++) {
      const phase = seedArr[i * 3]
      const driftX = seedArr[i * 3 + 1]
      const floatY = seedArr[i * 3 + 2]

      posArr[i * 3] += Math.sin(t * 0.3 + phase) * driftX
      posArr[i * 3 + 1] += floatY // gentle upward thermal
      posArr[i * 3 + 2] += Math.cos(t * 0.2 + phase) * 0.002

      // Reset when floated too high
      if (posArr[i * 3 + 1] > 10) {
        posArr[i * 3] = (Math.random() - 0.5) * 20
        posArr[i * 3 + 1] = -0.5 + Math.random() * 2
        posArr[i * 3 + 2] = (Math.random() - 0.5) * 20
      }
    }
    posAttr.needsUpdate = true
  })

  // Fix: reference seeds from closure correctly
  const seedArr = seeds

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
```

**Note:** There's a scoping issue in the above — `seedArr` is used inside `useFrame` but declared outside. Fix: rename the destructured variable or use `seeds` directly inside `useFrame`. Correct version uses `seeds` directly:

Replace `const seedArr = seeds` removal, and inside `useFrame` use `seeds[i * 3]`, `seeds[i * 3 + 1]`, `seeds[i * 3 + 2]` instead of `seedArr[...]`.

**Step 2: Run build to verify no type errors**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/scenes/DustParticles.tsx
git commit -m "feat: add DustParticles component for floating dust motes"
```

---

### Task 5: Create FireflyParticles Component

**Files:**
- Create: `src/scenes/FireflyParticles.tsx`

**Step 1: Create the firefly particle system with pulsing glow**

```tsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FireflyParticlesProps {
  count?: number
  reducedMotion?: boolean
}

export function FireflyParticles({ count = 50, reducedMotion = false }: FireflyParticlesProps) {
  const ref = useRef<THREE.Points>(null)
  const clampedCount = Math.min(Math.max(0, count), 100)
  const materialRef = useRef<THREE.PointsMaterial>(null)

  const { geometry, seeds } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(clampedCount * 3)
    const seedArr = new Float32Array(clampedCount * 4) // phase, wanderX, wanderZ, pulseSpeed

    for (let i = 0; i < clampedCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16
      positions[i * 3 + 1] = 0.5 + Math.random() * 4
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16

      seedArr[i * 4] = Math.random() * Math.PI * 2
      seedArr[i * 4 + 1] = (Math.random() - 0.5) * 0.006
      seedArr[i * 4 + 2] = (Math.random() - 0.5) * 0.006
      seedArr[i * 4 + 3] = 0.5 + Math.random() * 1.5 // pulse frequency
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return { geometry: geo, seeds: seedArr }
  }, [clampedCount])

  useFrame((state) => {
    if (reducedMotion || !ref.current) return
    const t = state.clock.getElapsedTime()
    const posAttr = ref.current.geometry.attributes.position
    if (!posAttr) return
    const posArr = posAttr.array as Float32Array

    for (let i = 0; i < clampedCount; i++) {
      const phase = seeds[i * 4]
      const wanderX = seeds[i * 4 + 1]
      const wanderZ = seeds[i * 4 + 2]

      posArr[i * 3] += Math.sin(t * 0.4 + phase) * wanderX
      posArr[i * 3 + 1] += Math.sin(t * 0.2 + phase) * 0.002
      posArr[i * 3 + 2] += Math.cos(t * 0.3 + phase) * wanderZ
    }
    posAttr.needsUpdate = true

    // Global opacity pulse (average of all fireflies)
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
```

**Step 2: Run build to verify no type errors**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/scenes/FireflyParticles.tsx
git commit -m "feat: add FireflyParticles component for night glow effect"
```

---

### Task 6: Create FogParticles Component

**Files:**
- Create: `src/scenes/FogParticles.tsx`

**Step 1: Create the rolling mist particle system**

```tsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FogParticlesProps {
  density?: number
  speed?: number
  reducedMotion?: boolean
}

export function FogParticles({ density = 200, speed = 0.3, reducedMotion = false }: FogParticlesProps) {
  const ref = useRef<THREE.Points>(null)
  const clampedDensity = Math.min(Math.max(0, density), 500)

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(clampedDensity * 3)

    for (let i = 0; i < clampedDensity; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25
      positions[i * 3 + 1] = 0.5 + Math.random() * 3 // horizontal band near ground
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [clampedDensity])

  useFrame(() => {
    if (reducedMotion || !ref.current) return
    const posAttr = ref.current.geometry.attributes.position
    if (!posAttr) return
    const posArr = posAttr.array as Float32Array

    for (let i = 0; i < clampedDensity; i++) {
      // Drift in one direction
      posArr[i * 3] += speed * 0.01

      // Respawn on opposite side
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
```

**Step 2: Run build to verify no type errors**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/scenes/FogParticles.tsx
git commit -m "feat: add FogParticles component for rolling mist effect"
```

---

### Task 7: Create LightningFlash Component

**Files:**
- Create: `src/scenes/LightningFlash.tsx`

**Step 1: Create the lightning flash point light**

```tsx
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface LightningFlashProps {
  frequency?: number // avg seconds between flashes
  reducedMotion?: boolean
}

export function LightningFlash({ frequency = 5, reducedMotion = false }: LightningFlashProps) {
  const lightRef = useRef<THREE.PointLight>(null)
  const [position] = useState<[number, number, number]>(() => [
    (Math.random() - 0.5) * 12,
    9,
    -5,
  ])

  const nextFlashRef = useRef(Math.random() * frequency)
  const flashPhaseRef = useRef(-1) // -1 = idle, 0-3 = flash stages

  useFrame((state) => {
    if (reducedMotion || !lightRef.current) return
    const t = state.clock.getElapsedTime()

    if (flashPhaseRef.current === -1) {
      // Waiting for next flash
      lightRef.current.intensity = 0
      if (t > nextFlashRef.current) {
        flashPhaseRef.current = 0
        // Randomize position for next flash
        lightRef.current.position.x = (Math.random() - 0.5) * 12
      }
    } else {
      // Double-flash pattern: on-off-on-off over ~0.3s
      const elapsed = t - nextFlashRef.current
      if (elapsed < 0.05) {
        lightRef.current.intensity = 3
      } else if (elapsed < 0.1) {
        lightRef.current.intensity = 0
      } else if (elapsed < 0.15) {
        lightRef.current.intensity = 4
      } else if (elapsed < 0.25) {
        lightRef.current.intensity = 0.5
      } else {
        lightRef.current.intensity = 0
        flashPhaseRef.current = -1
        nextFlashRef.current = t + frequency * (0.5 + Math.random())
      }
    }
  })

  return (
    <pointLight
      ref={lightRef}
      position={position}
      color="#ffffff"
      intensity={0}
      distance={30}
      decay={1}
    />
  )
}
```

**Step 2: Run build to verify no type errors**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/scenes/LightningFlash.tsx
git commit -m "feat: add LightningFlash component for storm double-flash effect"
```

---

### Task 8: Add windSpeed Prop to SnowParticles

**Files:**
- Modify: `src/scenes/SnowParticles.tsx`

**Step 1: Add optional windSpeed prop and apply horizontal drift**

Add `windSpeed?: number` to the component. Default to 0. Inside `useFrame`, add `posArr[i * 3] += windSpeed * 0.005` to each particle's x position update.

The interface becomes:
```tsx
interface SnowParticlesProps {
  windSpeed?: number
}

export function SnowParticles({ windSpeed = 0 }: SnowParticlesProps) {
```

Inside the useFrame loop, after the existing `posArr[i * 3] += Math.sin(t + i) * 0.002` line, add:
```tsx
posArr[i * 3] += windSpeed * 0.005
```

**Step 2: Run build to verify no type errors**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/scenes/SnowParticles.tsx
git commit -m "feat: add windSpeed prop to SnowParticles for wind gust effect"
```

---

### Task 9: Wire All New Components into SceneContent

**Files:**
- Modify: `src/scenes/SceneContent.tsx` (imports + conditional rendering)

**Step 1: Add imports for all new components**

Add after existing scene imports:
```tsx
import { LeafParticles } from '@/scenes/LeafParticles.tsx'
import { DustParticles } from '@/scenes/DustParticles.tsx'
import { FireflyParticles } from '@/scenes/FireflyParticles.tsx'
import { FogParticles } from '@/scenes/FogParticles.tsx'
import { LightningFlash } from '@/scenes/LightningFlash.tsx'
```

**Step 2: Add condition booleans and new rendering blocks**

After the existing boolean declarations (`isNight`, `isRain`, `isSnow`, `showClouds`), add:
```tsx
const showLeaves = condition === 'clear' || condition === 'partly-cloudy' || condition === 'cloudy' || condition === 'drizzle'
const showDust = (condition === 'clear' || condition === 'partly-cloudy') && !isNight
const showFireflies = (condition === 'clear' || condition === 'partly-cloudy') && isNight
const showFog = condition === 'foggy' || condition === 'storm'
const showLightning = condition === 'storm'
```

**Step 3: Add rendering blocks in the JSX return**

After the snow particles line (`{isSnow && !reducedMotion && <SnowParticles />}`), add the new particle effects:

```tsx
{showLeaves && !reducedMotion && (
  <LeafParticles
    intensity={condition === 'cloudy' ? 70 : condition === 'partly-cloudy' ? 50 : condition === 'drizzle' ? 30 : 40}
    speed={condition === 'cloudy' ? 1.0 : condition === 'partly-cloudy' ? 0.5 : condition === 'drizzle' ? 0.4 : 0.3}
    reducedMotion={reducedMotion}
  />
)}

{showDust && !reducedMotion && (
  <DustParticles
    count={condition === 'clear' ? 150 : 100}
    reducedMotion={reducedMotion}
  />
)}

{showFireflies && !reducedMotion && (
  <FireflyParticles
    count={condition === 'clear' ? 50 : 30}
    reducedMotion={reducedMotion}
  />
)}

{showFog && !reducedMotion && (
  <FogParticles
    density={condition === 'foggy' ? 200 : 80}
    speed={condition === 'foggy' ? 0.3 : 0.6}
    reducedMotion={reducedMotion}
  />
)}

{showLightning && !reducedMotion && (
  <LightningFlash frequency={5} reducedMotion={reducedMotion} />
)}
```

Also update the SnowParticles line to pass windSpeed for stormy snow:
```tsx
{isSnow && !reducedMotion && <SnowParticles windSpeed={condition === 'storm' ? 1 : 0} />}
```

**Note:** `condition` can't be both `'snow'` and `'storm'` simultaneously (they are distinct union members), so `windSpeed` will always be 0 here. If the design intent is for heavy-snow storms, this can be revisited. For now it's a no-op prop ready for future use.

**Step 4: Run build to verify no type errors**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Run existing tests to verify nothing is broken**

Run: `npm run test`
Expected: All 97 tests pass (scene components are not unit-tested)

**Step 6: Commit**

```bash
git add src/scenes/SceneContent.tsx
git commit -m "feat: wire all weather particle effects into SceneContent orchestrator"
```

---

### Task 10: Visual Verification and Final Commit

**Step 1: Run dev server and visually test each condition**

Run: `npm run dev`

Test by searching for cities with known weather patterns, or by temporarily hardcoding a condition in `SceneContent` to cycle through:
- Clear day: leaves + dust + sun on right + houses/trees on sides
- Clear night: fireflies + moon on right + stars + houses/trees on sides
- Partly cloudy day: leaves + dust + clouds
- Partly cloudy night: fireflies + clouds + stars
- Cloudy: faster leaves + denser clouds
- Foggy: fog particles + clouds + fog attach
- Rain: rain particles + clouds (existing, unchanged)
- Storm: rain + lightning flashes + fog particles + dense clouds
- Snow: snow particles + white trees

**Step 2: Run full test suite**

Run: `npm run test`
Expected: All tests pass

**Step 3: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors or warnings

**Step 4: Final commit if any tweaks were needed**

```bash
git add -A
git commit -m "feat: complete 3D scene enhancement — all weather conditions now visually distinct"
```
