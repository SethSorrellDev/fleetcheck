import { useEffect, useState, type FormEvent } from 'react'
import { AppShell } from '../components/AppShell'
import { api } from '../api/client'
import type { Account, Driver, Role } from '../api/types'

const roleLabels: Record<Role, string> = {
  DRIVER: 'Driver',
  MECHANIC: 'Mechanic',
  FLEET_MANAGER: 'Fleet Manager',
  ADMIN: 'Admin',
}

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [driverId, setDriverId] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function loadData() {
    setLoading(true)
    Promise.all([api.get<Account[]>('/accounts'), api.get<Driver[]>('/drivers')])
      .then(([accountsData, driversData]) => {
        setAccounts(accountsData)
        setDrivers(driversData)
      })
      .catch(() => setLoadError('Could not load accounts.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  function driverNameFor(id: number | null): string {
    if (id === null) return '—'
    const d = drivers.find((d) => d.id === id)
    return d ? `${d.firstName} ${d.lastName}` : `#${id}`
  }

  function resetForm() {
    setUsername('')
    setPassword('')
    setRole('')
    setDriverId('')
    setSubmitError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!role) {
      setSubmitError('Select a role for this account.')
      return
    }

    setSubmitting(true)
    try {
      await api.post<Account>('/accounts', {
        username: username.trim(),
        password,
        role,
        driverId: role === 'DRIVER' && driverId ? Number(driverId) : null,
        active: true,
      })
      resetForm()
      loadData()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not create the account.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(account: Account) {
    try {
      await api.put(`/accounts/${account.id}`, {
        username: account.username,
        role: account.role,
        driverId: account.driverId,
        active: !account.active,
      })
      loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update the account.')
    }
  }

  return (
    <AppShell>
      <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-graphite">
        Accounts
      </h2>
      <p className="mt-1 font-mono text-xs uppercase tracking-wider text-steel">
        User Administration
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4 rounded border border-steel/30 bg-white p-6">
        <h3 className="font-sans text-sm font-semibold uppercase tracking-wide text-graphite">
          Create Account
        </h3>

        <div>
          <label htmlFor="username" className="mb-1 block font-sans text-sm font-medium text-graphite">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full rounded border border-steel/40 bg-white px-3 py-2 font-mono text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block font-sans text-sm font-medium text-graphite">
            Temporary Password
          </label>
          <input
            id="password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded border border-steel/40 bg-white px-3 py-2 font-mono text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
          />
        </div>

        <div>
          <label htmlFor="role" className="mb-1 block font-sans text-sm font-medium text-graphite">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            required
            className="w-full rounded border border-steel/40 bg-white px-3 py-2 font-mono text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
          >
            <option value="" disabled>Select a role</option>
            {(Object.keys(roleLabels) as Role[]).map((r) => (
              <option key={r} value={r}>{roleLabels[r]}</option>
            ))}
          </select>
        </div>

        {role === 'DRIVER' && (
          <div>
            <label htmlFor="driverLink" className="mb-1 block font-sans text-sm font-medium text-graphite">
              Link to Driver Record (optional)
            </label>
            <select
              id="driverLink"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full rounded border border-steel/40 bg-white px-3 py-2 font-mono text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
            >
              <option value="">No driver link</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.firstName} {d.lastName} ({d.employeeId})</option>
              ))}
            </select>
          </div>
        )}

        {submitError && (
          <p role="alert" className="border-l-4 border-alert bg-alert/10 px-3 py-2 font-sans text-sm text-alert">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-graphite px-4 py-2 font-sans text-sm font-semibold uppercase tracking-wide text-paper transition hover:bg-graphite/90 disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create Account'}
        </button>
      </form>

      <h3 className="mt-10 font-sans text-sm font-semibold uppercase tracking-wide text-graphite">
        Existing Accounts
      </h3>

      {loadError && (
        <p className="mt-2 border-l-4 border-alert bg-alert/10 px-3 py-2 font-sans text-sm text-alert">{loadError}</p>
      )}

      {!loading && !loadError && (
        <div className="mt-4 overflow-x-auto rounded border border-steel/30 bg-white">
          <table className="w-full min-w-[600px] text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-steel/30 font-mono text-xs uppercase tracking-wider text-steel">
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Linked Driver</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-steel/10 last:border-0">
                  <td className="px-4 py-3 font-mono text-graphite">{a.username}</td>
                  <td className="px-4 py-3 font-mono text-xs text-steel">{roleLabels[a.role]}</td>
                  <td className="px-4 py-3 text-steel">{driverNameFor(a.driverId)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded border px-2 py-1 font-mono text-xs uppercase tracking-wide ${
                        a.active ? 'border-clear bg-clear/10 text-clear' : 'border-alert bg-alert/10 text-alert'
                      }`}
                    >
                      {a.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(a)}
                      className="font-sans text-xs font-semibold uppercase tracking-wide text-steel hover:text-safety"
                    >
                      {a.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  )
}
