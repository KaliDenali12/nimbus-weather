const GEOLOCATION_TIMEOUT = 8000

export interface GeoPosition {
  latitude: number
  longitude: number
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

// Antarctica fallback coordinates
export const ANTARCTICA: { latitude: number; longitude: number; name: string; country: string } = {
  latitude: -82.8628,
  longitude: 135.0,
  name: 'Antarctica',
  country: 'Antarctica',
}
