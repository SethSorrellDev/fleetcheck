import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const canViewReports = user?.role === 'MECHANIC' || user?.role === 'FLEET_MANAGER' || user?.role === 'ADMIN'
  const isMechanic = user?.role === 'MECHANIC'
  const isManager = user?.role === 'FLEET_MANAGER'
  const isAdmin = user?.role === 'ADMIN'

  const navLinks = (
    <>
      <Link to="/" className="hover:text-safety" onClick={() => setMenuOpen(false)}>Dashboard</Link>
      {canViewReports && <Link to="/reports" className="hover:text-safety" onClick={() => setMenuOpen(false)}>Reports</Link>}
      {isMechanic && <Link to="/queue" className="hover:text-safety" onClick={() => setMenuOpen(false)}>Queue</Link>}
      {canViewReports && <Link to="/vehicles" className="hover:text-safety" onClick={() => setMenuOpen(false)}>Fleet</Link>}
      {isManager && <Link to="/vehicles/new" className="hover:text-safety" onClick={() => setMenuOpen(false)}>Add Vehicle</Link>}
      {isManager && <Link to="/drivers/new" className="hover:text-safety" onClick={() => setMenuOpen(false)}>Add Driver</Link>}
      {isAdmin && <Link to="/accounts" className="hover:text-safety" onClick={() => setMenuOpen(false)}>Accounts</Link>}
    </>
  )

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b-4 border-safety bg-graphite">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-display text-xl font-bold uppercase tracking-wide text-paper sm:text-2xl">
              FleetCheck
            </Link>
            <nav className="hidden gap-4 font-sans text-sm text-paper/70 sm:flex">
              {navLinks}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="hidden font-mono text-xs uppercase tracking-wider text-safety sm:inline">
                  {user.role} · {user.username}
                </span>
                <button
                  onClick={logout}
                  className="hidden rounded border border-steel px-3 py-1 font-sans text-xs text-paper transition hover:border-safety hover:text-safety sm:block"
                >
                  Log out
                </button>
              </>
            )}
            {user && (
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                className="inline-flex items-center justify-center rounded p-2 text-paper hover:bg-paper/10 sm:hidden"
              >
                <span className="sr-only">Open main menu</span>
                {menuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {user && menuOpen && (
          <div id="mobile-menu" className="border-t border-steel/40 px-4 pb-4 pt-2 sm:hidden">
            <nav className="flex flex-col gap-3 font-sans text-sm text-paper/80">
              {navLinks}
            </nav>
            <div className="mt-4 flex items-center justify-between border-t border-steel/40 pt-3">
              <span className="font-mono text-xs uppercase tracking-wider text-safety">
                {user.role} · {user.username}
              </span>
              <button
                onClick={() => { setMenuOpen(false); logout() }}
                className="rounded border border-steel px-3 py-1 font-sans text-xs text-paper transition hover:border-safety hover:text-safety"
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
