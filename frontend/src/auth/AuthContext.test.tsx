import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'
import { api } from '../api/client'

vi.mock('../api/client', () => ({
  api: { get: vi.fn() },
}))

function TestConsumer() {
  const { user, isLoading, login, logout } = useAuth()

  async function handleLogin() {
    try {
      await login('driver1', 'password123')
    } catch {
      // LoginPage handles this in real usage; swallow here to isolate state assertions
    }
  }

  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="user">{user ? `${user.username}:${user.role}` : 'none'}</span>
      <button onClick={handleLogin}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('starts with no user once initial loading finishes', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'))
    expect(screen.getByTestId('user')).toHaveTextContent('none')
  })

  it('login stores credentials and sets the user on success', async () => {
    (api.get as any).mockResolvedValue({ username: 'driver1', role: 'DRIVER', driverId: 1 })

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'))

    await userEvent.click(screen.getByText('login'))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('driver1:DRIVER'))
    expect(sessionStorage.getItem('fleetcheck-credentials')).not.toBeNull()
  })

  it('clears stored credentials and stays logged out when login fails', async () => {
    (api.get as any).mockRejectedValue(new Error('401'))

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'))

    await userEvent.click(screen.getByText('login'))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'))
    expect(sessionStorage.getItem('fleetcheck-credentials')).toBeNull()
  })

  it('logout clears storage and resets the user', async () => {
    (api.get as any).mockResolvedValue({ username: 'driver1', role: 'DRIVER', driverId: 1 })

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'))
    await userEvent.click(screen.getByText('login'))
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('driver1:DRIVER'))

    await userEvent.click(screen.getByText('logout'))

    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(sessionStorage.getItem('fleetcheck-credentials')).toBeNull()
  })

  it('validates a previously-stored credential against /me on mount', async () => {
    sessionStorage.setItem('fleetcheck-credentials', 'ZHJpdmVyMTpwYXNzd29yZA==')
    ;(api.get as any).mockResolvedValue({ username: 'driver1', role: 'DRIVER', driverId: 1 })

    render(<AuthProvider><TestConsumer /></AuthProvider>)

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('driver1:DRIVER'))
    expect(api.get).toHaveBeenCalledWith('/me')
  })
})
