# Error Messages Reference

> All user-facing error messages in the Nimbus Weather App, grouped by feature.

---

## Message Style Guide

### Voice & Tone

- **Calm and helpful** — never blame the user
- **Specific** — say what happened, not just "something went wrong"
- **Actionable** — always tell the user what to do next
- **Consistent formality** — semi-casual, friendly, no jargon

### Structure Template

```
[What happened]. [What to do / What's happening instead].
```

### Words to Avoid

| Avoid | Use Instead |
|-------|-------------|
| "Invalid" | "Please enter..." / "Try a different..." |
| "Error" (as heading) | Describe the state: "Weather Unavailable" |
| "Failed" (user-facing) | "couldn't" / "unable to" |
| "You" + negative verb | Reframe as system state or suggestion |
| Internal names (ApiError, 500, etc.) | Plain language equivalents |

### Standard Phrases

| Situation | Standard Phrase |
|-----------|----------------|
| Network issue | "Please check your connection and try again." |
| Server issue | "The weather service is temporarily unavailable. Please try again in a few minutes." |
| Rate limited | "Too many requests. Please wait a moment and try again." |
| Geo denied | "Location access was not granted." |
| Geo timeout | "Location detection timed out." |
| Geo unavailable | "Location detection is not available." |
| Retry available | "Try Again" (button text) |
| Search empty | "No cities found. Try a different spelling or a nearby city." |
| Search failed | "Search failed. Please check your connection and try again." |

---

## User-Facing Error Messages

### Weather Loading Errors

| Location | Trigger | Message | Status |
|----------|---------|---------|--------|
| `ErrorState.tsx:12` | Any weather fetch failure | **Heading:** "Weather Unavailable" | Current |
| `ErrorState.tsx:15` | Error is null (default) | "Unable to fetch weather data. Please check your connection and try again." | Current |
| `WeatherContext.tsx:89` | HTTP 500+ from API | "The weather service is temporarily unavailable. Please try again in a few minutes." | Current |
| `WeatherContext.tsx:91` | HTTP 429 from API | "Too many requests. Please wait a moment and try again." | Current |
| `WeatherContext.tsx:93` | Other API/network error | "Unable to fetch weather data. Please check your connection and try again." | Current |
| `WeatherContext.tsx:96` | Non-Error exception | "Unable to fetch weather data. Please check your connection and try again." | Current |

### Geolocation Messages

| Location | Trigger | Message | Status |
|----------|---------|---------|--------|
| `App.tsx:36` | Geolocation permission denied | "Location access was not granted. We've landed you in Antarctica! Use the search bar to find your city." | Current |
| `App.tsx:38` | Geolocation timeout | "Location detection timed out. Showing Antarctica for now — try searching for your city." | Current |
| `App.tsx:39` | Geolocation unavailable | "Location detection is not available. Use the search bar to find your city." | Current |

### Search Messages

| Location | Trigger | Message | Status |
|----------|---------|---------|--------|
| `SearchBar.tsx:153` | Search API error | "Search failed. Please check your connection and try again." | Current |
| `SearchBar.tsx:154` | No results for query | "No cities found. Try a different spelling or a nearby city." | Current |

### Loading States

| Location | Trigger | Message | Status |
|----------|---------|---------|--------|
| `LoadingState.tsx:12` | Initial weather fetch | "Fetching weather data..." | Current |

### Accessibility Labels

| Location | Element | Label | Status |
|----------|---------|-------|--------|
| `SearchBar.tsx:122` | Search input | "Search for a city" | Current |
| `SearchBar.tsx:132` | Clear button | "Clear search" | Current |
| `Toast.tsx:40` | Dismiss button | "Dismiss notification" | Current |
| `Header.tsx:17` | Unit toggle | "Switch to Fahrenheit/Celsius" (dynamic) | Current |
| `Header.tsx:26` | Dark mode toggle | "Enable/Disable dark mode" (dynamic) | Current |

---

## Developer-Facing Messages

### API Errors (Internal)

| Location | Trigger | Message | Notes |
|----------|---------|---------|-------|
| `api.ts:59` | Geocoding API non-ok | `ApiError("Failed to search cities", status)` | Caught by SearchBar, never shown to user |
| `api.ts:86` | Forecast API non-ok | `ApiError("Failed to fetch weather data", status)` | Caught by WeatherContext, mapped to user-friendly message |

### Context Validation

| Location | Trigger | Message | Notes |
|----------|---------|---------|-------|
| `WeatherContext.tsx:192` | useWeather outside provider | `Error("useWeather must be used within a WeatherProvider")` | Developer error, thrown at dev time |

### Logging

| Location | Level | Message | Notes |
|----------|-------|---------|-------|
| `SceneErrorBoundary.tsx:21` | ERROR | `[SceneErrorBoundary] WebGL/3D scene crashed — falling back to gradient background.` | Only log statement in the app. Includes error message and component stack. |
