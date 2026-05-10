import { render, screen } from '@testing-library/react'
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
})

async function seedAnalyticsMilestoneFixture() {
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
