import { useEffect, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { api } from '../api/client'
import type { InspectionReport, Vehicle, Driver, RepairOrder } from '../api/types'

export function MechanicQueuePage() {
  const [reports, setReports] = useState<InspectionReport[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [repairOrders, setRepairOrders] = useState<RepairOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [expandedReportId, setExpandedReportId] = useState<number | null>(null)
  const [workDescription, setWorkDescription] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    setLoading(true)
    Promise.all([
      api.get<InspectionReport[]>('/inspection-reports/queue'),
      api.get<Vehicle[]>('/vehicles'),
      api.get<Driver[]>('/drivers'),
      api.get<RepairOrder[]>('/repair-orders'),
    ])
      .then(([reportsData, vehiclesData, driversData, repairOrdersData]) => {
        setReports(reportsData)
        setVehicles(vehiclesData)
        setDrivers(driversData)
        setRepairOrders(repairOrdersData)
      })
      .catch(() => setError('Could not load the repair queue.'))
      .finally(() => setLoading(false))
  }

  function unitNumberFor(vehicleId: number): string {
    return vehicles.find((v) => v.id === vehicleId)?.unitNumber ?? `#${vehicleId}`
  }

  function driverNameFor(driverId: number): string {
    const d = drivers.find((d) => d.id === driverId)
    return d ? `${d.firstName} ${d.lastName}` : `#${driverId}`
  }

  function repairOrderFor(reportId: number): RepairOrder | undefined {
    return repairOrders.find((ro) => ro.inspectionReportId === reportId)
  }

  const needsRepairOrder = reports
    .filter((r) => r.status === 'REPAIR_REQUESTED' && !repairOrderFor(r.id))
    .sort((a, b) => (a.inspectionDate < b.inspectionDate ? -1 : 1))

  const readyToComplete = reports
    .filter((r) => r.status === 'REPAIR_REQUESTED' && repairOrderFor(r.id))
    .sort((a, b) => (a.inspectionDate < b.inspectionDate ? -1 : 1))

  const awaitingReview = reports
    .filter((r) => r.status === 'REPAIR_COMPLETED')
    .sort((a, b) => (a.inspectionDate < b.inspectionDate ? -1 : 1))

  async function handleStartRepair(reportId: number) {
    if (!workDescription.trim()) {
      setActionError('Describe the work being performed before saving.')
      return
    }
    setSubmitting(true)
    setActionError(null)
    try {
      const order = await api.post<RepairOrder>('/repair-orders', {
        inspectionReportId: reportId,
        workPerformedDescription: workDescription.trim(),
      })
      setRepairOrders((prev) => [...prev, order])
      setExpandedReportId(null)
      setWorkDescription('')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save the repair order.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCompleteRepair(reportId: number) {
    setSubmitting(true)
    setActionError(null)
    try {
      const updated = await api.post<InspectionReport>(`/inspection-reports/${reportId}/complete-repair`)
      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not complete the repair.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell>
      <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-graphite">
        Repair Queue
      </h2>
      <p className="mt-1 font-sans text-sm text-steel">
        {loading
          ? 'Loading…'
          : `${needsRepairOrder.length + readyToComplete.length} open repair${
              needsRepairOrder.length + readyToComplete.length === 1 ? '' : 's'
            }, ${awaitingReview.length} awaiting driver review.`}
      </p>

      {error && (
        <p className="mt-4 border-l-4 border-alert bg-alert/10 px-3 py-2 font-sans text-sm text-alert">{error}</p>
      )}

      {!loading && !error && (
        <>
          <section className="mt-8">
            <h3 className="font-sans text-sm font-semibold uppercase tracking-wide text-safety">
              Needs Repair Order — {needsRepairOrder.length}
            </h3>
            {needsRepairOrder.length === 0 ? (
              <p className="mt-2 font-sans text-sm text-steel">Nothing waiting here.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {needsRepairOrder.map((r) => (
                  <li key={r.id} className="rounded border-2 border-safety/40 bg-safety/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-sm font-semibold text-graphite">
                          {unitNumberFor(r.vehicleId)} — {r.repairType?.replace('_', '-')}
                        </p>
                        <p className="mt-1 font-sans text-sm text-steel">
                          Reported by {driverNameFor(r.driverId)} on {r.inspectionDate}
                        </p>
                        <p className="mt-1 font-sans text-sm text-graphite">"{r.repairDescription}"</p>
                      </div>
                      <button
                        onClick={() => {
                          setExpandedReportId(expandedReportId === r.id ? null : r.id)
                          setWorkDescription('')
                          setActionError(null)
                        }}
                        className="shrink-0 rounded bg-graphite px-3 py-2 font-sans text-xs font-semibold uppercase tracking-wide text-paper hover:bg-graphite/90"
                      >
                        {expandedReportId === r.id ? 'Cancel' : 'Start Repair'}
                      </button>
                    </div>

                    {expandedReportId === r.id && (
                      <div className="mt-3 border-t border-safety/30 pt-3">
                        <label className="mb-1 block font-sans text-sm font-medium text-graphite">
                          Work being performed
                        </label>
                        <textarea
                          value={workDescription}
                          onChange={(e) => setWorkDescription(e.target.value)}
                          rows={3}
                          placeholder="e.g. Replacing front brake pads and rotors"
                          className="w-full rounded border border-steel/40 bg-white px-3 py-2 font-sans text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
                        />
                        {actionError && <p className="mt-2 font-sans text-xs text-alert">{actionError}</p>}
                        <button
                          onClick={() => handleStartRepair(r.id)}
                          disabled={submitting}
                          className="mt-2 rounded bg-graphite px-4 py-2 font-sans text-xs font-semibold uppercase tracking-wide text-paper disabled:opacity-50"
                        >
                          Save Repair Order
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <h3 className="font-sans text-sm font-semibold uppercase tracking-wide text-steel">
              Ready to Complete — {readyToComplete.length}
            </h3>
            {readyToComplete.length === 0 ? (
              <p className="mt-2 font-sans text-sm text-steel">Nothing waiting here.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {readyToComplete.map((r) => {
                  const order = repairOrderFor(r.id)
                  return (
                    <li key={r.id} className="rounded border border-steel/30 bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-mono text-sm font-semibold text-graphite">{unitNumberFor(r.vehicleId)}</p>
                          <p className="mt-1 font-sans text-sm text-steel">
                            Work order: "{order?.workPerformedDescription}"
                          </p>
                        </div>
                        <button
                          onClick={() => handleCompleteRepair(r.id)}
                          disabled={submitting}
                          className="shrink-0 rounded bg-clear px-3 py-2 font-sans text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
                        >
                          Mark Complete
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <h3 className="font-sans text-sm font-semibold uppercase tracking-wide text-steel">
              Awaiting Driver Review — {awaitingReview.length}
            </h3>
            {awaitingReview.length === 0 ? (
              <p className="mt-2 font-sans text-sm text-steel">Nothing waiting here.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {awaitingReview.map((r) => (
                  <li
                    key={r.id}
                    className="rounded border border-steel/20 bg-white px-4 py-3 font-sans text-sm text-steel"
                  >
                    <span className="font-mono text-graphite">{unitNumberFor(r.vehicleId)}</span> — repair
                    completed, waiting for {driverNameFor(r.driverId)} to review and close.
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AppShell>
  )
}
