import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { db } from '../../db/database'
import { RoutinesPage } from './RoutinesPage'
import { getAppStateRecord } from './routinesRepository'

describe('RoutinesPage', () => {
  it('creates a routine, stores the exercise catalog and allows editing without touching history', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <RoutinesPage />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /nueva rutina/i }))
    await user.type(screen.getByLabelText(/nombre de la rutina/i), 'Upper A')
    const dayCountInputs = screen.getAllByLabelText(/^días$/i)
    expect(dayCountInputs[0]).toHaveValue(null)
    fireEvent.change(dayCountInputs[0], { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText(/cantidad de semanas/i), { target: { value: '2' } })

    const weekNameInputs = screen.getAllByLabelText(/nombre de la semana/i)
    await user.clear(weekNameInputs[1])
    await user.type(weekNameInputs[1], 'Semana 2 - descarga')

    const dayInputs = screen.getAllByLabelText(/nombre del día/i)
    await user.clear(dayInputs[0])
    await user.type(dayInputs[0], 'Pecho y espalda')

    const addExerciseButtons = screen.getAllByRole('button', { name: /agregar ejercicio/i })
    await user.click(addExerciseButtons[0])

    await user.type(screen.getByLabelText(/^ejercicio$/i), 'Press banca')
    await user.click(screen.getByRole('button', { name: /agregar serie/i }))
    fireEvent.change(screen.getAllByLabelText(/repeticiones objetivo serie/i)[0], { target: { value: '8-12' } })
    fireEvent.change(screen.getAllByLabelText(/rir objetivo serie/i)[0], { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/grupo muscular/i), { target: { value: 'Pecho' } })

    await user.click(screen.getByRole('button', { name: /repetir semana anterior/i }))

    await user.click(screen.getByRole('button', { name: /guardar rutina/i }))

    expect(await screen.findByRole('heading', { name: 'Upper A' })).toBeInTheDocument()
    expect(screen.getAllByText(/8 series/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/pecho/i).length).toBeGreaterThan(0)

    const savedRoutine = await db.routines.toCollection().first()
    const catalogEntry = await db.exerciseCatalog.toCollection().first()

    expect(savedRoutine?.weekCount).toBe(2)
    expect(savedRoutine?.weeks[0]?.days).toHaveLength(10)
    expect(savedRoutine?.weeks[1]?.days).toHaveLength(10)
    expect(savedRoutine?.weeks[0]?.label).toBe('Semana 1')
    expect(savedRoutine?.weeks[1]?.label).toBe('Semana 2 - descarga')
    expect(savedRoutine?.weeks[0]?.days[0]?.label).toBe('Pecho y espalda')
    expect(savedRoutine?.weeks[1]?.days[0]?.label).toBe('Pecho y espalda')
    expect(savedRoutine?.weeks[0]?.days[0]?.exercises[0]?.muscle).toBe('Pecho')
    expect(savedRoutine?.weeks[0]?.days[0]?.exercises[0]?.setReferences).toHaveLength(4)
    expect(savedRoutine?.weeks[0]?.days[0]?.exercises[0]?.setReferences?.[0]?.repsTarget).toBe('8-12')
    expect(savedRoutine?.weeks[1]?.days[0]?.exercises[0]).toMatchObject({
      name: 'Press banca',
      muscle: 'Pecho',
      targetSets: 4,
      targetRir: 2
    })
    expect(savedRoutine?.weeks[1]?.id).not.toBe(savedRoutine?.weeks[0]?.id)
    expect(savedRoutine?.weeks[1]?.days[0]?.id).not.toBe(savedRoutine?.weeks[0]?.days[0]?.id)
    expect(savedRoutine?.weeks[1]?.days[0]?.exercises[0]?.id).not.toBe(savedRoutine?.weeks[0]?.days[0]?.exercises[0]?.id)
    expect(savedRoutine?.weeks[1]?.days[0]?.exercises[0]?.setReferences?.[0]?.id).not.toBe(
      savedRoutine?.weeks[0]?.days[0]?.exercises[0]?.setReferences?.[0]?.id
    )
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

  it('keeps day count empty on a new routine until the user defines it', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <RoutinesPage />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /nueva rutina/i }))

    expect(screen.getByLabelText(/^días$/i)).toHaveValue(null)
    expect(screen.queryByLabelText(/nombre del día/i)).not.toBeInTheDocument()
  })

  it('repeats the previous week while editing without mutating the source week', async () => {
    const routineId = 'routine-repeat-edit'

    await db.routines.add({
      id: routineId,
      name: 'Upper Lower',
      status: 'paused',
      weekCount: 2,
      progress: { currentWeekIndex: 0, lastCompletedDayId: null, lastCompletedAt: null },
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z',
      weeks: [
        {
          id: 'week-1',
          label: 'Semana 1',
          days: [
            {
              id: 'day-1',
              label: 'Push fuerte',
              exercises: [
                {
                  id: 'exercise-1',
                  name: 'Press banca',
                  targetSets: 2,
                  targetRir: 1,
                  muscle: 'Pecho',
                  setReferences: [
                    { id: 'set-1', repsTarget: '6-8', rirTarget: '1' },
                    { id: 'set-2', repsTarget: '8-10', rirTarget: '2' }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'week-2',
          label: 'Semana 2 personalizada',
          days: [
            {
              id: 'day-2',
              label: 'Viejo día',
              exercises: [
                {
                  id: 'exercise-2',
                  name: 'Curl martillo',
                  targetSets: 1,
                  targetRir: 0,
                  muscle: 'Biceps',
                  setReferences: [{ id: 'set-3', repsTarget: '12', rirTarget: '0' }]
                }
              ]
            }
          ]
        }
      ]
    })

    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <RoutinesPage />
      </MemoryRouter>
    )

    await user.click(await screen.findByRole('button', { name: /editar/i }))
    await user.click(screen.getByRole('button', { name: /repetir semana anterior/i }))

    const dayNameInputs = screen.getAllByLabelText(/nombre del día/i)
    await user.clear(dayNameInputs[1])
    await user.type(dayNameInputs[1], 'Push técnico')

    const exerciseInputs = screen.getAllByLabelText(/^ejercicio$/i)
    await user.clear(exerciseInputs[1])
    await user.type(exerciseInputs[1], 'Press inclinado')

    const muscleSelects = screen.getAllByLabelText(/grupo muscular/i)
    fireEvent.change(muscleSelects[1], { target: { value: 'Hombro' } })

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    const updatedRoutine = await db.routines.get(routineId)

    expect(updatedRoutine?.weeks[0]?.days[0]?.label).toBe('Push fuerte')
    expect(updatedRoutine?.weeks[0]?.days[0]?.exercises[0]?.name).toBe('Press banca')
    expect(updatedRoutine?.weeks[1]?.label).toBe('Semana 2 personalizada')
    expect(updatedRoutine?.weeks[1]?.days[0]?.label).toBe('Push técnico')
    expect(updatedRoutine?.weeks[1]?.days[0]?.exercises[0]).toMatchObject({
      name: 'Press inclinado',
      muscle: 'Hombro',
      targetSets: 2,
      targetRir: 1
    })
    expect(updatedRoutine?.weeks[1]?.id).not.toBe(updatedRoutine?.weeks[0]?.id)
    expect(updatedRoutine?.weeks[1]?.days[0]?.id).not.toBe(updatedRoutine?.weeks[0]?.days[0]?.id)
    expect(updatedRoutine?.weeks[1]?.days[0]?.exercises[0]?.id).not.toBe(updatedRoutine?.weeks[0]?.days[0]?.exercises[0]?.id)
    expect(updatedRoutine?.weeks[1]?.days[0]?.exercises[0]?.setReferences?.[0]?.id).not.toBe(
      updatedRoutine?.weeks[0]?.days[0]?.exercises[0]?.setReferences?.[0]?.id
    )
  })

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
    render(
      <MemoryRouter>
        <RoutinesPage />
      </MemoryRouter>
    )

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
