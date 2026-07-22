import { useState, type MouseEvent } from 'react'
import type { DamageType, ViewAngle } from '../api/types'

export interface DamageMarkingDraft {
  tempId: string
  viewAngle: ViewAngle
  xCoordinate: number
  yCoordinate: number
  damageType: DamageType
  notes: string
}

interface DamageMarkerEditorProps {
  value: DamageMarkingDraft[]
  onChange: (markers: DamageMarkingDraft[]) => void
}

const damageLegend: Record<DamageType, { code: string; label: string }> = {
  CHIP: { code: 'C', label: 'Chip' },
  HOLE: { code: 'H', label: 'Hole' },
  DENT: { code: 'D', label: 'Dent' },
  BROKEN: { code: 'BR', label: 'Broken' },
  MISSING: { code: 'M', label: 'Missing' },
  SCRATCH: { code: 'S', label: 'Scratch' },
  RUST: { code: 'R', label: 'Rust' },
  OTHER: { code: 'OT', label: 'Other' },
}

const viewBoxes: Record<ViewAngle, { width: number; height: number }> = {
  FRONT: { width: 300, height: 200 },
  SIDE: { width: 500, height: 220 },
  REAR: { width: 300, height: 200 },
}

const viewLabels: Record<ViewAngle, string> = {
  FRONT: 'Front',
  SIDE: 'Side',
  REAR: 'Rear',
}

