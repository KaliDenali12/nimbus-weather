# User Journey for Nimbus

## Executive Summary

Nimbus is a web-based weather app that replaces flat data readouts with an immersive, visually rich experience — dynamic theming, a 3D weather diorama, and clean data presentation. The core journey is deliberately short: open the app, absorb the weather through visuals and data, and close it. The entire experience should take under 30 seconds.

## 1. User Personas

### Primary User: The Design-Conscious Weather Checker
- **Who they are:** Someone who checks weather daily, appreciates good design, and would switch apps purely because one is more beautiful
- **Their goal:** Know what the weather is — fast — in a way that actually feels like the weather
- **Their pain point:** Every weather app they've used is either ugly, cluttered with ads, or emotionally flat
- **Technical comfort:** Moderate — comfortable with web apps, not necessarily technical

### Secondary User: The Hiring Manager / Portfolio Reviewer
- **Who they are:** Engineering lead or hiring manager evaluating frontend skill
- **Their goal:** Assess the builder's craft — design taste, technical range, attention to detail
- **Their pain point:** Most portfolio projects are tutorial clones or half-finished demos
- **Technical comfort:** High — they'll inspect the code, test edge cases, resize the browser

## 2. Basic User Journey

1. User receives a shared link (portfolio, social media, direct message)
2. App loads and immediately requests geolocation
3. Weather data and 3D scene render for the user's location
4. User absorbs the visual atmosphere and scans the data
5. User optionally searches another city, toggles units, or enables dark mode
6. User closes the tab
7. User returns later — geolocation re-detects, recent cities are still available

## 3. Detailed User Journey

### Stage 1: Arrival (0–2 seconds)

**User Goal:** See the weather for where I am, right now.

1. User clicks a link to Nimbus (shared via portfolio, social media, or direct message)
2. App loads — the browser requests geolocation permission
3. While waiting for geolocation + API response, the user sees a loading state (spinner or skeleton UI)
4. **If geolocation is granted:** weather data and 3D scene render for the user's current location
5. **If geolocation is denied:** a toast explains that location access was blocked, and the app defaults to Antarctica — showcasing the snow 3D scene and injecting personality immediately

**Emotional State:** Curiosity ("someone shared this with me") → mild impatience during loading → surprise/delight when the full scene renders

**Potential Friction:**
- Geolocation prompt can feel intrusive — but there's no way around it for auto-detect, and the Antarctica fallback keeps things moving
- Slow geolocation response (>3 sec) could feel broken — timeout at 8 seconds with graceful fallback prevents a dead screen
- If the user is on a VPN, geolocation may return an unexpected location — recent cities and search let them correct quickly

### Stage 2: First Impression (2–5 seconds)

**User Goal:** Understand what I'm looking at and feel something.

1. The 3D weather scene fills the background — rain particles, golden sunlight, drifting snow, or stars depending on conditions
2. The dynamic color theme wraps the entire UI in the mood of the current weather
3. The user's city name and current temperature are immediately visible and large
4. The user absorbs the atmosphere before consciously reading any data — this is the key differentiator

**Emotional State:** "This is beautiful" → "Oh, it actually shows the weather visually" → "This is way better than my weather app"

**Potential Friction:**
- If text contrast is poor against the 3D background, the data becomes unreadable — glass-morphism cards with backdrop blur solve this
- If the 3D scene is too busy, it competes with the data instead of supporting it — scene should be atmospheric, not distracting
- On low-end mobile devices, a heavy 3D scene could stutter — capped pixel ratio and reasonable particle counts keep it smooth

### Stage 3: Data Scan (5–15 seconds)

**User Goal:** Get the actual information I came for.

1. User reads current temperature, condition, humidity, and wind speed
2. User glances at the 5-day forecast — highs, lows, icons, precipitation probability
3. User optionally looks at the temperature trend chart for the week's trajectory
4. If severe weather alerts exist, they're displayed prominently and the user reads them
5. The user now has everything they need

**Emotional State:** Satisfaction — the data is clean, legible, and organized. No ads. No clutter. No upsells.

**Potential Friction:**
- If the data layout is confusing or requires scrolling to find basics, the "glance and go" promise breaks — critical data (temp, condition, forecast) must be above the fold on all screen sizes
- If units default to something unexpected (Celsius for a US user), it creates a small moment of confusion — unit preference persists in localStorage after first toggle

