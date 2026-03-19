# Cost & Resource Optimization Report

**Run**: 01 | **Date**: 2026-03-18 | **Branch**: `nightytidy/run-2026-03-18-1312`

---

## 1. Executive Summary

**Total estimated monthly cost: $0/month.** This is a pure client-side weather app with zero backend, zero paid APIs, and zero paid infrastructure. All external services are on free tiers with no risk of overage for the app's current scale.

**Total estimated waste: $0/month in dollar terms.** However, there are measurable bandwidth/performance inefficiencies worth fixing.

**Fixes implemented** (3 changes):
1. Added in-memory geocoding cache (5-min TTL, 50-entry cap) — eliminates redundant API calls
2. Removed unused Google Font weights — saves ~15-25KB per first page load
3. Added `Cache-Control: immutable` headers for hashed assets — eliminates re-validation requests

**Confidence**: High. This app has no paid services, no backend, and no infrastructure beyond Netlify's free static hosting tier.

---

## 2. Billable Service Inventory

| Service | Provider | Purpose | Billing Model | Usage Pattern | Est. Monthly Cost | Issues |
|---------|----------|---------|---------------|---------------|-------------------|--------|
| Static hosting + CDN | Netlify | Deploy & serve SPA | Free tier: 300 build min/mo, 100GB bandwidth | ~1 deploy/week, low traffic | $0 | None |
| Weather API | Open-Meteo | Geocoding + forecast data | Free, no key, no rate limits | Per user search/load | $0 | None |
| Font CDN | Google Fonts | Bricolage Grotesque + Figtree | Free (Google-funded CDN) | Per page load | $0 | Unused weights loaded |
| Geolocation | Browser API | User location detection | Free (native browser) | Once per app load | $0 | None |
| Source hosting | GitHub | Git repository | Free (public/private repo) | Standard dev workflow | $0 | None |

**No unused services found.** No SDK initializations for services not in use. No dev/test services configured for production. No overlapping services.

**Missing cost controls:** N/A — all services are genuinely free with no overage billing model.

---

## 3. Infrastructure Analysis

### Compute
| Resource | Current Config | Recommendation | Est. Savings | Confidence |
|----------|---------------|----------------|--------------|------------|
| Netlify static hosting | Free tier | No change needed | $0 | High |
| No Lambda/serverless | N/A (empty functions dir) | N/A | N/A | High |
| No containers | No Dockerfile | N/A | N/A | High |

### Database
None. All data is client-side (localStorage + API calls).

### Storage
| Resource | Current Config | Recommendation | Est. Savings | Confidence |
|----------|---------------|----------------|--------------|------------|
| localStorage | 1 key, ~500-1000 bytes, 5-city cap | Already bounded and validated | $0 | High |
| Static assets (dist/) | ~1.5MB uncompressed, ~450KB gzipped | Well-optimized with code splitting | $0 | High |

### Networking
| Resource | Current Config | Recommendation | Est. Savings | Confidence |
|----------|---------------|----------------|--------------|------------|
| Netlify CDN | Default config | Already includes global CDN | $0 | High |
| Google Fonts CDN | 2 font families, multiple weights | **Removed unused weights** (see fixes) | ~15-25KB/load | High |

### CDN / Caching
| Resource | Current Config | Recommendation | Est. Savings | Confidence |
|----------|---------------|----------------|--------------|------------|
| Hashed assets (JS/CSS) | No explicit Cache-Control | **Added immutable 1-year cache** | Eliminates re-validation | High |
| HTML (index.html) | Netlify defaults (~1hr) | Appropriate for SPA entry point | $0 | High |

### CI/CD
| Resource | Current Config | Recommendation | Est. Savings | Confidence |
|----------|---------------|----------------|--------------|------------|
| Build pipeline | Manual `netlify deploy --prod` | No CI/CD overhead costs | $0 | High |
| No GitHub Actions | N/A | N/A | N/A | High |

### Containers / Docker
None configured. Not needed for a static SPA.

---

## 4. Application-Level Waste

### Redundant API Calls

**Finding: Geocoding search results were not cached**

- **Pattern**: User searches "London", types something else, searches "London" again → two identical API calls
- **Location**: `src/lib/api.ts:searchCities()`
- **Impact**: Each redundant call is ~200ms latency + ~500B response. For a typical session with 3-5 repeat searches, this means 3-5 unnecessary network round-trips
- **Fix applied**: Added in-memory cache with 5-minute TTL and 50-entry cap
- **Estimated improvement**: 30-50% fewer geocoding API calls for typical usage

**Finding: `reverseGeocode()` is exported but never called in production code**

