import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { api } from '../api/client'
import type { Vehicle, VehicleType } from '../api/types'

const vehicleTypeLabels: Record<VehicleType, string> = {
  STEP_VAN: 'Step Van',
  BOX_TRUCK: 'Box Truck',
}

export function NewVehiclePage() {
  const [unitNumber, setUnitNumber] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [assignedRoute, setAssignedRoute] = useState('')
  const [currentOdometer, setCurrentOdometer] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<Vehicle | null>(null)

  function resetForAddAnother() {
    setResult(null)
    setUnitNumber('')
    setVehicleType('')
    setMake('')
    setModel('')
    setYear('')
    setLicensePlate('')
    setAssignedRoute('')
    setCurrentOdometer('')
    setSubmitError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!vehicleType) {
      setSubmitError('Select whether this is a step van or box truck.')
      return
    }

    setSubmitting(true)
    try {
      const vehicle = await api.post<Vehicle>('/vehicles', {
        unitNumber: unitNumber.trim(),
        vehicleType,
        make: make.trim() || null,
        model: model.trim() || null,
        year: year ? Number(year) : null,
        licensePlate: licensePlate.trim() || null,
        assignedRoute: assignedRoute.trim() || null,
        currentOdometer: currentOdometer ? Number(currentOdometer) : null,
        active: true,
      })
      setResult(vehicle)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not add the vehicle.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <AppShell>
        <div className="max-w-md">
          <div className="border-l-4 border-clear bg-clear/10 px-4 py-3 font-sans text-sm text-graphite">
            <p className="font-semibold">Vehicle added</p>
            <p className="mt-1 text-steel">
              Unit <span className="font-mono text-graphite">{result.unitNumber}</span> —{' '}
              {vehicleTypeLabels[result.vehicleType]}
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
        Add Vehicle
      </h2>
      <p className="mt-1 font-mono text-xs uppercase tracking-wider text-steel">
        Fleet Roster
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-6">
        <div>
          <label htmlFor="unitNumber" className="mb-1 block font-sans text-sm font-medium text-graphite">
            Unit Number
          </label>
          <input
            id="unitNumber"
            type="text"
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            required
            placeholder="e.g. FRK-1275"
            className="w-full rounded border border-steel/40 bg-white px-3 py-3 font-mono text-base text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
          />
        </div>

        <div>
          <span className="mb-2 block font-sans text-sm font-medium text-graphite">Vehicle type</span>
          <div className="grid grid-cols-2 gap-3">
            {(['STEP_VAN', 'BOX_TRUCK'] as VehicleType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setVehicleType(type)}
                className={`rounded border-2 px-4 py-4 font-sans text-sm font-semibold uppercase tracking-wide transition ${
                  vehicleType === type
                    ? 'border-safety bg-safety/10 text-safety'
                    : 'border-steel/30 text-steel hover:border-steel/60'
                }`}
              >
                {vehicleTypeLabels[type]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="make" className="mb-1 block font-sans text-sm font-medium text-graphite">
              Make
            </label>
            <input
              id="make"
              type="text"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="w-full rounded border border-steel/40 bg-white px-3 py-3 font-sans text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
            />
          </div>
          <div>
            <label htmlFor="model" className="mb-1 block font-sans text-sm font-medium text-graphite">
              Model
            </label>
            <input
              id="model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded border border-steel/40 bg-white px-3 py-3 font-sans text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="year" className="mb-1 block font-sans text-sm font-medium text-graphite">
              Year
            </label>
            <input
              id="year"
              type="number"
              inputMode="numeric"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded border border-steel/40 bg-white px-3 py-3 font-mono text-base text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
            />
          </div>
          <div>
            <label htmlFor="licensePlate" className="mb-1 block font-sans text-sm font-medium text-graphite">
              License Plate
            </label>
            <input
              id="licensePlate"
              type="text"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="w-full rounded border border-steel/40 bg-white px-3 py-3 font-mono text-base text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="assignedRoute" className="mb-1 block font-sans text-sm font-medium text-graphite">
              Assigned Route
            </label>
            <input
              id="assignedRoute"
              type="text"
              value={assignedRoute}
              onChange={(e) => setAssignedRoute(e.target.value)}
              placeholder="e.g. Frankfort Route 3"
              className="w-full rounded border border-steel/40 bg-white px-3 py-3 font-sans text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
            />
          </div>
          <div>
            <label htmlFor="currentOdometer" className="mb-1 block font-sans text-sm font-medium text-graphite">
              Current Odometer
            </label>
            <input
              id="currentOdometer"
              type="number"
              inputMode="numeric"
              min={0}
              value={currentOdometer}
              onChange={(e) => setCurrentOdometer(e.target.value)}
              className="w-full rounded border border-steel/40 bg-white px-3 py-3 font-mono text-base text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
            />
          </div>
        </div>

        {submitError && (
          <p role="alert" className="border-l-4 border-alert bg-alert/10 px-3 py-2 font-sans text-sm text-alert">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-graphite px-4 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-paper transition hover:bg-graphite/90 disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add Vehicle'}
        </button>
      </form>
    </AppShell>
  )
}
