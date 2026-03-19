import type { City } from '@/types/index.ts'

interface UrlCity extends City {
  lat: number
  lon: number
  name: string
  country: string
}

export function parseCityFromUrl(): UrlCity | null {
  const params = new URLSearchParams(window.location.search)
  const latStr = params.get('lat')
  const lonStr = params.get('lon')
  const city = params.get('city')
  const country = params.get('country')

  if (!latStr || !lonStr || !city) return null

  const lat = Number(latStr)
  const lon = Number(lonStr)

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) return null

  return { lat, lon, name: city, country: country ?? '' }
}

export function updateUrlWithCity(city: City): void {
  const params = new URLSearchParams()
  params.set('lat', city.lat.toString())
  params.set('lon', city.lon.toString())
  params.set('city', city.name)
  if (city.country) params.set('country', city.country)

  history.replaceState(null, '', `?${params.toString()}`)
}

export function clearUrlParams(): void {
  if (window.location.search) {
    history.replaceState(null, '', window.location.pathname)
  }
}
