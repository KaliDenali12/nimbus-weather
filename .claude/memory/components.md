# UI Components — Nimbus Weather App

## Component Map

All in `src/components/`. All use named exports, functional style, consume context via `useWeather()`.

### Layout Components

| Component | Role | Key Details |
|-----------|------|-------------|
| `Header.tsx` | Top bar | App title "Nimbus", unit toggle (°C/°F), dark mode toggle (Sun/Moon) |
| `SearchBar.tsx` | City search | Debounced input, dropdown with keyboard nav, combobox ARIA |
| `RecentCities.tsx` | City chips | Glass chips with MapPin icons, returns null if empty |

### Data Display

| Component | Role | Key Details |
|-----------|------|-------------|
| `CurrentWeather.tsx` | Main weather card | City (display-lg), temp (display-xl), icon, condition, details row |
| `Forecast.tsx` | 6-day grid | 3-col mobile / 6-col desktop, precipitation %, hover lift |
| `TemperatureChart.tsx` | Trend chart | Recharts AreaChart, dual area (high/low), glass tooltip |
| `AlertBanner.tsx` | Weather alerts | 3 severity levels, per-alert dismiss via Set tracking |

### Feedback Components

| Component | Role | Key Details |
|-----------|------|-------------|
| `LoadingState.tsx` | Loading spinner | Centered Loader2 icon, "Fetching weather data..." |
| `ErrorState.tsx` | Error display | CloudOff icon, error message, retry button |
| `Toast.tsx` | Notification | Fixed top-center, auto-dismiss, configurable duration |
| `WeatherIcon.tsx` | Icon mapper | WMO code → Lucide icon, aria-hidden, custom size |
| `SceneErrorBoundary.tsx` | WebGL crash guard | Class component, renders null on error, wraps WeatherScene |

## Styling Pattern

All components use:
1. **Tailwind utilities** for layout, spacing, responsive
2. **Glassmorphism classes** from `index.css` (`.glass-card`, `.glass-button`, etc.)
3. **CSS custom properties** for theme-aware colors (`var(--text-primary)`, etc.)
4. **`clsx`** for conditional class joining

## SearchBar Implementation Details

Most complex component. Key behaviors:
- `useDebounce(query, 300)` — delays API calls
- `useState` for: query, results, loading, isOpen, activeIndex
- Keyboard: ArrowDown/Up cycle activeIndex, Enter selects, Escape closes
- Click-outside: `useEffect` with `mousedown` listener on document
- Clear button: resets query + closes dropdown
- Results show: city name, country code, admin1 (state/province) for disambiguation
- Cancellation: `cancelled` flag in search useEffect prevents stale updates

## Toast Props

```typescript
interface ToastProps {
  message: string
  duration?: number    // Default: 5000ms
  onDismiss: () => void
}
```

Auto-dismiss: setTimeout for `duration` → fade-out animation (200ms) → `onDismiss()`.
Manual dismiss: X button click → fade-out → `onDismiss()`.

## AlertBanner Severity Colors

| Severity | Background | Border | Icon |
|----------|-----------|--------|------|
| advisory | blue-500/15% | blue-400/30% | Info |
| warning | amber-500/15% | amber-400/30% | AlertTriangle |
| emergency | red-500/20% | red-400/40% | AlertOctagon |

## Responsive Breakpoints

- Mobile (<640px): Single column, stacked layout
- Tablet (640-899px): 2-column where appropriate
- Desktop (900px+): Full layout, 6-col forecast grid
- Max content width: 900px, centered with `mx-auto`
