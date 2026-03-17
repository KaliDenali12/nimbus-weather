# Dependency Health Report

**Project**: Nimbus Weather App
**Date**: 2026-03-17
**Run**: 01
**Branch**: `nightytidy/run-2026-03-17-1741`
**Auditor**: Automated (Claude Code)

---

## 1. Executive Summary

| Metric | Count |
|--------|-------|
| Total dependencies (direct) | 29 (8 runtime + 21 dev) |
| Total dependencies (transitive) | ~471 packages |
| Known vulnerabilities | **0** |
| Dependencies 1+ major versions behind | **11** |
| Potentially abandoned dependencies | **0** |
| License risks found | **0** |
| Upgrades applied | **7** (3 in-range + 4 low-risk major) |
| Dependencies removed | **2** (clsx, framer-motion) |

**Overall health: GOOD.** Zero vulnerabilities, all licenses permissive, no abandoned packages. The main concern is staleness — 11 packages are one or more major versions behind their latest release. Two unused dependencies were removed.

---

## 2. Vulnerability Report

```
npm audit: found 0 vulnerabilities
```

| Package | CVE | Severity | Used in Project? | Fix Available? | Fix Applied? |
|---------|-----|----------|-----------------|----------------|-------------|
| *(none)* | — | — | — | — | — |

**No vulnerabilities found.** The dependency tree is clean as of 2026-03-17.

**Note:** A critical React Server Components vulnerability (CVE affecting React 19.0–19.2.0) was patched in React 19.2.1+. This project is on React 19.2.4 and is **not affected**. Additionally, this project does not use React Server Components (pure client-side).

---

## 3. License Compliance

### License Distribution

| License | Count | Risk |
|---------|-------|------|
| MIT | 371 | None |
| ISC | 36 | None |
| Apache-2.0 | 24 | None |
| BSD-3-Clause | 11 | None |
| BSD-2-Clause | 8 | None |
| BlueOak-1.0.0 | 5 | None |
| MIT-0 | 1 | None |
| Python-2.0 | 1 | None |
| CC-BY-4.0 | 1 | None |
| 0BSD | 1 | None |
| MIT AND ISC | 1 | None |
| MIT* | 1 | None |

