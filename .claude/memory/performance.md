# Performance — Nimbus Weather App

## Bundle Strategy

### Code Splitting (vite.config.ts)

Manual chunks via `rollupOptions.output.manualChunks`:

| Chunk | Contents | Rationale |
|-------|----------|-----------|
| `three` | three, @react-three/fiber, @react-three/drei | Largest dep (~500KB). Lazy-loaded via SceneContent. |
| `recharts` | recharts | ~200KB. Only needed after weather data loads. |
| Main | App code, React, utilities | ~31KB gzip. Always loaded. |

### Lazy Loading

- `SceneContent` loaded via `React.lazy(() => import('@/scenes/SceneContent.tsx'))`
- Wrapped in `Suspense` with `null` fallback (invisible until loaded)
- Three.js bundle only downloaded when 3D scene is needed

## Rendering Optimizations

### React

| Pattern | Where | Effect |
|---------|-------|--------|
| `useCallback` | All WeatherContext actions | Prevents child re-renders on context update |
| `useMemo` | SceneContent lighting calculations | Avoids per-frame recalculation |
| `useMemo` | Ground color computation | Stable reference between renders |
| Conditional return `null` | RecentCities, AlertBanner | Skip render when no data |

### Three.js / WebGL

| Pattern | Where | Effect |
|---------|-------|--------|
| DPR cap at 2 | WeatherScene Canvas | Prevents GPU overload on 4K+ displays |
| Particle count limits | Rain: 300-1500, Snow: 600 | Bounded GPU particle processing |
| BufferGeometry mutation | Rain/SnowParticles | Direct array mutation + needsUpdate, no new allocations |
| prefers-reduced-motion | WeatherScene | Skips entire Canvas when motion reduced |

## Network Optimizations

| Pattern | Where | Effect |
|---------|-------|--------|
| Debounce 300ms | SearchBar → useDebounce | Prevents rapid API calls during typing |
| Min 2 chars | searchCities() | No API call for single-character queries |
| Cancellation flag | SearchBar useEffect | Prevents stale search results from updating state |
| Geolocation 5min cache | getUserLocation() | navigator.geolocation maxAge option |

## Font Loading

- Google Fonts with `display=swap` — text visible immediately with fallback font
- Two font families: Bricolage Grotesque (display) + Figtree (body)
- Preconnect hints in `index.html` `<head>`

## CSS Performance

- `background-attachment: fixed` on body — may cause repaint on scroll (acceptable for static app)
- `backdrop-filter: blur()` — GPU-composited, but can be expensive on low-end mobile
- Transitions use `ease` timing — native CSS, no JS overhead
- `will-change` not used (not needed for this app's complexity)

## Measured Build Output

```
dist/
├── index-[hash].css        ~8KB
├── index-[hash].js         ~31KB gzip (main app)
├── three-[hash].js         ~180KB gzip (Three.js ecosystem)
├── recharts-[hash].js      ~70KB gzip (charting)
└── SceneContent-[hash].js  ~5KB gzip (lazy 3D scene)
```

## Potential Improvements

- Service worker for offline fallback (stretch feature)
- API response caching (10-15min TTL)
- Image/asset preloading (not needed currently — no images)
- Virtual list for search results (not needed — max 8 results)
- Web Worker for heavy computation (not needed — all ops are fast)
