import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api, ApiError } from './client'
import { AUTH_EXPIRED_EVENT } from '../auth/tokens'

const ACCESS_KEY = 'fleetcheck-access-token'
const REFRESH_KEY = 'fleetcheck-refresh-token'

function jsonResponse(status: number, body: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
  }
}

const unauthorized = {
  ok: false,
  status: 401,
  headers: new Headers(),
  json: async () => {
    throw new Error('no body')
  },
}

describe('api client', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends GET requests and returns the parsed body', async () => {
    ;(fetch as any).mockResolvedValue(jsonResponse(200, { id: 1 }))

    const result = await api.get('/vehicles')

    expect(fetch).toHaveBeenCalledWith('/api/vehicles', expect.objectContaining({}))
    expect(result).toEqual({ id: 1 })
  })

  it('adds a Bearer Authorization header when an access token is stored', async () => {
    sessionStorage.setItem(ACCESS_KEY, 'tok123')
    ;(fetch as any).mockResolvedValue(jsonResponse(200))

    await api.get('/vehicles')

    const headers = (fetch as any).mock.calls[0][1].headers
    expect(headers.Authorization).toBe('Bearer tok123')
  })

  it('omits the Authorization header when no token is stored', async () => {
    ;(fetch as any).mockResolvedValue(jsonResponse(200))

    await api.get('/vehicles')

    const headers = (fetch as any).mock.calls[0][1].headers
    expect(headers.Authorization).toBeUndefined()
  })

  it('serializes the request body for POST', async () => {
    ;(fetch as any).mockResolvedValue(jsonResponse(201, { id: 5 }))

    await api.post('/vehicles', { unitNumber: 'FRK-9999' })

    const callArgs = (fetch as any).mock.calls[0]
    expect(callArgs[1].method).toBe('POST')
    expect(callArgs[1].body).toBe(JSON.stringify({ unitNumber: 'FRK-9999' }))
  })

  it('returns undefined for 204 No Content responses', async () => {
    ;(fetch as any).mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
      json: async () => {
        throw new Error('should not be called')
      },
    })

    expect(await api.delete('/vehicles/1')).toBeUndefined()
  })

  it('throws an ApiError with the server message on a JSON error response', async () => {
    ;(fetch as any).mockResolvedValue(
      jsonResponse(404, {
        timestamp: '2026-01-01T00:00:00',
        status: 404,
        error: 'Not Found',
        message: 'Vehicle not found with id: 999',
        path: '/api/vehicles/999',
        validationErrors: null,
      }),
    )

    await expect(api.get('/vehicles/999')).rejects.toThrow(ApiError)
    await expect(api.get('/vehicles/999')).rejects.toThrow('Vehicle not found with id: 999')
  })

  it('throws a generic Error on a 401 with no stored session, without trying to refresh', async () => {
    ;(fetch as any).mockResolvedValue(unauthorized)

    await expect(api.get('/vehicles')).rejects.toThrow('Request failed with status 401')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('refreshes the tokens on a 401 and retries the request with the new access token', async () => {
    sessionStorage.setItem(ACCESS_KEY, 'old')
    sessionStorage.setItem(REFRESH_KEY, 'refresh1')
    ;(fetch as any)
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'new', refreshToken: 'refresh2' }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 1 }))

    const result = await api.get('/vehicles')

    expect(result).toEqual({ id: 1 })
    const refreshCall = (fetch as any).mock.calls[1]
    expect(refreshCall[0]).toContain('/auth/token/refresh')
    expect(JSON.parse(refreshCall[1].body)).toEqual({ refreshToken: 'refresh1' })
    expect((fetch as any).mock.calls[2][1].headers.Authorization).toBe('Bearer new')
    expect(sessionStorage.getItem(ACCESS_KEY)).toBe('new')
    expect(sessionStorage.getItem(REFRESH_KEY)).toBe('refresh2')
  })

  it('clears the session and fires the expired event when the refresh fails', async () => {
    sessionStorage.setItem(ACCESS_KEY, 'old')
    sessionStorage.setItem(REFRESH_KEY, 'dead')
    const onExpired = vi.fn()
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    ;(fetch as any)
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce({ ok: false, status: 401, headers: new Headers(), json: async () => ({}) })

    await expect(api.get('/vehicles')).rejects.toThrow()

    window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
    expect(onExpired).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem(ACCESS_KEY)).toBeNull()
    expect(sessionStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('shares a single refresh request between concurrent 401s', async () => {
    sessionStorage.setItem(ACCESS_KEY, 'old')
    sessionStorage.setItem(REFRESH_KEY, 'refresh1')
    let refreshCalls = 0
    ;(fetch as any).mockImplementation(async (url: string, init: RequestInit) => {
      if (String(url).includes('/auth/token/refresh')) {
        refreshCalls += 1
        return jsonResponse(200, { accessToken: 'new', refreshToken: 'refresh2' })
      }
      const auth = (init.headers as Record<string, string>).Authorization
      return auth === 'Bearer new' ? jsonResponse(200, { ok: true }) : unauthorized
    })

    await Promise.all([api.get('/a'), api.get('/b')])

    expect(refreshCalls).toBe(1)
  })
})
