import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, ApiError } from '../api/client'
import { AUTH_EXPIRED_EVENT, clearTokens, hasSession, loginWithIdentity } from './tokens'

interface CurrentUser {
  username: string
  role: 'DRIVER' | 'MECHANIC' | 'FLEET_MANAGER' | 'ADMIN' | string
  driverId: number | null
}

interface AuthContextValue {
  user: CurrentUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    function onExpired() {
      setUser(null)
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)

    if (!hasSession()) {
      setIsLoading(false)
    } else {
      api
        .get<CurrentUser>('/me')
        .then(setUser)
        .catch(() => clearTokens())
        .finally(() => setIsLoading(false))
    }
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  async function login(email: string, password: string) {
    await loginWithIdentity(email, password)
    try {
      setUser(await api.get<CurrentUser>('/me'))
    } catch (err) {
      clearTokens()
      if (err instanceof ApiError && err.status === 403) {
        throw new Error(err.message)
      }
      throw new Error('Could not load your FleetCheck account. Please try again.')
    }
  }

  function logout() {
    clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
