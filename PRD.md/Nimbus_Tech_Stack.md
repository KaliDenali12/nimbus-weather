# Tech Stack for Nimbus

## Executive Summary

Nimbus is a pure client-side weather web app with dynamic theming and a 3D weather diorama. There is no backend, no database, and no user accounts — the app fetches weather data directly from a free API and stores preferences in the browser. This stack is built on React + TypeScript + Three.js, optimized for AI-assisted development with widely adopted, well-documented tools. Every choice below is final and ready to build on.

## 1. Mandatory Stack (MVP Requirements)

### Frontend (What Users See & Interact With)

| Technology | Version | Purpose |
|---|---|---|
| React | 18.x | Core UI framework — renders all interface components |
| TypeScript | 5.x | Adds type safety to JavaScript — catches bugs before they happen |
| Vite | 5.x | Build tool — bundles the app for production and runs the dev server |
| Tailwind CSS | 3.x | Utility-first CSS framework — handles layout, spacing, responsive design |
| Shadcn/UI | Latest | Pre-built accessible UI components (buttons, inputs, dropdowns, toasts) |

### 3D Rendering (The Weather Diorama)

| Technology | Version | Purpose |
|---|---|---|
| Three.js | 0.162+ | 3D graphics engine — renders the weather scene |
| React Three Fiber (@react-three/fiber) | 8.x | React wrapper for Three.js — lets you build 3D scenes as React components |
| @react-three/drei | 9.x | Helper library — provides pre-built Sky, Stars, Cloud, and particle components |

### Backend

None. This is a purely client-side application. No server, no serverless functions, no backend framework.

### Database & Storage

| Technology | Purpose |
|---|---|
| Browser localStorage | Stores user preferences (unit toggle, dark mode) and recent cities list. No external database. |

### Infrastructure & Services

| Technology | Purpose |
|---|---|
| Netlify | Static site hosting — deploys the built app, serves it globally via CDN |
| GitHub | Version control — stores the codebase, connects to Netlify for auto-deploy on push |
| Open-Meteo API | Weather data — provides current conditions, forecast, and geocoding. Free, no API key required. |

### Key Libraries & Tools

| Technology | Purpose |
|---|---|
| Recharts | Chart library — renders the temperature trend chart (line/area chart) |
| Lucide React | Icon library — provides weather and UI icons (sun, cloud, rain, search, etc.) |
| clsx | Utility — conditionally joins CSS class names for dynamic theming |
| Framer Motion | Animation library — handles page transitions and subtle UI animations (optional, use only if complexity stays low) |

## 2. Architecture Overview

### How It All Fits Together

```
User's Browser
├── React App (Vite-built, hosted on Netlify)
│   ├── Search Component → calls Open-Meteo Geocoding API → returns city coordinates
│   ├── Weather Display → calls Open-Meteo Forecast API → returns current + 5-day forecast
│   ├── Theme Provider → reads weather code → sets CSS variables for dynamic colors
│   ├── 3D Scene (React Three Fiber) → reads weather code → renders matching diorama
│   ├── Chart (Recharts) → reads forecast data → renders temperature trend
│   └── localStorage → reads/writes unit preference, dark mode, recent cities
└── No backend. No database. No authentication.
```

### Data Flow

1. **On load:** Browser geolocation API provides coordinates → app calls Open-Meteo API with those coordinates → weather data returns → UI renders current weather, forecast, chart, 3D scene, and theme
2. **On city search:** User types → debounced call to Open-Meteo Geocoding API → autocomplete results display → user selects → same flow as step 1 with new coordinates
3. **On preference change:** User toggles °C/°F or dark mode → state updates → value written to localStorage → persists across sessions
4. **On return visit:** App re-detects geolocation (fresh weather data) → reads localStorage for unit preference, dark mode, recent cities → renders with saved preferences

### Key Architectural Decisions

- **No backend at all.** Open-Meteo is free and requires no API key, so there's nothing to hide server-side. All logic runs in the browser.
- **No state management library.** React's built-in useState and useContext are sufficient for this app's complexity. No Redux, Zustand, or similar.
- **3D scene as a React component.** React Three Fiber lets the 3D diorama live inside the React component tree, sharing state (weather code, day/night) via props — no manual DOM bridging.
- **CSS variables for dynamic theming.** Weather condition maps to a set of CSS custom properties (background gradient, card color, text color). Switching cities updates the variables, and CSS transitions handle the smooth color shift.
- **Shadcn/UI for base components, custom CSS for weather theming.** Shadcn provides accessible, unstyled primitives (input, button, toast, dropdown). The dynamic weather aesthetic (glassmorphism, gradients, transparency) is custom Tailwind + CSS on top.
