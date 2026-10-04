import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { registerWithIdentity } from '../auth/tokens'

export function LoginPage() {
  const { user, login } = useAuth()
  const [mode, setMode] = useState<'signin' | 'register'>('signin')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
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
      if (mode === 'register') {
        await registerWithIdentity(email, password, firstName, lastName)
      }
      await login(email, password)
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
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="mb-1 block font-sans text-sm font-medium text-graphite">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full rounded border border-steel/40 bg-white px-3 py-2 font-mono text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1 block font-sans text-sm font-medium text-graphite">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full rounded border border-steel/40 bg-white px-3 py-2 font-mono text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block font-sans text-sm font-medium text-graphite">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {submitting
              ? mode === 'register' ? 'Creating account…' : 'Signing in…'
              : mode === 'register' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'register' : 'signin')
            setError(null)
          }}
          className="mt-4 font-sans text-sm text-steel underline hover:text-graphite"
        >
          {mode === 'signin' ? 'Create an account' : 'Already have an account? Sign in'}
        </button>

        {mode === 'register' && (
          <p className="mt-3 font-sans text-xs text-steel">
            New accounts need a FleetCheck administrator to assign a role before they can use the app.
          </p>
        )}

      </div>
    </div>
  )
}
