import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'
import { api, ApiError } from '../api/client'
import { AUTH_EXPIRED_EVENT, loginWithIdentity } from './tokens'

vi.mock('../api/client', () => {
  class ApiError extends Error {
    status: number
    validationErrors: string[] | null = null
    constructor(body: { status: number; message: string }) {
      super(body.message)
      this.status = body.status
    }
  }
  return { api: { get: vi.fn() }, ApiError }
})

vi.mock('./tokens', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./tokens')>()
  return { ...actual, loginWithIdentity: vi.fn() }
})

const ACCESS_KEY = 'fleetcheck-access-token'
const REFRESH_KEY = 'fleetcheck-refresh-token'

function storeFakeTokens() {
  sessionStorage.setItem(ACCESS_KEY, 'access')
  sessionStorage.setItem(REFRESH_KEY, 'refresh')
}

function TestConsumer() {
  const { user, isLoading, login, logout } = useAuth()
  const [error, setError] = useState('')

  async function handleLogin() {
    try {
      await login('driver@example.com', 'pw')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown')
    }
  }

  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="user">{user ? `${user.username}:${user.role}` : 'none'}</span>
      <span data-testid="error">{error}</span>
      <button onClick={handleLogin}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  )
}

const driver = { username: 'driver1', role: 'DRIVER', driverId: 1 }

async function renderReady() {
  render(<AuthProvider><TestConsumer /></AuthProvider>)
  await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'))
}

describe('AuthContext', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('starts with no user and does not call /me when there is no session', async () => {
    await renderReady()
    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(api.get).not.toHaveBeenCalled()
  })

  it('login signs in through identity-service and loads the FleetCheck user', async () => {
    ;(loginWithIdentity as any).mockImplementation(async () => storeFakeTokens())
    ;(api.get as any).mockResolvedValue(driver)
    await renderReady()

    await userEvent.click(screen.getByText('login'))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('driver1:DRIVER'))
    expect(loginWithIdentity).toHaveBeenCalledWith('driver@example.com', 'pw')
    expect(sessionStorage.getItem(ACCESS_KEY)).not.toBeNull()
  })

  it('stays logged out and surfaces the message when identity-service rejects the login', async () => {
    ;(loginWithIdentity as any).mockRejectedValue(new Error('Invalid email or password.'))
    await renderReady()

    await userEvent.click(screen.getByText('login'))

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Invalid email or password.'))
    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(api.get).not.toHaveBeenCalled()
  })

  it('shows the not-authorized message and clears tokens on a 403 from /me', async () => {
    ;(loginWithIdentity as any).mockImplementation(async () => storeFakeTokens())
    ;(api.get as any).mockRejectedValue(
      new (ApiError as any)({ status: 403, message: "This account isn't authorized to use FleetCheck." }),
    )
    await renderReady()

    await userEvent.click(screen.getByText('login'))

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent("This account isn't authorized to use FleetCheck."),
    )
    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(sessionStorage.getItem(ACCESS_KEY)).toBeNull()
    expect(sessionStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('logout clears tokens and resets the user', async () => {
    ;(loginWithIdentity as any).mockImplementation(async () => storeFakeTokens())
    ;(api.get as any).mockResolvedValue(driver)
    await renderReady()
    await userEvent.click(screen.getByText('login'))
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('driver1:DRIVER'))

    await userEvent.click(screen.getByText('logout'))

    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(sessionStorage.getItem(ACCESS_KEY)).toBeNull()
    expect(sessionStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('restores a stored session by validating it against /me on mount', async () => {
    storeFakeTokens()
    ;(api.get as any).mockResolvedValue(driver)

    render(<AuthProvider><TestConsumer /></AuthProvider>)

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('driver1:DRIVER'))
    expect(api.get).toHaveBeenCalledWith('/me')
  })

  it('clears the user when the session-expired event fires', async () => {
    storeFakeTokens()
    ;(api.get as any).mockResolvedValue(driver)
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('driver1:DRIVER'))

    act(() => {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    })

    expect(screen.getByTestId('user')).toHaveTextContent('none')
  })
})