### Stage 4: Exploration (optional, 15–30 seconds)

**User Goal:** Check weather for another place, or adjust preferences.

1. User types a city name in the search bar
2. Autocomplete dropdown shows matching cities with country/region for disambiguation
3. User selects a city — the entire app transitions: background theme shifts, 3D scene changes weather state, data updates
4. The searched city is saved to recent cities (visible as quick-access chips)
5. User may toggle °C/°F or enable dark mode
6. User may check 1-2 more cities using recent city chips

**Emotional State:** Playfulness — switching cities and watching the 3D scene transform is genuinely fun. This is where the "hey, check out this weather app" moment lives.

**Potential Friction:**
- If autocomplete is slow or results are ambiguous ("Portland" without state/country), the search feels broken — debounced input + region labels solve this
- If the theme/scene transition is jarring (instant snap rather than smooth shift), it breaks the magic — CSS transitions on colors and gradual 3D state changes maintain immersion
- If recent cities don't persist across sessions, returning users lose their shortcuts — localStorage handles this

### Stage 5: Exit (< 1 second)

**User Goal:** Done. Close the tab.

1. User closes the tab or navigates away
2. No action required — there's no save button, no account, no "are you sure?" prompt
3. Preferences (unit choice, dark mode, recent cities) are silently persisted in localStorage

**Emotional State:** Quiet satisfaction. The interaction was fast, pleasant, and complete. Nothing was asked of them.

### Stage 6: Return Visit (next day or later)

**User Goal:** Check weather again, as fast as last time.

1. User opens the Nimbus link (bookmark, history, or re-shared link)
2. App re-detects geolocation and loads current weather (fresh data every visit)
3. Recent cities are still available as quick-access chips
4. Unit preference and dark mode setting are preserved
5. The experience is identical to the first visit but faster — the user already knows the layout

**Emotional State:** Familiarity. "This is my weather app now."

