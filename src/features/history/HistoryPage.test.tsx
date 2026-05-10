import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { db } from '../../db/database'
import type { WorkoutSession } from '../../domain/sessions'
import { HistoryPage } from './HistoryPage'
import { saveWorkoutSession } from '../session/sessionRepository'
import { HistorySessionDetailPage } from './HistorySessionDetailPage'

describe('HistoryPage', () => {
  it('keeps the history list focused and opens the frozen snapshot in a dedicated page', async () => {
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

    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/history?range=month']}>
        <Routes>
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:sessionId" element={<HistorySessionDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect((await screen.findAllByRole('heading', { name: /upper a/i })).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/semana base · push pesado/i)).not.toHaveLength(0)
    expect(screen.queryByText(/snapshot congelado/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /press banca/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /ver detalle/i }))

    expect(await screen.findByText(/snapshot congelado/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /push pesado/i, level: 2 })).toBeInTheDocument()
    expect(screen.getAllByText(/semana base · upper a/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/1300 kg volumen/i)).toBeInTheDocument()
    expect(screen.queryByText(/upper b/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/press inclinado/i)).not.toBeInTheDocument()
  })

  it('shows record badges only on the historical session that matches the best marks', async () => {
    await seedHistoryMilestoneFixture()

    renderHistoryDetail('session-1')

    expect(await screen.findByText(/snapshot congelado/i)).toBeInTheDocument()
    expect(screen.queryByText(/mejor peso/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/mejor serie/i)).not.toBeInTheDocument()
  })

  it('marks best weight and best set separately in the matching history snapshot', async () => {
    await seedHistoryMilestoneFixture()

    renderHistoryDetail('session-2')

    expect(await screen.findByText(/snapshot congelado/i)).toBeInTheDocument()
    expect(screen.getAllByText(/mejor peso/i)).not.toHaveLength(0)
    expect(screen.getAllByText(/mejor serie/i)).not.toHaveLength(0)
    expect(screen.getByText(/80 kg, 10 reps, RIR 2/i)).toBeInTheDocument()
    expect(screen.getByText(/85 kg, 8 reps, RIR 1/i)).toBeInTheDocument()
  })
})

function renderHistoryDetail(sessionId: string) {
  render(
    <MemoryRouter initialEntries={[`/history/${sessionId}`]}>
      <Routes>
        <Route path="/history/:sessionId" element={<HistorySessionDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

async function seedHistoryMilestoneFixture() {
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
            exercises: [{ id: 'exercise-1', name: 'Press banca', targetSets: 2, targetRir: 1, muscle: 'Pecho' }]
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

  const sessions: WorkoutSession[] = [
    {
      id: 'session-1',
      routineId: 'routine-1',
      routineName: 'Upper A',
      weekIndex: 0,
      weekLabel: 'Semana Base',
      dayId: 'day-1',
      dayLabel: 'Push pesado',
      status: 'completed',
      startedAt: '2026-05-05T10:00:00.000Z',
      endedAt: '2026-05-05T10:40:00.000Z',
      exercises: [
        {
          id: 'snap-1',
          exerciseTemplateId: 'exercise-1',
          exerciseName: 'Press banca',
          targetSets: 2,
          targetRir: 1,
          muscle: 'Pecho',
          sets: [
            { id: 'set-1', setNumber: 1, reps: 8, weightKg: 80, actualRir: 2 },
            { id: 'set-2', setNumber: 2, reps: 8, weightKg: 82.5, actualRir: 1 }
          ]
        }
      ]
    },
    {
      id: 'session-2',
      routineId: 'routine-1',
      routineName: 'Upper A',
      weekIndex: 0,
      weekLabel: 'Semana Base',
      dayId: 'day-1',
      dayLabel: 'Push pesado',
      status: 'completed',
      startedAt: '2026-05-12T10:00:00.000Z',
      endedAt: '2026-05-12T10:42:00.000Z',
      exercises: [
        {
          id: 'snap-2',
          exerciseTemplateId: 'exercise-1',
          exerciseName: 'Press banca',
          targetSets: 2,
          targetRir: 1,
          muscle: 'Pecho',
          sets: [
            { id: 'set-3', setNumber: 1, reps: 10, weightKg: 80, actualRir: 2 },
            { id: 'set-4', setNumber: 2, reps: 8, weightKg: 85, actualRir: 1 }
          ]
        }
      ]
    }
  ]

  await db.sessions.bulkAdd(sessions)
}
