import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api, ApiError } from './client'

describe('api client', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends GET requests and returns the parsed body', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 1 }),
    }
    ;(fetch as any).mockResolvedValue(mockResponse)

    const result = await api.get('/vehicles')

    expect(fetch).toHaveBeenCalledWith('/api/vehicles', expect.objectContaining({}))
    expect(result).toEqual({ id: 1 })
  })

  it('adds an Authorization header when credentials exist in sessionStorage', async () => {
    sessionStorage.setItem('fleetcheck-credentials', 'ZHJpdmVyMTpwYXNzd29yZA==')
    const mockResponse = {
      ok: true, status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
    }
    ;(fetch as any).mockResolvedValue(mockResponse)

    await api.get('/vehicles')

    const headers = (fetch as any).mock.calls[0][1].headers
    expect(headers.Authorization).toBe('Basic ZHJpdmVyMTpwYXNzd29yZA==')
  })

  it('omits the Authorization header when no credentials are stored', async () => {
    const mockResponse = {
      ok: true, status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
    }
    ;(fetch as any).mockResolvedValue(mockResponse)

    await api.get('/vehicles')

    const headers = (fetch as any).mock.calls[0][1].headers
    expect(headers.Authorization).toBeUndefined()
  })

  it('serializes the request body for POST', async () => {
    const mockResponse = {
      ok: true, status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 5 }),
    }
    ;(fetch as any).mockResolvedValue(mockResponse)

    await api.post('/vehicles', { unitNumber: 'FRK-9999' })

    const callArgs = (fetch as any).mock.calls[0]
    expect(callArgs[1].method).toBe('POST')
    expect(callArgs[1].body).toBe(JSON.stringify({ unitNumber: 'FRK-9999' }))
  })

  it('returns undefined for 204 No Content responses', async () => {
    const mockResponse = {
      ok: true, status: 204,
      headers: new Headers(),
      json: async () => { throw new Error('should not be called') },
    }
    ;(fetch as any).mockResolvedValue(mockResponse)

    const result = await api.delete('/vehicles/1')

    expect(result).toBeUndefined()
  })

  it('throws an ApiError with the server message on a JSON error response', async () => {
    const errorBody = {
      timestamp: '2026-01-01T00:00:00',
      status: 404,
      error: 'Not Found',
      message: 'Vehicle not found with id: 999',
      path: '/api/vehicles/999',
      validationErrors: null,
    }
    const mockResponse = {
      ok: false, status: 404,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => errorBody,
    }
    ;(fetch as any).mockResolvedValue(mockResponse)

    await expect(api.get('/vehicles/999')).rejects.toThrow(ApiError)
    await expect(api.get('/vehicles/999')).rejects.toThrow('Vehicle not found with id: 999')
  })

  it('throws a generic Error when the failed response has no JSON body', async () => {
    const mockResponse = {
      ok: false, status: 401,
      headers: new Headers(),
      json: async () => { throw new Error('no body') },
    }
    ;(fetch as any).mockResolvedValue(mockResponse)

    await expect(api.get('/vehicles')).rejects.toThrow('Request failed with status 401')
  })
})