**Potential Friction:**
- If geolocation re-prompts every time (it shouldn't — browsers remember the grant), it would be annoying — once granted, it stays granted unless the user revokes
- If recent cities disappeared between sessions, the user feels like progress was lost — localStorage persistence prevents this

### Stage 7: Portfolio Review Path (secondary persona)

**User Goal:** Evaluate the builder's frontend skills.

1. Hiring manager clicks the portfolio link
2. First impression: "This looks polished" — the 3D scene and theming signal craft immediately
3. They resize the browser window — responsive layout holds up
4. They search a few cities — transitions are smooth, data updates correctly
5. They try edge cases: empty search, gibberish input, toggling units rapidly
6. They open dev tools: check performance, inspect code quality, look for accessibility
7. They tab through the interface — keyboard navigation works, focus indicators are visible
8. They form an opinion: "This person ships complete, thoughtful work"

**Emotional State:** Impressed → curious → convinced

**Potential Friction:**
- If any edge case is unhandled (broken layout at a certain width, unescaped input, missing error state), it undermines the entire portfolio pitch — polish is the product
- If the 3D scene tanks performance in dev tools, it signals lack of optimization awareness — capped pixel ratio and efficient rendering matter

## 4. Key Moments of Truth

| Moment | What Happens | User Question | Success Criteria |
|--------|-------------|---------------|------------------|
| **First Render** | 3D scene and weather data appear for the first time | "Is this actually good, or just another weather app?" | User pauses to take in the visual — doesn't immediately bounce |
| **Geolocation Denial** | User blocks location access | "Now what?" | Antarctica loads with a friendly toast — user searches their city without frustration |
| **City Switch** | User searches a new city and the scene transforms | "Does the whole thing actually change?" | Theme, 3D scene, and data all transition smoothly — feels magical |
| **Data Glance** | User scans temperature, forecast, and chart | "Can I get what I need in 5 seconds?" | All critical info is above the fold, legible, and uncluttered |
| **Return Visit** | User comes back the next day | "Does it still remember me?" | Recent cities and preferences are intact — feels like their app |
| **Portfolio Review** | Hiring manager tests edge cases | "Is this real quality or surface-level polish?" | Error states, accessibility, responsive layout, and performance all hold up |

## 5. Friction Points & Opportunities

### Potential Friction Points

- **Geolocation prompt on first visit** — browsers show a permission dialog that can feel aggressive. Mitigation: the Antarctica fallback with a friendly toast keeps the experience moving regardless of the user's choice.
- **3D scene performance on mobile** — Three.js rendering can be heavy on low-end devices. Mitigation: cap pixel ratio at 2, keep polygon counts low, use efficient particle systems, and respect `prefers-reduced-motion`.
- **Text legibility over 3D background** — dynamic backgrounds make consistent contrast tricky. Mitigation: glass-morphism cards with strong backdrop blur and semi-opaque backgrounds ensure data is always readable.
- **Unit confusion** — defaulting to Celsius may confuse US users and vice versa. Mitigation: persist the user's choice in localStorage so they only toggle once, ever.
- **Ambiguous search results** — common city names (Portland, Springfield) exist in multiple places. Mitigation: show country and region in the autocomplete dropdown.
- **Stale weather data on return** — re-detecting geolocation ensures fresh data, but if the API is slow, the user sees a loading state they didn't expect. Mitigation: show cached/last-known data instantly with a "Updating..." indicator, then swap in fresh data.

### Delight Opportunities

- **Antarctica personality** — the geolocation-denied state is a chance to show charm instead of an error. Playful copy + a snowy 3D scene turns a negative moment into a memorable one.
- **City-switching transitions** — the moment the 3D scene shifts from sunny to rainy (or vice versa) when searching a new city is the app's signature "wow" moment. Invest in making this transition smooth and cinematic.
- **Night mode accuracy** — if the 3D scene shows nighttime for Tokyo when it's actually night in Tokyo (using the location's timezone, not the browser's), it adds an unexpected layer of realism that thoughtful users will notice.
- **Weather-appropriate micro-copy** — a subtle greeting like "Don't forget your umbrella" or "Perfect day for a walk" adds personality with almost no engineering effort.
- **The "show someone" moment** — this app is built to be shared. The 3D scene is the hook. If a user says "hey, check out this weather app" to a friend, the product has succeeded at its deepest level.

## 6. Success Metrics

### Leading Indicators (Early Signals)

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Time to first meaningful render | < 3 seconds | If the 3D scene + data don't load fast, users bounce before seeing the value |
| Geolocation grant rate | > 60% | Higher grant rate means more users get the ideal first experience |
| Cities searched per session | > 1 | Searching a second city means the user is exploring, not just glancing |
| Unit toggle usage | Tracked (no target) | Tells you whether the default unit is wrong for most users |
| Return visits (same browser) | > 20% within 7 days | Signals the app is sticky enough to replace their default weather check |

### Lagging Indicators (Outcome Metrics)

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Average session duration | 15–45 seconds | Under 15 sec = bounced. Over 45 sec = exploring. Over 2 min = probably stuck. |
| Bounce rate (< 5 sec) | < 30% | High bounce means the first render isn't compelling enough |
| Portfolio conversion | Tracked qualitatively | Did sharing this link lead to interview callbacks or positive feedback? |
| Repeat weekly usage | > 10% of visitors | If people actually come back weekly, this is a real product, not just a demo |
| Lighthouse accessibility score | > 90 | Validates that accessibility isn't just claimed but measurable |

## 7. Edge Cases & Alternative Paths

- **User on VPN or traveling:** Geolocation returns an unexpected city. User sees unfamiliar weather, might be confused for a moment. Recent cities and prominent search bar let them correct immediately.
- **User with JavaScript disabled:** The app won't function (React + Three.js require JS). A `<noscript>` message explaining the requirement is the graceful fallback.
- **User on extremely slow connection:** 3D assets and weather API may load out of sync. Skeleton UI for data + a simple background color (from the theme) until the 3D scene is ready prevents a blank screen.
- **API rate limiting or downtime:** Open-Meteo is free but has rate limits. If the API returns an error, show a clear message with a retry button. Cache recent responses (10-15 min TTL) to reduce redundant calls.
- **User searches a location with no weather data:** Some remote coordinates may return incomplete data. Handle missing fields gracefully — show "—" for unavailable metrics rather than crashing.
- **Screen reader user:** The 3D scene is decorative — marked with `role="img"` and an `aria-label` describing the weather. All data is in semantic HTML. The experience is fully functional without visuals.
- **User with `prefers-reduced-motion`:** 3D scene animations are reduced or paused. CSS transitions are minimized. The visual theme still adapts to weather conditions via color, just without motion.
- **Extremely wide or narrow viewports:** The responsive layout must handle edge widths (320px phone, 4K monitor) without breaking. Test at extremes, not just common breakpoints.
