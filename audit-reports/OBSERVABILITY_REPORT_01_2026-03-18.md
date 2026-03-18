# Observability & Monitoring Readiness Report

**Run**: 01 | **Date**: 2026-03-18 | **Branch**: `nightytidy/run-2026-03-18-1312`
**App**: Nimbus Weather — pure client-side SPA (React 19 + TypeScript 5.9 + Three.js)
**Deploy**: Netlify static CDN | **Backend**: None | **Database**: None

---

## 1. Executive Summary

### Maturity Level: **Basic** (appropriate for architecture)

Nimbus Weather is a **pure client-side SPA** with zero backend, zero database, zero server-side code. This fundamentally changes the observability landscape — most enterprise monitoring patterns (server health endpoints, distributed tracing, server-side metrics, log aggregation) are not applicable by design.

### Detection Speed

| Failure Type | Detection Method | Time to Detect |
|-------------|-----------------|----------------|
| Open-Meteo API down | User sees error state → "Try Again" | Immediate (after 10s timeout) |
| 3D scene crash | SceneErrorBoundary catches, logs to console | Immediate (silent to user) |
| React render crash | AppErrorBoundary catches, shows recovery UI | Immediate |
| localStorage failure | Silent fallback to defaults | Invisible (by design) |
| Geolocation failure | Toast notification + Antarctica fallback | Immediate |
| Netlify deploy failure | Build fails, previous version stays live | Minutes (via Netlify dashboard) |

### Diagnostic Capability

| Capability | Status |
|-----------|--------|
| Identify which dependency is failing | **Yes** — via `nimbus.diagnose()` (added in this audit) |
| See API response times | **Yes** — via diagnostics and browser DevTools |
| Debug render crashes | **Yes** — error boundaries log to console with component stacks |
| Track user-affecting errors in production | **No** — no error reporting service (Sentry, etc.) |
| Measure real-user performance | **No** — no Web Vitals tracking |
| Monitor deploy health | **Partial** — Netlify dashboard only |

### Top 5 Gaps

1. **No error reporting service** — Production errors are only visible if the user opens DevTools. Cannot detect or quantify user-affecting failures at scale.
2. **No Web Vitals tracking** — No visibility into real-user performance (LCP, FID, CLS). Can't detect performance regressions.
3. **No CI/CD quality gate** — Broken code can be merged without lint/test/type-check running pre-merge (also flagged in DevOps audit).
4. **No uptime monitoring** — No external check that the Netlify-hosted app is accessible. Would only learn about outages from user reports.
5. **API error instrumentation is absent** — API errors are shown to users but not logged/counted. Cannot measure error rate or API reliability over time.

---

## 2. Health Checks

### Before State

No health check capability existed. The only way to diagnose a failing dependency was to open browser DevTools, manually test API calls, and inspect console errors.

### After State (This Audit)

**Added `src/lib/diagnostics.ts`** — A lightweight client-side diagnostics module that checks all runtime dependencies and returns structured JSON results.

**Checks performed:**

| Component | What It Checks | Healthy | Degraded | Unhealthy |
|-----------|---------------|---------|----------|-----------|
| Open-Meteo API | HTTP GET to forecast endpoint | 200 OK | Non-200 status | Network error / timeout (5s) |
| localStorage | Write + read + delete test key | Read/write succeeds | Unavailable or quota exceeded | — |
| WebGL | `getContext('webgl2')` or `getContext('webgl')` | Context created + GPU info | Not available | — |
| Geolocation API | `navigator.geolocation` presence | API present | Not available | — |

**Access method:** Browser console → `nimbus.diagnose()`

```
> nimbus.diagnose()
┌─────────────────────┬──────────┬────────┬───────────────────────────────────────────────────┐
│ Component           │ Status   │ Latency│ Detail                                            │
├─────────────────────┼──────────┼────────┼───────────────────────────────────────────────────┤
│ Open-Meteo API      │ healthy  │ 245ms  │ 200 in 245ms                                     │
│ localStorage        │ healthy  │ 0ms    │ Read/write OK                                    │
│ WebGL               │ healthy  │ 1ms    │ Supported (ANGLE (Intel, ..., Direct3D11))       │
│ Geolocation API     │ healthy  │ 0ms    │ API present (permission not tested)               │
└─────────────────────┴──────────┴────────┴───────────────────────────────────────────────────┘
Overall: healthy | 2026-03-18T14:43:00.000Z
```

