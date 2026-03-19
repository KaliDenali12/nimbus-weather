# Nimbus Weather App — Disaster Recovery Plan

> **Last updated**: 2026-03-18 | **Architecture**: Pure client-side SPA on Netlify CDN
>
> This document is written for someone stressed, tired, and unfamiliar with the system.
> Follow it step by step. No assumed knowledge.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Store Inventory](#2-data-store-inventory)
3. [Recovery Procedures](#3-recovery-procedures)
4. [Infrastructure Recreation](#4-infrastructure-recreation)
5. [Credential Rotation Procedures](#5-credential-rotation-procedures)
6. [Disaster Response Playbooks](#6-disaster-response-playbooks)
7. [Emergency Contacts & Access](#7-emergency-contacts--access)

---

## 1. Architecture Overview

Nimbus is a **pure client-side** React single-page application. There is:

- **No backend server** — all logic runs in the user's browser
- **No database** — no SQL, no NoSQL, no ORM, nothing
- **No API keys or secrets** — Open-Meteo is free and keyless
- **No server-side sessions** — no auth, no user accounts
- **No file storage** — no uploads, no S3, no generated files

**What exists:**
- Static HTML/JS/CSS files hosted on Netlify CDN
- Browser `localStorage` for user preferences (trivial data, ~500 bytes per user)
- Two in-memory JavaScript Maps for API response caching (lost on page refresh)
- Open-Meteo free API as the sole data source (no key, no rate limits)

**Implication:** Most traditional disaster recovery concerns (database backups, data replication, failover) **do not apply**. The primary risks are source code loss and deployment infrastructure loss.

---

## 2. Data Store Inventory

| Data Store | Type | Criticality | Backup Method | Frequency | Location | RPO | RTO |
|---|---|---|---|---|---|---|---|
| **Source code** | Git repository (GitHub) | **CRITICAL** | GitHub built-in (redundant storage) | Every push | GitHub cloud + local clones | Near-zero (last push) | 5 min (re-clone) |
| **localStorage** (`nimbus-preferences`) | Browser storage | LOW | None (per-user browser data) | N/A | User's browser | N/A — user recreates by using app | Instant (defaults load) |
| **Geocoding cache** | In-memory JS Map | EPHEMERAL | None needed | N/A | Browser tab memory | N/A — re-fetched on demand | Instant (cache miss → API call) |
| **Forecast cache** | In-memory JS Map | EPHEMERAL | None needed | N/A | Browser tab memory | N/A — re-fetched on demand | Instant (cache miss → API call) |
| **Netlify deploy history** | Netlify platform | MEDIUM | Netlify built-in | Every deploy | Netlify cloud | N/A | 1-click rollback |
| **Build artifacts** (`dist/`) | Generated files | EPHEMERAL | Reproducible from source | Every build | `.gitignore`'d, on Netlify | N/A — rebuild from source | 2 min (npm run build) |
| **npm dependencies** | npm registry | LOW | `package-lock.json` in repo | Every install | npmjs.org registry | N/A — reinstall from lock | 30 sec (npm install) |

---

## 3. Recovery Procedures

### 3.1 Source Code Recovery

**Scenario:** GitHub repository deleted or corrupted.

**Prerequisites:**
- Any machine with git installed
- A local clone of the repository (any developer machine, CI cache, or backup)

**Steps:**

1. **Check for local clones.** Any developer who has cloned the repo has a full copy of all history:
   ```bash
   # On any developer machine
   cd ~/projects/nimbus-weather
   git log --oneline -5  # Verify history is intact
   ```

2. **If GitHub is gone, recreate the repo:**
   ```bash
   # Create new repo on GitHub (or alternative host)
   # Then push from local clone:
   git remote set-url origin https://github.com/<new-org>/nimbus-weather.git
   git push --all origin
   git push --tags origin
   ```

3. **If NO local clone exists (worst case):**
   - Check Netlify's deploy cache — the last deployed `dist/` bundle exists there
   - This only recovers built assets, not source code — **source would be lost**
   - Check if any developer has a fork

**Verification:** `git log --oneline -10` shows expected commit history.

**Failure fallback:** Contact GitHub support for repository recovery.

---

### 3.2 Netlify Deployment Recovery

**Scenario:** Netlify site deleted, account locked, or deployment corrupted.

**Prerequisites:**
- Source code available (see 3.1)
- Access to a Netlify account (or alternative: Vercel, Cloudflare Pages, GitHub Pages)

**Steps:**

1. **If site is deleted but account exists:**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Login and create new site
   netlify login
   netlify init

   # Deploy
   npm install && npm run build
   netlify deploy --prod --dir=dist
   ```

2. **If switching to a different host:**
   ```bash
   npm install && npm run build
   # Upload dist/ folder to any static host
   # Configure SPA routing: all paths → /index.html (200)
   ```

3. **Restore security headers** — copy `[[headers]]` sections from `netlify.toml` to the new host's equivalent config.

4. **Restore SPA routing** — ensure `/*` redirects to `/index.html` with status 200.

**Verification:**
- Visit deployed URL — app loads and shows weather
- Check DevTools Network tab — security headers present
- Search for a city — API calls succeed

---

### 3.3 npm Dependencies Recovery

**Scenario:** npm registry partially unavailable or specific package version removed.

**Prerequisites:**
- `package-lock.json` in the repository (pinned versions + integrity hashes)

**Steps:**

1. **Standard recovery:**
   ```bash
   npm install  # Uses package-lock.json for exact versions
   ```

2. **If specific package is unavailable:**
   - Check if any developer has `node_modules/` cached locally
   - Check npm cache: `npm cache ls`
   - Use alternative registry: `npm install --registry=https://registry.npmmirror.com`

3. **If a critical package is permanently removed (left-pad scenario):**
   - The lockfile records exact versions — if the version exists in any registry mirror, it will work
   - As a last resort: fork the missing package, publish under a different name, update `package.json`

**Verification:** `npm run build` completes without errors.

---

### 3.4 localStorage Recovery (Per-User)

**Scenario:** User's browser data cleared.

**Impact:** Minimal. User loses:
- Temperature unit preference (defaults to Celsius)
- Dark mode setting (defaults to system preference)
- Up to 5 recent cities (can re-search)

**Recovery:** No action needed. Defaults are sensible. User re-selects preferences naturally.

---

## 4. Infrastructure Recreation

### 4.1 What Can Be Recreated from the Repository Alone

| Component | From Repo? | Command |
|---|---|---|
| All source code | ✅ Yes | `git clone` |
| All dependencies | ✅ Yes | `npm install` (via `package-lock.json`) |
| Build artifacts | ✅ Yes | `npm run build` |
| Tests | ✅ Yes | `npm test` |
| Security headers config | ✅ Yes | Defined in `netlify.toml` |
| SPA routing rules | ✅ Yes | Defined in `netlify.toml` |
| Cache policies | ✅ Yes | Defined in `netlify.toml` |

### 4.2 What Requires Manual Setup

| Component | Manual Steps | Estimated Time |
|---|---|---|
| **Netlify site connection** | Create site, connect to GitHub repo | 5 minutes |
| **Custom domain (if any)** | Add DNS records pointing to Netlify | 10 minutes |
| **⚠️ TEAM INPUT NEEDED: SSL certificate** | Usually auto-provisioned by Netlify (Let's Encrypt) — verify | 5 minutes |
| **⚠️ TEAM INPUT NEEDED: Netlify team/account access** | Requires account owner to grant access | Depends on team availability |
| **⚠️ TEAM INPUT NEEDED: DNS provider access** | Need credentials for domain registrar (if custom domain) | Depends on team |

### 4.3 Environment Variables to Re-Provision

**None.** This application has zero environment variables, zero API keys, and zero secrets. Open-Meteo is a free, keyless API. All configuration is hardcoded in source files.

---

## 5. Credential Rotation Procedures

### 5.1 Application Credentials

**None exist.** The application has no API keys, tokens, passwords, or secrets of any kind.

### 5.2 Infrastructure Credentials

| Credential | Location | Rotation Procedure | Dependent Services | Expected Downtime |
|---|---|---|---|---|
| **GitHub account** | ⚠️ TEAM INPUT NEEDED | GitHub Settings → Password / 2FA | Source code access, Netlify auto-deploy | None (no prod dependency on GitHub uptime) |
| **Netlify account** | ⚠️ TEAM INPUT NEEDED | Netlify Settings → Password / 2FA | Deployment pipeline | None (existing deploy stays live) |
| **⚠️ TEAM INPUT NEEDED: Domain registrar** | Unknown | Registrar-specific | DNS resolution, custom domain | Potential downtime if DNS misconfigured |
| **npm account** (if publishing) | ⚠️ TEAM INPUT NEEDED | npm Settings → Tokens | N/A (private repo, not published) | None |

### 5.3 Rotation Without Downtime

Since there are no application-level credentials, credential compromise only affects infrastructure access:

1. **GitHub token compromised:** Rotate immediately. No impact on running application (it's static files on CDN).
2. **Netlify token compromised:** Rotate immediately. Existing deployment stays live. Attacker could deploy malicious code — after rotation, redeploy from known-good commit.

---

## 6. Disaster Response Playbooks

### 6.1 Scenario: Application Servers Destroyed (Netlify Down)

**Detection:** Users report app is unreachable. Check [Netlify Status](https://www.netlifystatus.com/).

**Triage:**
1. Is it a Netlify-wide outage? → Wait for Netlify recovery. No action needed.
2. Is our specific site down? → Check Netlify dashboard for deploy status.

**Recovery:**
1. If Netlify is permanently unavailable:
   ```bash
   git clone https://github.com/KaliDenali12/nimbus-weather.git
   cd nimbus-weather
   npm install
   npm run build
   # Deploy dist/ to any static host (Vercel, Cloudflare Pages, GitHub Pages, S3+CloudFront)
   ```
2. Configure SPA routing on the new host (all paths → `/index.html`, status 200)
3. Copy security headers from `netlify.toml`
4. Update DNS if using a custom domain

**Verification:**
- App loads at new URL
- Weather search works (Open-Meteo calls succeed)
- Security headers present in response

**Data loss:** None. Application is stateless server-side.

**Time to operational:** 15–30 minutes (clone + build + deploy to alternative host).

---

### 6.2 Scenario: Source Code Repository Destroyed

**Detection:** GitHub repository returns 404 or is empty.

**Triage:**
1. Check if any team member has a local clone
2. Check if Netlify still has the last deployed build

**Recovery:**
1. **From local clone** (preferred):
   ```bash
   # On developer machine with clone
   git remote set-url origin https://github.com/<new-org>/nimbus-weather.git
   git push --all origin
   git push --tags origin
   ```
2. **From Netlify deployed assets only** (last resort):
   - Download deployed files from Netlify
   - This recovers the compiled application but NOT the source TypeScript/React code
   - Source reconstruction from minified JS is not feasible
   - **This is partial recovery only**

**Data loss:** If no local clone exists, all source code since inception is lost. **Keep at least one local clone.**

**Time to operational:** 5 minutes (from local clone) to unrecoverable (if no clones exist).

---

### 6.3 Scenario: Open-Meteo API Permanently Unavailable

**Detection:** All weather searches and location lookups fail. Error state shown to all users.

**Triage:**
1. Check [Open-Meteo status](https://open-meteo.com/) and [their GitHub](https://github.com/open-meteo/open-meteo)
2. Test API directly: `curl "https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current=temperature_2m"`

**Recovery:**
1. The app's core functionality depends entirely on Open-Meteo. If permanently gone:
   - Replace API endpoints in `src/lib/api.ts` with an alternative weather API
   - Candidates: [WeatherAPI](https://www.weatherapi.com/), [OpenWeatherMap](https://openweathermap.org/), [Visual Crossing](https://www.visualcrossing.com/)
   - Update response mapping (field names differ between providers)
   - Most alternatives require an API key — add to environment config
2. Estimated effort: 2–4 hours of development work to swap API provider

**Data loss:** None (no data stored locally from the API).

**Impact:** App is non-functional until API is replaced. Users see error state.

---

### 6.4 Scenario: Credential Compromise

**Detection:** Unauthorized deploys, unexpected code changes, suspicious GitHub/Netlify activity.

**Triage:**
1. Which credential was compromised? (GitHub, Netlify, domain registrar)
2. Has malicious code been deployed?

**Recovery:**

**GitHub compromised:**
1. Rotate password and all personal access tokens immediately
2. Enable 2FA if not already enabled
3. Review recent commits: `git log --oneline -20`
4. If malicious commits found: `git revert <commit>` and push
5. Review repository collaborators and remove unauthorized access

**Netlify compromised:**
1. Rotate password and revoke all deploy tokens
2. Check recent deploys in Netlify dashboard
3. If malicious deploy detected: click "Rollback" to last known-good deploy
4. Re-deploy from known-good git commit:
   ```bash
   git checkout <known-good-commit>
   npm install && npm run build
   netlify deploy --prod --dir=dist
   ```

**Data loss:** None (application has no data to steal). Risk is malicious code injection.

**Time to operational:** 10–15 minutes.

---

### 6.5 Scenario: Accidental Data Corruption / Bad Migration

**Detection:** App behaves incorrectly after a code change.

**Triage:**
- This app has no database migrations. "Data corruption" means either:
  1. Bad code deployed that breaks the UI
  2. User localStorage corrupted (handled automatically — invalid data filtered out)

**Recovery:**

**Bad code deployed:**
1. Rollback in Netlify dashboard (one click) or:
   ```bash
   git log --oneline -10  # Find last good commit
   git checkout <good-commit>
   npm install && npm run build
   netlify deploy --prod --dir=dist
   ```

**localStorage corrupted (per-user):**
- The app handles this automatically: `loadPreferences()` validates all fields, filters invalid entries, and falls back to defaults
- If user wants to manually clear: `localStorage.removeItem('nimbus-preferences')` in browser console

**Data loss:** None. Bad deploy is instantly recoverable. User preferences are trivially regenerated.

---

### 6.6 Scenario: File Storage Destroyed / Corrupted

**Not applicable.** This application has no file storage (no S3, no uploads, no generated files). All assets are generated by the build process from source code.

---

## 7. Emergency Contacts & Access

> **⚠️ TEAM INPUT NEEDED:** Fill in all fields below.

### 7.1 Team Contacts

| Role | Name | Contact | Backup Contact |
|---|---|---|---|
| Repository owner | ⚠️ TEAM INPUT NEEDED | ⚠️ TEAM INPUT NEEDED | ⚠️ TEAM INPUT NEEDED |
| Netlify account owner | ⚠️ TEAM INPUT NEEDED | ⚠️ TEAM INPUT NEEDED | ⚠️ TEAM INPUT NEEDED |
| Domain registrar admin | ⚠️ TEAM INPUT NEEDED | ⚠️ TEAM INPUT NEEDED | ⚠️ TEAM INPUT NEEDED |
| On-call engineer | ⚠️ TEAM INPUT NEEDED | ⚠️ TEAM INPUT NEEDED | ⚠️ TEAM INPUT NEEDED |

### 7.2 Service Access

| Service | URL | Who Has Access |
|---|---|---|
| GitHub repository | https://github.com/KaliDenali12/nimbus-weather | ⚠️ TEAM INPUT NEEDED |
| Netlify dashboard | ⚠️ TEAM INPUT NEEDED | ⚠️ TEAM INPUT NEEDED |
| Domain registrar | ⚠️ TEAM INPUT NEEDED | ⚠️ TEAM INPUT NEEDED |
| Deployed application | https://nimbus-weather-kd.netlify.app | Public |

### 7.3 External Service Status Pages

| Service | Status Page |
|---|---|
| GitHub | https://www.githubstatus.com/ |
| Netlify | https://www.netlifystatus.com/ |
| Open-Meteo | https://open-meteo.com/ (check GitHub issues) |
| npm registry | https://status.npmjs.org/ |

---

*This document should be reviewed and updated whenever the architecture changes. All `⚠️ TEAM INPUT NEEDED` items should be filled in by the team.*