**No GPL, AGPL, SSPL, BSL, or unlicensed packages found.** All dependencies use permissive licenses compatible with MIT (the project's own license).

The single `UNLICENSED` entry in the raw scan is the project itself (`nimbus-weather@1.0.0` has `"private": true` — this is standard for private packages and not a concern).

---

## 4. Staleness Report

### Currently Installed (After Upgrades)

| Package | Type | Current | Latest | Gap | Last Published | Health |
|---------|------|---------|--------|-----|----------------|--------|
| `three` | Runtime | 0.175.0 | 0.183.2 | 8 minor | Mar 2026 | Excellent |
| `@types/three` | Dev | 0.175.0 | 0.183.1 | 8 minor | Mar 2026 | Excellent |
| `recharts` | Runtime | 2.15.4 | 3.8.0 | 1 major | Mar 2026 | Good |
| `tailwindcss` | Dev | 3.4.19 | 4.2.1 | 1 major | Feb 2026 | Caution |
| `eslint` | Dev | 9.39.4 | 10.0.3 | 1 major | Mar 2026 | Excellent |
| `@eslint/js` | Dev | 9.39.4 | 10.0.1 | 1 major | Feb 2026 | Excellent |
| `vite` | Dev | 7.3.1 | 8.0.0 | 1 major | Mar 2026 | Excellent |
| `vitest` | Dev | 3.2.4 | 4.1.0 | 1 major | Mar 2026 | Excellent |
| `@vitest/coverage-v8` | Dev | 3.2.4 | 4.1.0 | 1 major | Mar 2026 | Excellent |
| `@vitejs/plugin-react` | Dev | 5.2.0 | 6.0.1 | 1 major | Mar 2026 | Excellent |
| `jsdom` | Dev | 26.1.0 | 29.0.0 | 3 major | Mar 2026 | Good |

**All packages are actively maintained.** The gaps are due to recent major version releases, not package abandonment.

### Up-to-Date Packages

| Package | Type | Version | Status |
|---------|------|---------|--------|
| `react` | Runtime | 19.2.4 | Current |
| `react-dom` | Runtime | 19.2.4 | Current |
| `@react-three/fiber` | Runtime | 9.5.0 | Current |
| `@react-three/drei` | Runtime | 10.7.7 | Current |
| `lucide-react` | Runtime | 0.577.0 | Current (upgraded) |
| `typescript` | Dev | 5.9.3 | Current |
| `typescript-eslint` | Dev | 8.57.1 | Current (upgraded) |
| `eslint-plugin-react-hooks` | Dev | 7.0.1 | Current |
| `eslint-plugin-react-refresh` | Dev | 0.5.2 | Current (upgraded) |
| `globals` | Dev | 17.4.0 | Current (upgraded) |
| `@types/node` | Dev | 25.5.0 | Current (upgraded) |
| `@types/react` | Dev | 19.2.14 | Current |
| `@types/react-dom` | Dev | 19.2.3 | Current |
| `@testing-library/jest-dom` | Dev | 6.9.1 | Current |
| `@testing-library/react` | Dev | 16.3.2 | Current |
| `@testing-library/user-event` | Dev | 14.6.1 | Current |
| `autoprefixer` | Dev | 10.4.27 | Current |
| `postcss` | Dev | 8.5.8 | Current |

---

## 5. Upgrades Applied

| Package | From | To | Type | Tests Pass? |
|---------|------|----|------|-------------|
| `typescript-eslint` | 8.57.0 | 8.57.1 | Patch (in-range) | Yes (228/228) |
| `@vitejs/plugin-react` | 5.1.4 | 5.2.0 | Minor (in-range) | Yes (228/228) |
| `framer-motion` | 12.35.2 | 12.38.0 | Minor (in-range) | Yes (228/228) |
| `globals` | 16.5.0 | 17.4.0 | Major | Yes (228/228) |
| `@types/node` | 24.12.0 | 25.5.0 | Major | Yes (228/228) |
| `lucide-react` | 0.511.0 | 0.577.0 | Minor (0.x) | Yes (228/228) |
| `eslint-plugin-react-refresh` | 0.4.26 | 0.5.2 | Major | Yes (228/228) |

**Code change required:** `eslint.config.js` line 16 — changed `reactRefresh.configs.vite` to `reactRefresh.configs.vite()` (function call syntax required in v0.5).

**Note:** `framer-motion` was upgraded from 12.35.2 to 12.38.0 before being removed (see Section 7). The upgrade was part of the in-range bump pass.

---

## 6. Major Upgrades Needed (Not Applied)

### Priority 1: Vite + Vitest Ecosystem (Coordinated Upgrade)

| Package | Current | Target | Breaking Changes | Effort | Priority |
|---------|---------|--------|-----------------|--------|----------|
| `vite` | 7.3.1 | 8.0.0 | Rolldown bundler (Rust), new plugin API, Node 20.19+ | Moderate | Medium |
| `vitest` | 3.2.4 | 4.1.0 | Browser Mode stable, new defaults | Moderate | Medium |
| `@vitest/coverage-v8` | 3.2.4 | 4.1.0 | Must match vitest version | Trivial | Medium |
| `@vitejs/plugin-react` | 5.2.0 | 6.0.1 | Likely Vite 8 peer dep | Trivial | Medium |

**Notes:** These should be upgraded together. Vite 8 ships Rolldown (Rust-based bundler) replacing esbuild/rollup for 10–30x faster builds. Security patches are still backported to Vite 7.3.x, so no urgency. Recommended as a half-day dedicated task.

### Priority 2: ESLint 10

| Package | Current | Target | Breaking Changes | Effort | Priority |
|---------|---------|--------|-----------------|--------|----------|
| `eslint` | 9.39.4 | 10.0.3 | Legacy `.eslintrc` removed (flat config only), Node 20.19+ | Trivial | Low |
| `@eslint/js` | 9.39.4 | 10.0.1 | Must match eslint version | Trivial | Low |

**Notes:** This project already uses flat config (`eslint.config.js`), so migration should be minimal. The `defineConfig` import path may change. Low urgency — ESLint 9 continues to work.

### Priority 3: Recharts 3

| Package | Current | Target | Breaking Changes | Effort | Priority |
|---------|---------|--------|-----------------|--------|----------|
| `recharts` | 2.15.4 | 3.8.0 | Internal API cleanup, `accessibilityLayer` on by default | Trivial | Low |

**Notes:** Research indicates this project's usage (AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer) is unaffected by the v3 breaking changes. The breaking changes target internal/advanced APIs (CategoricalChartState, CartesianGrid xAxisId, custom Tooltip types). Should be a safe upgrade but warrants visual verification of the chart after upgrading.

### Priority 4: Three.js + @types/three

| Package | Current | Target | Breaking Changes | Effort | Priority |
|---------|---------|--------|-----------------|--------|----------|
| `three` | 0.175.0 | 0.183.2 | Ongoing 0.x releases, WebGPU emphasis | Moderate | Low |
| `@types/three` | 0.175.0 | 0.183.1 | Must match three version | Trivial | Low |

**Notes:** Three.js uses unconventional versioning (always 0.x). Each minor release can contain breaking changes. The project uses basic geometry, materials, and BufferAttribute — likely safe, but should be tested incrementally (bump one version at a time). Low urgency since the current version works.

### Priority 5: Tailwind CSS 4

| Package | Current | Target | Breaking Changes | Effort | Priority |
|---------|---------|--------|-----------------|--------|----------|
| `tailwindcss` | 3.4.19 | 4.2.1 | Complete rewrite: CSS-first config, no `tailwind.config.js`, Lightning CSS engine, new browser baseline | Significant | Low |

**Notes:** Tailwind v4 is a full rewrite. Migration requires removing `tailwind.config.js`, converting config to CSS-based `@theme` directives, updating PostCSS config, and potentially adjusting class names. Browser baseline changes (Safari 16.4+, Chrome 111+, Firefox 128+). **Additional risk factor:** Tailwind Labs laid off 75% of engineering in January 2026. While v4 is stable and released, long-term maintenance is uncertain. Recommend staying on v3 until the ecosystem stabilizes.

### Priority 6: jsdom

| Package | Current | Target | Breaking Changes | Effort | Priority |
|---------|---------|--------|-----------------|--------|----------|
| `jsdom` | 26.1.0 | 29.0.0 | 3 major versions; DOM spec compliance changes | Unknown | Low |

**Notes:** Used only as a test environment for Vitest. Should be upgraded in coordination with Vitest. Low urgency.

### Suggested Upgrade Order

1. **Vite 8 + Vitest 4 + @vitest/coverage-v8 4 + @vitejs/plugin-react 6 + jsdom** (coordinated build tool upgrade)
2. **ESLint 10 + @eslint/js 10** (independent, straightforward)
3. **Recharts 3** (independent, low risk)
4. **Three.js 0.183 + @types/three** (independent, needs visual testing)
5. **Tailwind CSS 4** (last — highest effort, highest risk, least urgency)

---

## 7. Dependency Weight & Reduction

### Unused Dependencies Removed

| Package | Was Used? | Size Impact | Action |
|---------|-----------|-------------|--------|
| `clsx` | Never imported in source | 239 bytes (trivial) | **Removed** |
| `framer-motion` | Never imported in source | ~150KB+ (significant) | **Removed** — reduced `node_modules` by 4 packages |

**clsx**: Listed in `package.json` but never imported. The project uses inline Tailwind className strings throughout.

**framer-motion**: Listed in `package.json` but never imported. All animations are handled by Three.js `useFrame` hooks (3D) and CSS transitions via Tailwind (UI). Removing this saved the most meaningful dependency weight.

### Lightweight Usage Observations

| Package | Usage Scope | Assessment |
|---------|-------------|------------|
| `@react-three/drei` | 1 file, 1 import (`Stars`) | Very light usage of a large library. Could be replaced with a custom starfield, but not worth the effort — drei is already loaded for R3F compatibility. |
| `recharts` | 1 file (`TemperatureChart.tsx`) | Large library (charting + D3 internals) for a single chart component. An alternative would be a lightweight SVG chart, but the effort to replace would be disproportionate to the benefit. |

### No Other Removals Recommended

All other dependencies are actively imported and used across multiple files. No polyfills for already-supported features were found.

---

## 8. Abandoned / At-Risk Dependencies

| Package | Last Release | Maintainer Activity | Risk | Recommendation |
|---------|-------------|---------------------|------|---------------|
| `tailwindcss` (v3) | Dec 2025 (v3.4.19) | **75% engineering layoffs Jan 2026.** v3 in maintenance mode, all development on v4. | **Medium** | Monitor closely. Plan v4 migration when ecosystem stabilizes. |
| `recharts` | Mar 2026 (v3.8.0) | Active, but "Looking for Contributors" issue open (#3407) | **Low** | Monitor. Current release cadence is healthy. |
| `lucide-react` | Mar 2026 (v0.577.0) | 1 npm publisher, community-driven | **Low** | Low complexity (icon library) mitigates single-publisher risk. |

**No dependencies are abandoned.** All packages received releases within the last 6 months. The Tailwind Labs layoffs are the only notable organizational risk signal.

---

## 9. Lock File Status

| Check | Result |
|-------|--------|
| Lock file exists? | Yes (`package-lock.json`) |
| Committed to repo? | Yes |
| Consistent with manifest? | Yes (`npm install --package-lock-only` reports "up to date") |
| Duplicate packages? | No significant duplicates detected |
| Total packages in tree | 471 (after removing framer-motion) |

---

## 10. Recommendations

### Immediate (No Additional Work Needed)

1. **Commit the changes from this audit** — 7 upgrades applied, 2 unused deps removed, 1 config fix. All 228 tests pass.

### Short-Term (Next Sprint)

2. **Upgrade recharts 2 → 3** — Research indicates zero code changes needed for this project's usage. Visually verify the temperature chart after upgrading.

3. **Upgrade ESLint 9 → 10** — This project already uses flat config. Migration should be a < 1 hour task.

### Medium-Term (Next Month)

4. **Coordinated Vite/Vitest ecosystem upgrade** — Vite 8 (Rolldown), Vitest 4, @vitejs/plugin-react 6, jsdom latest. Plan as a half-day task. Benefits: significantly faster builds via Rust-based bundler.

5. **Bump Three.js 0.175 → 0.183** — Increment one minor version at a time, run tests after each. The project uses basic APIs that are unlikely to break.

### Long-Term (Quarterly Review)

6. **Evaluate Tailwind CSS 4 migration** — Wait for ecosystem stability post-layoffs. The v3 → v4 migration is non-trivial (CSS-first config, different build pipeline). Not urgent while v3.4.x works.

### Tooling Recommendations

7. **Enable Dependabot or Renovate** — Automate dependency update PRs to prevent staleness accumulation. Configure to auto-merge patch updates with passing CI.

8. **Add `npm audit` to CI pipeline** — Run `npm audit --audit-level=moderate` as a CI step to catch vulnerabilities early.

### Dependency Addition Policy

For future dependency additions, consider:
- **Is it actively maintained?** (Release within last 6 months)
- **Does it have more than 1 maintainer?** (Bus factor)
- **Is the license permissive?** (MIT, ISC, BSD, Apache-2.0)
- **Can this be solved with < 50 lines of utility code?** (If yes, prefer inline)
- **Does it pull in a large transitive tree?** (Check with `npm explain`)
