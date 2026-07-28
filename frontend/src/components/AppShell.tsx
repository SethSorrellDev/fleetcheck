import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const canViewReports = user?.role === 'MECHANIC' || user?.role === 'FLEET_MANAGER' || user?.role === 'ADMIN'
  const isMechanic = user?.role === 'MECHANIC'
  const isManager = user?.role === 'FLEET_MANAGER'
  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b-4 border-safety bg-graphite">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-display text-2xl font-bold uppercase tracking-wide text-paper">
              FleetCheck
            </Link>
            <nav className="hidden gap-4 font-sans text-sm text-paper/70 sm:flex">
              <Link to="/" className="hover:text-safety">Dashboard</Link>
              {canViewReports && <Link to="/reports" className="hover:text-safety">Reports</Link>}
              {isMechanic && <Link to="/queue" className="hover:text-safety">Queue</Link>}
              {canViewReports && <Link to="/vehicles" className="hover:text-safety">Fleet</Link>}
              {isManager && <Link to="/vehicles/new" className="hover:text-safety">Add Vehicle</Link>}
              {isManager && <Link to="/drivers/new" className="hover:text-safety">Add Driver</Link>}
              {isAdmin && <Link to="/accounts" className="hover:text-safety">Accounts</Link>}
            </nav>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs uppercase tracking-wider text-safety">
                {user.role} · {user.username}
              </span>
              <button
                onClick={logout}
                className="rounded border border-steel px-3 py-1 font-sans text-xs text-paper transition hover:border-safety hover:text-safety"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}
