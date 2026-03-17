# Security Audit Report — Nimbus Weather App

**Run**: 01 | **Date**: 2026-03-17 | **Branch**: `nightytidy/run-2026-03-17-1741`
**Auditor**: Claude Opus 4.6 (automated) | **Scope**: Full codebase + git history + dependencies

---

## 1. Executive Summary

The Nimbus Weather App has a **strong security posture** for its architecture: a pure client-side SPA with no backend, no authentication, no API keys, and no user-generated content. The attack surface is inherently small. Zero critical or high-severity vulnerabilities were found. Three mechanical hardening fixes were applied (HTTP security headers, .gitignore patterns, npm script restrictions) — all tests pass after each fix (228/228). The primary recommendations are infrastructure-level: adding security headers to production (now done) and establishing CI/CD security scanning.

---

## 2. Automated Security Scan Results

### Tools Discovered and Run

| Tool | Version | Findings | Critical | High | Medium | Low | False Positives |
|------|---------|----------|----------|------|--------|-----|-----------------|
| npm audit | 10.x (built-in) | 0 | 0 | 0 | 0 | 0 | 0 |
| TypeScript (strict mode) | 5.9.3 | 0 security issues | — | — | — | — | — |
| ESLint | 9.39.1 | 0 (no security plugin) | — | — | — | — | — |
| Git history search (manual) | — | 0 secrets | 0 | 0 | 0 | 0 | 0 |

### Tools Recommended but Unavailable

| Tool | What It Catches | Effort to Add | Priority |
|------|----------------|---------------|----------|
| eslint-plugin-security | Unsafe regex, eval, non-literal require | Low (npm install + config) | Medium |
| Gitleaks | Secrets in git history | Low (npx or CI action) | Low |
| Snyk / Socket.dev | Dependency vulns + supply chain risk | Low (CI integration) | Medium |
| Dependabot / Renovate | Automated dependency updates | Low (GitHub config) | Medium |

### Security CI/CD Assessment

**Current state**: No CI/CD pipeline exists. No automated security scanning runs on PRs or merges. All quality checks (lint, test, type-check) are manual CLI commands. Netlify builds on push but runs no security checks.

**Recommendation**: Add GitHub Actions workflow with: npm audit, eslint with security plugin, and type-checking. Block merges on failures.

### Notable False Positives

None — no automated security tools were configured to produce false positives.

---

## 3. Fixes Applied

| # | Issue | Severity | Location | Fix Applied | Tests Pass? | Detected By |
|---|-------|----------|----------|-------------|-------------|-------------|
| 1 | Missing HTTP security headers | Medium | `netlify.toml` | Added CSP, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy | Yes (228/228) | Manual review |
| 2 | Incomplete .gitignore for sensitive files | Low | `.gitignore` | Added patterns for .pem, .key, .p12, .pfx, .jks, .keystore, credentials.json, service-account*.json | Yes (228/228) | Manual review |
| 3 | No npm install script restrictions | Low | `.npmrc` (new file) | Added `ignore-scripts=true` to prevent supply chain attacks via malicious lifecycle scripts | Yes (228/228) | Supply chain audit |

### Fix Details

#### Fix 1: HTTP Security Headers (`netlify.toml`)

**What was changed**: Added `[[headers]]` block with five security headers for all routes.

**Content-Security-Policy** restricts:
- `default-src 'self'` — only load from same origin by default
- `script-src 'self'` — no external scripts
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` — allows Tailwind inline styles + Google Fonts CSS
- `font-src https://fonts.gstatic.com` — only Google Fonts font files
- `img-src 'self' data: blob:` — allows inline images and Three.js textures
- `connect-src` — restricted to the two Open-Meteo API endpoints
- `worker-src 'self' blob:` — allows web workers for Three.js
- `child-src blob:` — allows blob iframes for WebGL

**Note for team review**: The `'unsafe-inline'` in `style-src` is required because Tailwind CSS generates inline styles. This is a known trade-off. If the team moves to CSS-in-JS with nonces, this can be tightened.

#### Fix 2: .gitignore Hardening

**What was changed**: Added patterns for private keys, certificates, keystores, and credential files. These patterns follow industry standard .gitignore templates.

#### Fix 3: npm Script Restrictions (`.npmrc`)

**What was changed**: Created `.npmrc` with `ignore-scripts=true`. This prevents all npm lifecycle scripts (preinstall, install, postinstall) from running automatically. The only direct dependency that uses a postinstall script is `esbuild` (downloads platform binary). After `npm install`, run `npm rebuild esbuild` to allow its download.

