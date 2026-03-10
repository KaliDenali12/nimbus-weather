# Product Vision: Nimbus

## One-Sentence Summary

Nimbus is a weather app that replaces lifeless data readouts with an immersive, visually rich experience — so checking the weather feels less like reading a spreadsheet and more like glancing out a beautifully designed window.

## The Fundamental Problem

Weather is one of the most checked categories of information on the planet. People look at it multiple times a day. And yet, the experience of checking the weather is almost universally terrible.

Most weather apps treat weather as a data problem: here are your numbers, here are your icons, done. The result is functional but emotionally flat. You get the information, but you don't *feel* anything. The forecast says 72° and sunny, but the app looks exactly the same as when it said 28° and snowing.

The real problem isn't a lack of weather data — it's that weather apps have stripped out the one thing that makes weather interesting: **the sensory experience of it.**

### What people are doing today

- Using whatever default app came on their phone (Apple Weather, Google Weather)
- Checking weather.com or AccuWeather — functional but cluttered with ads and upsells
- Glancing at a widget that shows a number and a tiny icon, then forgetting about it instantly

None of these are broken. But none of them are memorable, enjoyable, or beautiful. Weather checking is a daily habit that nobody actually looks forward to.

## What We're Literally Building

A web-based weather application with the following capabilities:

- **Auto-detect location:** Uses browser geolocation on first load to show local weather immediately.
- **City search:** Type a city name, get current conditions (temperature, humidity, wind speed, weather condition) plus a 5-day forecast with daily highs, lows, and weather icons.
- **Temperature trend chart:** A visual chart showing how temperature changes across the forecast period.
- **Unit toggle:** °C / °F switch that applies globally across all displayed temperatures.
- **Recent cities:** Stores the last 5 searched cities as quick-access buttons.
- **Dynamic theming:** The background, color palette, and overall mood of the app shift to match the current weather condition — blue skies for clear days, muted tones for rain, etc.
- **3D weather scene:** A Three.js-powered diorama that visualizes the current weather: particle rain, drifting snow, golden sunlight, night stars. Transitions smoothly when you switch cities.
- **Dark mode:** Manual toggle for dark theme preference.
- **Responsive + accessible:** Works on mobile and desktop. Keyboard navigable with proper ARIA labels.

## What We're Actually Building

### Not this:

- Yet another weather data display with a fresh coat of paint
- A novelty 3D demo that happens to show temperature
- A feature-rich weather dashboard for power users

### This:

**A weather experience that reconnects you to what's happening outside.** Every visual element — the background gradients, the 3D scene, the color palette — responds to the real weather. The app doesn't just *tell* you it's raining; it *shows* you. The data is there when you need it, but the first thing you notice is the atmosphere — not a number.

It's also a portfolio-grade demonstration of frontend craft: responsive design, accessibility, 3D rendering, dynamic theming, and polished interactions — all working together in a single, cohesive application.

## Target User

**People who are tired of boring weather apps and would genuinely enjoy a better one.**

- They check the weather at least once a day — it's a reflexive habit
- They notice and appreciate good design (they'd pick a beautiful app over an ugly one, all else equal)
- They're not looking for hyper-detailed meteorological data — they want to know if they need a jacket, not the barometric pressure trend
- They use their phone or laptop — this isn't a widget, it's an app you open intentionally

Secondary audience: hiring managers and engineering leads evaluating frontend portfolios. For them, the app is proof of craft — real-world complexity handled with taste.

## Core Experience

You open the app. It already knows where you are.

The first thing you notice isn't a number — it's the mood. The entire interface reflects the weather outside: warm golden tones on a sunny day, cool grays and soft rain particles when it's overcast. A small 3D diorama shows a miniature world experiencing the same weather you are — rain falling on tiny trees, snow drifting past a little house, stars twinkling on a clear night.

Then you see the data: temperature, conditions, humidity, wind. A 5-day forecast with a trend chart. Clean, legible, no clutter. Toggle between Celsius and Fahrenheit. Flip to dark mode if you prefer.

Search for another city and the whole scene transitions — background colors shift, the 3D weather changes, the data updates. Your recent searches sit right there for quick access.

The whole interaction takes seconds, but it's *pleasant*. That's the difference.

## Value Delivered

### For the end user

- A daily micro-moment that's actually enjoyable instead of purely transactional
- Faster intuitive understanding of weather conditions (visuals communicate faster than numbers)
- An app worth showing to someone — "hey, check out this weather app"

### For the builder (portfolio value)

- Demonstrates real-world complexity: API integration, state management, responsive design, accessibility, 3D rendering
- Shows design sensibility, not just engineering competence
- A live, usable app — not a code snippet or a tutorial clone

## What Success Looks Like

- Someone bookmarks this app and uses it instead of their default weather app — not because it has more features, but because it's nicer to use.
- A user searches a vacation destination and the 3D scene shifts to snowy mountains or tropical sun — and they smile.
- A hiring manager opens the link, spends 30 seconds playing with it, and thinks: "This person cares about craft."
- The app loads fast, looks great on a phone, works with a keyboard, and handles edge cases gracefully. It feels finished.

## Key Insights

1. **The 3D scene supports the experience — it doesn't replace it.** The atmospheric theming (colors, gradients, mood) does most of the emotional heavy lifting. The 3D diorama is a powerful enhancement, but if you stripped it away, the app should still *feel* different from competitors. Don't let the 3D scene become a crutch that masks a mediocre underlying design.

2. **This is a "vitamin" product — which means craft is everything.** Nobody *needs* a prettier weather app. They choose one because it delights them. That means every detail matters: load times, transitions, responsiveness, how it handles a city not found. The polish *is* the product.

3. **The dual audience is a strength, not a tension.** What makes this impressive to a hiring manager (real API integration, accessibility, 3D rendering, responsive design) is the same stuff that makes it good for a real user. Building for real usage standards automatically produces portfolio-grade work.
