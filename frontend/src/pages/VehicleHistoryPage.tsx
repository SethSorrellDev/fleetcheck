import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { api } from '../api/client'
import type {
  Vehicle,
  VehicleDispatchStatus,
  InspectionReport,
  Driver,
  RepairOrder,
  DamageMarking,
  ReportStatus,
  VehicleType,
} from '../api/types'

const statusStyles: Record<ReportStatus, string> = {
  SATISFACTORY: 'bg-clear/10 text-clear border-clear',
  REPAIR_REQUESTED: 'bg-safety/10 text-safety border-safety',
  REPAIR_COMPLETED: 'bg-steel/10 text-steel border-steel',
  REVIEWED_CLOSED: 'bg-clear/10 text-clear border-clear',
}

const vehicleTypeLabels: Record<VehicleType, string> = {
  STEP_VAN: 'Step Van',
  BOX_TRUCK: 'Box Truck',
}

export function VehicleHistoryPage() {
  const { id } = useParams<{ id: string }>()
  const vehicleId = Number(id)

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [dispatchStatus, setDispatchStatus] = useState<VehicleDispatchStatus | null>(null)
  const [reports, setReports] = useState<InspectionReport[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [repairOrders, setRepairOrders] = useState<RepairOrder[]>([])
  const [damageMarkings, setDamageMarkings] = useState<DamageMarking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!vehicleId) return
    Promise.all([
      api.get<Vehicle>(`/vehicles/${vehicleId}`),
      api.get<VehicleDispatchStatus>(`/vehicles/${vehicleId}/dispatch-status`),
      api.get<InspectionReport[]>(`/inspection-reports/by-vehicle/${vehicleId}`),
      api.get<Driver[]>('/drivers'),
      api.get<RepairOrder[]>('/repair-orders'),
      api.get<DamageMarking[]>('/damage-markings'),
    ])
      .then(([vehicleData, dispatchData, reportsData, driversData, repairOrdersData, markingsData]) => {
        setVehicle(vehicleData)
        setDispatchStatus(dispatchData)
        setReports(reportsData)
        setDrivers(driversData)
        setRepairOrders(repairOrdersData)
        setDamageMarkings(markingsData)
      })
      .catch(() => setError('Could not load this vehicle.'))
      .finally(() => setLoading(false))
  }, [vehicleId])

  function driverNameFor(driverId: number): string {
    const d = drivers.find((d) => d.id === driverId)
    return d ? `${d.firstName} ${d.lastName}` : `#${driverId}`
  }

  function repairOrderFor(reportId: number): RepairOrder | undefined {
    return repairOrders.find((ro) => ro.inspectionReportId === reportId)
  }

  function markingsFor(reportId: number): DamageMarking[] {
    return damageMarkings.filter((m) => m.inspectionReportId === reportId)
  }

  const sortedReports = [...reports].sort((a, b) => (a.inspectionDate < b.inspectionDate ? 1 : -1))

  if (loading) {
    return (
      <AppShell>
        <p className="font-mono text-sm text-steel">Loading…</p>
      </AppShell>
    )
  }

  if (error || !vehicle) {
    return (
      <AppShell>
        <p className="border-l-4 border-alert bg-alert/10 px-4 py-3 font-sans text-sm text-alert">
          {error ?? 'Vehicle not found.'}
        </p>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-graphite">
            {vehicle.unitNumber}
          </h2>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-steel">
            {vehicleTypeLabels[vehicle.vehicleType]} · {vehicle.make} {vehicle.model} {vehicle.year ?? ''}
          </p>
          <p className="mt-1 font-sans text-sm text-steel">
            {vehicle.assignedRoute ?? 'Unassigned'} · {vehicle.licensePlate ?? 'No plate on file'} ·{' '}
            {vehicle.currentOdometer?.toLocaleString() ?? '—'} mi
          </p>
        </div>
        {dispatchStatus && (
          <span
            className={`inline-block rounded border-2 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide ${
              dispatchStatus.dispatchable
                ? 'border-clear bg-clear/10 text-clear'
                : 'border-alert bg-alert/10 text-alert'
            }`}
          >
            {dispatchStatus.dispatchable ? 'Dispatchable' : 'Blocked from dispatch'}
          </span>
        )}
      </div>

      <h3 className="mt-10 font-sans text-sm font-semibold uppercase tracking-wide text-graphite">
        Inspection History — {sortedReports.length} report{sortedReports.length === 1 ? '' : 's'}
      </h3>

      {sortedReports.length === 0 ? (
        <p className="mt-3 font-sans text-sm text-steel">No inspection reports for this vehicle yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {sortedReports.map((r) => {
            const order = repairOrderFor(r.id)
            const markings = markingsFor(r.id)
            return (
              <li key={r.id} className="rounded border border-steel/30 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-sans text-sm text-graphite">
                    <span className="font-mono">{r.inspectionDate}</span> — {driverNameFor(r.driverId)}, odometer{' '}
                    {r.odometerReading?.toLocaleString() ?? '—'}
                  </p>
                  <span
                    className={`inline-block rounded border px-2 py-1 font-mono text-xs uppercase tracking-wide ${statusStyles[r.status]}`}
                  >
                    {r.status.replace('_', ' ')}
                  </span>
                </div>

                {r.requiresRepair && (
                  <div className="mt-3 border-t border-steel/20 pt-3">
                    <p className="font-mono text-xs uppercase tracking-wide text-steel">
                      {r.repairType?.replace('_', '-')} repair
                    </p>
                    <p className="mt-1 font-sans text-sm text-graphite">"{r.repairDescription}"</p>

                    {markings.length > 0 && (
                      <p className="mt-2 font-sans text-xs text-steel">
                        {markings.length} damage marking{markings.length === 1 ? '' : 's'}:{' '}
                        {markings.map((m) => `${m.damageType} (${m.viewAngle})`).join(', ')}
                      </p>
                    )}

                    {order && (
                      <div className="mt-2 rounded bg-paper px-3 py-2 font-sans text-xs text-steel">
                        <p>Work performed: "{order.workPerformedDescription}"</p>
                        {order.completedByName && <p className="mt-1">By {order.completedByName}</p>}
                        {order.completedAt && <p>Completed {order.completedAt.replace('T', ' ')}</p>}
                        {order.driverReviewedAt && <p>Reviewed {order.driverReviewedAt.replace('T', ' ')}</p>}
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </AppShell>
  )
}
