# Performance Report — Run 1

**Date:** 2026-03-18
**Branch:** `nightytidy/run-2026-03-18-1312`
**App:** Nimbus Weather (React 19 + Three.js + Open-Meteo, pure client-side)
**Test suite:** 235 tests, 25 files — all passing before and after changes

---

## 1. Executive Summary

**Top 5 findings (by severity):**

| # | Severity | Issue | Action Taken |
|---|----------|-------|-------------|
| 1 | **Medium** | Context Provider creates a new object reference on every render, causing all 8+ consumer components to re-render unnecessarily | Fixed: memoized context value with `useMemo` |
| 2 | **Medium** | `DioramaObjects` calls `Math.random()` during render for tree scales, producing non-deterministic output and preventing React reconciliation from skipping re-renders | Fixed: replaced with static scale values matching the non-snow branch |
| 3 | **Low** | `TemperatureChart` reconstructs chart data array on every render without memoization | Fixed: wrapped in `useMemo` |
| 4 | **Low** | `WeatherScene` calls `window.matchMedia()` and creates new object literals (`camera`, `gl`, `style`) on every render | Fixed: hoisted to module-level constants |
| 5 | **Low** | `Toast` has a nested `setTimeout(onDismiss, 200)` in both `useEffect` and click handler that isn't cleaned up on unmount | Fixed: centralized dismiss logic with ref-tracked timer cleanup |

**Quick wins implemented:** 5
**Larger efforts documented:** 3 (see Optimization Roadmap)

---

## 2. Database Performance

**N/A** — Nimbus is a pure client-side app with no database. Data persistence is limited to `localStorage` for user preferences (unit, dark mode, recent cities). The localStorage operations are synchronous but trivially fast (< 1KB JSON).

---

## 3. Application Performance

### API Call Patterns

The app makes 2-3 network requests on load and 1-2 per city search:

| Operation | Endpoint | Frequency | Issue? |
|-----------|----------|-----------|--------|
| Geocoding | `geocoding-api.open-meteo.com/v1/search` | Per search (debounced 300ms) | No — debounce prevents excessive calls |
| Forecast | `api.open-meteo.com/v1/forecast` | Per city selection | No — single request per selection |
| Reverse geocode | Geocoding endpoint (workaround) | Once on load | No — non-critical, wrapped in try-catch |

**No N+1 patterns.** No sequential dependent requests. No unbounded queries. The search debounce (300ms) with cancellation flag for stale responses is well-implemented.

### Expensive Operations

**None identified.** All operations are O(n) where n ≤ 8 (search results) or n ≤ 6 (forecast days). No nested loops, no large data transformations.

### Caching Opportunities

| Data | Strategy | Invalidation | Worth It? |
|------|----------|-------------|-----------|
| Weather data for previously viewed cities | In-memory Map keyed by `lat,lon` | On next search for same coords | Probably not — users rarely revisit the same city in a session |
| Search results | Debounce already prevents excessive calls | N/A | No — debounce is sufficient |
| Geolocation result | Already cached by browser (5min `maximumAge`) | N/A | Already done |

### Async/Concurrency

The initialization flow makes 2 sequential API calls (geocoding → forecast). These could theoretically be parallelized, but the forecast depends on knowing the city name from geocoding, making parallelization impractical without changing behavior.

---

## 4. Memory & Resources

### Event Listener Audit

| Listener | Target | Cleanup? | Issue? |
|----------|--------|----------|--------|
| `mousedown` (click-outside) | `document` | Yes — `removeEventListener` on unmount | No |
| `useFrame` (R3F animation loop) | Three.js canvas | Yes — R3F handles cleanup | No |

### Timer Audit

| Timer | Component | Cleanup? | Issue? |
|-------|-----------|----------|--------|
| Debounce timeout | `useDebounce.ts` | Yes — cleared on value change and unmount | No |
| Auto-dismiss timeout | `Toast.tsx` | Yes (after fix) — both timers now tracked and cleared | **Fixed** |
| Search cancellation flag | `SearchBar.tsx` | Yes — cancelled on cleanup | No |

### Potential Memory Issues

- **Three.js BufferGeometry** (`RainParticles`, `SnowParticles`): Created via `useMemo`, reused across renders. Geometry is not explicitly disposed on unmount, but R3F handles this automatically when components unmount.
- **No growing collections** — recent cities capped at 5, search results at 8, forecast at 6 days.
- **No circular references** — clean React component tree with unidirectional data flow.

### Resource Management

No database connections, file handles, child processes, or temp files. The app is pure client-side with only `fetch` calls (no persistent connections).

---

## 5. Frontend Performance

### 5.1 Render Performance

#### Fixes Applied

