import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { db } from '../../db/database'
import { RoutinesPage } from './RoutinesPage'
import { getAppStateRecord } from './routinesRepository'

describe('RoutinesPage', () => {
  it('creates a routine, stores the exercise catalog and allows editing without touching history', async () => {
    const user = userEvent.setup()

    render(<RoutinesPage />)

    await user.click(screen.getByRole('button', { name: /nueva rutina/i }))
    await user.type(screen.getByLabelText(/nombre de la rutina/i), 'Upper A')
    fireEvent.change(screen.getByLabelText(/cantidad de semanas/i), { target: { value: '2' } })

    const dayInputs = screen.getAllByLabelText(/nombre del día/i)
    await user.clear(dayInputs[0])
    await user.type(dayInputs[0], 'Pecho y espalda')

    const dayCountInputs = screen.getAllByLabelText(/^días$/i)
    fireEvent.change(dayCountInputs[1], { target: { value: '2' } })

    const addExerciseButtons = screen.getAllByRole('button', { name: /agregar ejercicio/i })
    await user.click(addExerciseButtons[0])

    await user.type(screen.getByLabelText(/^ejercicio$/i), 'Press banca')
    fireEvent.change(screen.getByLabelText(/series/i), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText(/rir objetivo/i), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/grupo muscular/i), { target: { value: 'Pecho' } })

    await user.click(screen.getByRole('button', { name: /guardar rutina/i }))

    expect(await screen.findByRole('heading', { name: 'Upper A' })).toBeInTheDocument()
    expect(screen.getByText(/series semanales por grupo muscular/i)).toBeInTheDocument()
    expect(screen.getByText(/semana actual del plan/i)).toBeInTheDocument()
    expect(screen.getByText(/pecho: 4 series/i)).toBeInTheDocument()

    const savedRoutine = await db.routines.toCollection().first()
    const catalogEntry = await db.exerciseCatalog.toCollection().first()

    expect(savedRoutine?.weekCount).toBe(2)
    expect(savedRoutine?.weeks[0]?.label).toBe('Semana 1')
    expect(savedRoutine?.weeks[0]?.days[0]?.label).toBe('Pecho y espalda')
    expect(savedRoutine?.weeks[1]?.days).toHaveLength(2)
    expect(savedRoutine?.weeks[0]?.days[0]?.exercises[0]?.muscle).toBe('Pecho')
    expect(catalogEntry?.name).toBe('Press banca')

    await db.sessions.add({
      id: 'session-1',
      routineId: savedRoutine!.id,
      dayId: savedRoutine!.weeks[0].days[0].id,
      weekIndex: 0,
      status: 'completed',
      exercises: [
        {
          id: 'snapshot-1',
          exerciseTemplateId: savedRoutine!.weeks[0].days[0].exercises[0].id,
          exerciseName: 'Press banca',
          targetSets: 4,
          targetRir: 2,
          muscle: 'Pecho',
          sets: []
        }
      ],
      startedAt: '2026-05-05T10:00:00.000Z',
      endedAt: '2026-05-05T10:30:00.000Z'
    })

    await user.click(screen.getByRole('button', { name: /editar/i }))

    const routineNameInput = screen.getByLabelText(/nombre de la rutina/i)
    await user.clear(routineNameInput)
    await user.type(routineNameInput, 'Upper A v2')

    const dayNameInputs = screen.getAllByLabelText(/nombre del día/i)
    await user.clear(dayNameInputs[0])
    await user.type(dayNameInputs[0], 'Push principal')

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    expect(await screen.findByRole('heading', { name: 'Upper A v2' })).toBeInTheDocument()

    const updatedRoutine = await db.routines.get(savedRoutine!.id)
    const savedSession = await db.sessions.get('session-1')

    expect(updatedRoutine?.weeks[0].days[0].label).toBe('Push principal')
    expect(savedSession?.exercises[0]).toMatchObject({
      exerciseName: 'Press banca',
      targetSets: 4,
      targetRir: 2
    })
  }, 10000)

  it('keeps a single active routine and updates app state when switching routines', async () => {
    const firstRoutineId = 'routine-1'
    const secondRoutineId = 'routine-2'

    await db.routines.bulkAdd([
      {
        id: firstRoutineId,
        name: 'Push Pull Legs',
        status: 'active',
        weekCount: 1,
        weeks: [],
        progress: { currentWeekIndex: 0, lastCompletedDayId: null, lastCompletedAt: null },
        createdAt: '2026-05-05T10:00:00.000Z',
        updatedAt: '2026-05-05T10:00:00.000Z'
      },
      {
        id: secondRoutineId,
        name: 'Upper Lower',
        status: 'paused',
        weekCount: 1,
        weeks: [],
        progress: { currentWeekIndex: 0, lastCompletedDayId: null, lastCompletedAt: null },
        createdAt: '2026-05-05T10:00:00.000Z',
        updatedAt: '2026-05-05T10:00:00.000Z'
      }
    ])

    await db.appState.put({ key: 'activeRoutineId', value: firstRoutineId })

    const user = userEvent.setup()
    render(<RoutinesPage />)

    const activateButtons = await screen.findAllByRole('button', { name: /activar rutina/i })
    await user.click(activateButtons[0])

    await waitFor(async () => {
      const activeRoutine = await db.routines.get(secondRoutineId)
      expect(activeRoutine?.status).toBe('active')
    })

    const pausedRoutine = await db.routines.get(firstRoutineId)
    const activeRoutine = await db.routines.get(secondRoutineId)
    const appState = await getAppStateRecord('activeRoutineId')

    expect(pausedRoutine?.status).toBe('paused')
    expect(activeRoutine?.status).toBe('active')
    expect(appState?.value).toBe(secondRoutineId)
    expect(await db.routines.where('status').equals('active').count()).toBe(1)
  })
})
