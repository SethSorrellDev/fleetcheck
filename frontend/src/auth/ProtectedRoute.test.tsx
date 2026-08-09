import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import * as AuthContextModule from './AuthContext'

function renderProtected(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<div>Dashboard Page</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedRoles={['FLEET_MANAGER']}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('shows a loading state while auth status is undetermined', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null, isLoading: true, login: vi.fn(), logout: vi.fn(),
    })
    renderProtected('/protected')
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('redirects to /login when there is no authenticated user', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null, isLoading: false, login: vi.fn(), logout: vi.fn(),
    })
    renderProtected('/protected')
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('redirects to / when the user role is not in allowedRoles', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { username: 'driver1', role: 'DRIVER', driverId: 1 },
      isLoading: false, login: vi.fn(), logout: vi.fn(),
    })
    renderProtected('/protected')
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
  })

  it('renders the protected content when the role matches', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { username: 'manager1', role: 'FLEET_MANAGER', driverId: null },
      isLoading: false, login: vi.fn(), logout: vi.fn(),
    })
    renderProtected('/protected')
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('renders content for any authenticated user when no allowedRoles is specified', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { username: 'driver1', role: 'DRIVER', driverId: 1 },
      isLoading: false, login: vi.fn(), logout: vi.fn(),
    })
    render(
      <MemoryRouter initialEntries={['/open']}>
        <Routes>
          <Route path="/open" element={<ProtectedRoute><div>Open Content</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Open Content')).toBeInTheDocument()
  })
})
