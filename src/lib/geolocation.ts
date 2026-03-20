const GEOLOCATION_TIMEOUT = 5000

export interface GeoPosition {
  latitude: number
  longitude: number
}

export interface IpLocation {
  latitude: number
  longitude: number
  name: string
  country: string
}

export type GeoError = 'denied' | 'unavailable' | 'timeout'

export async function getUserLocation(): Promise<
  { ok: true; position: GeoPosition } | { ok: false; error: GeoError }
> {
  if (!navigator.geolocation) {
    return { ok: false, error: 'unavailable' }
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          ok: true,
          position: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
        })
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          resolve({ ok: false, error: 'denied' })
        } else if (err.code === err.TIMEOUT) {
          resolve({ ok: false, error: 'timeout' })
        } else {
          resolve({ ok: false, error: 'unavailable' })
        }
      },
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_TIMEOUT,
        maximumAge: 300000, // 5 min cache
      },
    )
  })
}

/** IP-based geolocation via BigDataCloud — more accurate than browser IP geolocation for many ISPs */
export async function getIpLocation(): Promise<IpLocation | null> {
  try {
    const res = await fetch(
      'https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en',
      { signal: AbortSignal.timeout(GEOLOCATION_TIMEOUT), redirect: 'follow' },
    )
    if (!res.ok) return null
    const data = await res.json()
    const lat = data.latitude
    const lon = data.longitude
    if (typeof lat !== 'number' || typeof lon !== 'number') return null
    const name = data.city || data.locality || data.principalSubdivision || ''
    const country = data.countryName ?? ''
    if (!name) return null
    return { latitude: lat, longitude: lon, name, country }
  } catch {
    return null
  }
}

// Antarctica fallback coordinates
export const ANTARCTICA: { latitude: number; longitude: number; name: string; country: string } = {
  latitude: -82.8628,
  longitude: 135.0,
  name: 'Antarctica',
  country: 'Antarctica',
}
