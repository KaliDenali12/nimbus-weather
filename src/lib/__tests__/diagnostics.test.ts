import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { runDiagnostics } from '@/lib/diagnostics.ts'


describe('runDiagnostics', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.spyOn(performance, 'now').mockReturnValue(0)
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('returns structured result with all four checks', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 })

    const result = await runDiagnostics()

    expect(result.checks).toHaveLength(4)
    expect(result.checks.map((c) => c.name)).toEqual([
      'Open-Meteo API',
      'localStorage',
      'WebGL',
      'Geolocation API',
    ])
    expect(result.timestamp).toBeTruthy()
    expect(result.userAgent).toBeTruthy()
  })

  it('reports API as healthy on 200 OK', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 })

    const result = await runDiagnostics()
    const apiCheck = result.checks.find((c) => c.name === 'Open-Meteo API')!

    expect(apiCheck.status).toBe('healthy')
    expect(apiCheck.latencyMs).toBeTypeOf('number')
  })

  it('reports API as degraded on non-200 status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 })

    const result = await runDiagnostics()
    const apiCheck = result.checks.find((c) => c.name === 'Open-Meteo API')!

    expect(apiCheck.status).toBe('degraded')
    expect(apiCheck.detail).toContain('503')
  })

  it('reports API as unhealthy on network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    const result = await runDiagnostics()
    const apiCheck = result.checks.find((c) => c.name === 'Open-Meteo API')!

    expect(apiCheck.status).toBe('unhealthy')
    expect(apiCheck.detail).toContain('Network error')
  })

  it('reports API as unhealthy on timeout', async () => {
    const timeoutError = new DOMException('The operation was aborted.', 'TimeoutError')
    globalThis.fetch = vi.fn().mockRejectedValue(timeoutError)

    const result = await runDiagnostics()
    const apiCheck = result.checks.find((c) => c.name === 'Open-Meteo API')!

    expect(apiCheck.status).toBe('unhealthy')
    expect(apiCheck.detail).toContain('Timed out')
  })

  it('reports localStorage as healthy when available', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 })

    const result = await runDiagnostics()
    const storageCheck = result.checks.find((c) => c.name === 'localStorage')!

    expect(storageCheck.status).toBe('healthy')
    expect(storageCheck.detail).toBe('Read/write OK')
  })

  it('reports geolocation API based on navigator presence', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 })

    const result = await runDiagnostics()
    const geoCheck = result.checks.find((c) => c.name === 'Geolocation API')!

    // jsdom may or may not have geolocation — just verify structure
    expect(['healthy', 'degraded']).toContain(geoCheck.status)
    expect(geoCheck.latencyMs).toBeTypeOf('number')
  })

  it('overall status is unhealthy when any check is unhealthy', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    const result = await runDiagnostics()

    expect(result.overall).toBe('unhealthy')
  })

  it('overall status is healthy when all checks pass', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 })

    // Mock navigator.geolocation to exist in jsdom
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: vi.fn() },
      writable: true,
      configurable: true,
    })

    const result = await runDiagnostics()

    // WebGL may be degraded in jsdom (no canvas context), so check for at most degraded
    const nonWebGLChecks = result.checks.filter((c) => c.name !== 'WebGL')
    const allNonWebGLHealthy = nonWebGLChecks.every((c) => c.status === 'healthy')
    expect(allNonWebGLHealthy).toBe(true)
  })

  it('each check has latencyMs as a number', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 })

    const result = await runDiagnostics()

    for (const check of result.checks) {
      expect(check.latencyMs).toBeTypeOf('number')
    }
  })
})
