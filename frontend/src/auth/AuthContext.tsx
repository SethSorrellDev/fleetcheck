import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../api/client'

interface CurrentUser {
  username: string
  role: 'DRIVER' | 'MECHANIC' | 'FLEET_MANAGER' | string
  driverId: number | null
}

interface AuthContextValue {
  user: CurrentUser | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const STORAGE_KEY = 'fleetcheck-credentials'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) {
      setIsLoading(false)
      return
    }
    api
      .get<CurrentUser>('/me')
      .then(setUser)
      .catch(() => sessionStorage.removeItem(STORAGE_KEY))
      .finally(() => setIsLoading(false))
  }, [])

  async function login(username: string, password: string) {
    const encoded = btoa(`${username}:${password}`)
    sessionStorage.setItem(STORAGE_KEY, encoded)
    try {
      const currentUser = await api.get<CurrentUser>('/me')
      setUser(currentUser)
    } catch {
      sessionStorage.removeItem(STORAGE_KEY)
      throw new Error('Invalid username or password.')
    }
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY)
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
