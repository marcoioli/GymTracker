import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { db } from '../../db/database'
import { HistoryPage } from './HistoryPage'
import { saveWorkoutSession } from '../session/sessionRepository'

describe('HistoryPage', () => {
  it('shows frozen session details even after the routine template changes', async () => {
    await db.routines.add({
      id: 'routine-1',
      name: 'Upper A',
      status: 'active',
      weekCount: 1,
      weeks: [
        {
          id: 'week-1',
          label: 'Semana Base',
          days: [
            {
              id: 'day-1',
              label: 'Push pesado',
              exercises: [{ id: 'exercise-1', name: 'Press banca', targetSets: 2, targetRir: 1 }]
            }
          ]
        }
      ],
      progress: {
        currentWeekIndex: 0,
        lastCompletedDayId: null,
        lastCompletedAt: null
      },
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z'
    })

    await saveWorkoutSession({
      routineId: 'routine-1',
      weekIndex: 0,
      dayId: 'day-1',
      startedAt: '2026-05-05T10:00:00.000Z',
      endedAt: '2026-05-05T10:40:00.000Z',
      status: 'completed',
      exercises: [
        {
          exerciseId: 'exercise-1',
          exerciseName: 'Press banca',
          sets: [
            { reps: '8', weightKg: '80', actualRir: '2' },
            { reps: '8', weightKg: '82.5', actualRir: '1' }
          ]
        }
      ]
    })

    await db.routines.put({
      id: 'routine-1',
      name: 'Upper B',
      status: 'active',
      weekCount: 1,
      weeks: [
        {
          id: 'week-1',
          label: 'Semana Editada',
          days: [
            {
              id: 'day-1',
              label: 'Push técnico',
              exercises: [{ id: 'exercise-1', name: 'Press inclinado', targetSets: 3, targetRir: 2 }]
            }
          ]
        }
      ],
      progress: {
        currentWeekIndex: 0,
        lastCompletedDayId: 'day-1',
        lastCompletedAt: '2026-05-05T10:40:00.000Z'
      },
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-06T10:00:00.000Z'
    })

    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    )

    expect((await screen.findAllByRole('heading', { name: /upper a/i })).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/semana base · push pesado/i)).not.toHaveLength(0)
    expect(screen.getByText(/snapshot congelado/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /press banca/i })).toBeInTheDocument()
    expect(screen.getByText(/1300 kg volumen/i)).toBeInTheDocument()
    expect(screen.queryByText(/upper b/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/press inclinado/i)).not.toBeInTheDocument()
  })
})