- **Location**: `src/lib/api.ts:170-195` (function definition), tests in `api-reverseGeocode.test.ts` and `api-contracts.test.ts`
- **Impact**: Dead code (~25 lines). Not a cost issue but maintenance overhead. The context uses `searchCities()` with rounded coordinates instead (lines 114-116 of WeatherContext.tsx)
- **Action**: Documented; not removed (function is tested and could be useful future work)

### Database Query Cost
N/A — no database.

### Storage Patterns

**localStorage is well-bounded:**
- Max 5 cities (`MAX_RECENT_CITIES = 5`)
- City names capped at 200 chars (`MAX_CITY_NAME_LENGTH = 200`)
- Validation on read prevents corrupted data growth
- Silent failure on write (handles quota exceeded gracefully)

**No unbounded growth patterns found.** API response counts are capped (geocoding: 8 results, forecast: 6 days).

### Serverless Patterns
N/A — no serverless functions.

### Third-Party Tier Optimization

| Service | Current Tier | Usage vs. Limits | Recommendation |
|---------|-------------|------------------|----------------|
| Netlify | Free | Well within limits | Stay on free tier |
| Open-Meteo | Free | No limits | Stay on free tier |
| GitHub | Free | Standard usage | Stay on free tier |

---

## 5. Data Transfer & Egress

### Data Movement Map

| Flow | Direction | Frequency | Payload Size |
|------|-----------|-----------|-------------|
| Google Fonts CSS | CDN → Client | First page load | ~5KB |
| Google Fonts files | CDN → Client | First page load | ~100-150KB (cached after) |
| Open-Meteo geocoding | Client → API → Client | Per search query | ~500B-2KB response |
| Open-Meteo forecast | Client → API → Client | Per city selection | ~2-4KB response |
| Static assets (JS/CSS) | Netlify CDN → Client | First visit + cache miss | ~450KB gzipped |

### Reduction Opportunities

| Opportunity | Status | Impact |
|-------------|--------|--------|
| Response compression (gzip/brotli) | Handled by Netlify automatically | Already optimized |
| Google Font subsetting | **Fixed: removed 3 unused weights** | ~15-25KB saved per first load |
| Immutable asset caching | **Fixed: added Cache-Control headers** | Eliminates re-validation requests |
| Bundle code splitting | Already implemented (three/recharts/lazy SceneContent) | Already optimized |
| API response caching | **Fixed: 5-min in-memory geocoding cache** | 30-50% fewer API calls |

---

## 6. Non-Production Costs

### Environment Inventory

| Environment | Infrastructure | Always-On? | Parity with Prod? | Cleanup? |
|-------------|---------------|------------|-------------------|----------|
| Development | Local `vite dev` | No (on-demand) | Same code | N/A |
| Preview | Netlify deploy preview | No (on-demand) | Same build | Auto-cleanup by Netlify |
| Production | `nimbus-weather-kd.netlify.app` | Yes (static CDN) | N/A | N/A |

**No paid tool seats.** All tools (Vite, Vitest, ESLint, TypeScript) are open-source.
**No non-prod cost waste identified.**

---

## 7. Code-Level Fixes Implemented

| File | Change | Impact | Tests Pass? |
|------|--------|--------|-------------|
| `src/lib/api.ts` | Added in-memory geocoding cache (5-min TTL, 50-entry cap, LRU eviction) | Eliminates redundant geocoding API calls for repeat searches | Yes (235/235) |
| `src/lib/__tests__/api.test.ts` | Added `clearGeocodingCache()` to `beforeEach` | Tests isolated from cache state | Yes |
| `src/lib/__tests__/api-contracts.test.ts` | Added `clearGeocodingCache()` to `beforeEach` | Tests isolated from cache state | Yes |
| `index.html` | Removed unused font weights (Bricolage 400,500; Figtree 300) | Saves ~15-25KB per first page load | Yes |
| `netlify.toml` | Added `Cache-Control: public, max-age=31536000, immutable` for `/assets/*` | Eliminates re-validation requests for hashed static assets | Yes |

---

## 8. Cost Monitoring Assessment

| Category | Status | Notes |
|----------|--------|-------|
| Budget alerts | N/A | All services free-tier; no billing to alert on |
| Cost tagging | N/A | No cloud resources to tag |
| Per-feature cost attribution | N/A | Single free API, no cost differentiation |
| Anomaly detection | N/A | No billing anomalies possible |
| Governance | Adequate | CSP restricts external services; no one can accidentally add paid services without updating netlify.toml CSP headers |
| Auto-scaling spending limits | N/A | No auto-scaling resources |

