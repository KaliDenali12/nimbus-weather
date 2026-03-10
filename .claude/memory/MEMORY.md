# Nimbus Weather App — Memory Index

Portfolio-grade client-side weather app (React 19 + Three.js + Open-Meteo). See CLAUDE.md for full rules.

## Current State

- **Tests**: 87 passing (9 files, ~1.2s)
- **Deploy**: https://test-feb26.netlify.app
- **Repo**: https://github.com/KaliDenali12/nimbus-weather
- **Status**: Full MVP complete. All mandatory features built and deployed.

## Sub-Memory Files

| File | When to Load |
|------|-------------|
| testing.md | Writing or fixing tests |
| three-js.md | Working on 3D scenes or R3F components |
| theming.md | Modifying weather-driven theme or dark mode |
| api-integration.md | Working with Open-Meteo API calls |
| accessibility.md | Fixing a11y issues or adding ARIA patterns |
| data-model.md | Modifying types, localStorage, or context state |
| performance.md | Optimizing bundle, rendering, or network |
| components.md | Building or modifying UI components |
| error-handling.md | Debugging errors or adding error handling |
| build-config.md | Changing Vite, TypeScript, Tailwind, or deploy config |
| weather-codes.md | Mapping WMO codes to conditions/icons |

## Critical Gotchas

1. **erasableSyntaxOnly** — No parameter properties, enums, or namespaces in TypeScript
2. **drei v10 Cloud removed** — Use custom `SimpleCloud` (overlapping spheres)
3. **Snow-day has dark text** — Only theme with dark text on light background, intentional
4. **`userEvent` + fake timers** — Causes timeout, use `fireEvent` instead
5. **Open-Meteo free tier** — No alerts, no hourly, no historical data

## File Rules

- One topic per file, 40–80 lines target
- Terse reference format: tables, bullets, code snippets — no prose
- Update this index when creating or removing files
