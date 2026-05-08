import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { db } from '../../db/database'
import { DashboardPage } from './DashboardPage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('DashboardPage', () => {
  it('shows the suggested day and lets the user override it before starting', async () => {
    const user = userEvent.setup()
    const firstDayId = 'day-1'
    const secondDayId = 'day-2'

    await db.routines.add({
      id: 'routine-1',
      name: 'Upper Lower',
      status: 'active',
      weekCount: 1,
      weeks: [
        {
          id: 'week-1',
          label: 'Semana 1',
          days: [
            { id: firstDayId, label: 'Push', exercises: [{ id: 'exercise-1', name: 'Press banca', targetSets: 3, targetRir: 2 }] },
            { id: secondDayId, label: 'Pull', exercises: [{ id: 'exercise-2', name: 'Remo con barra', targetSets: 3, targetRir: 2 }] }
          ]
        }
      ],
      progress: {
        currentWeekIndex: 0,
        lastCompletedDayId: firstDayId,
        lastCompletedAt: '2026-05-05T10:00:00.000Z'
      },
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z'
    })

    await db.appState.put({ key: 'activeRoutineId', value: 'routine-1' })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    expect(await screen.findByText(/upper lower · semana 1 · pull/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /iniciar rutina/i }))

    expect(screen.getByRole('dialog', { name: /confirmá el día/i })).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: /confirmá el día/i })).toHaveTextContent(/sugerido/i)

    await user.click(screen.getByText(/semana 1 · push/i))
    await user.click(screen.getByRole('button', { name: /iniciar push/i }))

    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate.mock.calls[0][0]).toContain('/session/routine-1/0/day-1?startedAt=')
  })
})