| Component | Issue | Fix |
|-----------|-------|-----|
| `WeatherContext.tsx` | Provider `value` prop creates a new object on every render, causing all consumers (Header, SearchBar, CurrentWeather, Forecast, TemperatureChart, RecentCities, AlertBanner, WeatherScene) to re-render | Wrapped value in `useMemo` with explicit dependency array |
| `TemperatureChart.tsx` | Chart `data` array reconstructed on every render (6 items × map + convertTemp + formatDayName) | Wrapped in `useMemo([weather.daily, unit])` |
| `DioramaObjects.tsx` | Snow-covered trees used `Math.random() * 0.4` for scale in `.map()`, producing different values each render — non-deterministic output prevents React from skipping re-renders | Replaced with static scale values (0.9, 1.1, 1.0, 0.8, 1.0) matching non-snow branch |
| `WeatherScene.tsx` | `window.matchMedia('(prefers-reduced-motion: reduce)')` called on every render; `camera`, `gl`, `dpr`, and `style` objects recreated each render | Hoisted `matchMedia` check, `dpr` calculation, and all config objects to module-level constants |

#### Documented for Review (Not Fixed)

| Component | Issue | Impact | Effort |
|-----------|-------|--------|--------|
| All consumers of `useWeather()` | Components subscribe to entire context but only use a subset (e.g., Header only needs `preferences`, `toggleUnit`, `toggleDark`) | Low — context value is now memoized, and updates only happen on actual state changes | High (requires splitting context or using selectors) |
| `SimpleCloud` (×2-3 instances) | Each instance runs its own `useFrame` callback; could share a single animation loop | Very low — 2-3 sine calculations per frame is negligible | Medium |
| `Forecast.tsx` | `weather.daily.slice(0, 6).map(...)` runs on every render without memoization | Very low — 6 items, trivial computation | Low (not worth the added complexity) |

### 5.2 Loading Performance

#### Critical Rendering Path

```
index.html (< 1KB)
  ├── Google Fonts CSS (render-blocking <link>, ~5KB)
  │   └── Font files: Bricolage Grotesque + Figtree (~150KB total, display=swap)
  ├── index.css (14KB, Tailwind + custom)
  └── main.tsx → index.js (31KB, main app chunk)
      ├── three.js chunk (1010KB, deferred — code-split)
      ├── recharts chunk (388KB, deferred — code-split)
      └── SceneContent chunk (6.5KB, lazy-loaded)
```

**What blocks first paint:**
1. Google Fonts CSS stylesheet (render-blocking `<link>` in `<head>`)
2. Main JS bundle (31KB, module type — non-blocking by default)

**Good practices already in place:**
- `font-display: swap` prevents FOIT (Flash of Invisible Text)
- `preconnect` for Google Fonts CDN
- Three.js and Recharts code-split into separate chunks
- `SceneContent` lazy-loaded with `React.lazy()` + `<Suspense>`
- No synchronous `<script>` tags
- DPR capped at 2 for WebGL canvas

#### Fixes Applied

| Area | Before | After |
|------|--------|-------|
| WeatherScene config objects | 4 new objects created per render (camera, gl, style, dpr calculation) | Hoisted to module-level constants — zero per-render allocations |

#### Larger Recommendations

| Opportunity | Impact | Effort |
|-------------|--------|--------|
| Self-host fonts (Bricolage Grotesque + Figtree) with `font-display: optional` to eliminate render-blocking CSS from Google CDN | Eliminates external CSS render-blocking, reduces FOIT, removes Google dependency | Medium — download fonts, add to public/, update CSS |
| Add `rel="preload"` for the main chunk to hint browser to start downloading sooner | Marginal LCP improvement | Low |
| Consider a lighter chart library or custom SVG for the simple dual-line area chart (Recharts is 388KB for 2 lines) | 388KB bundle reduction | High — requires reimplementing chart |

### 5.3 Bundle Analysis

| Chunk | Size (uncompressed) | Size (gzipped, est.) | Purpose |
|-------|---------------------|----------------------|---------|
| `three-*.js` | 1010 KB | ~300 KB | Three.js + R3F + Drei |
| `recharts-*.js` | 388 KB | ~120 KB | Recharts charting |
| `index-*.js` | 31 KB | ~10 KB | App code |
| `SceneContent-*.js` | 6.5 KB | ~2 KB | Lazy-loaded 3D scene |
| `index-*.css` | 14 KB | ~4 KB | Tailwind + custom CSS |
| **Total** | **~1450 KB** | **~436 KB** | |

Three.js (70% of bundle) is the dominant cost, but it's essential for the 3D weather scene and already code-split. Recharts (27%) is the most disproportionate — 388KB for a simple dual-line area chart.

### 5.4 Images

No raster images in the app. All visuals are CSS gradients, Three.js geometry, or Lucide SVG icons (tree-shakeable). Favicon is the default Vite SVG.

### 5.5 Third-Party Scripts

| Script | Purpose | Size | Async? | Deferrable? |
|--------|---------|------|--------|-------------|
| Google Fonts | Typography | ~5KB CSS + ~150KB fonts | No (render-blocking CSS link) | Could self-host |

No analytics, tracking, chat widgets, or other third-party scripts. Clean setup.

