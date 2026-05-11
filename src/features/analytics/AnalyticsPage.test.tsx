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

  it('cascades routine, saved day, and exercise filters from session history', async () => {
    const user = userEvent.setup()

    await seedAnalyticsCascadeFixture()

    render(
      <MemoryRouter>
        <AnalyticsPage />
      </MemoryRouter>
    )

    const routineSelect = await screen.findByLabelText(/rutina/i)
    const daySelect = screen.getByLabelText(/día guardado/i)
    const exerciseSelect = screen.getByLabelText(/ejercicio/i)

    await user.selectOptions(routineSelect, 'routine-1')

    expect(screen.getByRole('option', { name: /semana 1 · push pesado/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /semana 1 · pull técnico/i })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /semana 1 · piernas/i })).not.toBeInTheDocument()

    await user.selectOptions(daySelect, '0:day-2:Semana 1:Pull técnico')

    expect(screen.getByRole('option', { name: 'Remo' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /press banca/i })).not.toBeInTheDocument()
    expect(exerciseSelect).toHaveValue('exercise-2')
  })

  it('limits progress milestones to the selected routine day session subset', async () => {
    const user = userEvent.setup()

    await seedAnalyticsSameExerciseDifferentDaysFixture()

    render(
      <MemoryRouter>
        <AnalyticsPage />
      </MemoryRouter>
    )

    const routineSelect = await screen.findByLabelText(/rutina/i)
    const daySelect = screen.getByLabelText(/día guardado/i)

    await user.selectOptions(routineSelect, 'routine-1')
    await user.selectOptions(daySelect, '0:day-2:Semana Base:Push liviano')

    expect(await screen.findByRole('heading', { name: /progreso: press banca/i })).toBeInTheDocument()
    expect(screen.getAllByText(/^62\.5 kg$/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/^625 kg$/i)).toBeInTheDocument()
    expect(screen.getByText(/último hito 14 may 2026/i)).toBeInTheDocument()
    expect(screen.queryByText(/^85 kg$/i)).not.toBeInTheDocument()
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

async function seedAnalyticsCascadeFixture() {
  await db.routines.bulkAdd([
    {
      id: 'routine-1',
      name: 'Upper A',
      status: 'active',
      weekCount: 1,
      weeks: [
        {
          id: 'week-1',
          label: 'Semana 1',
          days: [
            {
              id: 'day-1',
              label: 'Push pesado',
              exercises: [{ id: 'exercise-1', name: 'Press banca', targetSets: 2, targetRir: 1, muscle: 'Pecho' }]
            },
            {
              id: 'day-2',
              label: 'Pull técnico',
              exercises: [{ id: 'exercise-2', name: 'Remo', targetSets: 2, targetRir: 1, muscle: 'Espalda' }]
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
    },
    {
      id: 'routine-2',
      name: 'Lower B',
      status: 'paused',
      weekCount: 1,
      weeks: [
        {
          id: 'week-2',
          label: 'Semana 1',
          days: [
            {
              id: 'day-3',
              label: 'Piernas',
              exercises: [{ id: 'exercise-3', name: 'Sentadilla', targetSets: 3, targetRir: 2, muscle: 'Piernas' }]
            }
          ]
        }
      ],
      progress: {
        currentWeekIndex: 0,
        lastCompletedDayId: null,
        lastCompletedAt: null
      },
      createdAt: '2026-05-06T10:00:00.000Z',
      updatedAt: '2026-05-06T10:00:00.000Z'
    }
  ])

  await db.sessions.bulkAdd([
    {
      id: 'session-cascade-1',
      routineId: 'routine-1',
      routineName: 'Upper A',
      weekIndex: 0,
      weekLabel: 'Semana 1',
      dayId: 'day-1',
      dayLabel: 'Push pesado',
      status: 'completed',
      startedAt: '2026-05-05T10:00:00.000Z',
      endedAt: '2026-05-05T10:40:00.000Z',
      exercises: [
        {
          id: 'snap-cascade-1',
          exerciseTemplateId: 'exercise-1',
          exerciseName: 'Press banca',
          targetSets: 2,
          targetRir: 1,
          muscle: 'Pecho',
          sets: [
            { id: 'set-cascade-1', setNumber: 1, reps: 8, weightKg: 80, actualRir: 2 },
            { id: 'set-cascade-2', setNumber: 2, reps: 8, weightKg: 82.5, actualRir: 1 }
          ]
        }
      ]
    },
    {
      id: 'session-cascade-2',
      routineId: 'routine-1',
      routineName: 'Upper A',
      weekIndex: 0,
      weekLabel: 'Semana 1',
      dayId: 'day-2',
      dayLabel: 'Pull técnico',
      status: 'completed',
      startedAt: '2026-05-07T10:00:00.000Z',
      endedAt: '2026-05-07T10:35:00.000Z',
      exercises: [
        {
          id: 'snap-cascade-2',
          exerciseTemplateId: 'exercise-2',
          exerciseName: 'Remo',
          targetSets: 2,
          targetRir: 1,
          muscle: 'Espalda',
          sets: [
            { id: 'set-cascade-3', setNumber: 1, reps: 10, weightKg: 60, actualRir: 2 },
            { id: 'set-cascade-4', setNumber: 2, reps: 10, weightKg: 62.5, actualRir: 1 }
          ]
        }
      ]
    },
    {
      id: 'session-cascade-3',
      routineId: 'routine-2',
      routineName: 'Lower B',
      weekIndex: 0,
      weekLabel: 'Semana 1',
      dayId: 'day-3',
      dayLabel: 'Piernas',
      status: 'completed',
      startedAt: '2026-05-08T10:00:00.000Z',
      endedAt: '2026-05-08T10:45:00.000Z',
      exercises: [
        {
          id: 'snap-cascade-3',
          exerciseTemplateId: 'exercise-3',
          exerciseName: 'Sentadilla',
          targetSets: 3,
          targetRir: 2,
          muscle: 'Piernas',
          sets: [
            { id: 'set-cascade-5', setNumber: 1, reps: 6, weightKg: 100, actualRir: 2 },
            { id: 'set-cascade-6', setNumber: 2, reps: 6, weightKg: 105, actualRir: 1 }
          ]
        }
      ]
    }
  ])
}

async function seedAnalyticsSameExerciseDifferentDaysFixture() {
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
          },
          {
            id: 'day-2',
            label: 'Push liviano',
            exercises: [{ id: 'exercise-1', name: 'Press banca', targetSets: 2, targetRir: 2, muscle: 'Pecho' }]
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

  await db.sessions.bulkAdd([
    {
      id: 'session-day-split-1',
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
          id: 'snap-day-split-1',
          exerciseTemplateId: 'exercise-1',
          exerciseName: 'Press banca',
          targetSets: 2,
          targetRir: 1,
          muscle: 'Pecho',
          sets: [
            { id: 'set-day-split-1', setNumber: 1, reps: 8, weightKg: 80, actualRir: 2 },
            { id: 'set-day-split-2', setNumber: 2, reps: 8, weightKg: 82.5, actualRir: 1 }
          ]
        }
      ]
    },
    {
      id: 'session-day-split-2',
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
          id: 'snap-day-split-2',
          exerciseTemplateId: 'exercise-1',
          exerciseName: 'Press banca',
          targetSets: 2,
          targetRir: 1,
          muscle: 'Pecho',
          sets: [
            { id: 'set-day-split-3', setNumber: 1, reps: 10, weightKg: 80, actualRir: 2 },
            { id: 'set-day-split-4', setNumber: 2, reps: 8, weightKg: 85, actualRir: 1 }
          ]
        }
      ]
    },
    {
      id: 'session-day-split-3',
      routineId: 'routine-1',
      routineName: 'Upper A',
      weekIndex: 0,
      weekLabel: 'Semana Base',
      dayId: 'day-2',
      dayLabel: 'Push liviano',
      status: 'completed',
      startedAt: '2026-05-14T10:00:00.000Z',
      endedAt: '2026-05-14T10:35:00.000Z',
      exercises: [
        {
          id: 'snap-day-split-3',
          exerciseTemplateId: 'exercise-1',
          exerciseName: 'Press banca',
          targetSets: 2,
          targetRir: 2,
          muscle: 'Pecho',
          sets: [
            { id: 'set-day-split-5', setNumber: 1, reps: 10, weightKg: 60, actualRir: 3 },
            { id: 'set-day-split-6', setNumber: 2, reps: 10, weightKg: 62.5, actualRir: 2 }
          ]
        }
      ]
    }
  ])
}
