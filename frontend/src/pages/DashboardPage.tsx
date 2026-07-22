import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { useAuth } from '../auth/AuthContext'

export function DashboardPage() {
  const { user } = useAuth()
  const canViewReports = user?.role === 'MECHANIC' || user?.role === 'FLEET_MANAGER' || user?.role === 'ADMIN'
  const isMechanic = user?.role === 'MECHANIC'
  const isManager = user?.role === 'FLEET_MANAGER'
  const isAdmin = user?.role === 'ADMIN'

  return (
    <AppShell>
      <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-graphite">
        Dashboard
      </h2>
      <p className="mt-2 font-sans text-sm text-steel">
        Signed in as <span className="font-mono text-graphite">{user?.username}</span> — role{' '}
        <span className="font-mono text-graphite">{user?.role}</span>.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {user?.role === 'DRIVER' && (
          <Link
            to="/inspections/new"
            className="inline-block rounded bg-safety px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-graphite transition hover:bg-safety/90"
          >
            File New Inspection Report
          </Link>
        )}
        {isMechanic && (
          <Link
            to="/queue"
            className="inline-block rounded bg-safety px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-graphite transition hover:bg-safety/90"
          >
            Repair Queue
          </Link>
        )}
        {canViewReports && (
          <Link
            to="/reports"
            className="inline-block rounded border-2 border-graphite px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-graphite transition hover:bg-graphite hover:text-paper"
          >
            View Inspection Reports
          </Link>
        )}
        {canViewReports && (
          <Link
            to="/vehicles"
            className="inline-block rounded border-2 border-graphite px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-graphite transition hover:bg-graphite hover:text-paper"
          >
            Fleet Overview
          </Link>
        )}
        {isManager && (
          <Link
            to="/vehicles/new"
            className="inline-block rounded border-2 border-graphite px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-graphite transition hover:bg-graphite hover:text-paper"
          >
            Add Vehicle
          </Link>
        )}
        {isAdmin && (
          <Link
            to="/accounts"
            className="inline-block rounded border-2 border-graphite px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-graphite transition hover:bg-graphite hover:text-paper"
          >
            Manage Accounts
          </Link>
        )}
      </div>
    </AppShell>
  )
}
