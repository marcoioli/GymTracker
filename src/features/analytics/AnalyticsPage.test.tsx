import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { db } from '../../db/database'
import type { WorkoutSession } from '../../domain/sessions'
import { AnalyticsPage } from './AnalyticsPage'

describe('AnalyticsPage milestones', () => {
  it('surfaces best weight and best set milestones from immutable history', async () => {
    await seedAnalyticsMilestoneFixture()

    render(
      <MemoryRouter>
        <AnalyticsPage />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: /progreso: press banca/i })).toBeInTheDocument()
    expect(screen.getAllByText(/^85 kg$/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/^800 kg$/i)).toBeInTheDocument()
    expect(screen.getByText(/sesiones con récord/i)).toBeInTheDocument()
    expect(screen.getByText(/último hito 12 may 2026/i)).toBeInTheDocument()
    expect(screen.getAllByText(/mejor peso/i)).not.toHaveLength(0)
    expect(screen.getAllByText(/mejor serie/i)).not.toHaveLength(0)
  })

  it('renders per-set chart series and lets users toggle each set independently', async () => {
    const user = userEvent.setup()

    await seedAnalyticsMilestoneFixture({ includeThirdSession: true })

    const { container } = render(
      <MemoryRouter>
        <AnalyticsPage />
      </MemoryRouter>
    )

    expect(await screen.findByRole('img', { name: /gráfico de progreso por sets de press banca/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /set 1/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /set 2/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /set 3/i })).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('[data-testid="analytics-set-series-2"]')).not.toBeNull()

    await user.click(screen.getByRole('button', { name: /set 2/i }))

    expect(screen.getByRole('button', { name: /set 2/i })).toHaveAttribute('aria-pressed', 'false')
    expect(container.querySelector('[data-testid="analytics-set-series-2"]')).toBeNull()
    expect(container.querySelector('[data-testid="analytics-set-series-1"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="analytics-set-series-3"]')).not.toBeNull()
  })
})

async function seedAnalyticsMilestoneFixture(options?: { includeThirdSession?: boolean }) {
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

  if (options?.includeThirdSession) {
    sessions.push({
      id: 'session-3',
      routineId: 'routine-1',
      routineName: 'Upper A',
      weekIndex: 0,
      weekLabel: 'Semana Base',
      dayId: 'day-1',
      dayLabel: 'Push pesado',
      status: 'completed',
      startedAt: '2026-05-19T10:00:00.000Z',
      endedAt: '2026-05-19T10:45:00.000Z',
      exercises: [
        {
          id: 'snap-3',
          exerciseTemplateId: 'exercise-1',
          exerciseName: 'Press banca',
          targetSets: 3,
          targetRir: 1,
          muscle: 'Pecho',
          sets: [
            { id: 'set-5', setNumber: 1, reps: 8, weightKg: 82.5, actualRir: 2 },
            { id: 'set-6', setNumber: 2, reps: 8, weightKg: null, actualRir: 1 },
            { id: 'set-7', setNumber: 3, reps: 6, weightKg: 87.5, actualRir: 1 }
          ]
        }
      ]
    })
  }

  await db.sessions.bulkAdd(sessions)
}
