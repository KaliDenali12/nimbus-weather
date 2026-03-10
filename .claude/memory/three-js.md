# Three.js / React Three Fiber — Nimbus Weather App

## Stack

- **three**: 0.175.0
- **@react-three/fiber**: 9.1.2 (R3F — React renderer for Three.js)
- **@react-three/drei**: 10.0.0 (only used for `Stars` component)

## File Map

| File | Role |
|------|------|
| `scenes/WeatherScene.tsx` | Canvas wrapper. Lazy-loads SceneContent. Checks `prefers-reduced-motion`. |
| `scenes/SceneContent.tsx` | Main orchestrator: lighting, particles, objects, camera sway |
| `scenes/RainParticles.tsx` | BufferGeometry points, vertical fall (0.15/frame), intensity-based count |
| `scenes/SnowParticles.tsx` | 600 points, slow fall (0.02), sine-based horizontal drift |
| `scenes/SimpleCloud.tsx` | Custom cloud (4 overlapping spheres), optional x-axis drift |
| `scenes/Ground.tsx` | Plane geometry, color by condition/time (green/white/dark) |
| `scenes/DioramaObjects.tsx` | Tree (cylinder+cones) + House (box+cone roof+door+window) |

## Architecture

- `WeatherScene` renders in `App.tsx` as fixed background (`position: fixed, inset: 0, z-index: 0`)
- Canvas: `camera={{ position: [0, 2, 5], fov: 45 }}`, `dpr={Math.min(window.devicePixelRatio, 2)}`
- SceneContent receives `condition` + `timeOfDay` from `useWeather()` context
- Scene elements rendered conditionally based on weather condition

## Conditional Rendering Logic (SceneContent)

| Condition | Elements |
|-----------|----------|
| clear (day) | Sun sphere, bright ambient, ground green |
| clear (night) | Moon sphere, Stars, dim ambient, dark ground |
| cloudy/partly-cloudy | SimpleCloud x3, moderate ambient |
| rain/drizzle | RainParticles, SimpleClouds, dark lighting |
| snow | SnowParticles, white ground, snow-covered objects |
| storm | RainParticles (high intensity), dark lighting, fog |
| foggy | Fog effect, muted lighting |

## Known Gotchas

1. **drei Cloud removed** — v10 broke `Cloud` props (no `width`/`depth`/`segments`). `SimpleCloud` is a custom replacement using 4 overlapping `sphereGeometry` meshes.
2. **bufferAttribute in R3F v9** — JSX `<bufferAttribute>` needs `args` prop. We create `BufferGeometry` programmatically with `new THREE.BufferAttribute()` instead.
3. **useFrame updates** — Particle positions update via `geometry.attributes.position.array` direct mutation + `needsUpdate = true`.
4. **Reduced motion** — `WeatherScene` checks `window.matchMedia('(prefers-reduced-motion: reduce)')` and skips rendering entirely if true.

## Performance

- DPR capped at 2 to prevent high-DPI GPU overload
- SceneContent lazy-loaded (Suspense with null fallback)
- Manual chunks in Vite: `three` + `@react-three/fiber` + `@react-three/drei` → separate bundle
- Particle counts: Rain 300-1500 (by intensity), Snow 600 (fixed)
- Camera sway via `useFrame` with small sine offsets (subtle, not distracting)

## Adding a New Weather Effect

1. Create component in `scenes/` following RainParticles/SnowParticles pattern
2. Add conditional in `SceneContent.tsx` based on weather condition
3. Use `useFrame` for per-frame animation
4. Respect reduced-motion preference
5. Keep particle count reasonable (<2000)
