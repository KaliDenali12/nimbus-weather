# Nimbus Design Language Guide

## Overview

**Design Direction:** Atmospheric and cinematic. The weather IS the design — it's not decoration layered on top of an app, it's the foundation everything sits on.

**The Feeling:** Standing at a floor-to-ceiling window during a storm. The data is there when you need it, but the atmosphere hits first. Bold typographic presence gives it editorial confidence — this isn't a toy, it's a crafted experience.

**Who This Is For:** People who care about good design and want a weather app that feels like the weather. Also: hiring managers who will notice the craft.

**Core Principles:**
- The weather drives everything — color, mood, lighting, motion
- Data is secondary to atmosphere but never sacrificed for it
- Bold typography gives editorial weight to simple information
- Glassmorphism creates depth without competing with the 3D scene
- Accessibility is non-negotiable — beautiful AND usable

## Color Palette

### How Color Works in Nimbus

Nimbus does not have a single fixed color palette. The entire UI shifts based on the current weather condition and time of day. There is no "primary brand color" in the traditional sense — the weather IS the brand. However, every weather state needs a defined palette so the app looks intentional rather than random.

### Weather-Driven Palettes

Each weather state defines four values: background gradient, card surface color, primary text color, and secondary text color. These are applied via CSS custom properties and transition smoothly when switching cities.

#### Clear Sky (Day)
| Role | Value | Usage |
|------|-------|-------|
| Background | `linear-gradient(135deg, #1e5faa 0%, #5b9bd5 40%, #8bbaf0 100%)` | Full-page background |
| Card Surface | `rgba(255, 255, 255, 0.14)` | Glassmorphism card fill |
| Card Border | `rgba(255, 255, 255, 0.12)` | Subtle card edge |
| Text Primary | `#ffffff` | Headings, temperature, city name |
| Text Secondary | `rgba(255, 255, 255, 0.7)` | Labels, metadata, secondary info |

#### Clear Sky (Night)
| Role | Value | Usage |
|------|-------|-------|
| Background | `linear-gradient(135deg, #0b1224 0%, #1a1847 50%, #2b2670)` | Full-page background |
| Card Surface | `rgba(255, 255, 255, 0.07)` | Glassmorphism card fill |
| Card Border | `rgba(255, 255, 255, 0.08)` | Subtle card edge |
| Text Primary | `#e2e8f0` | Headings, temperature, city name |
| Text Secondary | `rgba(226, 232, 240, 0.6)` | Labels, metadata |

#### Cloudy (Day)
| Role | Value | Usage |
|------|-------|-------|
| Background | `linear-gradient(135deg, #5a6a7a 0%, #8494a7 50%, #b0bec9 100%)` | Full-page background |
| Card Surface | `rgba(255, 255, 255, 0.16)` | Glassmorphism card fill |
| Card Border | `rgba(255, 255, 255, 0.12)` | Subtle card edge |
| Text Primary | `#ffffff` | Headings, temperature |
| Text Secondary | `rgba(255, 255, 255, 0.65)` | Labels, metadata |

#### Cloudy (Night)
| Role | Value | Usage |
|------|-------|-------|
| Background | `linear-gradient(135deg, #1a2535 0%, #2d3d50 50%, #3f5168 100%)` | Full-page background |
| Card Surface | `rgba(255, 255, 255, 0.08)` | Glassmorphism card fill |
| Card Border | `rgba(255, 255, 255, 0.08)` | Subtle card edge |
| Text Primary | `#e2e8f0` | Headings, temperature |
| Text Secondary | `rgba(226, 232, 240, 0.55)` | Labels, metadata |

#### Rain (Day)
| Role | Value | Usage |
|------|-------|-------|
| Background | `linear-gradient(135deg, #1c3550 0%, #2a4d6b 50%, #3f6d8c 100%)` | Full-page background |
| Card Surface | `rgba(255, 255, 255, 0.10)` | Glassmorphism card fill |
| Card Border | `rgba(255, 255, 255, 0.08)` | Subtle card edge |
| Text Primary | `#e2e8f0` | Headings, temperature |
| Text Secondary | `rgba(226, 232, 240, 0.6)` | Labels, metadata |

