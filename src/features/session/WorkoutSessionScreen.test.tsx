import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '../../db/database'
import * as sessionRepository from './sessionRepository'
import { WorkoutSessionScreen } from './WorkoutSessionScreen'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('WorkoutSessionScreen', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    vi.restoreAllMocks()
  })

  it('shows previous references and communicates when a set has no prior snapshot', async () => {
    await seedRoutine()

    await db.sessions.add({
      id: 'session-old',
      routineId: 'routine-1',
      routineName: 'Upper Lower',
      dayId: 'day-1',
      dayLabel: 'Pull',
      weekIndex: 0,
      weekLabel: 'Semana 1',
      status: 'completed',
      startedAt: '2026-05-04T10:00:00.000Z',
      endedAt: '2026-05-04T10:40:00.000Z',
      exercises: [
        {
          id: 'snapshot-old',
          exerciseTemplateId: 'exercise-1',
          exerciseName: 'Remo con barra',
          targetSets: 2,
          targetRir: 1,
          sets: [{ id: 'set-1', setNumber: 1, reps: 8, weightKg: 70, actualRir: 1 }]
        }
      ]
    })

    renderSessionScreen()

    expect(await screen.findByText(/última referencia: 8 reps · 70 kg · rir 1/i)).toBeInTheDocument()
    expect(screen.getByText(/sin referencia previa para esta serie/i)).toBeInTheDocument()
  })

  it('shows visible saving feedback and returns with a success flag', async () => {
    const user = userEvent.setup()
    await seedRoutine()

    let resolveSave: ((value: Awaited<ReturnType<typeof sessionRepository.saveWorkoutSession>>) => void) | null = null
    const savePromise = new Promise<Awaited<ReturnType<typeof sessionRepository.saveWorkoutSession>>>((resolve) => {
      resolveSave = resolve
    })

    vi.spyOn(sessionRepository, 'saveWorkoutSession').mockReturnValue(savePromise)

    renderSessionScreen()

    await screen.findByRole('heading', { name: 'Pull' })
    await user.click(screen.getByRole('button', { name: /finalizar sesión/i }))

    expect(screen.getByRole('status')).toHaveTextContent(/guardando sesión finalizada/i)
    expect(screen.getByRole('button', { name: /guardando finalización/i })).toBeDisabled()

    resolveSave?.({
      id: 'session-new',
      routineId: 'routine-1',
      routineName: 'Upper Lower',
      dayId: 'day-1',
      dayLabel: 'Pull',
      weekIndex: 0,
      weekLabel: 'Semana 1',
      status: 'completed',
      startedAt: '2026-05-05T10:00:00.000Z',
      endedAt: '2026-05-05T10:30:00.000Z',
      exercises: []
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/?sessionSaved=completed')
    })
  })
})

function renderSessionScreen() {
  return render(
    <MemoryRouter initialEntries={['/session/routine-1/0/day-1?startedAt=2026-05-05T10:00:00.000Z']}>
      <Routes>
        <Route path="/session/:routineId/:weekIndex/:dayId" element={<WorkoutSessionScreen />} />
      </Routes>
    </MemoryRouter>
  )
}

async function seedRoutine() {
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
          {
            id: 'day-1',
            label: 'Pull',
            exercises: [{ id: 'exercise-1', name: 'Remo con barra', targetSets: 2, targetRir: 1 }]
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
}
