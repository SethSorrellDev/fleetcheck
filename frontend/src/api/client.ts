import { AUTH_EXPIRED_EVENT, clearTokens, getAccessToken, refreshTokens } from '../auth/tokens'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface ErrorResponse {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  validationErrors: string[] | null
}

export class ApiError extends Error {
  status: number
  validationErrors: string[] | null

  constructor(body: ErrorResponse) {
    super(body.message)
    this.status = body.status
    this.validationErrors = body.validationErrors
  }
}

async function send(path: string, options: RequestInit): Promise<Response> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers })
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response = await send(path, options)

  if (response.status === 401 && getAccessToken() !== null) {
    if (await refreshTokens()) {
      response = await send(path, options)
    }
    if (response.status === 401) {
      clearTokens()
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    if (body && typeof body === 'object' && 'message' in body) {
      throw new ApiError(body as ErrorResponse)
    }
    throw new Error(`Request failed with status ${response.status}`)
  }

  return body as T
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}
