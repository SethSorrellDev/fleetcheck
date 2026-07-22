import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { user, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 border-b-4 border-safety pb-4">
          <h1 className="font-display text-4xl font-bold uppercase tracking-wide text-graphite">
            FleetCheck
          </h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-steel">
            Driver Vehicle Inspection Report
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoFocus
              className="w-full rounded border border-steel/40 bg-white px-3 py-2 font-mono text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block font-sans text-sm font-medium text-graphite">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded border border-steel/40 bg-white px-3 py-2 font-mono text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
            />
          </div>

          {error && (
            <p role="alert" className="border-l-4 border-alert bg-alert/10 px-3 py-2 font-sans text-sm text-alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-graphite px-4 py-2 font-sans text-sm font-semibold uppercase tracking-wide text-paper transition hover:bg-graphite/90 disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 font-mono text-xs text-steel/70">
          Dev accounts: driver1 / driver2 / mechanic1 / manager1 — password123
        </p>
      </div>
    </div>
  )
}
