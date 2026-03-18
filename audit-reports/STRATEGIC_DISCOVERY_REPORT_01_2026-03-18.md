# Strategic Discovery Report — Run 01

**Date:** 2026-03-18
**Branch:** `nightytidy/run-2026-03-18-1312`
**App:** Nimbus Weather (React 19 + Three.js + Open-Meteo, pure client-side)
**Type:** Read-only analysis — no code changes
**Tests:** 270 tests, 29 files — all passing (verified, no changes made)

---

## 1. Product Profile

### What Nimbus Is

Nimbus is a **portfolio-grade client-side weather application** built with React 19, TypeScript 5.9, Three.js, and the Open-Meteo API. It displays current weather conditions and a 6-day forecast for any city worldwide, wrapped in an emotionally-driven visual experience: a full-screen 3D diorama background (rain particles, snow, clouds, trees, a small house) that reacts to real-time weather conditions, paired with 16 dynamic color themes (8 weather conditions x day/night) applied through CSS custom properties.

The app runs entirely in the browser with zero backend, zero API keys, and zero authentication. It's deployed as a static site on Netlify.

### Target Users

Based on UI copy, feature set, and design language:

- **Primary:** Hiring managers and technical reviewers evaluating the developer's frontend skills. The app exists to showcase React, TypeScript, Three.js, accessibility, performance, and design polish.
- **Secondary:** Casual weather checkers who want a visually beautiful, ad-free, privacy-respecting weather experience.
- **Tertiary:** Developers exploring the codebase as a learning reference for React + Three.js integration patterns.

### Core Features Inventory

| # | Feature | Implementation Quality |
|---|---------|----------------------|
| 1 | City search with autocomplete | Excellent — debounced, keyboard-navigable, ARIA combobox pattern |
| 2 | Current weather display | Excellent — temp, feels like, humidity, wind speed |
| 3 | 6-day forecast grid | Good — responsive, shows high/low/precipitation/icon |
| 4 | Temperature trend chart | Good — Recharts area chart with accessible hidden table |
| 5 | 3D weather scene | Good — rain/snow particles, clouds, diorama, day/night |
| 6 | 16 dynamic weather themes | Excellent — CSS custom properties, smooth transitions |
| 7 | Dark mode toggle | Excellent — persisted, system preference detection on first visit |
| 8 | Celsius/Fahrenheit toggle | Excellent — persisted, also converts wind speed to mph |
| 9 | Recent cities (up to 5) | Good — chips with hover-prefetch for instant switching |
| 10 | Geolocation with fallback | Good — Antarctica fallback with explanatory toast |
| 11 | Skeleton loading states | Good — shows card shapes during initial load |
| 12 | Error handling | Good — error card with retry, toast for geo errors |
| 13 | Accessibility | Excellent — WCAG 2.1 AA compliant, reduced motion support |
| 14 | Alert banner component | Built but unused — Open-Meteo free tier has no alert data |

### Strengths

1. **Visual design polish**: The glassmorphism design system, dynamic theming, and 3D background create an emotional experience rare in weather apps — and even rarer in portfolio projects.
2. **Accessibility depth**: Full ARIA combobox, skip links, `aria-live` regions, screen-reader-accessible chart data, reduced motion support. This exceeds what most production weather apps achieve.
3. **Code quality**: Strict TypeScript, comprehensive tests (97 across 10 files), clean separation of concerns, memoized context, proper cleanup patterns.
4. **Performance**: Skeleton loading, stale-while-revalidate city switching, prefetch on hover, debounced search, DPR-capped WebGL, code-split Three.js chunk.
5. **Privacy**: No tracking, no analytics, no ads, no API keys, no cookies — just localStorage for preferences.

### Weaknesses

1. **Limited weather data**: Only shows temperature, feels like, humidity, wind speed, and precipitation probability. Open-Meteo offers 50+ additional parameters (UV index, sunrise/sunset, air quality, visibility, pressure, dew point, etc.) that are not utilized.
2. **No hourly forecast**: Only daily data — users can't see hour-by-hour changes, which is the most common use case for checking weather.
3. **No offline support**: No service worker, no PWA manifest. The app is completely non-functional offline.
4. **No shareable state**: No URL routing for cities. Users can't share "weather in Tokyo" with a friend via link.
5. **Alert system is a shell**: `AlertBanner` component is fully built but `alerts` array is always empty because Open-Meteo free tier lacks alert data.
6. **3D scene is atmosphere only**: Beautiful but doesn't convey information. The scene could be leveraged to communicate weather data visually.
7. **No weather maps or radar**: Competitors universally offer interactive maps. Nimbus has none.
8. **Single-language**: 82+ hardcoded English strings with no i18n framework.

