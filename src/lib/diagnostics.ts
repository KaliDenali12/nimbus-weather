/**
 * Client-side diagnostics for Nimbus Weather.
 *
 * Verifies runtime dependencies (API reachability, storage, WebGL, geolocation)
 * and returns structured health status. Lightweight — safe to call from a
 * console helper or a hidden debug panel.
 */

const DIAGNOSTIC_TIMEOUT_MS = 5_000

export type ComponentStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface ComponentCheck {
  name: string
  status: ComponentStatus
  latencyMs: number | null
  detail: string
}

export interface DiagnosticsResult {
  overall: ComponentStatus
  timestamp: string
  userAgent: string
  checks: ComponentCheck[]
}

async function checkOpenMeteoApi(): Promise<ComponentCheck> {
  const start = performance.now()
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current=temperature_2m&forecast_days=1',
      { signal: AbortSignal.timeout(DIAGNOSTIC_TIMEOUT_MS) },
    )
    const latencyMs = Math.round(performance.now() - start)
    if (res.ok) {
      return { name: 'Open-Meteo API', status: 'healthy', latencyMs, detail: `${res.status} in ${latencyMs}ms` }
    }
    return { name: 'Open-Meteo API', status: 'degraded', latencyMs, detail: `HTTP ${res.status}` }
  } catch (e) {
    const latencyMs = Math.round(performance.now() - start)
    const detail = e instanceof DOMException && e.name === 'TimeoutError'
      ? `Timed out after ${DIAGNOSTIC_TIMEOUT_MS}ms`
      : 'Network error — unreachable'
    return { name: 'Open-Meteo API', status: 'unhealthy', latencyMs, detail }
  }
}

function checkLocalStorage(): ComponentCheck {
  const start = performance.now()
  try {
    const testKey = '__nimbus_diagnostic__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    const latencyMs = Math.round(performance.now() - start)
    return { name: 'localStorage', status: 'healthy', latencyMs, detail: 'Read/write OK' }
  } catch {
    const latencyMs = Math.round(performance.now() - start)
    return { name: 'localStorage', status: 'degraded', latencyMs, detail: 'Unavailable or quota exceeded' }
  }
}

function checkWebGL(): ComponentCheck {
  const start = performance.now()
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    const latencyMs = Math.round(performance.now() - start)
    if (gl) {
      const renderer = gl.getExtension('WEBGL_debug_renderer_info')
      const gpu = renderer ? gl.getParameter(renderer.UNMASKED_RENDERER_WEBGL) : 'unknown'
      return { name: 'WebGL', status: 'healthy', latencyMs, detail: `Supported (${gpu})` }
    }
    return { name: 'WebGL', status: 'degraded', latencyMs, detail: 'Not available — 3D scene will be hidden' }
  } catch {
    const latencyMs = Math.round(performance.now() - start)
    return { name: 'WebGL', status: 'degraded', latencyMs, detail: 'Detection failed' }
  }
}

function checkGeolocation(): ComponentCheck {
  const start = performance.now()
  const available = typeof navigator !== 'undefined' && 'geolocation' in navigator
  const latencyMs = Math.round(performance.now() - start)
  return {
    name: 'Geolocation API',
    status: available ? 'healthy' : 'degraded',
    latencyMs,
    detail: available ? 'API present (permission not tested)' : 'Not available — will use Antarctica fallback',
  }
}

function deriveOverallStatus(checks: ComponentCheck[]): ComponentStatus {
  if (checks.some((c) => c.status === 'unhealthy')) return 'unhealthy'
  if (checks.some((c) => c.status === 'degraded')) return 'degraded'
  return 'healthy'
}

/** Run all diagnostic checks and return structured results. */
export async function runDiagnostics(): Promise<DiagnosticsResult> {
  const [apiCheck, storageCheck, webglCheck, geoCheck] = await Promise.all([
    checkOpenMeteoApi(),
    Promise.resolve(checkLocalStorage()),
    Promise.resolve(checkWebGL()),
    Promise.resolve(checkGeolocation()),
  ])

  const checks = [apiCheck, storageCheck, webglCheck, geoCheck]

  return {
    overall: deriveOverallStatus(checks),
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    checks,
  }
}