#### Rain (Night)
| Role | Value | Usage |
|------|-------|-------|
| Background | `linear-gradient(135deg, #0a1520 0%, #14202f 50%, #1c2e42 100%)` | Full-page background |
| Card Surface | `rgba(255, 255, 255, 0.06)` | Glassmorphism card fill |
| Card Border | `rgba(255, 255, 255, 0.06)` | Subtle card edge |
| Text Primary | `#c8d6e0` | Headings, temperature |
| Text Secondary | `rgba(200, 214, 224, 0.55)` | Labels, metadata |

#### Snow (Day)
| Role | Value | Usage |
|------|-------|-------|
| Background | `linear-gradient(135deg, #d8e4ee 0%, #c0cdd8 50%, #8a9baa 100%)` | Full-page background |
| Card Surface | `rgba(0, 0, 0, 0.07)` | Glassmorphism card fill (dark on light) |
| Card Border | `rgba(0, 0, 0, 0.06)` | Subtle card edge |
| Text Primary | `#1a2533` | Headings, temperature (dark text on light bg) |
| Text Secondary | `rgba(26, 37, 51, 0.6)` | Labels, metadata |

#### Snow (Night)
| Role | Value | Usage |
|------|-------|-------|
| Background | `linear-gradient(135deg, #1a2535 0%, #2d3d50 50%, #506478 100%)` | Full-page background |
| Card Surface | `rgba(255, 255, 255, 0.08)` | Glassmorphism card fill |
| Card Border | `rgba(255, 255, 255, 0.08)` | Subtle card edge |
| Text Primary | `#e2e8f0` | Headings, temperature |
| Text Secondary | `rgba(226, 232, 240, 0.55)` | Labels, metadata |

#### Storm (Day/Night)
| Role | Value | Usage |
|------|-------|-------|
| Background | `linear-gradient(135deg, #12121f 0%, #22223a 50%, #323252 100%)` | Full-page background |
| Card Surface | `rgba(255, 255, 255, 0.08)` | Glassmorphism card fill |
| Card Border | `rgba(255, 255, 255, 0.07)` | Subtle card edge |
| Text Primary | `#d4d4e0` | Headings, temperature |
| Text Secondary | `rgba(212, 212, 224, 0.55)` | Labels, metadata |

### Dark Mode Override

When dark mode is toggled on, it overrides the weather-driven palette with a single consistent dark theme. The 3D scene still reflects the weather, but the UI chrome becomes neutral.

| Role | Value | Usage |
|------|-------|-------|
| Background | `linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)` | Full-page background |
| Card Surface | `rgba(255, 255, 255, 0.05)` | Glassmorphism card fill |
| Card Border | `rgba(255, 255, 255, 0.06)` | Subtle card edge |
| Text Primary | `#e4e4e7` | Headings, temperature |
| Text Secondary | `rgba(228, 228, 231, 0.55)` | Labels, metadata |

### Semantic Colors

These are consistent across all weather states and modes. They're used for alerts, status indicators, and interactive feedback.

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Success | Green | `#34d399` | Successful actions, positive indicators |
| Warning | Amber | `#fbbf24` | Caution states, advisory alerts |
| Error / Danger | Red | `#f87171` | Errors, severe weather warnings |
| Info | Blue | `#60a5fa` | Informational callouts, tips |

For alert banners, these semantic colors are used at full intensity as background tints:

| Alert Level | Background | Text | Border |
|---|---|---|---|
| Warning (advisory) | `rgba(251, 191, 36, 0.2)` | `#fbbf24` | `rgba(251, 191, 36, 0.4)` |
| Severe (warning) | `rgba(251, 146, 60, 0.2)` | `#fb923c` | `rgba(251, 146, 60, 0.4)` |
| Extreme (emergency) | `rgba(248, 113, 113, 0.2)` | `#f87171` | `rgba(248, 113, 113, 0.4)` |

