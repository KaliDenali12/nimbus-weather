# Nimbus Feature Set

## Mandatory Features

### Geolocation & Location Detection
- **Auto-detect user location on first load** — use browser geolocation API to get coordinates and fetch local weather immediately
  - Request geolocation permission via browser prompt
  - Convert coordinates to city name via reverse geocoding (Open-Meteo geocoding API)
  - Show loading state while detecting location and fetching data
- **Geolocation denied fallback** — when the user blocks location access, show a toast/prompt explaining geolocation was blocked and default to an Antarctica location
  - Toast message communicating that location access was denied
  - Antarctica coordinates as the default location (showcases snow/night 3D scene)
  - Search bar prominently visible so the user knows how to proceed
- **Geolocation timeout handling** — if the browser takes too long to respond, fall back gracefully
  - Timeout after ~8 seconds
  - Same fallback behavior as denial (Antarctica + toast)

### City Search
- **City search with autocomplete** — type a city name and see matching results from the geocoding API
  - Debounced input (300ms) to avoid hammering the API on every keystroke
  - Dropdown list of matching cities with country/region for disambiguation (e.g., "Portland, OR" vs "Portland, ME")
  - Minimum 2 characters before search triggers
  - Clear button (X) to reset search input
- **City selection** — click a result to load weather for that city
  - Dismiss dropdown on selection
  - Update all weather data, chart, 3D scene, and theme simultaneously
- **Empty input handling** — no search triggered on empty or whitespace-only input
- **No results state** — show a clear message when the search returns no matching cities
- **Click-outside dismissal** — close the dropdown when clicking anywhere outside the search area

### Current Weather Display
- **Current temperature** — large, prominent display of the current temperature
- **Weather condition label** — human-readable condition (e.g., "Partly Cloudy," "Heavy Rain")
- **Humidity** — current relative humidity percentage
- **Wind speed** — current wind speed with appropriate unit (km/h or mph based on °C/°F selection)
- **Feels-like temperature** — apparent temperature accounting for wind chill / heat index
- **Weather condition icon** — icon representing the current condition (sun, cloud, rain, snow, storm)
  - Day/night variant awareness (moon icon for clear nights, sun for clear days)

### 5-Day Forecast
- **Daily forecast cards** — show the next 5 days with day name, weather icon, high temp, and low temp
  - "Today" and "Tomorrow" labels instead of day names for the first two entries
  - Weather icons per day matching the daily condition code
- **High/low temperatures** — clearly distinguished daily maximums and minimums
- **Precipitation probability** — percentage chance of rain/snow per day (if available from API)

### Temperature Trend Chart
- **Visual chart across the forecast period** — display temperature highs and lows over the 5-day period
  - Whatever chart type looks best with the data (line or area)
  - Both high and low temperature lines/areas
  - Day labels on X-axis
  - Temperature values on Y-axis
- **Unit-aware axis labels** — chart updates when toggling °C/°F
- **Tooltip on hover** — show exact temperature values when hovering over a data point

### Unit Toggle (°C / °F)
- **Global temperature unit switch** — single toggle that converts all temperatures across the entire app
  - Current temperature
  - Feels-like temperature
  - Forecast highs and lows
  - Chart values and axis labels
  - Tooltip values
- **Wind speed unit pairing** — °C displays km/h, °F displays mph
- **Persisted preference** — remember the user's unit choice in localStorage so it survives refresh