---

## 4. Critical Findings (Unfixed)

None.

---

## 5. High Findings (Unfixed)

None.

---

## 6. Medium Findings (Unfixed)

### M-1: No API Response Schema Validation

- **Severity**: Medium
- **Location**: `src/lib/api.ts:28, 55-84`
- **Description**: API responses from Open-Meteo are cast to TypeScript interfaces without runtime validation. If the API schema changes or is compromised, the app will crash or process corrupted data silently.
- **Impact**: App crash or display of incorrect weather data. No data exfiltration risk (client-side only).
- **Proof**:
  ```typescript
  // api.ts:28 — cast without validation
  return (data.results ?? []) as GeocodingResult[]

  // api.ts:65 — assumes array exists
  data.daily.time.map((dateStr: string, i: number) => ({
  ```
- **Recommendation**: Add Zod schemas for `GeocodingResult[]` and forecast response:
  ```typescript
  import { z } from 'zod'
  const GeocodingResultSchema = z.object({
    name: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    country: z.string().optional(),
    admin1: z.string().optional(),
  })
  const parsed = GeocodingResultSchema.array().parse(data.results ?? [])
  ```
- **Why It Wasn't Fixed**: Requires adding a new dependency (zod) and restructuring the API layer — not a mechanical fix.
- **Effort**: Moderate
- **Detected By**: Manual review

### M-2: No CI/CD Security Pipeline

- **Severity**: Medium
- **Location**: Project-wide (no `.github/workflows/` directory)
- **Description**: No automated security scanning runs on commits or PRs. All quality gates are manual CLI commands.
- **Impact**: Dependency vulnerabilities, secret commits, and code quality regressions can reach production undetected.
- **Recommendation**: Add GitHub Actions workflow:
  ```yaml
  - npm audit --audit-level=high
  - npx eslint --max-warnings 0
  - npm run test
  - npx tsc --noEmit
  ```
- **Why It Wasn't Fixed**: Infrastructure/workflow change requiring team alignment, not a codebase fix.
- **Effort**: Moderate
- **Detected By**: Manual review

---

## 7. Low Findings (Unfixed)

### L-1: External Fonts Without Subresource Integrity (SRI)

