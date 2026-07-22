import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api/client'
import type { InspectionReport, Vehicle, Driver, ReportStatus } from '../api/types'

const statusStyles: Record<ReportStatus, string> = {
  SATISFACTORY: 'bg-clear/10 text-clear border-clear',
  REPAIR_REQUESTED: 'bg-safety/10 text-safety border-safety',
  REPAIR_COMPLETED: 'bg-steel/10 text-steel border-steel',
  REVIEWED_CLOSED: 'bg-clear/10 text-clear border-clear',
}

export function ReportsListPage() {
  const { user } = useAuth()
  const canDelete = user?.role === 'FLEET_MANAGER' || user?.role === 'ADMIN'

  const [reports, setReports] = useState<InspectionReport[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReports()
  }, [])

  function loadReports() {
    setLoading(true)
    Promise.all([
      api.get<InspectionReport[]>('/inspection-reports'),
      api.get<Vehicle[]>('/vehicles'),
      api.get<Driver[]>('/drivers'),
    ])
      .then(([reportsData, vehiclesData, driversData]) => {
        setReports([...reportsData].sort((a, b) => (a.inspectionDate < b.inspectionDate ? 1 : -1)))
        setVehicles(vehiclesData)
        setDrivers(driversData)
      })
      .catch(() => setError('Could not load inspection reports.'))
      .finally(() => setLoading(false))
  }

  function vehicleFor(vehicleId: number): Vehicle | undefined {
    return vehicles.find((v) => v.id === vehicleId)
  }

  function driverNameFor(driverId: number): string {
    const d = drivers.find((d) => d.id === driverId)
    return d ? `${d.firstName} ${d.lastName}` : `#${driverId}`
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this inspection report? This cannot be undone.')) return
    try {
      await api.delete(`/inspection-reports/${id}`)
      setReports((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete the report.')
    }
  }

  return (
    <AppShell>
      <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-graphite">
        Inspection Reports
      </h2>
      <p className="mt-1 font-sans text-sm text-steel">
        {loading ? 'Loading…' : `${reports.length} report${reports.length === 1 ? '' : 's'} on file.`}
      </p>

      {error && (
        <p className="mt-4 border-l-4 border-alert bg-alert/10 px-3 py-2 font-sans text-sm text-alert">{error}</p>
      )}

      {!loading && !error && (
        <div className="mt-6 overflow-x-auto rounded border border-steel/30 bg-white">
          <table className="w-full min-w-[720px] text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-steel/30 font-mono text-xs uppercase tracking-wider text-steel">
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Odometer</th>
                <th className="px-4 py-3">Repair Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Description</th>
                {canDelete && <th className="px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const vehicle = vehicleFor(r.vehicleId)
                return (
                  <tr key={r.id} className="border-b border-steel/10 last:border-0">
                    <td className="px-4 py-3 font-mono">
                      {vehicle ? (
                        <Link to={`/vehicles/${vehicle.id}`} className="text-graphite hover:text-safety hover:underline">
                          {vehicle.unitNumber}
                        </Link>
                      ) : (
                        <span className="text-graphite">#{r.vehicleId}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-graphite">{driverNameFor(r.driverId)}</td>
                    <td className="px-4 py-3 font-mono text-steel">{r.inspectionDate}</td>
                    <td className="px-4 py-3 font-mono text-steel">{r.odometerReading ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-steel">
                      {r.repairType ? r.repairType.replace('_', '-') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded border px-2 py-1 font-mono text-xs uppercase tracking-wide ${statusStyles[r.status]}`}
                      >
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-steel">{r.repairDescription ?? '—'}</td>
                    {canDelete && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="font-sans text-xs font-semibold uppercase tracking-wide text-alert hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={canDelete ? 8 : 7} className="px-4 py-6 text-center text-steel">
                    No inspection reports yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  )
}