### Monetization Model

**None.** This is a portfolio project with no billing, subscriptions, feature gating, or ads. Open-Meteo is free for non-commercial use.

---

## 2. Competitive Landscape

### Competitor Matrix

| Competitor | Overlap | Unique Strengths | Weaknesses | Pricing |
|-----------|---------|-----------------|------------|---------|
| **The Weather Channel** | Current + forecast, city search | MinuteCast radar, 10-day forecast, alerts, news integration, 100M+ users | Heavy ads, privacy concerns (location data selling), bloated UI | Free + ads; Premium $4.99/mo |
| **AccuWeather** | Current + forecast, city search | MinuteCast (minute-by-minute precip), 15-day forecast, air quality, lifestyle indices | Caught selling location data (2017), aggressive ads | Free + ads; Premium $3.99/mo |
| **Windy.com** | Current conditions, forecast | 50+ weather maps, multi-model comparison, aviation/marine data, animated wind visualization, free without ads | Complex UI — not beginner-friendly | Free (no ads); Premium €1.99/mo |
| **Carrot Weather** | Current + forecast, beautiful UI | Personality/humor system, health weather tracking (allergies, arthritis), Apple Watch | Expensive, iOS/Mac only | $5/mo or $20/year |
| **Weather Underground** | Current + forecast, city search | Hyper-local via personal weather stations, "Smart Forecast" activity recommendations, community-driven | Aging UI, declining station network | Free + ads; Premium $2/mo |
| **YR.no** | Current + forecast, clean UI | Norwegian meteorological accuracy, no ads, open data, clean design | Coarse outside Norway, limited features | Free (no ads) |
| **Apple Weather** | Current + forecast, beautiful UI | Native iOS integration, Dark Sky acquisition data, minute-by-minute precipitation | iOS-only, limited customization | Free (built into iOS) |
| **OpenWeatherMap** | API-based, similar developer audience | Massive API ecosystem, weather maps, historical data, 60+ satellite layers | Web app is basic, aimed at developers not consumers | Free tier; Paid API from $0 |
| **Acme Weather** | Beautiful UI, forecast display | Forecast uncertainty visualization (confidence ranges), from Dark Sky founders, multi-source data | iOS-only, $25/year, new/unproven | $25/year |
| **Overdrop** | Beautiful UI, weather display | 70+ widgets, 12 immersive animated themes, multiple data providers, privacy-first | Premium for full features, Android-focused | Free + ads; Premium |
| **Weawow** | Weather display, privacy-first | Real photography backgrounds, swappable data sources, community-driven, 4.9-star rating | Less polished UI, photo quality varies | Free (donation-supported, no ads) |

### What Competitors Offer That Nimbus Doesn't

| Feature | Who Has It | Table Stakes? |
|---------|-----------|---------------|
| Hourly forecast | Everyone | Yes |
| Weather maps/radar | Weather Channel, AccuWeather, Windy, WU | Yes for serious use |
| Severe weather alerts | Everyone except YR.no | Yes |
| Sunrise/sunset times | Everyone | Yes |
| UV index | AccuWeather, Weather Channel, Windy | Becoming standard |
| Air quality/pollen | AccuWeather, Windy, Weather Channel | Growing expectation |
| 10-14 day forecast | AccuWeather (15-day), Weather Channel (10-day) | Common expectation |
| Minute-by-minute precipitation | AccuWeather, Apple Weather | Differentiator |
| Weather widgets (homescreen/embed) | Carrot, Weather Channel, AccuWeather | Common expectation |
| Offline/PWA support | Some mobile apps | Emerging expectation |
| Share/link to city weather | Everyone with URL routing | Yes for web apps |
| Multi-location dashboard | Carrot, Weather Channel, AccuWeather | Common expectation |

### What Nimbus Does Better Than Competitors