### Color Do's and Don'ts

- **DO** let the weather palette drive the mood — the whole point is that the app feels different on a rainy day vs. a sunny day
- **DO** use CSS custom properties for palette values so weather transitions are a single variable swap with a CSS transition
- **DO** ensure card surfaces always have enough contrast against text — test every weather state
- **DON'T** add a fixed "brand color" that competes with the weather palette
- **DON'T** use semantic colors (red, green) for non-semantic purposes — red means error/danger, green means success, always
- **DON'T** make the snow day palette too bright — it should feel soft and overcast, not blinding white
- **DON'T** forget that glassmorphism cards need `backdrop-filter: blur()` to work — without the blur, transparent cards look broken

## Typography

### Font Families

| Role | Font | Source | Why |
|------|------|--------|-----|
| Display (headings, temperature, city name) | **Bricolage Grotesque** | [Google Fonts](https://fonts.google.com/specimen/Bricolage+Grotesque) | Bold, editorial presence. Variable weight support (200–800). Has personality without being eccentric — feels like a magazine headline, which gives authority to simple weather data. |
| Body (labels, descriptions, metadata) | **Figtree** | [Google Fonts](https://fonts.google.com/specimen/Figtree) | Clean, modern, excellent readability at small sizes. Slightly warm character that pairs well with Bricolage's boldness without competing. Variable weight support (300–700). |

**Loading:** Import both via Google Fonts with `display=swap` to prevent layout shift while fonts load.

```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Figtree:wght@300;400;500;600&display=swap" rel="stylesheet">
```

### Type Scale

| Token | Size | Weight | Line Height | Font | Usage |
|-------|------|--------|-------------|------|-------|
| `display-xl` | 64px | 800 | 1.0 | Bricolage Grotesque | Current temperature (hero display) |
| `display-lg` | 36px | 700 | 1.1 | Bricolage Grotesque | City name |
| `heading-1` | 26px | 800 | 1.2 | Bricolage Grotesque | App title ("Nimbus"), section headers |
| `heading-2` | 20px | 700 | 1.25 | Bricolage Grotesque | Card titles, forecast day names |
| `heading-3` | 16px | 600 | 1.3 | Bricolage Grotesque | Sub-labels, chart title |
| `body` | 15px | 400 | 1.5 | Figtree | General body text, descriptions |
| `body-sm` | 13px | 400 | 1.4 | Figtree | Secondary info, metadata, timestamps |
| `caption` | 11px | 500 | 1.3 | Figtree | Fine print, chart axis labels |
| `label` | 13px | 600 | 1.2 | Figtree | Button text, form labels, chip text |

### Typography Do's and Don'ts

- **DO** use Bricolage Grotesque at weight 700–800 for display elements — it's designed to be bold, don't make it timid
- **DO** keep body text (Figtree) at weight 400 for readability — use 500–600 only for labels and emphasis
- **DO** use the `display-xl` size exclusively for the current temperature — nothing else should be that large
- **DON'T** use Bricolage below 16px — it loses legibility at small sizes; switch to Figtree
- **DON'T** use more than 3 different sizes on a single screen — pick from the scale, don't invent new values
- **DON'T** use light weights (300) for anything other than large display text — thin text on dynamic backgrounds is hard to read
- **DON'T** center-align body text — left-align is easier to read. Center is acceptable only for the hero temperature and city name

### Letter Spacing

| Token | Spacing | Usage |
|-------|---------|-------|
| `display-xl` | `-1.5px` | Temperature display — tighten at large sizes |
| `display-lg` | `-0.5px` | City name — slight tightening |
| `heading-1` | `-0.5px` | App title |
| `label-caps` | `+1.5px` | Uppercase labels like "HUMIDITY", "WIND" — loosen for readability |
| All body text | `0` (default) | No adjustment needed |

## Spacing

### Spacing Scale

Based on a 4px grid. Every margin, padding, and gap should come from this scale.

| Token | Value | Tailwind | Common Usage |
|-------|-------|----------|--------------|
| `space-1` | 4px | `p-1` | Tight internal padding (icon to label) |
| `space-2` | 8px | `p-2` | Between icon and text, small gaps |
| `space-3` | 12px | `p-3` | Compact card padding, chip padding |
| `space-4` | 16px | `p-4` | Standard element spacing, input padding |
| `space-5` | 20px | `p-5` | Card internal padding |
| `space-6` | 24px | `p-6` | Between sections on mobile, generous card padding |
| `space-8` | 32px | `p-8` | Between major sections |
| `space-10` | 40px | `p-10` | Page top/bottom padding |
| `space-12` | 48px | `p-12` | Large section separators |
| `space-16` | 64px | `p-16` | Hero spacing, major visual breaks |

### Application Guidelines

| Context | Value | Notes |
|---------|-------|-------|
| Card internal padding | 20px (`space-5`) | All glassmorphism cards |
| Gap between cards | 12–16px (`space-3` to `space-4`) | Forecast cards, info cards |
| Section margin (vertical) | 24px (`space-6`) | Between search and current weather, weather and forecast, etc. |
| Page horizontal padding | 16px mobile, 24px desktop | Edge margins |
| Max content width | 900px | Centered, keeps content readable on wide screens |
| Search bar internal padding | 14px vertical, 16px horizontal | Comfortable tap target |
| Button padding | 6px vertical, 14px horizontal | Compact header buttons |
| Chip/pill padding | 6px vertical, 14px horizontal | Recent city chips |

### Spacing Do's and Don'ts

- **DO** use values from the scale — never eyeball spacing with arbitrary pixel values
- **DO** give elements generous breathing room — this is a visual app, not a data dashboard
- **DON'T** go below 4px spacing between any elements
- **DON'T** use different spacing values for the same repeated pattern (e.g., all forecast cards should have identical padding)

## Components

### Glassmorphism Cards

The primary container component. Used for current weather, forecast, chart, and alert sections.

| Property | Value |
|----------|-------|
| Background | Weather-driven card surface color (see palette) |
| Backdrop Filter | `blur(16px)` |
| Border | 1px solid, weather-driven card border color |
| Border Radius | 16px |
| Padding | 20px |
| Transition | `background 0.6s ease, border-color 0.6s ease` |

**Why 16px radius on cards but 8px is the base?** Cards are large containers — they get double the base radius (8px × 2) to feel proportional. Smaller elements like buttons and inputs use the 8px base. This creates visual hierarchy through rounding.

### Buttons

#### Header Buttons (Unit Toggle, Dark Mode)

| Property | Value |
|----------|-------|
| Background | `rgba(255, 255, 255, 0.10)` |
| Border | 1px solid `rgba(255, 255, 255, 0.12)` |
| Border Radius | 10px |
| Padding | 6px 14px |
| Font | Figtree, 14px, weight 600 |
| Text Color | Inherits from weather text primary |
| Hover | Background shifts to `rgba(255, 255, 255, 0.18)` |
| Focus | 2px solid `rgba(255, 255, 255, 0.5)` outline, 2px offset |
| Transition | `background 0.2s ease` |

There is no "primary action button" in Nimbus — the app is read-heavy, not action-heavy. All buttons are subtle glass-style controls that don't compete with the weather display.

### Search Input

| Property | Value |
|----------|-------|
| Background | `rgba(255, 255, 255, 0.10)` |
| Border | 1px solid `rgba(255, 255, 255, 0.12)` |
| Border Radius | 14px |
| Padding | 14px vertical, 16px horizontal (with search icon inset) |
| Font | Figtree, 15px, weight 400 |
| Text Color | Inherits from weather text primary |
| Placeholder Color | text secondary at 60% opacity |
| Focus | 2px solid `rgba(255, 255, 255, 0.35)` outline |
| Backdrop Filter | `blur(12px)` |

### Search Dropdown

| Property | Value |
|----------|-------|
| Background | `rgba(20, 30, 50, 0.95)` (light mode) / `rgba(24, 24, 27, 0.95)` (dark mode) |
| Border | 1px solid `rgba(255, 255, 255, 0.08)` |
| Border Radius | 12px |
| Backdrop Filter | `blur(20px)` |
| Item Padding | 12px 16px |
| Item Hover | `rgba(255, 255, 255, 0.08)` background |
| Item Border | 1px solid `rgba(255, 255, 255, 0.04)` between items |
| Z-Index | 50 |

### Recent City Chips

| Property | Value |
|----------|-------|
| Background | `rgba(255, 255, 255, 0.10)` |
| Border | 1px solid `rgba(255, 255, 255, 0.12)` |
| Border Radius | 20px (pill shape) |
| Padding | 6px 14px |
| Font | Figtree, 13px, weight 500 |
| Icon | MapPin, 11px, 50% opacity |
| Hover | Background shifts to `rgba(255, 255, 255, 0.18)` |
| Transition | `background 0.2s ease` |

### Forecast Day Cards

| Property | Value |
|----------|-------|
| Layout | Horizontal row on desktop, scrollable on mobile |
| Background | Shared glassmorphism card (all days in one card) or individual mini-cards |
| Day Name | Figtree, 13px, weight 600, secondary text color |
| Temperature | Bricolage Grotesque, 16px, weight 700 |
| Weather Icon | Lucide, 24px |
| Spacing | 16px between each day column |

### Alert Banners

| Property | Value |
|----------|-------|
| Background | Semantic color at 20% opacity (see Semantic Colors table) |
| Border | 1px solid semantic color at 40% opacity |
| Border Radius | 12px |
| Padding | 12px 16px |
| Title Font | Bricolage Grotesque, 14px, weight 700 |
| Body Font | Figtree, 13px, weight 400 |
| Dismiss Button | X icon, top right, subtle hover state |

### Toast Notifications

Used for geolocation denial message and similar feedback.

| Property | Value |
|----------|-------|
| Background | `rgba(20, 30, 50, 0.9)` |
| Border | 1px solid `rgba(255, 255, 255, 0.1)` |
| Border Radius | 12px |
| Padding | 12px 16px |
| Font | Figtree, 14px, weight 500 |
| Position | Top center, 20px from top edge |
| Auto-dismiss | 5 seconds |
| Backdrop Filter | `blur(12px)` |

### Component Do's and Don'ts

- **DO** apply `backdrop-filter: blur(16px)` on every glass card — without it, the transparent background looks like a bug
- **DO** keep all interactive elements (buttons, chips, search) visually consistent — same glass treatment, same border style
- **DO** use the same border radius within a component group (all buttons = 10px, all cards = 16px, all chips = 20px)
- **DON'T** add drop shadows on glassmorphism cards — the blur effect creates its own depth
- **DON'T** use solid/opaque cards — they block the 3D scene and break the atmospheric effect
- **DON'T** mix glass-style and solid-style components on the same screen — pick one visual language

## States & Interactions

### Hover States

| Element | Hover Effect | Transition |
|---------|-------------|------------|
| Buttons | Background `rgba(255, 255, 255, 0.18)` | `background 0.2s ease` |
| Chips | Background `rgba(255, 255, 255, 0.18)` | `background 0.2s ease` |
| Search Dropdown Items | Background `rgba(255, 255, 255, 0.08)` | `background 0.15s ease` |
| Forecast Day Columns | Subtle lift — `translateY(-2px)` + slightly brighter background | `transform 0.2s ease, background 0.2s ease` |

### Focus States

Critical for keyboard accessibility. Every focusable element must have a visible focus indicator.

| Element | Focus Style |
|---------|-------------|
| Search Input | `outline: 2px solid rgba(255, 255, 255, 0.35); outline-offset: 0` |
| Buttons | `outline: 2px solid rgba(255, 255, 255, 0.5); outline-offset: 2px` |
| Chips | `outline: 2px solid rgba(255, 255, 255, 0.5); outline-offset: 2px` |
| Dropdown Items | `outline: 2px solid rgba(255, 255, 255, 0.5); outline-offset: -2px` (inset) |

**Focus rings use white at varying opacity because the background is always dynamic.** A fixed-color focus ring would clash with some weather states. White with transparency works across all themes.

### Disabled States

| Property | Value |
|----------|-------|
| Opacity | 0.4 |
| Cursor | `not-allowed` |
| Pointer Events | `none` |

### Loading States

| Context | Treatment |
|---------|-----------|
| Initial page load | Centered spinner (Lucide `Loader2` icon, CSS `spin` animation) + "Fetching weather data..." text in secondary color |
| City switch | Same spinner, displayed in the main content area while new data loads |
| Search autocomplete | No visible loader — results appear when ready, fast enough to not need one (debounced at 300ms) |

### Error States

| Context | Treatment |
|---------|-----------|
| Network failure | Glassmorphism card with cloud icon (48px, 40% opacity), error message, and a "Try Again" button |
| City not found | Text in the search dropdown: "No cities found" in secondary text color |
| API error | Same as network failure with appropriate message |
| Geolocation denied | Toast notification (see Toast component) with friendly copy |

### Weather Transitions

When switching cities, the entire visual state transitions:

| Element | Transition Duration | Easing |
|---------|-------------------|--------|
| Background gradient | 800ms | `ease` |
| Card surface/border colors | 600ms | `ease` |
| Text colors | 500ms | `ease` |
| 3D scene (lighting, particles) | Handled by Three.js — aim for ~1s smooth blend |

## Accessibility Requirements

### Color Contrast

- All primary text on card surfaces must meet **WCAG AA (4.5:1 ratio)** at minimum
- The glassmorphism blur effect helps — it desaturates and mutes the background behind text, improving contrast
- **Snow (day) is the highest risk palette** because it uses dark text on a light background with light card surfaces. Test this state carefully.
- Large display text (temperature, city name at 36px+) only needs **3:1 ratio**

### Focus Indicators

- Every interactive element has a visible focus ring (see Focus States above)
- Focus rings must be visible across ALL weather states — this is why they use white with opacity rather than a fixed color
- Never use `outline: none` without a replacement focus indicator

### Touch Targets

- Minimum touch target: **44 × 44px** on mobile
- Search input: well above minimum (full-width, 48px+ height)
- Buttons: padding ensures 44px height minimum
- Chips: padding ensures 36px height — acceptable because they're supplementary, not primary actions
- Search dropdown items: 44px+ row height

### Keyboard Navigation

- Tab order: Search input → Recent city chips → Unit toggle → Dark mode toggle
- Search dropdown: arrow keys to navigate, Enter to select, Escape to dismiss
- All toggles: Space or Enter to activate
- 3D scene: not focusable (decorative, marked with `role="img"`)

### Reduced Motion

When `prefers-reduced-motion: reduce` is active:
- CSS transitions reduced to 0ms or near-instant
- 3D scene particles stop animating (static positions)
- Cloud drift and camera sway disabled
- Weather theme still changes (via color), just without animated transitions

### Accessibility Checklist

- [ ] All text meets WCAG AA contrast (4.5:1 body, 3:1 large)
- [ ] Focus states are visible on every interactive element across all weather states
- [ ] Color is never the only indicator (icons + text accompany color for alerts)
- [ ] Touch targets are 44px+ on mobile
- [ ] 3D scene has `role="img"` and descriptive `aria-label`
- [ ] All form inputs have associated labels (even if visually hidden)
- [ ] Toggle buttons announce their state to screen readers (`aria-label` updates)
- [ ] `prefers-reduced-motion` is respected
- [ ] Text remains readable when browser zoom is increased to 200%

## Supporting Elements

### Icons

| Property | Value |
|----------|-------|
| Library | Lucide React |
| Default Size | 18px for inline, 24px for standalone, 48px for empty states |
| Style | Stroke (outline), not filled — matches the glass aesthetic |
| Color | Inherits from text color (primary or secondary depending on context) |

**Weather-specific icons:** Lucide provides Sun, Moon, Cloud, CloudRain, Snowflake, Zap, Wind, Droplets, Thermometer, Eye, MapPin, Search, X, Loader2 — all of which Nimbus uses.

### Motion Defaults

| Property | Value | Usage |
|----------|-------|-------|
| Fast | `150ms ease` | Hover states, small interactions |
| Normal | `200ms ease` | Button state changes, chip interactions |
| Slow | `500-800ms ease` | Weather theme transitions, page-level changes |
| Easing | `ease` (CSS default) | Used everywhere — natural deceleration |

**Motion philosophy:** Less is more. The 3D scene provides all the visual dynamism. UI chrome should animate subtly so it doesn't compete with the weather.

### Responsive Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | < 640px | Single column, full-width cards, horizontal scroll for forecast, tighter spacing |
| Tablet | 640–899px | Slightly wider cards, more breathing room |
| Desktop | 900px+ | Max-width container (900px), centered, most generous spacing |

## Quick Reference Cheat Sheet

### Weather Palette (CSS Custom Properties)

```css
/* Set these based on weather condition + time of day */
--bg-gradient: linear-gradient(...);
--card-surface: rgba(...);
--card-border: rgba(...);
--text-primary: #...;
--text-secondary: rgba(...);
```

### Semantic Colors
```
Success:     #34d399
Warning:     #fbbf24
Error:       #f87171
Info:        #60a5fa
```

### Alert Backgrounds
```
Advisory:    rgba(251, 191, 36, 0.2)    border: rgba(251, 191, 36, 0.4)
Warning:     rgba(251, 146, 60, 0.2)    border: rgba(251, 146, 60, 0.4)
Emergency:   rgba(248, 113, 113, 0.2)   border: rgba(248, 113, 113, 0.4)
```

### Dark Mode Override
```
Background:  linear-gradient(135deg, #09090b, #18181b, #27272a)
Card:        rgba(255, 255, 255, 0.05)
Border:      rgba(255, 255, 255, 0.06)
Text:        #e4e4e7
Text Sec:    rgba(228, 228, 231, 0.55)
```

### Typography
```
Display:     Bricolage Grotesque
Body:        Figtree

display-xl:  64px / 800 / 1.0   — Temperature hero
display-lg:  36px / 700 / 1.1   — City name
heading-1:   26px / 800 / 1.2   — App title
heading-2:   20px / 700 / 1.25  — Card titles
heading-3:   16px / 600 / 1.3   — Sub-labels
body:        15px / 400 / 1.5   — General text
body-sm:     13px / 400 / 1.4   — Metadata
caption:     11px / 500 / 1.3   — Fine print
label:       13px / 600 / 1.2   — Buttons, chips
```

### Spacing
```
space-1:   4px     space-5:   20px    space-10:  40px
space-2:   8px     space-6:   24px    space-12:  48px
space-3:   12px    space-8:   32px    space-16:  64px
space-4:   16px
```

### Border Radius
```
Buttons:       10px
Search Input:  14px
Cards:         16px
Chips:         20px (pill)
Dropdown:      12px
Toast:         12px
Alert:         12px
```

### Glassmorphism Recipe
```css
background: var(--card-surface);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid var(--card-border);
border-radius: 16px;
```

### Shadows
```
None — glassmorphism cards do not use box-shadow.
The backdrop-filter blur creates depth.
Exception: forecast card hover gets a subtle shadow:
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15)
```

### Transitions
```
Fast:    150ms ease  — hovers, small state changes
Normal:  200ms ease  — button clicks, chip interactions
Slow:    600ms ease  — weather theme transitions
XSlow:   800ms ease  — background gradient transitions
```

### Focus Ring
```css
outline: 2px solid rgba(255, 255, 255, 0.5);
outline-offset: 2px;
```

### Icon Sizes
```
Inline:      18px
Standalone:  24px
Empty State: 48px
```
