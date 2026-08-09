import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { DamageMarkerEditor, type DamageMarkingDraft } from './DamageMarkerEditor'

function Wrapper() {
  const [markers, setMarkers] = useState<DamageMarkingDraft[]>([])
  return <DamageMarkerEditor value={markers} onChange={setMarkers} />
}

describe('DamageMarkerEditor', () => {
  it('shows the three view tabs', () => {
    render(<Wrapper />)
    expect(screen.getByText('Front')).toBeInTheDocument()
    expect(screen.getByText('Side')).toBeInTheDocument()
    expect(screen.getByText('Rear')).toBeInTheDocument()
  })

  it('opens the damage-type picker after clicking the diagram', async () => {
    render(<Wrapper />)
    await userEvent.click(document.querySelector('svg')!)
    expect(screen.getByText('What kind of damage is marked here?')).toBeInTheDocument()
  })

  it('disables Add Marker until a damage type is selected', async () => {
    render(<Wrapper />)
    await userEvent.click(document.querySelector('svg')!)
    expect(screen.getByText('Add Marker')).toBeDisabled()
  })

  it('adds a marker to the list after selecting a type and confirming', async () => {
    render(<Wrapper />)
    await userEvent.click(document.querySelector('svg')!)
    await userEvent.click(screen.getByText(/C · Chip/))
    await userEvent.click(screen.getByText('Add Marker'))

    expect(screen.getByText(/Chip — Side/)).toBeInTheDocument()
  })

  it('removes a marker when Remove is clicked', async () => {
    render(<Wrapper />)
    await userEvent.click(document.querySelector('svg')!)
    await userEvent.click(screen.getByText(/S · Scratch/))
    await userEvent.click(screen.getByText('Add Marker'))
    expect(screen.getByText(/Scratch — Side/)).toBeInTheDocument()

    await userEvent.click(screen.getByText('Remove'))
    expect(screen.queryByText(/Scratch — Side/)).not.toBeInTheDocument()
  })
})