### Recent Cities
- **Store last 5 searched cities** — save to browser localStorage on each city selection
  - Deduplicate (searching the same city again moves it to the front, doesn't create a duplicate)
  - Cap at 5 entries, oldest drops off
- **Quick-access buttons** — display recent cities as clickable chips/pills near the search bar
  - City name displayed on each chip
  - Clicking loads weather for that city immediately
- **Persist across sessions** — recent cities survive page refresh and browser close

### Dynamic Theming
- **Background and color palette shift based on weather condition** — the entire app's visual mood reflects the current weather
  - Clear/sunny → warm blues, golden accents
  - Cloudy → muted grays, cool tones
  - Rain → deep blue-grays, muted lighting feel
  - Snow → pale whites, light grays
  - Storm → dark, dramatic tones
- **Day/night awareness** — theme adjusts based on time of day (darker palette at night, lighter during day)
- **Smooth transition between themes** — when switching cities, colors transition gracefully (CSS transition on background)

### Dark Mode
- **Manual dark mode toggle** — button in the header to switch between weather-adaptive theme and a dark override
  - Dark mode overrides the weather-based theme with a consistent dark palette
  - Toggle state persisted in localStorage
- **Consistent dark mode styling** — all UI elements (cards, search, text, chart) adapt to dark mode, not just the background

### 3D Weather Scene (Background)
- **Three.js diorama as full background** — a 3D scene sits behind all UI content, reacting to the current weather data
- **Weather-reactive states:**
  - Sunny → golden directional light, blue sky, no clouds, visible sun sphere
  - Cloudy → gray overcast, dense cloud objects, diffused lighting
  - Rainy → particle rain system, dark clouds, muted lighting
  - Snowy → drifting snowflake particles, white fog, soft lighting
  - Night → star particles, moon lighting, dark sky
  - Storm → dark clouds, intense rain particles, flash-like lighting
- **Scene elements** — ground plane, stylized trees, small house (or similar diorama objects) to give depth and charm
- **Smooth transitions** — when switching cities, the 3D scene transitions to the new weather state (lighting, particles, sky color)
- **Responsive canvas** — 3D canvas resizes correctly on window resize
- **Performance-conscious rendering** — capped pixel ratio, reasonable polygon counts, efficient particle systems

### Weather Alerts
- **Display severe weather warnings** — if the API returns active weather alerts for the location, show them prominently
  - Alert type (e.g., "Winter Storm Warning," "Heat Advisory")
  - Alert description/summary
  - Visual distinction (colored banner or card) so alerts stand out from normal weather data
  - Dismissable by the user (but reappears if they search the same location again)

### Loading & Error States
- **Initial loading state** — spinner or skeleton UI while geolocation resolves and weather data loads
- **Search loading state** — visual feedback while autocomplete results are being fetched
- **Weather fetch loading** — indicator when switching cities and waiting for new data
- **Network failure handling** — clear error message if the weather API is unreachable or returns an error
  - "Unable to fetch weather data. Check your connection and try again."
  - Retry option
- **API error handling** — graceful handling of unexpected API responses (malformed data, missing fields)

### Responsive Layout
- **Mobile layout** — stacked single-column layout on small screens
  - Search bar full-width
  - Current weather section stacked
  - Forecast cards in a scrollable row or stacked
  - Chart fills available width
  - 3D scene still renders as background
- **Desktop layout** — wider layout with more horizontal space usage
  - Side-by-side sections where appropriate
  - More breathing room around elements
- **Breakpoint handling** — clean transitions between mobile and desktop (no broken intermediate states)

### Accessibility
- **Keyboard navigation** — all interactive elements (search input, city suggestions, toggle buttons, recent city chips, forecast cards) reachable and operable via keyboard
  - Focus indicators visible on all focusable elements
- **ARIA labels** — descriptive labels on all interactive and dynamic elements
  - Search input labeled
  - 3D scene marked as decorative (role="img" with aria-label)
  - Toggle buttons announce current state
  - Weather data sections labeled for screen readers
- **Color contrast** — text remains legible against all dynamic theme backgrounds
- **Reduced motion consideration** — respect `prefers-reduced-motion` by reducing or disabling 3D scene animations and CSS transitions

## Possible Features

### Search & Location

**Maybe**
- **Current location button** — a "Use my location" icon button near the search bar to re-trigger geolocation without reloading the page
  - Useful if the user initially denied permission, then enabled it in browser settings
- **Search history persistence** — store not just the last 5 cities but also remember the last-viewed city and auto-load it on return visits (instead of re-triggering geolocation every time)

**Stretch**
- **Fuzzy search tolerance** — handle minor typos in city names (e.g., "Londn" → "London")
- **Popular cities quick-start** — on first visit (before any searches), show a grid of 6-8 major world cities as starting points instead of only Antarctica

**Out of the Box**
- **"Surprise me" button** — loads weather for a random interesting location around the world (Reykjavik, Marrakech, Ushuaia, etc.) to showcase the 3D scene variety

### Weather Data Display

**Maybe**
- **Sunrise/sunset times** — display for the current day, useful context and feeds into day/night awareness
- **UV index** — show current UV level with a simple label (Low / Moderate / High / Very High)
- **Pressure** — barometric pressure reading for users who want a bit more detail
- **Visibility distance** — current visibility in km or miles

**Stretch**
- **Hourly breakdown (next 24h)** — a scrollable row of hourly temps and icons beneath the current weather, giving a more granular view of today
  - Hourly temperature, icon, and precipitation probability
  - Horizontal scroll on mobile
- **Wind direction indicator** — a small compass arrow or degree indicator alongside wind speed
- **"Feels like" explanation** — small tooltip explaining why feels-like differs from actual (wind chill vs. heat index)

**Out of the Box**
- **Weather comparison mode** — pick two cities and see their current weather side by side (split screen or overlay)
  - 3D scene shows a split view or toggles between the two

### 3D Scene & Visuals

**Maybe**
- **Time-of-day lighting accuracy** — use the location's actual local time (not the user's browser time) to determine day/night state in the 3D scene
  - Searching "Tokyo" at 10am EST should show nighttime if it's night in Tokyo
