import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { DamageMarkerEditor, type DamageMarkingDraft } from '../components/DamageMarkerEditor'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api/client'
import type { Vehicle, RepairType, InspectionReport } from '../api/types'

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

const repairTypeStyles: Record<RepairType, string> = {
  SAFETY: 'border-safety bg-safety/10 text-safety',
  NON_SAFETY: 'border-steel bg-steel/10 text-steel',
  BOTH: 'border-alert bg-alert/10 text-alert',
}

export function NewInspectionPage() {
  const { user } = useAuth()

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [vehicleId, setVehicleId] = useState('')
  const [inspectionDate, setInspectionDate] = useState(todayIsoDate())
  const [odometerReading, setOdometerReading] = useState('')
  const [satisfactory, setSatisfactory] = useState(true)
  const [repairType, setRepairType] = useState<RepairType | ''>('')
  const [repairDescription, setRepairDescription] = useState('')
  const [damageMarkings, setDamageMarkings] = useState<DamageMarkingDraft[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<InspectionReport | null>(null)
  const [markerWarning, setMarkerWarning] = useState<string | null>(null)
  const [markersRecorded, setMarkersRecorded] = useState(0)

  useEffect(() => {
    api
      .get<Vehicle[]>('/vehicles')
      .then((data) => setVehicles(data.filter((v) => v.active)))
      .catch(() => setLoadError('Could not load the vehicle list.'))
      .finally(() => setLoadingVehicles(false))
  }, [])

  function resetForFileAnother() {
    setResult(null)
    setVehicleId('')
    setOdometerReading('')
    setSatisfactory(true)
    setRepairType('')
    setRepairDescription('')
    setDamageMarkings([])
    setSubmitError(null)
    setMarkerWarning(null)
    setMarkersRecorded(0)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!satisfactory && !repairType) {
      setSubmitError('Select what kind of repair this vehicle needs.')
      return
    }
    if (!satisfactory && !repairDescription.trim()) {
      setSubmitError('Describe what needs repair.')
      return
    }

    setSubmitting(true)
    try {
      const report = await api.post<InspectionReport>('/inspection-reports', {
        vehicleId: Number(vehicleId),
        driverId: user?.driverId,
        inspectionDate,
        odometerReading: Number(odometerReading),
        conditionSatisfactory: satisfactory,
        requiresRepair: !satisfactory,
        repairType: satisfactory ? null : repairType,
        repairDescription: satisfactory ? null : repairDescription.trim(),
      })

      if (!satisfactory && damageMarkings.length > 0) {
        try {
          await Promise.all(
            damageMarkings.map((m) =>
              api.post('/damage-markings', {
                inspectionReportId: report.id,
                damageType: m.damageType,
                viewAngle: m.viewAngle,
                xCoordinate: m.xCoordinate,
                yCoordinate: m.yCoordinate,
                notes: m.notes || null,
              })
            )
          )
          setMarkersRecorded(damageMarkings.length)
        } catch {
          setMarkerWarning('Report filed, but one or more damage markers failed to save.')
        }
      }

      setResult(report)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit the report.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user?.driverId) {
    return (
      <AppShell>
        <p className="border-l-4 border-alert bg-alert/10 px-4 py-3 font-sans text-sm text-alert">
          This account isn't linked to a driver record, so it can't file inspection reports.
        </p>
      </AppShell>
    )
  }

  if (result) {
    const needsRepair = result.requiresRepair
    return (
      <AppShell>
        <div className="max-w-md">
          <div
            className={`border-l-4 px-4 py-3 font-sans text-sm ${
              needsRepair ? 'border-safety bg-safety/10 text-graphite' : 'border-clear bg-clear/10 text-graphite'
            }`}
          >
            <p className="font-semibold">
              {needsRepair ? 'Report filed — flagged for repair' : 'Report filed — vehicle satisfactory'}
            </p>
            <p className="mt-1 text-steel">
              Unit {vehicles.find((v) => v.id === result.vehicleId)?.unitNumber ?? result.vehicleId}, status{' '}
              <span className="font-mono">{result.status}</span>.
            </p>
            {result.repairDescription && <p className="mt-2 text-graphite">"{result.repairDescription}"</p>}
            {markersRecorded > 0 && !markerWarning && (
              <p className="mt-2 text-steel">
                {markersRecorded} damage marking{markersRecorded === 1 ? '' : 's'} recorded.
              </p>
            )}
            {markerWarning && <p className="mt-2 text-alert">{markerWarning}</p>}
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={resetForFileAnother}
              className="rounded bg-graphite px-4 py-2 font-sans text-sm font-semibold uppercase tracking-wide text-paper hover:bg-graphite/90"
            >
              File another
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
        New Inspection
      </h2>
      <p className="mt-1 font-mono text-xs uppercase tracking-wider text-steel">
        Driver Vehicle Inspection Report
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-6">
        <div>
          <label htmlFor="vehicle" className="mb-1 block font-sans text-sm font-medium text-graphite">
            Vehicle No.
          </label>
          {loadError ? (
            <p className="text-sm text-alert">{loadError}</p>
          ) : (
            <select
              id="vehicle"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
              disabled={loadingVehicles}
              className="w-full rounded border border-steel/40 bg-white px-3 py-3 font-mono text-base text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
            >
              <option value="" disabled>
                {loadingVehicles ? 'Loading…' : 'Select a vehicle'}
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.unitNumber} — {v.assignedRoute ?? 'Unassigned'}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="odometer" className="mb-1 block font-sans text-sm font-medium text-graphite">
              Ending Odometer
            </label>
            <input
              id="odometer"
              type="number"
              inputMode="numeric"
              min={0}
              value={odometerReading}
              onChange={(e) => setOdometerReading(e.target.value)}
              required
              className="w-full rounded border border-steel/40 bg-white px-3 py-3 font-mono text-base text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
            />
          </div>
          <div>
            <label htmlFor="date" className="mb-1 block font-sans text-sm font-medium text-graphite">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              required
              className="w-full rounded border border-steel/40 bg-white px-3 py-3 font-mono text-base text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
            />
          </div>
        </div>

        <div>
          <span className="mb-2 block font-sans text-sm font-medium text-graphite">Vehicle condition</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setSatisfactory(true)
                setRepairType('')
                setRepairDescription('')
                setDamageMarkings([])
              }}
              className={`rounded border-2 px-4 py-4 font-sans text-sm font-semibold uppercase tracking-wide transition ${
                satisfactory ? 'border-clear bg-clear/10 text-clear' : 'border-steel/30 text-steel hover:border-steel/60'
              }`}
            >
              ✓ Satisfactory
            </button>
            <button
              type="button"
              onClick={() => setSatisfactory(false)}
              className={`rounded border-2 px-4 py-4 font-sans text-sm font-semibold uppercase tracking-wide transition ${
                !satisfactory ? 'border-safety bg-safety/10 text-safety' : 'border-steel/30 text-steel hover:border-steel/60'
              }`}
            >
              ⚠ Needs attention
            </button>
          </div>
        </div>

        {!satisfactory && (
          <>
            <div>
              <span className="mb-2 block font-sans text-sm font-medium text-graphite">Repair type required</span>
              <div className="grid grid-cols-3 gap-3">
                {(['SAFETY', 'NON_SAFETY', 'BOTH'] as RepairType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRepairType(type)}
                    className={`rounded border-2 px-2 py-3 font-mono text-xs uppercase tracking-wide transition ${
                      repairType === type ? repairTypeStyles[type] : 'border-steel/30 text-steel hover:border-steel/60'
                    }`}
                  >
                    {type.replace('_', '-')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="repairDescription" className="mb-1 block font-sans text-sm font-medium text-graphite">
                What needs repair?
              </label>
              <textarea
                id="repairDescription"
                value={repairDescription}
                onChange={(e) => setRepairDescription(e.target.value)}
                required
                rows={4}
                placeholder="e.g. Grinding noise from front brakes when stopping"
                className="w-full rounded border border-steel/40 bg-white px-3 py-3 font-sans text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
              />
            </div>

            <div>
              <span className="mb-2 block font-sans text-sm font-medium text-graphite">
                Mark damage on the vehicle (optional)
              </span>
              <DamageMarkerEditor value={damageMarkings} onChange={setDamageMarkings} />
            </div>
          </>
        )}

        {submitError && (
          <p role="alert" className="border-l-4 border-alert bg-alert/10 px-3 py-2 font-sans text-sm text-alert">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || loadingVehicles}
          className="w-full rounded bg-graphite px-4 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-paper transition hover:bg-graphite/90 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>
      </form>
    </AppShell>
  )
}