### 5.6 Event Handlers

- **Search input**: Debounced at 300ms via `useDebounce` hook — no excessive API calls
- **No scroll/resize handlers**: Layout handled purely by CSS responsive breakpoints
- **No `mousemove` handlers**: Only `mousedown` for click-outside detection
- **Click-outside**: Single `document.addEventListener('mousedown')` with proper cleanup

### 5.7 Animation Performance

All animations use appropriate techniques:
- **3D animations**: `useFrame` (requestAnimationFrame) — runs on GPU via Three.js
- **CSS transitions**: `transform` and `opacity` only (compositor-friendly)
- **Reduced motion**: Global `prefers-reduced-motion` media query disables all animations
- **No `setInterval`**: All frame-based animation uses rAF via R3F
- **No layout-thrashing properties**: No `top`/`left`/`width`/`height` animations

---

## 6. Optimizations Implemented

### Change 1: Memoize WeatherContext Provider value
**File:** `src/context/WeatherContext.tsx`
**Before:** Context value object literal created inline in JSX — new reference every render, all consumers re-render
**After:** `useMemo` wraps the value object with explicit dependency array — consumers only re-render when actual values change
**Impact:** Prevents cascade of unnecessary re-renders across 8+ consumer components

### Change 2: Memoize TemperatureChart data
**File:** `src/components/TemperatureChart.tsx`
**Before:** `data` array reconstructed every render via `.map()` with `convertTemp()` and `formatDayName()` calls
**After:** `useMemo` with `[weather.daily, unit]` dependencies — only recomputes when weather data or unit preference changes
**Impact:** Eliminates redundant array allocation and computation on unrelated re-renders

### Change 3: Fix non-deterministic DioramaObjects render
**File:** `src/scenes/DioramaObjects.tsx`
**Before:** Snow-covered tree branch used `.map()` with `Math.random()` for scale — different values every render
**After:** Static scale values (0.9, 1.1, 1.0, 0.8, 1.0) matching the non-snow branch's explicit scales
**Impact:** Deterministic renders allow React to skip re-rendering unchanged tree components; fixes visual "jitter" from random scale changes

### Change 4: Hoist WeatherScene constants to module scope
**File:** `src/scenes/WeatherScene.tsx`
**Before:** `window.matchMedia()` called every render; `camera`, `gl`, `style` objects, and `dpr` calculation recreated each render
**After:** All hoisted to module-level constants — zero per-render allocations
**Impact:** Eliminates unnecessary `matchMedia` DOM queries and object allocations on every render cycle

### Change 5: Fix Toast timer cleanup
**File:** `src/components/Toast.tsx`
**Before:** Nested `setTimeout(onDismiss, 200)` in both `useEffect` and `onClick` — the inner timeout was never cleaned up if the component unmounted during the 200ms fade window
**After:** Centralized `dismiss` callback with `useRef`-tracked fade timer; cleanup effect clears the ref on unmount
**Impact:** Eliminates potential state-update-on-unmounted-component warning and memory leak

### Tests
**All 235 tests passing** — no regressions introduced.

---

## 7. Optimization Roadmap

| # | Recommendation | Impact | Effort | Priority |
|---|---------------|--------|--------|----------|
| 1 | Self-host Google Fonts | Eliminates render-blocking external CSS; improves LCP; removes CDN dependency | Medium (download, configure, update CSS) | Medium |
| 2 | Replace Recharts with lightweight alternative or custom SVG | 388KB bundle reduction (~27% of total) | High (rewrite chart component) | Low — only if bundle size becomes a concern |
| 3 | Add service worker for API response caching | Enables offline support; reduces API calls on revisit | Medium (new infrastructure) | Low — stretch feature, not MVP |

---

## 8. Monitoring Recommendations

### Key Frontend Vitals

| Metric | Target | Current Status |
|--------|--------|---------------|
| LCP (Largest Contentful Paint) | < 2.5s | Likely good — main content is text, not images |
| INP (Interaction to Next Paint) | < 200ms | Likely good — no expensive event handlers |
| CLS (Cumulative Layout Shift) | < 0.1 | Likely good — fixed layout, no dynamic content insertion |
| TTI (Time to Interactive) | < 3.8s | Three.js chunk is large but code-split; main bundle is 31KB |
| Bundle size | Monitor for growth | 1450KB uncompressed / ~436KB gzipped |

### Suggested Performance Testing

1. **Lighthouse CI** on each deploy — track LCP, INP, CLS, TTI over time
2. **Bundle size tracking** — alert if total exceeds 500KB gzipped
3. **Three.js frame rate** — profile on low-end devices (target: 30fps minimum for rain/snow particle systems with 600-1500 particles)

### What to Watch

- **Recharts bundle size** — if it grows with updates, consider switching to a lighter library
- **Three.js / R3F version bumps** — can significantly change bundle size and API
- **Google Fonts loading** — if LCP regresses, self-hosting is the first lever to pull