- **Transition animations between weather states** — when switching from a sunny city to a rainy one, clouds roll in and rain starts gradually rather than snapping instantly
- **Performance toggle** — let users disable the 3D scene if their device struggles (even though it's always-on by default, having an escape hatch is kind)

**Stretch**
- **Seasonal scene variations** — trees have leaves in summer, bare branches in winter, blossoms in spring
  - Derive season from hemisphere and current month
- **Dynamic cloud density** — more clouds for "overcast" than "partly cloudy," reflecting actual cloud cover percentage from the API
- **Lightning flashes for thunderstorms** — brief white flash in the 3D scene during storm conditions

**Out of the Box**
- **Camera angle shifts** — subtle camera movement when scrolling the page, creating a parallax-like depth effect between the 3D scene and the UI
- **Ambient weather sounds** — subtle rain, wind, or bird chirping audio tied to the weather condition
  - Muted by default, toggle to enable
  - Volume control
- **Fog and mist particles** — for fog weather codes, add a low-lying mist effect in the 3D scene

**Blow Their Mind**
- **Timelapse mode** — animate the 3D scene through the next 24 hours of forecast (sunrise → midday → sunset → night), showing how weather changes over the day
- **Globe navigation** — a miniature 3D globe you can spin to pick a location, which then zooms into the diorama view for that city's weather

### Forecast & Charts

**Maybe**
- **Precipitation chart layer** — overlay precipitation probability as bars or a secondary line on the temperature trend chart
- **Chart type selector** — let the user toggle between line chart, area chart, and bar chart views
- **Daily detail expansion** — click a forecast day card to expand and see more detail (humidity, wind, precipitation, sunrise/sunset for that day)

**Stretch**
- **Extended forecast (10 or 14 days)** — if the API supports it, offer a toggle to extend beyond 5 days
- **Min/max range shading on chart** — fill the area between high and low temps to visualize the daily temperature range

**Out of the Box**
- **Weekly summary sentence** — auto-generate a natural language summary of the week's weather: "Mostly sunny through Wednesday, rain expected Thursday and Friday. Highs in the low 70s."
  - Generated client-side from the forecast data, no AI needed

### Dark Mode & Theming

**Maybe**
- **System preference detection** — auto-enable dark mode if the user's OS is set to dark mode (`prefers-color-scheme: dark`)
  - Manual toggle still overrides system preference
- **Theme persistence across visits** — remember whether the user was in dark mode or weather-adaptive mode

**Stretch**
- **High contrast mode** — an accessibility-focused theme with maximum contrast ratios, bold borders, and no transparency effects
- **Custom accent color** — let the user pick an accent color that tints the UI while keeping weather-adaptive backgrounds

### Alerts & Notifications

**Maybe**
- **Alert severity levels** — visually distinguish between watches, warnings, and advisories (yellow / orange / red)
- **Alert link-through** — link to the full alert text from the national weather service or source authority
- **Multiple alerts stacking** — if a location has more than one active alert, stack them or show a count with expand/collapse

**Stretch**
- **Alert history** — show recently expired alerts for context ("Winter Storm Warning expired 2 hours ago")

**Out of the Box**
- **Push notifications for saved cities** — if the user opts in, send browser push notifications when severe weather alerts are issued for their recent cities
  - Requires service worker registration
  - Opt-in prompt, not default-on

### Performance & Technical Polish

**Maybe**
- **Service worker for offline support** — cache the last-viewed city's weather data so the app shows something useful even without a network connection
  - "Last updated X minutes ago" indicator
  - Banner indicating offline state
- **Skeleton loading screens** — instead of a spinner, show placeholder shapes that match the layout (skeleton cards, skeleton chart) for perceived performance
- **API response caching** — cache weather responses for 10-15 minutes to avoid redundant API calls when switching between recent cities

**Stretch**
- **Bundle splitting** — lazy-load the Three.js 3D scene so the core weather data renders first, then the 3D scene fades in once loaded
  - Reduces initial load time significantly
  - Show a subtle shimmer/placeholder where the 3D scene will appear
- **Image/asset preloading** — preload weather icons and fonts to prevent layout shifts

### Sharing & Export

**Stretch**
- **Share current weather** — a "Share" button that copies a formatted text snippet or generates a shareable link with the city pre-loaded (e.g., `nimbus.app/?city=Tokyo`)
  - URL-based city routing via query parameters
- **Screenshot/export** — capture the current view (3D scene + weather data) as a downloadable image
  - Uses canvas-to-image for the 3D scene

**Blow Their Mind**
- **Social preview cards** — when sharing a Nimbus link, generate a dynamic Open Graph image showing the current weather + 3D scene snapshot so the preview in Slack/Twitter/iMessage looks beautiful
  - Requires a lightweight serverless function to render the OG image

### Personality & Delight

**Maybe**
- **Weather-appropriate greeting** — a subtle line at the top: "Perfect day for a walk" / "Don't forget your umbrella" / "Bundle up out there"
  - Derived from weather code, not AI-generated
- **Antarctica Easter egg** — when showing the geolocation-denied default, add a fun touch (penguin in the 3D scene, playful copy like "Well, here we are in Antarctica")

**Stretch**
- **Animated number transitions** — when temperature values change (city switch or unit toggle), numbers count up/down to the new value instead of snapping
- **Micro-interactions on forecast cards** — subtle hover effects, slight lift, or icon animation on the daily forecast cards

**Out of the Box**
- **Achievement system** — lighthearted badges for exploring weather: "Checked 10 cities," "Found a place below -30°," "Visited all 7 continents"
  - Stored in localStorage
  - Small badge icon in the corner, expandable to see collection

**Blow Their Mind**
- **"What to wear" suggestion** — based on temperature, wind, and precipitation, suggest outfit layers: "T-shirt weather" / "Light jacket + umbrella" / "Heavy coat, gloves, hat"
  - Simple rule-based logic, no AI needed
  - Could include a small illustrated outfit icon
