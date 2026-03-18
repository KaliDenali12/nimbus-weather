# Nimbus Weather — Operational Runbooks

Actionable procedures for diagnosing and resolving production issues. Aimed at anyone with access to the Netlify dashboard and browser dev tools.

---

## Table of Contents

1. [Open-Meteo API Unreachable](#1-open-meteo-api-unreachable)
2. [App Shows Blank White Page](#2-app-shows-blank-white-page)
3. [3D Scene Crashes / Missing](#3-3d-scene-crashes--missing)
4. [Users Stuck on Antarctica Fallback](#4-users-stuck-on-antarctica-fallback)
5. [localStorage Quota Exceeded](#5-localstorage-quota-exceeded)
6. [Netlify Deploy Fails](#6-netlify-deploy-fails)
7. [Slow Initial Load](#7-slow-initial-load)
8. [Google Fonts Not Loading](#8-google-fonts-not-loading)

---

## 1. Open-Meteo API Unreachable

### Symptoms
- Users see the "Weather Unavailable" error card with "Try Again" button
- Error message: "Unable to fetch weather data. Please check your connection and try again."
- In console: `ApiError: Network error while fetching weather data` or `Weather request timed out`
- `nimbus.diagnose()` shows Open-Meteo API as `unhealthy`

### Diagnosis Steps

1. **Check Open-Meteo status**: Visit [https://open-meteo.com](https://open-meteo.com) — if the site itself is down, the API is likely down too.
2. **Test API directly**: Open browser console and run:
   ```js
   fetch('https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m')
     .then(r => r.json()).then(console.log).catch(console.error)
   ```
3. **Check geocoding API separately**:
   ```js
   fetch('https://geocoding-api.open-meteo.com/v1/search?name=Berlin&count=1')
     .then(r => r.json()).then(console.log).catch(console.error)
   ```
4. **Run full diagnostics**: `nimbus.diagnose()` in console for structured health check.
5. **Check CSP headers**: Verify `connect-src` in Netlify config still includes both Open-Meteo domains.

### Resolution

| Scenario | Action |
|----------|--------|
| Open-Meteo is down globally | Wait for recovery. App will auto-recover on next "Try Again" click. No action needed. |
| Timeout (>10s responses) | API is slow; app correctly times out. No code change needed; will resolve when API recovers. |
| CSP blocking requests | Fix `Content-Security-Policy` `connect-src` directive in `netlify.toml`. Redeploy. |
| HTTP 429 (rate limit) | Unusual for Open-Meteo free tier. Check if automated tooling is hammering the API. In-app caches (5-min TTL) should prevent this under normal use. |

### Prevention
- The 5-minute forecast and geocoding caches minimize API calls.
- The 10-second timeout prevents the UI from hanging indefinitely.
- App shows graceful error state rather than crashing.

### Escalation
- Open-Meteo is a free third-party service. If downtime exceeds 24 hours, consider adding a secondary weather API as fallback. This would require code changes.

---

## 2. App Shows Blank White Page

### Symptoms
- Page loads to a white screen with no content
- No error UI visible (AppErrorBoundary not rendering)
- May have errors in browser console

### Diagnosis Steps

1. **Check browser console** for JavaScript errors (F12 → Console tab).
2. **Verify the page source**: View Source — if `<div id="root"></div>` is present but empty, the React app failed to mount.
3. **Check network tab**: Are the JS/CSS assets loading (200 status)? If 404, the deploy may be incomplete.
4. **Check Netlify deploy log**: Netlify dashboard → Deploys → check if the latest deploy succeeded.
5. **Test in incognito**: Rules out browser extensions and corrupted localStorage.

### Resolution

| Scenario | Action |
|----------|--------|
| JS bundle 404 | Redeploy from Netlify dashboard. The `/* → /index.html` redirect means HTML loads but asset paths may be stale after a failed partial deploy. |
| React mounting error | Check console for the specific error. `AppErrorBoundary` only catches render errors — errors in `main.tsx` before React mounts will result in a blank page. |
| Corrupted localStorage | Clear localStorage: `localStorage.clear()` and reload. The `loadPreferences()` function handles this gracefully, but in extreme cases manual clearing helps. |
| TypeScript build error slipped through | Roll back to previous deploy in Netlify dashboard (one click). Fix the build error and redeploy. |

### Prevention
- Add a CI pipeline (GitHub Actions) to run `tsc -b`, `eslint .`, and `vitest run` before merge — catches build errors pre-deploy.
- Netlify already catches TypeScript errors during build (`npm run build` = `tsc -b && vite build`), but merge-time checks are earlier.

### Escalation
- If the blank page is browser-specific, check browser compatibility (app requires ES2020+ support).

---

## 3. 3D Scene Crashes / Missing

### Symptoms
- Background shows only the CSS gradient (no 3D buildings/trees/weather particles)
- Console shows: `[SceneErrorBoundary] WebGL/3D scene crashed — falling back to gradient background.`
- No user-facing error (by design — the gradient background is the fallback)

### Diagnosis Steps

1. **Check console** for `[SceneErrorBoundary]` message and the attached error/component stack.
2. **Run `nimbus.diagnose()`**: Check the "WebGL" row. If `degraded`, the browser/device doesn't support WebGL.
3. **Check GPU status**: In Chrome, navigate to `chrome://gpu` to see WebGL status.
4. **Test on another device**: If 3D works elsewhere, the issue is device-specific (GPU driver, hardware acceleration disabled).

### Resolution

| Scenario | Action |
|----------|--------|
| WebGL not supported | No fix needed. App degrades gracefully — gradient background is the designed fallback. |
| Three.js runtime error | Check the error in `SceneErrorBoundary`'s console output. Likely a breaking change in a Three.js/R3F/drei dependency update. |
| GPU driver crash | Advise user to enable hardware acceleration in browser settings or update GPU drivers. |

### Prevention
- The `SceneErrorBoundary` prevents 3D crashes from taking down the entire app.
- DPR is capped at 2 (`Math.min(devicePixelRatio, 2)`) to avoid GPU overload.
- `prefers-reduced-motion` disables animations to reduce GPU load when enabled.

### Escalation
- If the crash affects a newly-added 3D feature, revert the commit and investigate.

---

## 4. Users Stuck on Antarctica Fallback

### Symptoms
- App displays "Antarctica" as the location after initial load
- Toast message: "Location access was not granted" / "Location detection timed out" / "Location detection is not available"
- User cannot see weather for their actual location without manually searching

### Diagnosis Steps

1. **Check which toast message appeared**:
   - "not granted" → User denied geolocation permission or browser policy blocks it.
   - "timed out" → Browser geolocation took longer than 8 seconds (mobile networks, VPN, etc.).
   - "not available" → Browser doesn't support geolocation API (very rare in modern browsers).
2. **Check browser permissions**: Click the lock icon in the address bar → Location → check if blocked.
3. **Check HTTPS**: Geolocation requires HTTPS. Netlify provides this by default.

### Resolution

| Scenario | Action |
|----------|--------|
| Permission denied | User must allow location access via browser settings. App correctly falls back to Antarctica and shows a toast explaining how to use the search bar. |
| Timeout | The 8-second timeout is generous. On very slow connections, users should use the search bar. No code change needed. |
| Not available | Legacy browser. Search bar is the alternative. |

### Prevention
- The Antarctica fallback + toast notification is the designed behavior. This is not a bug.
- Geolocation uses `maximumAge: 300000` (5-minute cache) to avoid repeated permission prompts.

### Escalation
- None needed. This is expected UX for users who deny or lack geolocation.

---

## 5. localStorage Quota Exceeded

### Symptoms
- User preferences (dark mode, unit preference, recent cities) don't persist across page reloads
- No user-visible error (localStorage failures are silently caught)
- In console: `QuotaExceededError` if you manually check

### Diagnosis Steps

1. **Check localStorage usage**: In browser console:
   ```js
   const total = Object.keys(localStorage).reduce((sum, key) => sum + localStorage.getItem(key).length, 0)
   console.log(`${(total / 1024).toFixed(1)} KB used`)
   ```
2. **Check if Nimbus key exists**: `localStorage.getItem('nimbus-preferences')`
3. **Check if other sites on the same origin are using storage**: (Not applicable — Netlify gives each site its own origin.)

### Resolution

| Scenario | Action |
|----------|--------|
| Quota exceeded | Nimbus stores < 1KB. Other data on the origin is unlikely since Netlify isolates origins. Clear localStorage and reload. |
| Private/incognito mode | Some browsers restrict localStorage in private mode. Preferences won't persist — this is expected. |
| localStorage disabled | Browser-level setting. App works fine without persistence — just uses defaults each load. |

### Prevention
- `savePreferences()` wraps writes in try/catch — silent failure by design.
- Recent cities capped at 5 entries with FIFO eviction.
- Data size is trivially small (~200-500 bytes).

### Escalation
- None needed for a portfolio app. If scaling, consider IndexedDB for larger storage needs.

---

## 6. Netlify Deploy Fails

### Symptoms
- Netlify dashboard shows a failed deploy
- Previous version remains live (Netlify doesn't deploy broken builds)
- Build log shows `tsc` type errors or `vite build` failures

### Diagnosis Steps

1. **Read the build log**: Netlify dashboard → Deploys → click the failed deploy → read logs.
2. **Reproduce locally**: Run `npm run build` locally. The build command is `tsc -b && vite build`.
3. **Check if it's a TypeScript error**: `tsc -b` runs first. If it fails, Vite never runs.
4. **Check dependencies**: `npm ci` may fail if `package-lock.json` is out of sync with `package.json`.

### Resolution

| Scenario | Action |
|----------|--------|
| TypeScript error | Fix the type error locally, push fix. |
| Missing dependency | Run `npm install` locally to regenerate lock file, commit `package-lock.json`. |
| Node.js version mismatch | Check Netlify's Node.js version (set via `NODE_VERSION` env var or `.node-version` file). App targets Node 18+. |
| Vite build error | Usually a code-splitting or import issue. Check Vite's error output in build log. |

### Prevention
- Add a CI pipeline to catch these errors before merge.
- Netlify's build failure behavior is safe — it never deploys a broken build.

### Escalation
- If the build fails consistently and you cannot reproduce locally, check Netlify's build image and Node.js version.

---

## 7. Slow Initial Load

### Symptoms
- Skeleton loading screen visible for more than 3 seconds
- Time to Interactive (TTI) > 5 seconds
- Users on mobile experience long waits

### Diagnosis Steps

1. **Run Lighthouse audit**: Chrome DevTools → Lighthouse → Performance audit.
2. **Check network waterfall**: DevTools → Network → disable cache → reload. Look for:
   - Large JS bundles (check `three` chunk size)
   - Slow Open-Meteo API response
   - Render-blocking fonts
3. **Check code splitting**: Verify `three` and `recharts` are separate chunks (configured in `vite.config.ts`).
4. **Run `nimbus.diagnose()`**: Check API latency.

### Resolution

| Scenario | Action |
|----------|--------|
| Large Three.js bundle (>500KB) | Expected. Three.js is ~150KB gzipped. It's lazy-loaded via `SceneContent` — shouldn't block initial render. |
| Slow API response | Check if the user's region has high latency to Open-Meteo servers (EU-based). Nothing we can control. |
| Render-blocking fonts | Google Fonts use `display=swap` — should not block rendering. Verify the `<link>` tag in `index.html`. |
| Unoptimized images | App uses no images — only SVG icons (Lucide) and 3D geometry. |

### Prevention
- Skeleton loading provides perceived performance.
- Stale-while-revalidate on city switches keeps old data visible during refresh.
- Code splitting separates `three` and `recharts` into separate chunks.
- Asset caching (1-year immutable) ensures returning visitors load instantly.

### Escalation
- If performance degrades significantly, profile the Three.js scene for GPU bottlenecks.

---

## 8. Google Fonts Not Loading

### Symptoms
- Text renders in system fonts (e.g., Arial/Helvetica) instead of Bricolage Grotesque / Figtree
- Network tab shows failed requests to `fonts.googleapis.com` or `fonts.gstatic.com`

### Diagnosis Steps

1. **Check network tab**: Filter for "font" — are the requests succeeding?
2. **Check CSP**: Verify `style-src` includes `https://fonts.googleapis.com` and `font-src` includes `https://fonts.gstatic.com` in `netlify.toml`.
3. **Check ad blocker**: Some privacy extensions block Google Fonts CDN.

### Resolution

| Scenario | Action |
|----------|--------|
| Google Fonts CDN is down | Extremely rare. App falls back to system fonts via `display=swap`. Cosmetic only — no functionality impact. |
| CSP blocking fonts | Fix CSP in `netlify.toml`. Current config correctly allows both domains. |
| Ad blocker | User-side issue. App remains fully functional with system fonts. |

### Prevention
- `display=swap` ensures text is always visible, even if fonts load slowly.
- Fonts are cosmetic — the app is fully functional without them.

### Escalation
- If persistent, consider self-hosting the fonts (add to `/public/fonts/` and update CSS). This eliminates the external dependency.