**Design decisions:**
- **Lightweight**: Single fetch + synchronous browser API checks. No heavy computation.
- **No UI impact**: Console-only. Zero bundle size impact on normal users.
- **Timeout-protected**: API check has 5s timeout (separate from the app's 10s timeout) to avoid hanging the diagnostic.
- **No sensitive data exposed**: Only component names, status, and latency.
- **Structured output**: Returns typed `DiagnosticsResult` object for programmatic use.

### Tests Added

10 tests in `src/lib/__tests__/diagnostics.test.ts` covering:
- All four dependency checks
- API healthy/degraded/unhealthy/timeout scenarios
- Overall status derivation
- Output structure validation

### What "Liveness" vs "Readiness" Means for a Client-Side SPA

| Concept | Server App | Client-Side SPA (Nimbus) |
|---------|-----------|--------------------------|
| Liveness | Process running, accepting connections | HTML/JS loaded, React mounted |
| Readiness | All dependencies connected, ready to serve | API reachable, localStorage available |

For Nimbus:
- **Liveness** = React mounted + error boundaries active. If the app shows *anything* (even the error state), it's "live."
- **Readiness** = Open-Meteo API reachable + weather data loaded. The diagnostics module checks this.

---

## 3. Metrics & Instrumentation

### Coverage Table

| Category | Present | Missing | Applicable? |
|----------|---------|---------|-------------|
| **Request metrics** (API call count, latency, errors) | No | Yes — API calls not instrumented | Yes |
| **Business metrics** (city searches, unit toggles) | No | Yes — user actions not tracked | Low priority |
| **Dependency metrics** (Open-Meteo latency, cache hit rate) | Partial — diagnostics shows point-in-time latency | Continuous tracking | Yes |
| **System/runtime metrics** (memory, FPS, bundle size) | No | Yes — no performance observer | Yes |
| **Web Vitals** (LCP, FID, CLS, TTFB, INP) | No | Yes — no `web-vitals` library | Yes |
| **Error metrics** (error count by type, error rate) | No | Yes — errors shown to users but not counted | Yes |
| **Cache metrics** (geocoding/forecast cache hit/miss) | No | Yes — caches exist but don't report hit rates | Low priority |

### What Was Added

**No continuous metrics instrumentation was added.** Rationale:

1. **No metrics library exists** in the project (no Prometheus client, no StatsD, no analytics SDK).
2. The project instructions explicitly state: "Don't add a metrics library if none exists; document the recommendation instead."
3. Adding `web-vitals` or a custom metrics collector would introduce a new dependency (violates audit rules).
4. For a portfolio-grade client-side app, the cost/benefit of client-side metrics collection is low without a backend to receive them.

### What Still Needs Infrastructure

| Metric Type | Recommended Approach | Requires New Dependency? |
|-------------|---------------------|-------------------------|
| Web Vitals (LCP, CLS, INP) | Add `web-vitals` library (~1KB) → send to analytics endpoint | Yes — `web-vitals` npm package |
| Error tracking | Add Sentry SDK → captures errors from error boundaries | Yes — `@sentry/react` |
| API latency tracking | Wrap `fetch` in a timing layer → send to analytics | No (code-only) — but needs a destination |
| Cache hit/miss rates | Add counters to `searchCities`/`fetchWeather` → expose via console | No |
| Real User Monitoring (RUM) | Netlify Analytics or Vercel Analytics | Platform feature, not a dependency |

### Existing Performance Optimizations (Already Instrumented)

These are performance *optimizations*, not *instrumentation*, but they show the team is performance-aware:

| Optimization | Location | Measured? |
|-------------|----------|-----------|
| Skeleton loading (perceived performance) | `App.tsx:93-136` | No |
| Stale-while-revalidate on city switch | `WeatherContext.tsx:89-93` | No |
| In-memory API caching (5-min TTL) | `api.ts:20-21` | No |
| Code splitting (three, recharts) | `vite.config.ts:15-18` | No |
| DPR cap at 2 | `WeatherScene.tsx` | No |
| Search debounce (300ms) | `useDebounce.ts` | No |
| Font swap (async Google Fonts) | `index.html` | No |

---

## 4. Distributed Tracing & Correlation

### Assessment: **Not Applicable**

This is a single-process client-side application making direct HTTP requests to one external API (Open-Meteo). There are no:

- Backend services to trace requests across
- Message queues or async job processors
- Microservices or internal APIs
- Database connections to trace queries for

### Request Correlation

| Aspect | Status | Notes |
|--------|--------|-------|
| Correlation ID per request | N/A | Single-process client, not multi-service |
| Request ID in response headers | N/A | No backend to set headers |
| Trace propagation | N/A | No downstream services |
| Span creation for DB queries | N/A | No database |
| Span creation for external calls | N/A | No tracing infrastructure |

### What Would Be Relevant

If the app ever adds a backend:
- Add `X-Request-Id` header middleware
- Propagate correlation ID to log context
- Use OpenTelemetry for distributed tracing

For now, this is not needed.

---

## 5. Failure Mode Analysis

### Critical Dependencies

| Dependency | Down Impact | Slow (10x) Impact | Timeout? | Retry? | Circuit Breaker? | Graceful Degradation? |
|-----------|------------|-------------------|----------|--------|------------------|----------------------|
| **Open-Meteo Forecast API** | Error state shown, "Try Again" button. No weather data. | 10s timeout fires, same error state. | Yes (10s) | Manual ("Try Again") | No | Yes — error UI |
| **Open-Meteo Geocoding API** | Search returns no results. Error shown in dropdown. | 10s timeout, "Search failed" message. | Yes (10s) | No (user re-types) | No | Yes — shows error message |
| **Browser Geolocation** | Falls back to Antarctica. Toast notification. | 8s timeout, same fallback. | Yes (8s) | No | No | Yes — Antarctica fallback |
| **localStorage** | Preferences don't persist. Defaults used. | N/A (synchronous) | N/A | N/A | N/A | Yes — silent fallback |
| **WebGL / GPU** | 3D scene hidden. Gradient background visible. | Scene may lag or drop frames. | N/A | N/A | N/A | Yes — SceneErrorBoundary |
| **Google Fonts CDN** | System fonts used. | Fonts load late, FOUT visible. | N/A | Browser retries | N/A | Yes — `display=swap` |
| **Netlify CDN** | App completely unreachable. | Slow page load. | N/A | N/A | N/A | No — total outage |

### Critical Code Paths

#### 1. Initial Load (App → Geolocation → API → Render)

```
main.tsx → App.tsx → WeatherProvider
  └─ initializeLocation()
     ├─ getUserLocation() → [8s timeout]
     │  ├─ OK → searchCities(coords) → fetchWeather() → render weather
     │  └─ FAIL → setGeoError() → show toast → loadWeatherForCoords(Antarctica)
     └─ fetchWeather() → [10s timeout]
        ├─ OK → setWeather() → render data
        └─ FAIL → setError() → render ErrorState
```

**What can go wrong:**
1. Geolocation denied/timeout → **Handled**: Antarctica fallback + toast
2. Open-Meteo down → **Handled**: ErrorState with "Try Again"
3. Malformed API response → **Handled**: Shape validation throws ApiError
4. React render crash → **Handled**: AppErrorBoundary catches, shows recovery UI
5. 3D scene crash → **Handled**: SceneErrorBoundary catches, hides scene

#### 2. City Search (User types → Debounce → API → Dropdown)

```
SearchBar → useDebounce(300ms) → searchForCities()
  └─ searchCities(query) → [10s timeout]
     ├─ Cache HIT → return cached results → render dropdown
     ├─ OK → cache result → render dropdown
     └─ FAIL → return "Search failed" message
```

**What can go wrong:**
1. API timeout → **Handled**: Error message in dropdown
2. Empty results → **Handled**: "No cities found" in dropdown
3. Network error → **Handled**: "Search failed. Please check your connection."

#### 3. City Selection (Click → API → Render)

```
selectCity(city) → addRecentCity() → loadWeatherForCoords()
  └─ setRefreshing(true) → keep old data visible → fetchWeather()
     ├─ OK → setWeather(newData) → setRefreshing(false)
     └─ FAIL → setError() → show ErrorState (old data cleared)
```

**What can go wrong:**
1. API failure during refresh → **Handled**: Error state replaces stale data
2. localStorage quota exceeded when saving recent city → **Handled**: Silent catch

### Graceful Degradation Assessment

| Feature | When Dependency Fails | User Experience |
|---------|----------------------|----------------|
| Weather display | Open-Meteo down | Error card with "Try Again" button |
| City search | Geocoding API down | "Search failed" message in dropdown |
| Location detection | Geolocation denied/timeout | Antarctica fallback + informative toast |
| 3D background | WebGL crashes | CSS gradient background (visually fine) |
| User preferences | localStorage unavailable | Defaults used each session, app still functional |
| Typography | Google Fonts CDN down | System fonts used, app fully functional |

**Overall**: The app degrades gracefully for every dependency failure except total Netlify CDN outage. This is excellent for a client-side SPA.

### Runbooks

Full operational runbooks created at `docs/RUNBOOKS.md` covering 8 failure scenarios:

1. Open-Meteo API Unreachable
2. App Shows Blank White Page
3. 3D Scene Crashes / Missing
4. Users Stuck on Antarctica Fallback
5. localStorage Quota Exceeded
6. Netlify Deploy Fails
7. Slow Initial Load
8. Google Fonts Not Loading

Each runbook includes: Symptoms, Diagnosis Steps, Resolution (by scenario), Prevention, and Escalation guidance.

---

## 6. Alerting Recommendations

### Current State

**No alerting exists.** There are no:
- Prometheus rules or Grafana alerts
- PagerDuty/Opsgenie configuration
- CloudWatch alarms
- Netlify alert plugins
- Uptime monitoring (Pingdom, UptimeRobot, etc.)

This is expected for a portfolio-grade client-side app with no backend infrastructure.

### Recommended Alert Definitions

If the app scales to real users, these alerts would be valuable. Thresholds are derived from codebase evidence.

| Alert Name | Condition | Threshold (Derived From) | Severity | Implementation |
|-----------|-----------|------------------------|----------|----------------|
| API Error Rate Spike | Error rate > 10% of requests in 5-min window | Forecast cache TTL is 5 min; >10% errors means most users affected | Critical | Requires client-side error reporting (Sentry) |
| API Latency Degradation | P95 API response > 5s | Timeout is 10s; sustained >5s means many users near timeout | Warning | Requires RUM or custom timing |
| Netlify Deploy Failure | Build fails | Any build failure | Warning | Netlify webhook → Slack/email |
| Site Unreachable | External health check fails | 3 consecutive failures, 1-min intervals | Critical | UptimeRobot / Pingdom (free tier) |
| Bundle Size Regression | JS bundle > 600KB gzipped | Current three.js chunk ~150KB gzip; total ~300KB | Warning | CI check with `size-limit` |
| Web Vitals Degradation | LCP > 4s or CLS > 0.25 or INP > 500ms | Google "Poor" thresholds | Warning | `web-vitals` library → analytics |
| Error Boundary Activation | AppErrorBoundary or SceneErrorBoundary fires | Any occurrence | Warning | Sentry error reporting |

### Quick Wins (No New Dependencies)

| Alert | How | Cost |
|-------|-----|------|
| Netlify deploy failure notification | Netlify dashboard → Notifications → Add email/Slack webhook | Free, 5 min |
| External uptime check | UptimeRobot free tier (50 monitors, 5-min intervals) | Free, 5 min |

---

## 7. Recommendations

| # | Recommendation | Impact | Risk if Ignored | Worth Doing? | Details |
|---|---------------|--------|----------------|--------------|---------|
| 1 | Add external uptime monitoring (UptimeRobot / Pingdom) | Detects total site outage — only way to know if Netlify CDN is down for your site | Medium | Yes | Free tier of UptimeRobot provides 5-minute interval checks. Setup takes 5 minutes. Currently the only way to learn about an outage is user reports. |
| 2 | Add Netlify deploy failure notifications | Immediate awareness of failed deploys → faster response | Medium | Yes | Netlify dashboard → Notifications → email or Slack webhook. 5-minute setup. Currently, deploy failures are only visible if you check the dashboard. |
| 3 | Add Sentry error reporting | Captures production errors from real users, with stack traces and breadcrumbs, without requiring users to open DevTools | Medium | Probably | ~15 min setup. `@sentry/react` SDK integrates with existing error boundaries. The `SceneErrorBoundary.tsx:20` comment already calls this out as a TODO. Only valuable if the app has real users. |
| 4 | Add Web Vitals tracking | Visibility into real-user performance (LCP, CLS, INP). Detects performance regressions from dependency updates. | Low | Probably | `web-vitals` library (~1KB) is the standard approach. Requires an analytics endpoint to send data to. Could use Netlify Analytics or a free tier of Vercel Analytics. |
| 5 | Add CI quality gate (GitHub Actions) | Prevents broken code from being merged. Catches type errors, lint issues, and test failures before deploy. | Medium | Yes | Also recommended in DevOps audit. ~30 min setup. The single highest-leverage improvement for preventing production issues. |
| 6 | Instrument API calls with timing + error counting | Visibility into Open-Meteo API reliability over time. Currently errors are shown to users but not tracked. | Low | Only if time allows | Could add lightweight counters in the fetch wrapper without a library. But without a destination to send metrics, the data would only be available in-session via console. |
| 7 | Add cache hit/miss counters to diagnostics | Understand cache effectiveness. Currently caches exist but don't report utilization. | Low | Only if time allows | Would expose via `nimbus.diagnose()` — e.g., "geocodingCache: 12 entries, 80% hit rate". Trivial to add but low value without continuous monitoring. |

---

## Appendix A: Architecture Context

### Why Many Observability Patterns Don't Apply

This table explains why several prompt-specified audit areas are not applicable:

| Audit Area | Why N/A for Nimbus |
|-----------|-------------------|
| Health endpoints (`/health`, `/healthz`) | No backend server. Client-side equivalent implemented as `nimbus.diagnose()`. |
| Liveness vs. readiness probes | No container orchestrator (K8s). App is static files on a CDN. |
| Database connection pool metrics | No database. Only localStorage. |
| Queue depth / consumer lag | No message queue. |
| Thread/worker pool utilization | Single-threaded browser JS. |
| Open file descriptors | N/A for client-side. |
| Distributed tracing / correlation IDs | Single-process app with one external API. |
| Log aggregation / structured logging | Console logging appropriate for client-side. No log sink to send to. |
| Circuit breakers | Not warranted for a single-API client-side app. Manual "Try Again" is sufficient. |
| Feature flags | No feature flag infrastructure. UI toggles (dark mode, units) are user preferences, not operational flags. |

### What IS Applicable (and Assessed)

| Area | Applicable? | Status |
|------|------------|--------|
| Error boundary coverage | Yes | **Good** — 2 boundaries covering React and 3D |
| API error handling | Yes | **Good** — timeout, validation, user-facing messages |
| Graceful degradation | Yes | **Excellent** — every failure has a fallback UX |
| Client-side diagnostics | Yes | **Added** — `nimbus.diagnose()` |
| Error reporting (Sentry) | Yes | **Missing** — recommended if app scales |
| Web Vitals | Yes | **Missing** — recommended for performance visibility |
| Uptime monitoring | Yes | **Missing** — recommended (free, 5-min setup) |
| Deploy failure alerting | Yes | **Missing** — recommended (free, 5-min setup) |
| Operational runbooks | Yes | **Added** — `docs/RUNBOOKS.md` |

---

## Appendix B: Files Changed in This Audit

| File | Action | Description |
|------|--------|-------------|
| `src/lib/diagnostics.ts` | **Created** | Client-side health diagnostics module (4 checks, structured JSON output) |
| `src/lib/__tests__/diagnostics.test.ts` | **Created** | 10 tests for diagnostics module |
| `src/main.tsx` | **Modified** | Exposed `nimbus.diagnose()` on globalThis for console access |
| `docs/RUNBOOKS.md` | **Created** | 8 operational runbooks for common failure scenarios |
| `audit-reports/OBSERVABILITY_REPORT_01_2026-03-18.md` | **Created** | This report |