export function DamageMarkerEditor({ value, onChange }: DamageMarkerEditorProps) {
  const [activeView, setActiveView] = useState<ViewAngle>('SIDE')
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null)
  const [pendingType, setPendingType] = useState<DamageType | ''>('')
  const [pendingNotes, setPendingNotes] = useState('')

  const vb = viewBoxes[activeView]

  function handleSvgClick(e: MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * vb.width)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * vb.height)
    setPending({ x, y })
    setPendingType('')
    setPendingNotes('')
  }

  function confirmMarker() {
    if (!pending || !pendingType) return
    const marker: DamageMarkingDraft = {
      tempId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      viewAngle: activeView,
      xCoordinate: pending.x,
      yCoordinate: pending.y,
      damageType: pendingType,
      notes: pendingNotes.trim(),
    }
    onChange([...value, marker])
    setPending(null)
    setPendingType('')
    setPendingNotes('')
  }

  function cancelPending() {
    setPending(null)
    setPendingType('')
    setPendingNotes('')
  }

  function removeMarker(tempId: string) {
    onChange(value.filter((m) => m.tempId !== tempId))
  }

  const markersForView = value.filter((m) => m.viewAngle === activeView)

  return (
    <div>
      <div className="flex gap-2">
        {(['FRONT', 'SIDE', 'REAR'] as ViewAngle[]).map((view) => {
          const count = value.filter((m) => m.viewAngle === view).length
          return (
            <button
              key={view}
              type="button"
              onClick={() => {
                setActiveView(view)
                setPending(null)
              }}
              className={`rounded border-2 px-4 py-2 font-mono text-xs uppercase tracking-wide transition ${
                activeView === view
                  ? 'border-safety bg-safety/10 text-safety'
                  : 'border-steel/30 text-steel hover:border-steel/60'
              }`}
            >
              {viewLabels[view]}
              {count > 0 && <span className="ml-1 text-graphite">({count})</span>}
            </button>
          )
        })}
      </div>

      <div className="mt-3 rounded border border-steel/30 bg-white p-3">
        <svg
          viewBox={`0 0 ${vb.width} ${vb.height}`}
          onClick={handleSvgClick}
          className="w-full cursor-crosshair"
          style={{ maxHeight: 220 }}
        >
          <TruckOutline view={activeView} />
          {markersForView.map((m) => (
            <g key={m.tempId}>
              <circle
                cx={m.xCoordinate}
                cy={m.yCoordinate}
                r={11}
                fill="var(--color-safety)"
                stroke="var(--color-graphite)"
                strokeWidth={1.5}
              />
              <text
                x={m.xCoordinate}
                y={m.yCoordinate}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9}
                fontFamily="var(--font-mono)"
                fontWeight={700}
                fill="var(--color-graphite)"
              >
                {damageLegend[m.damageType].code}
              </text>
            </g>
          ))}
          {pending && (
            <circle
              cx={pending.x}
              cy={pending.y}
              r={11}
              fill="none"
              stroke="var(--color-alert)"
              strokeWidth={2}
              strokeDasharray="3,2"
            />
          )}
        </svg>
      </div>

      <p className="mt-2 font-mono text-xs text-steel">
        Tap the diagram to mark a location. C=Chip · H=Hole · D=Dent · BR=Broken · M=Missing · S=Scratch · R=Rust · OT=Other
      </p>

      {pending && (
        <div className="mt-3 rounded border-2 border-alert/40 bg-alert/5 p-4">
          <p className="font-sans text-sm font-medium text-graphite">What kind of damage is marked here?</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {(Object.keys(damageLegend) as DamageType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPendingType(type)}
                className={`rounded border-2 px-2 py-2 font-mono text-xs uppercase transition ${
                  pendingType === type
                    ? 'border-safety bg-safety/10 text-safety'
                    : 'border-steel/30 text-steel hover:border-steel/60'
                }`}
              >
                {damageLegend[type].code} · {damageLegend[type].label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={pendingNotes}
            onChange={(e) => setPendingNotes(e.target.value)}
            placeholder="Optional note (e.g. rear panel near taillight)"
            className="mt-3 w-full rounded border border-steel/40 bg-white px-3 py-2 font-sans text-sm text-graphite outline-none focus:border-safety focus:ring-2 focus:ring-safety/30"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={confirmMarker}
              disabled={!pendingType}
              className="rounded bg-graphite px-4 py-2 font-sans text-xs font-semibold uppercase tracking-wide text-paper disabled:opacity-40"
            >
              Add Marker
            </button>
            <button
              type="button"
              onClick={cancelPending}
              className="rounded border border-steel/40 px-4 py-2 font-sans text-xs font-semibold uppercase tracking-wide text-graphite"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {value.length > 0 && (
        <ul className="mt-4 space-y-1">
          {value.map((m) => (
            <li
              key={m.tempId}
              className="flex items-center justify-between rounded border border-steel/20 bg-white px-3 py-2 font-sans text-xs"
            >
              <span className="text-graphite">
                <span className="font-mono text-safety">{damageLegend[m.damageType].code}</span>{' '}
                {damageLegend[m.damageType].label} — {viewLabels[m.viewAngle]}
                {m.notes && <span className="text-steel"> · "{m.notes}"</span>}
              </span>
              <button
                type="button"
                onClick={() => removeMarker(m.tempId)}
                className="font-semibold uppercase text-alert hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TruckOutline({ view }: { view: ViewAngle }) {
  const stroke = 'var(--color-graphite)'
  const fill = 'var(--color-paper)'

  if (view === 'FRONT') {
    return (
      <g stroke={stroke} strokeWidth={2.5} fill={fill}>
        <rect x={60} y={30} width={180} height={135} rx={16} />
        <rect x={78} y={46} width={144} height={46} rx={6} fill="white" />
        <rect x={90} y={102} width={120} height={22} fill="none" />
        <circle cx={90} cy={100} r={6} fill="var(--color-safety)" stroke={stroke} strokeWidth={1.5} />
        <circle cx={210} cy={100} r={6} fill="var(--color-safety)" stroke={stroke} strokeWidth={1.5} />
        <circle cx={95} cy={172} r={20} fill={stroke} />
        <circle cx={205} cy={172} r={20} fill={stroke} />
      </g>
    )
  }

  if (view === 'REAR') {
    return (
      <g stroke={stroke} strokeWidth={2.5} fill={fill}>
        <rect x={60} y={30} width={180} height={135} rx={16} />
        <line x1={150} y1={40} x2={150} y2={155} strokeWidth={2} />
        <rect x={72} y={55} width={68} height={80} rx={4} fill="none" />
        <rect x={160} y={55} width={68} height={80} rx={4} fill="none" />
        <rect x={90} y={98} width={16} height={8} fill="var(--color-alert)" stroke="none" />
        <rect x={194} y={98} width={16} height={8} fill="var(--color-alert)" stroke="none" />
        <circle cx={95} cy={172} r={20} fill={stroke} />
        <circle cx={205} cy={172} r={20} fill={stroke} />
      </g>
    )
  }

  return (
    <g stroke={stroke} strokeWidth={2.5} fill={fill}>
      <path d="M 40 60 Q 40 40 60 40 L 400 40 Q 430 40 430 70 L 430 150 L 40 150 Z" />
      <rect x={55} y={55} width={55} height={42} rx={5} fill="white" />
      <line x1={125} y1={65} x2={125} y2={150} strokeWidth={1.5} />
      <rect x={20} y={62} width={20} height={10} rx={3} />
      <circle cx={110} cy={172} r={22} fill={stroke} />
      <circle cx={365} cy={172} r={22} fill={stroke} />
    </g>
  )
}