1. **Privacy by architecture**: Not just a policy — there is literally no server to collect data. Stronger privacy story than even privacy-focused competitors like Carrot Weather or Weawow. The Weather Channel and AccuWeather have both been caught selling location data.
2. **3D diorama experience**: After comprehensive research, **no consumer-facing weather app** uses a Three.js/R3F 3D diorama scene as atmospheric background. The 3D weather space is dominated by developer tutorials/demos (Codrops R3F weather tutorial) or enterprise mapping products (MapTiler, WeatherLayers). Nimbus's approach is genuinely novel in the market.
3. **Dynamic theming depth**: 16 weather-time theme combinations is more comprehensive than most competitors. Only Overdrop (12 themes) and Carrot Weather (new "Sky" layout) approach this level of atmospheric responsiveness.
4. **Accessibility**: WCAG 2.1 AA compliance is rare among weather apps. YR.no's high-contrast design and The Weather Gods' VoiceOver optimization are the closest competitors.
5. **Zero friction**: No API keys, no account, no permissions nagging, no subscriptions. Only YR.no and Weawow match this frictionless experience.
6. **Performance**: Skeleton loading, hover-prefetch, stale-while-revalidate — techniques not commonly seen in weather web apps.

### Market Trends

1. **Privacy as a feature**: Post-GDPR/CCPA, users increasingly value privacy. Reddit threads consistently recommend ad-free, privacy-respecting alternatives.
2. **AI-powered weather**: Natural language summaries ("You'll need an umbrella after 3pm"), smart activity recommendations, and personalized alerts are emerging.
3. **Air quality integration**: Growing awareness of wildfire smoke, pollen, and pollution has made AQI a near-table-stakes feature.
4. **Hyper-local and minute-level data**: AccuWeather's MinuteCast and Apple Weather's minute-by-minute precipitation have raised the bar.
5. **Design-forward weather**: Apps like Carrot Weather and numerous Behance/Dribbble concepts prove users want weather apps that are *beautiful*, not just functional.
6. **PWA adoption**: 18.9% of sites now use service workers (2025 HTTP Archive). Offline capability is increasingly expected.
7. **Forecast uncertainty transparency**: Acme Weather (launched Feb 2026 by Dark Sky's original creators) pioneered showing confidence ranges instead of false precision. Users increasingly demand honesty about forecast limitations.
8. **Subscription fatigue**: Users resist paying for weather data they view as a public utility. Free, ad-free apps (Weawow, YR.no) are gaining loyalty against subscription-heavy incumbents.

---

## 3. Feature Opportunities

### Priority: Critical

| # | Feature | User Need | Competitive Context | Complexity | Effort |
|---|---------|-----------|-------------------|-----------|--------|
| 1 | **Hourly forecast (24h)** | "What's the weather this afternoon?" — the #1 reason people check weather | Every single competitor has this. Open-Meteo provides hourly data on the free tier — confirmed. | Low — API endpoint already supports `hourly` param; just add `hourly=temperature_2m,precipitation_probability,weather_code` to existing call. Add a new scrollable card component | Medium (1-2 weeks) |
| 2 | **Sunrise/sunset display** | Basic context for day planning; currently only `isDay` boolean used | Universal feature. Open-Meteo daily response includes `sunrise` and `sunset`. | Low — just add to API params and display | Small (2-3 days) |
| 3 | **URL-based city routing** | Shareable links ("here's the weather in Tokyo") | Every web-based competitor has URL routing | Medium — needs a client-side router or hash-based routing | Medium (1 week) |

### Priority: High

| # | Feature | User Need | Competitive Context | Complexity | Effort |
|---|---------|-----------|-------------------|-----------|--------|
| 4 | **UV index display** | Sun safety, especially for outdoor activities | AccuWeather, Weather Channel, Windy all show UV | Low — Open-Meteo daily provides `uv_index_max` | Small (1-2 days) |
| 5 | **Air quality index (AQI)** | Health-conscious users, wildfire smoke awareness | AccuWeather, Windy have AQI. Growing user expectation | Medium — requires separate Open-Meteo Air Quality API call | Medium (1-2 weeks) |
| 6 | **PWA with offline support** | Checking weather without network (commute, travel) | Mobile-first expectation; 18.9% of web apps have service workers | Medium — needs manifest + service worker + cache strategy | Medium (1-2 weeks) |
| 7 | **Extended forecast (10-14 days)** | Trip planning, event planning | AccuWeather: 15 days, Weather Channel: 10 days. Open-Meteo supports up to 16 days | Low — change `forecast_days` param from 6 to 14 | Small (2-3 days) |
| 8 | **Weather detail cards** | Atmospheric pressure, dew point, visibility, cloud cover | Common in serious weather apps. Open-Meteo provides all of these | Low — add API params and display components | Small (3-5 days) |

### Priority: Medium

| # | Feature | User Need | Competitive Context | Complexity | Effort |
|---|---------|-----------|-------------------|-----------|--------|
| 9 | **Multi-city dashboard** | Tracking weather in multiple locations simultaneously | Carrot Weather, Weather Channel | Medium — needs UI for managing saved locations, parallel API calls | Medium (2 weeks) |
| 10 | **Natural language weather summary** | "Do I need an umbrella?" instead of parsing numbers | Carrot Weather (humor), emerging AI trend | High — needs an LLM API call or clever template system | Medium (1-2 weeks) |
| 11 | **Weather-appropriate dressing suggestion** | "What should I wear?" | Some apps have clothing recommendations | Medium — rule-based system using temp + wind + precip | Small (3-5 days) |
| 12 | **Precipitation timeline** | When exactly will it rain? | AccuWeather MinuteCast, Apple Weather | Medium — needs hourly precipitation data visualization | Medium (1-2 weeks) |
| 13 | **Performance/3D toggle** | Users on low-end devices, battery saving | Documented as "not implemented" in CLAUDE.md | Low — conditional rendering based on preference | Small (1-2 days) |
| 14 | **Wind direction visualization** | Understanding wind patterns visually | Windy.com's core feature (animated wind map) | Medium — compass rose or animated indicator | Small (3-5 days) |

### Priority: Nice-to-Have

| # | Feature | User Need | Competitive Context | Complexity | Effort |
|---|---------|-----------|-------------------|-----------|--------|
| 15 | **Weather comparisons** | "Is it warmer in Tokyo or London right now?" | Unique differentiator — no major app does this well | Medium — needs side-by-side layout and dual API calls | Medium (1-2 weeks) |
| 16 | **Antarctica Easter egg** | Delight for the geo-denied fallback | Listed in CLAUDE.md as stretch feature | Low — add penguin model to DioramaObjects when location is Antarctica | Small (2-3 days) |
| 17 | **Animated number transitions** | Polish and delight | Listed as stretch feature | Low — CSS/Framer Motion counter animation | Small (1-2 days) |
| 18 | **Weather-appropriate greeting** | Emotional connection ("Beautiful sunny morning!") | Listed as stretch feature | Low — template strings based on condition + time | Small (1 day) |
| 19 | **Historical weather comparison** | "Is this warmer than usual for March?" | Weather Underground has historical data | High — needs Open-Meteo Historical API, complex visualization | Large (3-4 weeks) |
| 20 | **Pollen/allergy tracker** | Seasonal allergy sufferers | Carrot Weather, AccuWeather | Medium — Open-Meteo Air Quality API includes pollen | Medium (1-2 weeks) |

---

## 4. Untapped Data & Intelligence

### Open-Meteo Data Currently Unused

The app currently requests only 6 current parameters and 4 daily parameters. Open-Meteo provides **100+ parameters for free**. Key untapped data:

| Data Available | Currently Used? | Value if Surfaced |
|----------------|----------------|-------------------|
| Hourly temperature/conditions | No | Critical — #1 missing feature |
| Sunrise/sunset | No | High — basic user expectation |
| UV index (daily max) | No | High — health/safety feature |
| Precipitation sum (daily) | No | Medium — total rainfall amount |
| Wind gusts | No | Medium — severe weather awareness |
| Wind direction | No | Medium — outdoor activity planning |
| Cloud cover percentage | No | Low — nice detail |
| Surface pressure | No | Low — weather enthusiasts |
| Dew point | No | Low — comfort assessment |
| Visibility | No | Medium — driving/flying conditions |
| Sunshine duration (daily) | No | Low — nice stat for day summary |
| Snow depth | No | Medium — winter sports users |
| Soil temperature/moisture | No | Low — gardening niche |
| **Air Quality API (separate endpoint)** | No | High — PM2.5, PM10, ozone, pollen |

### Analytics & Insights Opportunities

**Currently collected data:**
- Recent cities (up to 5, stored in localStorage)
- Unit preference (Celsius/Fahrenheit)
- Dark mode preference

**Insight opportunities from existing data:**
1. **"Weather at a glance" for all saved cities**: Show a mini-card with current temp for each recent city, not just the active one.
2. **Smart unit detection**: Auto-detect unit preference based on the first city searched (e.g., US cities → Fahrenheit).
3. **Time-of-day awareness**: Show "Good morning" / "Good evening" greetings based on the location's timezone (already available in API response).

### Personalization Opportunities (Needs Validation)

These would require expanding localStorage or introducing optional user accounts:
- Favorite activities (running, cycling, gardening) → activity-specific weather ratings
- Notification preferences for weather thresholds ("Alert me if rain probability > 70%")
- Home vs. travel location distinction

---

## 5. Integration & Ecosystem Opportunities

### Third-Party Integrations Worth Building

| Integration | Value | Complexity | Priority |
|-------------|-------|-----------|----------|
| **Web Share API** | Share weather with friends via native OS share sheet | Low — `navigator.share()` is a few lines | High |
| **Open-Meteo Air Quality API** | AQI, PM2.5, PM10, ozone, pollen data | Medium — second API call, new data model | High |
| **Open-Meteo Marine API** | Wave height, ocean temp for coastal cities | Medium — conditional display for coastal locations | Low |
| **Geolocation → timezone greeting** | "Good morning from Tokyo!" using the `timezone` field already returned | Very low — already have the data | Medium |
| **Calendar integration (ICS export)** | "Export this week's forecast to your calendar" | Medium — generate .ics file from daily data | Nice-to-have |
| **Browser Notification API** | Push notifications for severe weather changes | Medium — needs service worker (pairs with PWA) | Medium |

### API/Platform Possibilities (Needs Validation)

As a portfolio project, platform plays are less relevant, but for portfolio *impact*:
- **Embeddable widget**: A `<nimbus-weather>` web component that other developers can embed. Showcases Web Components knowledge.
- **Open-source component library**: Extract the glassmorphism design system, 3D weather scenes, or weather code mapping as reusable npm packages.

---

## 6. AI Integration Roadmap

### Quick AI Wins (Client-Side Only)

| # | Opportunity | Impact | Feasibility | Notes |
|---|------------|--------|-------------|-------|
| 1 | **Template-based weather summaries** | Medium | Very High | Not real AI — rule-based templates like "Warm and sunny, perfect for outdoor activities. UV is high, wear sunscreen." Based on condition + temp + UV + wind |
| 2 | **Smart activity recommendations** | Medium | High | Rule engine: `if temp > 15 && precip < 20% → "Good for running"`. No AI needed, but feels intelligent |
| 3 | **Clothing suggestions** | Medium | High | Same approach: temp ranges + precipitation + wind → clothing icons/labels |

### Larger AI Initiatives (Would Require Backend/API Key)

| # | Opportunity | Impact | Feasibility | Notes |
|---|------------|--------|-------------|-------|
| 4 | **LLM-generated weather narrative** | High | Medium | Call an LLM API (Claude, GPT) with current weather data → get a natural language 2-3 sentence summary. Would require an API key (breaks "no backend" constraint) or a free-tier LLM endpoint |
| 5 | **Conversational weather queries** | High | Low | "Will it rain tomorrow afternoon?" → parse intent → answer from available data. Heavy lift for a portfolio project |
| 6 | **Smart alerts** | Medium | Low | ML model predicting weather threshold crossings. Overkill for this project |

### Recommendation

Focus on **template-based intelligence** (items 1-3). These create the *perception* of AI/smart features without requiring external services, preserving the zero-backend architecture. The template approach is:
- 100% client-side
- Zero latency
- Privacy-preserving
- Deterministic and testable
- Still impressive in a portfolio context

---

## 7. Architectural Recommendations

### Scalability Assessment

**Context:** Nimbus is a static site served via Netlify CDN with all API calls going directly from the browser to Open-Meteo. There is no backend to scale.

| Concern | Risk Level | Notes |
|---------|-----------|-------|
| CDN static hosting | None | Netlify handles any user volume |
| Open-Meteo API rate limits | Low | Free tier is 10,000 calls/day. With caching, this supports ~5,000 daily active users |
| Bundle size (1,474 KB / 411 KB gzip) | Medium | Three.js is 60%+ of the bundle. Already code-split, but still heavy for low-bandwidth users |
| WebGL device support | Low | Error boundary catches WebGL failures gracefully |
| localStorage limits | None | <1KB stored, well within browser limits |

### Bundle Size Opportunity

The Three.js dependency is the heaviest cost:
- `three` chunk: ~800KB raw / ~250KB gzip
- `recharts` chunk: ~300KB raw / ~80KB gzip
- App code: ~374KB raw / ~81KB gzip

**Options to reduce (needs validation):**
1. **Lazy-load 3D scene after first paint**: Already partially done (SceneContent is lazy). Could further defer the entire Three.js import until after weather data renders.
2. **Optional 3D**: A "Performance mode" toggle (listed in CLAUDE.md as not implemented) that skips Three.js entirely would save ~250KB gzip for users who prefer speed.
3. **Replace Recharts with lightweight chart**: Recharts adds ~80KB gzip. A custom SVG chart or a lighter library (e.g., uPlot at ~8KB) could save 90%.

### Platform/Extensibility Opportunities

| Opportunity | Impact on Portfolio | Complexity |
|-------------|-------------------|-----------|
| **Embeddable weather widget** (Web Component) | High — demonstrates Web Components mastery | Medium |
| **Configurable theme API** | Medium — "bring your own color scheme" | Low |
| **Plugin system for data sources** | Low — overengineered for this project | High |

### Technical Investments That Unlock Future Capabilities

1. **Client-side router (or hash routing)**: Unlocks URL-based city sharing, deep linking, multi-page layout (maps page, settings page).
2. **Service worker + PWA manifest**: Unlocks offline support, install-to-homescreen, push notifications.
3. **Abstract data layer**: Currently, `api.ts` is tightly coupled to Open-Meteo. An adapter pattern would allow swapping data sources (e.g., adding OpenWeatherMap as a fallback) — but this is YAGNI unless data source flexibility becomes a real need.

---

## 8. Recommended Roadmap

### This Quarter (Immediate — Weeks 1-6)

These are high-impact, low-effort changes that address the most glaring competitive gaps:

| # | Item | Effort | Impact | Dependencies |
|---|------|--------|--------|-------------|
| 1 | **Add sunrise/sunset to daily data** | 2-3 days | High — table stakes feature, zero extra API calls needed | None |
| 2 | **Add UV index to daily data** | 1-2 days | High — health/safety feature, same API call | None |
| 3 | **Add hourly forecast (24h)** | 1-2 weeks | Critical — #1 missing feature, most common user need | None |
| 4 | **Add weather detail cards** (pressure, visibility, dew point, wind gusts/direction) | 3-5 days | Medium — depth of information | None |
| 5 | **Performance/3D toggle** | 1-2 days | Medium — battery/device accessibility | None |
| 6 | **Template-based weather summaries** | 3-5 days | Medium — "smart" feeling without AI dependency | None |

### Next Quarter (Weeks 7-14)

Strategic features that build on the foundation:

| # | Item | Effort | Impact | Dependencies |
|---|------|--------|--------|-------------|
| 7 | **URL-based city routing** | 1 week | High — enables sharing, deep linking | None |
| 8 | **PWA + service worker** | 1-2 weeks | High — offline support, installable | None |
| 9 | **Extended forecast (10-14 days)** | 2-3 days | Medium — common user expectation | None |
| 10 | **Air quality index (AQI)** | 1-2 weeks | High — health feature, growing expectation | None |
| 11 | **Web Share API integration** | 1-2 days | Medium — native sharing, pairs with URL routing | #7 (URL routing) |
| 12 | **Multi-city mini-dashboard** | 1-2 weeks | Medium — power user feature | None |

### Future (Quarter 3+)

Longer-term strategic bets and polish features:

| # | Item | Effort | Impact | Dependencies |
|---|------|--------|--------|-------------|
| 13 | **Precipitation timeline visualization** | 1-2 weeks | Medium — differentiator if done well | #3 (hourly data) |
| 14 | **Pollen/allergy tracker** | 1-2 weeks | Medium — niche but valued audience | #10 (AQI infrastructure) |
| 15 | **Embeddable weather widget** | 2-3 weeks | High portfolio impact — Web Components showcase | #7 (URL routing) |
| 16 | **i18n framework** | 2-3 weeks | Medium — demonstrates production readiness | None |
| 17 | **Weather comparison mode** | 1-2 weeks | Medium — unique differentiator | None |
| 18 | **Historical weather comparison** | 3-4 weeks | Low — complex, niche appeal | Open-Meteo Historical API |
| 19 | **Antarctica Easter egg** | 2-3 days | Low — delight feature | None |
| 20 | **Animated number transitions** | 1-2 days | Low — polish | None |

### Key Dependencies

```
Hourly forecast (#3) → Precipitation timeline (#13)
AQI integration (#10) → Pollen tracker (#14)
URL routing (#7) → Web Share (#11) → Embeddable widget (#15)
PWA (#8) → Push notifications (future)
```

---

## Appendix A: Open-Meteo API Parameters Available But Unused

### Current Weather (6 of 15 used)

**Used:** `temperature_2m`, `apparent_temperature`, `relative_humidity_2m`, `wind_speed_10m`, `weather_code`, `is_day`

**Unused but valuable:**
- `precipitation` — current precipitation amount
- `rain` / `showers` / `snowfall` — precipitation type breakdown
- `cloud_cover` — percentage cloud coverage
- `pressure_msl` — sea level pressure
- `surface_pressure` — surface pressure
- `wind_direction_10m` — wind direction in degrees
- `wind_gusts_10m` — wind gust speed

### Daily (4 of 30+ used)

**Used:** `weather_code`, `temperature_2m_max`, `temperature_2m_min`, `precipitation_probability_max`

**Unused but valuable:**
- `sunrise` / `sunset` — sunrise and sunset times
- `uv_index_max` — maximum UV index
- `precipitation_sum` — total precipitation
- `wind_speed_10m_max` — maximum wind speed
- `wind_gusts_10m_max` — maximum wind gusts
- `wind_direction_10m_dominant` — dominant wind direction
- `daylight_duration` / `sunshine_duration` — hours of daylight/sunshine
- `shortwave_radiation_sum` — solar radiation

### Hourly (0 of 40+ used)

The entire hourly endpoint is unused. Key parameters:
- `temperature_2m` — hourly temperature
- `precipitation_probability` — hourly rain chance
- `precipitation` — hourly rainfall amount
- `weather_code` — hourly condition
- `visibility` — hourly visibility
- `cloud_cover` — hourly cloud coverage
- `wind_speed_10m` / `wind_direction_10m` — hourly wind

### Separate Endpoints (0 used)

- **Air Quality API**: PM2.5, PM10, CO, NO2, SO2, O3, pollen (birch, grass, ragweed, alder, mugwort, olive)
- **Marine API**: Wave height, wave direction, wave period, ocean temperature
- **Historical API**: Past weather data for any date range
- **Elevation API**: Elevation data for coordinates

---

## Appendix B: Competitive Research Sources

Research was conducted using web searches across the following domains:
- Weather app review sites (Tom's Guide, CNET, top10.com)
- User feedback platforms (Reddit, MacRumors Forums, PissedConsumer, Trustpilot)
- Design showcases (Behance, Dribbble, Designmodo, Hongkiat)
- Developer resources (Codrops, GitHub, npm)
- Industry analysis (ForecastWatch, HTTP Archive Web Almanac)
- Competitor sites (weather.com, accuweather.com, windy.com, yr.no, open-meteo.com)

---

## Appendix C: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Open-Meteo rate limit hit (10K/day) | Low | High — app stops working | Add client-side rate limiting, longer cache TTLs |
| Open-Meteo service outage | Low | High — app shows error state | Add a second data source (e.g., OpenWeatherMap fallback) — YAGNI for now |
| Three.js bundle size alienating low-bandwidth users | Medium | Medium — slow load, poor FCP | Implement performance toggle to skip 3D scene |
| Feature creep diluting portfolio focus | Medium | Medium — less impressive if overloaded | Prioritize depth over breadth; 5 polished features > 20 half-built ones |
| Browser WebGL incompatibility | Low | Low — error boundary already handles this | Already mitigated |
