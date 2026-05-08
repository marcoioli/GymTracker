import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { db } from '../../db/database'
import { BackupPage } from './BackupPage'

describe('BackupPage', () => {
  it('shows a clear validation error when the selected file is incompatible', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <BackupPage />
      </MemoryRouter>
    )

    const input = screen.getByLabelText(/seleccionar archivo de backup/i)
    const invalidFile = new File([JSON.stringify({ nope: true })], 'broken.json', { type: 'application/json' })

    await user.upload(input, invalidFile)

    expect(await screen.findByRole('alert')).toHaveTextContent(/backup local válido|formato json esperado/i)
    expect(screen.queryByRole('button', { name: /reemplazar mis datos locales/i })).not.toBeInTheDocument()
  })

  it('requires confirmation before replacing current local data with a valid backup', async () => {
    const user = userEvent.setup()

    await db.routines.add({
      id: 'current-routine',
      name: 'Rutina actual',
      status: 'active',
      weekCount: 1,
      weeks: [],
      progress: { currentWeekIndex: 0, lastCompletedDayId: null, lastCompletedAt: null },
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z'
    })

    render(
      <MemoryRouter>
        <BackupPage />
      </MemoryRouter>
    )

    const validFile = new File(
      [
        JSON.stringify({
          kind: 'gymtracker-backup',
          version: 1,
          exportedAt: '2026-05-05T12:00:00.000Z',
          appState: [{ key: 'activeRoutineId', value: 'restored-routine' }],
          routines: [
            {
              id: 'restored-routine',
              name: 'Rutina restaurada',
              status: 'paused',
              weekCount: 1,
              weeks: [],
              progress: { currentWeekIndex: 0, lastCompletedDayId: null, lastCompletedAt: null },
              createdAt: '2026-05-05T12:00:00.000Z',
              updatedAt: '2026-05-05T12:00:00.000Z'
            }
          ],
          exerciseCatalog: [],
          sessions: []
        })
      ],
      'backup.json',
      { type: 'application/json' }
    )

    await user.upload(screen.getByLabelText(/seleccionar archivo de backup/i), validFile)

    expect(await screen.findByRole('heading', { name: /listo para restaurar/i })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/reemplaza tus datos locales actuales/i)

    await user.click(screen.getByRole('button', { name: /sí, reemplazar mis datos locales/i }))

    await waitFor(async () => {
      expect(await db.routines.get('current-routine')).toBeUndefined()
      expect(await db.routines.get('restored-routine')).toEqual(expect.objectContaining({ name: 'Rutina restaurada' }))
    })

    expect(await screen.findByRole('status')).toHaveTextContent(/backup restaurado/i)
  })
})
