import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { api } from '../api/client'
import type { Driver } from '../api/types'

export function NewDriverPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [employeeId, setEmployeeId] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<Driver | null>(null)

  function resetForAddAnother() {
    setResult(null)
    setFirstName('')
    setLastName('')
    setEmployeeId('')
    setSubmitError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setSubmitting(true)
    try {
      const driver = await api.post<Driver>('/drivers', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        employeeId: employeeId.trim(),
        active: true,
      })
      setResult(driver)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not add the driver.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <AppShell>
        <div className="max-w-md">
          <div className="border-l-4 border-clear bg-clear/10 px-4 py-3 font-sans text-sm text-graphite">
            <p className="font-semibold">Driver added</p>
            <p className="mt-1 text-steel">
              {result.firstName} {result.lastName} — employee ID{' '}
              <span className="font-mono text-graphite">{result.employeeId}</span>
            </p>
            <p className="mt-2 text-steel">
              Go to <span className="font-medium text-graphite">Accounts</span> to link this driver to a login, if one exists yet.
            </p>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={resetForAddAnother}
              className="rounded bg-graphite px-4 py-2 font-sans text-sm font-semibold uppercase tracking-wide text-paper hover:bg-graphite/90"
            >
              Add another
            </button>
            <Link
              to="/"
              className="rounded border border-steel/40 px-4 py-2 font-sans text-sm font-semibold uppercase tracking-wide text-graphite hover:border-safety"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-graphite">
        Add Driver
      </h2>
      <p className="mt-1 font-mono text-xs uppercase tracking-wider text-steel">
        Driver Roster
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
        <div>
          <label htmlFor="firstName" className="mb-1 block font-sans text-sm font-medium text-graphite">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full rounded border border-steel/40 bg-white px-3 py-2 font-sans text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1 block font-sans text-sm font-medium text-graphite">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full rounded border border-steel/40 bg-white px-3 py-2 font-sans text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
          />
        </div>
        <div>
          <label htmlFor="employeeId" className="mb-1 block font-sans text-sm font-medium text-graphite">
            Employee ID
          </label>
          <input
            id="employeeId"
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
            placeholder="e.g. E10234"
            className="w-full rounded border border-steel/40 bg-white px-3 py-2 font-mono text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
          />
        </div>

        {submitError && (
          <p role="alert" className="border-l-4 border-alert bg-alert/10 px-3 py-2 font-sans text-sm text-alert">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-graphite px-4 py-2 font-sans text-sm font-semibold uppercase tracking-wide text-paper disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add Driver'}
        </button>
      </form>
    </AppShell>
  )
}
