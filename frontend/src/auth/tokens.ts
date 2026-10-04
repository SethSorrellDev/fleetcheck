const IDENTITY_URL = import.meta.env.VITE_IDENTITY_URL || 'http://localhost:8081'
const ACCESS_KEY = 'fleetcheck-access-token'
const REFRESH_KEY = 'fleetcheck-refresh-token'

export const AUTH_EXPIRED_EVENT = 'fleetcheck-auth-expired'

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_KEY)
}

export function hasSession(): boolean {
  return sessionStorage.getItem(ACCESS_KEY) !== null || sessionStorage.getItem(REFRESH_KEY) !== null
}

export function clearTokens(): void {
  sessionStorage.removeItem(ACCESS_KEY)
  sessionStorage.removeItem(REFRESH_KEY)
}

function storeTokens(body: { accessToken: string; refreshToken: string }): void {
  sessionStorage.setItem(ACCESS_KEY, body.accessToken)
  sessionStorage.setItem(REFRESH_KEY, body.refreshToken)
}

export async function loginWithIdentity(email: string, password: string): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${IDENTITY_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    })
  } catch {
    throw new Error('Could not reach the sign-in service. It may be waking up, so try again in a minute.')
  }
  if (response.status === 401 || response.status === 400) {
    throw new Error('Invalid email or password.')
  }
  if (!response.ok) {
    throw new Error('Sign-in failed. Please try again.')
  }
  storeTokens(await response.json())
}

// Creates the identity-service account only. The caller signs in afterwards.
export async function registerWithIdentity(email: string, password: string): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${IDENTITY_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    })
  } catch {
    throw new Error('Could not reach the sign-in service. It may be waking up, so try again in a minute.')
  }
  if (response.status === 409) {
    throw new Error('An account with that email already exists. Try signing in instead.')
  }
  if (response.status === 400) {
    throw new Error('That email or password was rejected. Use a valid email and a longer password.')
  }
  if (!response.ok) {
    throw new Error('Could not create the account. Please try again.')
  }
}

let inFlight: Promise<boolean> | null = null

// Shared refresh: concurrent 401s trigger one request. Resolves true if new tokens were stored.
export function refreshTokens(): Promise<boolean> {
  if (inFlight) return inFlight
  const refreshToken = sessionStorage.getItem(REFRESH_KEY)
  if (!refreshToken) return Promise.resolve(false)

  inFlight = (async () => {
    try {
      const response = await fetch(`${IDENTITY_URL}/auth/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!response.ok) return false
      storeTokens(await response.json())
      return true
    } catch {
      return false
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}
