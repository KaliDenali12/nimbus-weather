# Build & Config — Nimbus Weather App

## Vite (vite.config.ts)

```typescript
import { defineConfig } from 'vitest/config'  // NOT 'vite' — needed for test config
import react from '@vitejs/plugin-react'
```

| Setting | Value | Notes |
|---------|-------|-------|
| Plugin | `@vitejs/plugin-react` | React Fast Refresh |
| Path alias | `@/` → `./src/` | Via `resolve.alias` |
| Manual chunks | `three` + `recharts` | Separate bundles for large deps |
| Test env | jsdom | Via vitest config section |
| Test setup | `./src/test/setup.ts` | @testing-library/jest-dom |
| Test globals | true | No need to import describe/it/expect |
| CSS in tests | true | Process CSS imports in test env |

**Gotcha**: Must import `defineConfig` from `'vitest/config'` (not `'vite'`) to get `test` property type.

## TypeScript (tsconfig.app.json)

| Setting | Value | Impact |
|---------|-------|--------|
| target | ES2022 | Modern JS features |
| module | ESNext | ESM imports |
| jsx | react-jsx | Automatic runtime (no React import needed) |
| strict | true | All strict checks enabled |
| noUnusedLocals | true | Error on unused variables |
| noUnusedParameters | true | Error on unused params |
| erasableSyntaxOnly | true | **No enums, no namespaces, no parameter properties** |
| verbatimModuleSyntax | true | `import type` required for type-only imports |
| baseUrl + paths | `@/*` → `./src/*` | Path alias |
| moduleResolution | bundler | Vite-compatible resolution |
| allowImportingTsExtensions | true | `.ts`/`.tsx` in imports |

**erasableSyntaxOnly pitfall**: Cannot write `constructor(public x: string)`. Must declare field separately: `x: string; constructor(x: string) { this.x = x; }`.

## Tailwind (tailwind.config.js)

Custom tokens defined in `theme.extend`:

### Fonts
- `fontFamily.display`: `['Bricolage Grotesque', ...]`
- `fontFamily.body`: `['Figtree', ...]`

### Font Sizes (all with lineHeight)
display-xl: 64px/1, display-lg: 36px/1.1, heading-1: 26px/1.2, heading-2: 20px/1.3, heading-3: 17px/1.4, body: 15px/1.5, body-sm: 13px/1.5, label: 13px/1, caption: 11px/1.3

### Border Radius
card: 16px, btn: 10px, search: 14px, chip: 20px, dropdown: 12px

### Transition Duration
fast: 150ms, normal: 200ms, slow: 600ms, xslow: 800ms

## PostCSS (postcss.config.js)

Plugins: `tailwindcss`, `autoprefixer`. Standard setup.

## ESLint (eslint.config.js)

ESLint 9 flat config:
- `@eslint/js` recommended
- `typescript-eslint` recommended
- `eslint-plugin-react-hooks` recommended
- `eslint-plugin-react-refresh` (warns on non-component exports)

## Netlify (netlify.toml)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

SPA redirect catches all routes → `index.html` (required for client-side-only app).

## Package Scripts

`dev` (vite), `build` (tsc -b && vite build), `preview`, `test` (vitest run), `test:watch`, `test:coverage`, `lint` (eslint .)

## index.html

Google Fonts preconnect + stylesheet (Bricolage Grotesque 400-800, Figtree 400-600). Meta description. Noscript fallback. Mount: `<div id="root">`.
