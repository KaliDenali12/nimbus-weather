# 3D Scene Enhancement Design

**Date:** 2026-03-20
**Goal:** Make the 3D weather scene visually engaging for ALL weather conditions (not just rain/snow) and reposition diorama objects to flank the UI cards instead of hiding behind them.

---

## Problem

1. Rain/snow have particle effects and look great. All other conditions (clear, cloudy, foggy, partly-cloudy) render as a mostly empty scene — feels like a plain background.
2. The single house and 5 trees are centered in the scene, directly behind the glass cards, making them invisible to most users.

## Approach

**Individual component per effect** (Approach A). One new file per particle type, matching the existing `RainParticles`/`SnowParticles` pattern. Each effect is independently testable, toggleable, and tunable.

---

## Part 1: Diorama Layout Repositioning

Push all scene objects to the left (x < -4) and right (x > 4) sides, flanking the center where glass cards live.

### New Layout

```
LEFT SIDE (x: -7 to -4)          CENTER (cards)          RIGHT SIDE (x: +4 to +7)
  House 1                          Glass Cards              Sun / Moon
  Tree  Tree  Tree                                          House 2
        Tree                                                Tree  Tree  Tree
                                                                  Tree
```

- **2 houses** — left (~x: -5.5), right (~x: +5.5), brought forward (z: 0 to +1)
- **8 trees** — ~4 left, ~4 right, staggered depths for parallax
- **Sun** — moved to [7, 6, -4] (right side, visible)
- **Moon** — moved to [6, 5, -3] (right side)
- **Ground** — unchanged (30x30 plane, already covers everything)

---

## Part 2: New Particle & Effect Components

### `LeafParticles.tsx` — Swirling leaves

- Conditions: clear day, partly-cloudy, cloudy, drizzle
- Count: 40-80 particles
- Movement: sine-wave horizontal drift + slow vertical fall, random gust bursts
- Colors: mix of greens/browns/oranges (#5a7a3a, #8b6914, #c4622d)
- Size: 0.12-0.18 (larger than rain)
- Speed scales with condition (gentle for clear, faster for cloudy)
- Props: `intensity?: number`, `speed?: number`

### `DustParticles.tsx` — Floating dust motes / pollen

- Conditions: clear day, partly-cloudy
- Count: ~150 tiny particles
- Movement: very slow random drift, slight upward float (thermal updrafts)
- Color: warm gold (#ffe4a0), high opacity variance
- Size: 0.03-0.06
- Props: `count?: number`

### `FireflyParticles.tsx` — Night glow dots

- Conditions: clear night, partly-cloudy night
- Count: 30-50 particles
- Movement: slow random wander with occasional pause
- Color: yellow-green (#ccff66), pulsing opacity per particle (sinusoidal)
- Size: 0.08, additive blending for glow
- Props: `count?: number`

### `FogParticles.tsx` — Rolling mist

- Conditions: foggy (heavy), storm (light)
- Count: ~200 particles in horizontal bands
- Movement: slow horizontal drift, respawn on opposite side
- Color: gray-white (#aabbcc), high transparency
- Size: 0.3-0.5 (large, soft, blobby)
- Props: `density?: number`, `speed?: number`

### `LightningFlash.tsx` — Storm lightning

- Conditions: storm only
- Not a particle system — a point light
- Behavior: random 3-8s interval, double-flash pattern (on-off-on-off), intensity 0 to ~3
- Position: random x (-6 to 6), high y (8-10)
- Props: `frequency?: number`

### `SnowParticles.tsx` — Minor enhancement

- Add optional `windSpeed?: number` prop for horizontal drift

---

## Part 3: SceneContent Wiring

### Condition-to-Effect Mapping

| Condition | Particles | Enhanced Objects |
|-----------|-----------|-----------------|
| Clear day | Leaves (40, speed 0.3) + Dust (150) | Sun (right side) |
| Clear night | Fireflies (50) | Moon (right side) + Stars |
| Partly cloudy day | Leaves (50, speed 0.5) + Dust (100) | Clouds |
| Partly cloudy night | Fireflies (30) | Clouds + Stars |
| Cloudy | Leaves (70, speed 1.0) | Clouds (denser) |
| Foggy | FogParticles (200, speed 0.3) | Clouds + fog attach |
| Drizzle | Rain (existing) + Leaves (30, speed 0.4) | Clouds |
| Rain | Rain (existing) | Clouds |
| Storm | Rain (existing) + Lightning (freq 5) | Clouds (dense) + fog + FogParticles (80, speed 0.6) |
| Snow | Snow (existing, +wind) | Snow-colored trees |

### Performance

- All new components respect `reducedMotion` — skip useFrame, render static
- Particle counts are modest (30-200 range)
- Lightning is a point light toggle — zero geometry cost
- Unused components don't render

---

## Files Summary

### New Files (5)

| File | Purpose |
|------|---------|
| `src/scenes/LeafParticles.tsx` | Swirling leaves particle system |
| `src/scenes/DustParticles.tsx` | Floating dust/pollen motes |
| `src/scenes/FireflyParticles.tsx` | Night glow dots with pulsing opacity |
| `src/scenes/FogParticles.tsx` | Horizontal rolling mist wisps |
| `src/scenes/LightningFlash.tsx` | Random double-flash point light |

### Modified Files (3)

| File | Change |
|------|--------|
| `src/scenes/SceneContent.tsx` | Import + wire all new components, move sun/moon positions |
| `src/scenes/DioramaObjects.tsx` | 2 houses, 8 trees, pushed to screen edges |
| `src/scenes/SnowParticles.tsx` | Add optional windSpeed prop |
