# Nimbus Weather App — Backup Recommendations

> **Generated**: 2026-03-18 | **Architecture**: Pure client-side SPA on Netlify CDN

---

## Context

Nimbus is a client-side-only application with no backend, no database, and no server-side state. Traditional backup recommendations (database snapshots, WAL archiving, file storage replication) **do not apply**.

The recommendations below focus on what **does** matter for this architecture: source code protection, deployment continuity, and operational resilience.

---

## Recommendations

### 1. Maintain Multiple Local Clones of the Repository

**What:** Ensure at least 2 developers always have an up-to-date local clone of the repository.

**Why:** If GitHub experiences a catastrophic failure or the repository is accidentally deleted, a local clone contains the complete history. GitHub's redundancy is excellent but not a guarantee — the repository owner could also accidentally delete it.

**Implementation:**
- Each active developer should `git pull` regularly (at least weekly)
- Consider a scheduled mirror to a second Git host (GitLab, Bitbucket) using:
  ```bash
  # One-time setup on a second Git host
  git remote add mirror https://gitlab.com/<org>/nimbus-weather.git

  # Weekly mirror push (could be a local cron or GitHub Action)
  git push mirror --all && git push mirror --tags
  ```

**Effort:** 15 minutes initial setup, zero ongoing maintenance if automated.

**Priority:** MEDIUM — GitHub outages are rare, but repository deletion is irreversible.

---

### 2. Add GitHub Actions CI Pipeline with Pre-Merge Checks

**What:** Run lint, type-check, and tests on every pull request before merge is allowed.

**Why:** Currently, broken code can be merged to `main` and deployed to production because there are no pre-merge quality gates. Netlify will fail the build (preventing broken deploys), but the bad commit is still in `main`.

**Implementation:**

Create `.github/workflows/ci.yml`:
```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run build    # Includes tsc type-checking
      - run: npm test
```

**Effort:** 30 minutes.

**Priority:** HIGH — Prevents deploying broken builds. Free tier of GitHub Actions is sufficient.

---

### 3. Enable Netlify Deploy Notifications

**What:** Configure Netlify to send notifications on deploy success/failure.

**Why:** Currently, deploy failures are only visible if someone checks the Netlify dashboard. A failed deploy means the last good version stays live (safe), but the team should know about it.

**Implementation:**
1. Go to Netlify Dashboard → Site → Settings → Build & deploy → Deploy notifications
2. Add: "Email on deploy failure" → team email
3. Optional: Add Slack webhook for deploy success/failure

**Effort:** 5 minutes.

**Priority:** MEDIUM — Low effort, immediate visibility improvement.

---

### 4. Set Up External Uptime Monitoring

**What:** Use a free uptime monitoring service to detect when the app is unreachable.

**Why:** If Netlify has an outage or the site breaks, the team currently has no way to know unless a user reports it.

**Implementation:**
1. Sign up at [UptimeRobot](https://uptimerobot.com/) (free tier: 50 monitors, 5-min checks)
2. Add monitor: `https://test-feb26.netlify.app`
3. Configure alert: email + ⚠️ TEAM INPUT NEEDED: Slack/SMS if desired

**Effort:** 5 minutes.

**Priority:** MEDIUM — Free, instant value.

---

### 5. Backup Testing Schedule

**What:** Periodically verify that the application can be fully recreated from the repository alone.

**Why:** The app's "backup" is the Git repository. If `npm install` or `npm run build` breaks due to dependency changes, the backup is effectively useless.

**Implementation:**

Quarterly (or after major dependency updates):
```bash
# Clone fresh into a temp directory
git clone https://github.com/KaliDenali12/nimbus-weather.git /tmp/nimbus-test
cd /tmp/nimbus-test

# Install and build from scratch
npm install
npm run build   # Should succeed
npm test        # Should pass

# Clean up
rm -rf /tmp/nimbus-test
```

This can be automated as a scheduled GitHub Action:
```yaml
name: Backup Verification
on:
  schedule:
    - cron: '0 6 1 */3 *'  # Quarterly, 1st of month at 6am UTC
  workflow_dispatch:         # Manual trigger

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm test
```

**Effort:** 15 minutes (automated) or 5 minutes (manual, quarterly).

**Priority:** LOW — `package-lock.json` provides strong reproducibility guarantees, but periodic verification is cheap insurance.

---

### 6. Add Error Reporting Service (When App Scales)

**What:** Integrate Sentry or similar for production error visibility.

**Why:** Currently, production JavaScript errors are only visible in individual users' browser DevTools. If a bug affects many users, the team has no visibility.

**When to implement:** When the app has real users beyond the portfolio showcase stage.

**Implementation:**
```bash
npm install @sentry/react
```
```typescript
// In main.tsx, before React render
import * as Sentry from '@sentry/react'
Sentry.init({ dsn: 'https://your-dsn@sentry.io/project' })
```

**Effort:** 15 minutes.

**Priority:** LOW (now) / HIGH (when app has real users).

---

### 7. Document and Secure Infrastructure Access

**What:** Record who has access to GitHub, Netlify, and the domain registrar (if any). Ensure at least 2 people have admin access to each.

**Why:** If the sole admin is unavailable, no one can deploy, roll back, or configure the site. This is a bus-factor-of-1 risk.

**Implementation:**
- Fill in the Emergency Contacts table in `docs/DISASTER_RECOVERY.md`
- Ensure GitHub org has at least 2 admins
- Ensure Netlify team has at least 2 owners
- Store access credentials securely (password manager shared vault)

**Effort:** 30 minutes.

**Priority:** MEDIUM — Organizational, not technical, but critical during incidents.

---

## Summary Table

| # | Recommendation | Effort | Priority | Cost |
|---|---|---|---|---|
| 1 | Maintain multiple local clones / Git mirror | 15 min | MEDIUM | Free |
| 2 | Add GitHub Actions CI pipeline | 30 min | HIGH | Free (GH Actions) |
| 3 | Enable Netlify deploy notifications | 5 min | MEDIUM | Free |
| 4 | Set up external uptime monitoring | 5 min | MEDIUM | Free |
| 5 | Backup testing schedule (quarterly) | 15 min | LOW | Free |
| 6 | Add error reporting (Sentry) | 15 min | LOW (now) | Free tier |
| 7 | Document infrastructure access | 30 min | MEDIUM | Free |

**Total estimated effort for all recommendations: ~2 hours.**

---

## What We Deliberately Do NOT Recommend

The following are standard DR recommendations that **do not apply** to this architecture:

- **Database backups / PITR / WAL archiving** — No database exists
- **Redis/cache replication** — In-memory caches are ephemeral and reconstructable
- **File storage versioning / replication** — No file storage exists
- **Multi-region / multi-AZ deployment** — Netlify CDN handles this automatically
- **Load balancer configuration** — Netlify CDN handles this automatically
- **Secret rotation automation** — No secrets exist
- **Service worker / offline caching** — Not implemented (stretch feature)
- **Database read replicas** — No database
- **Message queue persistence** — No message queues

Recommending these would be over-engineering for a client-side SPA with no backend.

---

*Review this document when the architecture changes (e.g., adding a backend, user accounts, or server-side data storage). At that point, traditional DR recommendations become critical.*