**Recommendation**: If the app grows to require paid services, implement Netlify spend notifications (available on paid plans) and Open-Meteo commercial plan monitoring.

---

## 9. Savings Roadmap

### Summary

This is a genuinely zero-cost application. The optimizations below improve performance (which indirectly reduces bandwidth costs if traffic grows) rather than reducing current spend.

### Immediate (Implemented)

| # | Opportunity | Est. Savings | Effort | Risk | Confidence | Details |
|---|-------------|-------------|--------|------|------------|---------|
| 1 | Geocoding API cache | 30-50% fewer API calls | Done | None | High | 5-min TTL, 50-entry cap, cache-busts automatically |
| 2 | Remove unused font weights | ~15-25KB/first-load | Done | None | High | Removed Bricolage 400,500 and Figtree 300 |
| 3 | Immutable asset caching | Eliminates re-validation | Done | None | High | Hash-based filenames make this safe |

### This Month (Optional)

| # | Opportunity | Est. Savings | Effort | Risk | Confidence | Worth Doing? |
|---|-------------|-------------|--------|------|------------|-------------|
| 4 | Self-host fonts | ~100ms faster first load (eliminate DNS lookup + connection to fonts.googleapis.com) | 2-3 hours | Low | Medium | Maybe — only matters at scale |
| 5 | Remove dead `reverseGeocode()` code | 25 lines less code | 15 min | None | High | Yes — reduces maintenance surface |

### This Quarter (If Needed)

| # | Opportunity | Est. Savings | Effort | Risk | Confidence | Worth Doing? |
|---|-------------|-------------|--------|------|------------|-------------|
| 6 | Service worker for offline support | Reduce repeat-visit API calls to zero | 4-8 hours | Medium (cache invalidation complexity) | Medium | Only if offline UX is desired |
| 7 | Named Three.js imports | Potentially ~10-30KB smaller bundle | 1 hour | Low | Low (bundler may already tree-shake) | Probably not worth it |

### Ongoing

| # | Opportunity | Details |
|---|-------------|---------|
| 8 | Monitor Netlify bandwidth | If traffic exceeds ~100GB/month, evaluate paid tier ($19/mo) vs. alternatives (Cloudflare Pages: free 500 builds/mo, unlimited bandwidth) |
| 9 | Monitor Open-Meteo usage | If commercial use, consider their paid API ($30-100/mo) for SLA guarantees and rate limit headroom |

---

## 10. Assumptions & Verification Needed

| # | Assumption | Verification Action |
|---|-----------|-------------------|
| 1 | App is on Netlify free tier | Check Netlify dashboard → Team Settings → Billing |
| 2 | GitHub repo is on free plan | Check GitHub → Settings → Billing |
| 3 | No custom domain costs | Confirm `nimbus-weather-kd.netlify.app` is the only URL (no paid domain registered) |
| 4 | Build minutes within free tier | Check Netlify dashboard → Build minutes used this month (expect <10 min/mo) |
| 5 | Bandwidth within free tier | Check Netlify dashboard → Bandwidth used this month (expect <1GB/mo) |
| 6 | Google Fonts weights are truly unused | Verified via Tailwind config + CSS — only weights 600/700/800 (Bricolage) and 400/500/600 (Figtree) are referenced |
| 7 | Open-Meteo has no hidden costs | Confirmed via their pricing page — free for non-commercial use, no rate limits |

---

## Appendix: Full Dependency Cost Analysis

### Production Dependencies (7 packages)

| Package | License | Cost | Risk |
|---------|---------|------|------|
| react ^19.2.0 | MIT | Free | None |
| react-dom ^19.2.0 | MIT | Free | None |
| three ^0.175.0 | MIT | Free | None |
| @react-three/fiber ^9.1.2 | MIT | Free | None |
| @react-three/drei ^10.0.0 | MIT | Free | None |
| recharts ^2.15.0 | MIT | Free | None |
| lucide-react ^0.577.0 | ISC | Free | None |

### Dev Dependencies (17 packages)

All MIT/ISC licensed, all free, all open-source. No paid tooling.

### Bundle Size Breakdown

| Chunk | Uncompressed | Gzipped (est.) | Loading Strategy |
|-------|-------------|----------------|-----------------|
| Main app (index.js) | 31KB | ~8-10KB | Immediate |
| Three.js chunk | 1010KB | ~300-350KB | Deferred (code split) |
| Recharts chunk | 388KB | ~100-120KB | Deferred (code split) |
| SceneContent | 6.5KB | ~2KB | Lazy-loaded (React.lazy) |
| CSS | 14KB | ~3-4KB | Immediate |
| **Total** | **~1.45MB** | **~450KB** | Well-optimized |