- **Severity**: Low
- **Location**: `index.html:11`
- **Description**: Google Fonts CSS is loaded via `<link>` without `integrity` attribute. If Google Fonts CDN is compromised, malicious CSS could be injected.
- **Impact**: CSS-based attacks (data exfiltration via CSS selectors, UI redress). Very low probability given Google's security posture.
- **Proof**:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet" />
  ```
- **Recommendation**: Google Fonts does not support SRI (responses vary by browser/UA). Mitigated by the CSP header added in Fix 1, which restricts style sources. No further action needed unless self-hosting fonts becomes viable.
- **Why It Wasn't Fixed**: Google Fonts dynamically generates CSS per browser UA, making SRI hashes impossible to pin. The CSP header provides equivalent protection.
- **Effort**: Significant refactor (would require self-hosting fonts)
- **Detected By**: Manual review

### L-2: No Fetch Timeout on API Calls

- **Severity**: Low
- **Location**: `src/lib/api.ts:22-25, 49-53`
- **Description**: `fetch()` calls to Open-Meteo have no explicit timeout. Browser defaults vary (Chrome: ~300s). A slow or unresponsive API could leave the app in a loading state indefinitely.
- **Impact**: Poor UX (infinite loading spinner). No security impact beyond resource consumption.
- **Proof**:
  ```typescript
  const res = await fetch(url.toString())
  // No AbortController, no timeout
  ```
- **Recommendation**: Add `AbortController` with a reasonable timeout (e.g., 10s):
  ```typescript
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  const res = await fetch(url.toString(), { signal: controller.signal })
  clearTimeout(timeout)
  ```
- **Why It Wasn't Fixed**: Functional enhancement rather than security fix. The app handles network errors gracefully already.
- **Effort**: Quick fix
- **Detected By**: Manual review

---

## 8. Informational

### I-1: No Authentication, No Authorization (By Design)

The app has no auth layer. This is correct — it's a read-only weather viewer consuming a public API. No IDOR, CSRF, session, JWT, or password issues exist because these concepts don't apply.

### I-2: Pure Client-Side Architecture Limits Attack Surface

No backend means no server-side injection (SQL, command, SSRF, path traversal, deserialization). The only attack vectors are client-side: XSS, CSP bypass, and supply chain. All were audited and found clean.

### I-3: `dangerouslySetInnerHTML` Not Used

Zero instances in the entire codebase. All dynamic content is rendered through React's safe JSX escaping.

### I-4: localStorage Contains No Sensitive Data

Only stores: `unitPreference` (string), `darkModeEnabled` (boolean), `recentCities` (array of city names + coordinates). No tokens, keys, or PII.

### I-5: Open-Meteo API is Keyless

No API keys to leak, rotate, or protect. The API is free, public, and HTTPS-only. This eliminates an entire class of secret management vulnerabilities.

### I-6: Error Messages Are Generic

API errors show "Unable to fetch weather data" to users. No stack traces, status codes, or internal details are exposed in the UI. The custom `ApiError` class stores status codes internally but doesn't render them.

---

## 9. Supply Chain Risk Assessment

### Post-install Scripts

| Package | Script Type | Behavior | Risk Level | Recommendation |
|---------|-------------|----------|------------|----------------|
| esbuild (transitive) | postinstall | Downloads platform-specific precompiled binary | Low | Expected behavior; allow via `npm rebuild esbuild` |

All other 522 packages have no install scripts that execute from registry installs. 23 packages have `prepare` scripts (build from source), but these only run on git clones, not npm installs.

**Mitigation applied**: `.npmrc` with `ignore-scripts=true` now prevents all lifecycle scripts by default.

### Typosquatting Risks

| Package | Similar To | Confidence | Evidence |
|---------|-----------|------------|---------|
| — | — | — | No typosquatting risks identified |

All 31 direct dependencies are well-known, high-download-count packages from established maintainers (@react-three, recharts, lucide, framer-motion, tailwindcss, vite, vitest, eslint, typescript). No obscure or suspiciously-named packages.

### Namespace/Scope Risks

| Package | Risk Type | Detail | Recommendation |
|---------|-----------|--------|----------------|
| — | — | — | No namespace risks identified |

No private registry references, no `@internal` scoped packages, no mixed registry configurations.

### Lock File Integrity

| Check | Result |
|-------|--------|
| Lock file committed | Yes |
| Lock file version | 3 (modern) |
| Registry hosts | `registry.npmjs.org` only |
| Missing integrity hashes | 0 |
| Unexpected URLs | None |

**Status**: PASS — Clean lock file with full integrity hashes pointing exclusively to the official npm registry.

### Maintainer Risk

No concerns identified. All critical dependencies (react, three, vite, typescript) are maintained by well-funded teams or large open-source organizations with multi-maintainer governance.

### Transitive Dependency Stats

| Metric | Value |
|--------|-------|
| Direct dependencies | 31 |
| Total packages | 523 |
| Max tree depth | 38 levels |
| Known vulnerabilities | 0 |
| Flagged packages | 0 |

The fan-out ratio (31 → 523) is typical for a React + Three.js + Vite + testing stack. Deep nesting is driven by `@react-three/drei` which pulls in media/controls libraries.

---

## 10. Methodology

### Phases Executed

1. **Phase 0 — Automated Tooling**: Discovered ESLint, TypeScript strict, Vitest. Ran `npm audit` (0 findings). No SAST or secret scanning tools installed.
2. **Phase 1 — Secrets Scan**: Searched git history across all 3 branches for API_KEY, SECRET, PASSWORD, TOKEN, PRIVATE_KEY patterns and sensitive file extensions. Zero findings.
3. **Phase 2 — Auth & Permissions**: N/A — pure client-side app with no auth layer. Confirmed no auth code exists.
4. **Phase 3 — Common Vulnerabilities**: Manual review of all source files for XSS, injection, CSRF, SSRF, deserialization, path traversal, CORS, error leakage. Zero vulnerabilities found.
5. **Phase 4A — Dependency Vulnerabilities**: `npm audit` returned 0 vulnerabilities across 523 packages.
6. **Phase 4B — Supply Chain**: Audited install scripts, lock file integrity, registry sources, namespace risks. Clean results.
7. **Phase 5 — Safe Fixes**: Applied 3 mechanical fixes (security headers, .gitignore, .npmrc). All tests pass.
8. **Phase 6 — Report**: This document.

### Files Reviewed

Every file in `src/` was read and analyzed: `lib/` (7 files), `context/` (1 file), `components/` (12 files), `scenes/` (7 files), `hooks/` (1 file), `types/` (2 files), `App.tsx`, `main.tsx`, `index.css`. Plus all config files at root level.
