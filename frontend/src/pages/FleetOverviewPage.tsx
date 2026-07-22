import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { api } from '../api/client'
import type { Vehicle, VehicleDispatchStatus, VehicleType } from '../api/types'

const vehicleTypeLabels: Record<VehicleType, string> = {
  STEP_VAN: 'Step Van',
  BOX_TRUCK: 'Box Truck',
}

export function FleetOverviewPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [statuses, setStatuses] = useState<Record<number, VehicleDispatchStatus>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<Vehicle[]>('/vehicles')
      .then(async (vehiclesData) => {
        setVehicles(vehiclesData)
        const results = await Promise.all(
          vehiclesData.map((v) => api.get<VehicleDispatchStatus>(`/vehicles/${v.id}/dispatch-status`))
        )
        const map: Record<number, VehicleDispatchStatus> = {}
        results.forEach((s) => {
          map[s.vehicleId] = s
        })
        setStatuses(map)
      })
      .catch(() => setError('Could not load the fleet.'))
      .finally(() => setLoading(false))
  }, [])

  const dispatchableCount = Object.values(statuses).filter((s) => s.dispatchable).length
  const blockedCount = Object.values(statuses).filter((s) => !s.dispatchable).length

  return (
    <AppShell>
      <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-graphite">
        Fleet Overview
      </h2>

      {!loading && !error && (
        <p className="mt-1 font-sans text-sm text-steel">
          {vehicles.length} vehicles — {dispatchableCount} dispatchable, {blockedCount} blocked.
        </p>
      )}

      {error && (
        <p className="mt-4 border-l-4 border-alert bg-alert/10 px-3 py-2 font-sans text-sm text-alert">{error}</p>
      )}

      {!loading && !error && (
        <div className="mt-6 overflow-x-auto rounded border border-steel/30 bg-white">
          <table className="w-full min-w-[600px] text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-steel/30 font-mono text-xs uppercase tracking-wider text-steel">
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Odometer</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => {
                const status = statuses[v.id]
                return (
                  <tr key={v.id} className="border-b border-steel/10 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        to={`/vehicles/${v.id}`}
                        className="font-mono text-graphite hover:text-safety hover:underline"
                      >
                        {v.unitNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-steel">{vehicleTypeLabels[v.vehicleType]}</td>
                    <td className="px-4 py-3 text-steel">{v.assignedRoute ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-steel">
                      {v.currentOdometer?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {status ? (
                        <span
                          className={`inline-block rounded border px-2 py-1 font-mono text-xs uppercase tracking-wide ${
                            status.dispatchable
                              ? 'border-clear bg-clear/10 text-clear'
                              : 'border-alert bg-alert/10 text-alert'
                          }`}
                        >
                          {status.dispatchable ? 'Dispatchable' : 'Blocked'}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  )
}
