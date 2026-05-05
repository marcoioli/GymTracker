import { db } from '../../db/database'
import { normalizeRoutineRecord } from '../../domain/routines'
import { getActiveRoutine, repairActiveRoutineState, saveRoutine, validateRoutineDraft } from './routinesRepository'

describe('routinesRepository hardening', () => {
  it('repairs orphaned and conflicting active routine state', async () => {
    await db.routines.bulkAdd([
      {
        id: 'routine-1',
        name: 'Push Pull',
        status: 'active',
        weekCount: 1,
        weeks: [],
        progress: { currentWeekIndex: 0, lastCompletedDayId: null, lastCompletedAt: null },
        createdAt: '2026-05-05T10:00:00.000Z',
        updatedAt: '2026-05-05T10:00:00.000Z'
      },
      {
        id: 'routine-2',
        name: 'Upper Lower',
        status: 'active',
        weekCount: 1,
        weeks: [],
        progress: { currentWeekIndex: 0, lastCompletedDayId: null, lastCompletedAt: null },
        createdAt: '2026-05-05T10:00:00.000Z',
        updatedAt: '2026-05-06T10:00:00.000Z'
      }
    ])

    await db.appState.put({ key: 'activeRoutineId', value: 'missing-id' })

    const activeRoutine = await repairActiveRoutineState()

    expect(activeRoutine?.id).toBe('routine-2')
    expect(await db.appState.get('activeRoutineId')).toEqual({ key: 'activeRoutineId', value: 'routine-2' })
    expect(await db.routines.get('routine-1')).toMatchObject({ status: 'paused' })
    expect(await db.routines.get('routine-2')).toMatchObject({ status: 'active' })
  })

  it('rejects routine drafts without a valid exercise muscle', () => {
    expect(
      validateRoutineDraft({
        name: 'Upper A',
        weeks: [
          {
            id: 'week-1',
            label: 'Semana 1',
            days: [
              {
                id: 'day-1',
                label: 'Push',
                exercises: [{ id: 'exercise-1', name: 'Press banca', targetSets: 4, targetRir: 2, muscle: 'Trapecio' as never }]
              }
            ]
          }
        ]
      })
    ).toContainEqual(expect.stringMatching(/grupo muscular válido/i))
  })

  it('normalizes legacy stored routines without muscle when resolving the active routine', async () => {
    await db.routines.add({
      id: 'routine-legacy',
      name: 'Legacy',
      status: 'active',
      weekCount: 1,
      weeks: [
        {
          id: 'week-1',
          label: 'Semana 1',
          days: [{ id: 'day-1', label: 'Push', exercises: [{ id: 'exercise-1', name: 'Press banca', targetSets: 4, targetRir: 2 }] }]
        }
      ],
      progress: { currentWeekIndex: 0, lastCompletedDayId: null, lastCompletedAt: null },
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z'
    } as never)

    await db.appState.put({ key: 'activeRoutineId', value: 'routine-legacy' })

    const routine = await getActiveRoutine()

    expect(routine?.weeks[0].days[0].exercises[0]?.muscle).toBe('PG')
  })

  it('persists an explicit muscle after editing a legacy routine that initially falls back to PG', async () => {
    await db.routines.add({
      id: 'routine-legacy',
      name: 'Legacy',
      status: 'paused',
      weekCount: 1,
      weeks: [
        {
          id: 'week-1',
          label: 'Semana 1',
          days: [{ id: 'day-1', label: 'Push', exercises: [{ id: 'exercise-1', name: 'Press banca', targetSets: 4, targetRir: 2 }] }]
        }
      ],
      progress: { currentWeekIndex: 0, lastCompletedDayId: null, lastCompletedAt: null },
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z'
    } as never)

    const storedLegacyRoutine = await db.routines.get('routine-legacy')
    const legacyRoutine = storedLegacyRoutine ? normalizeRoutineRecord(storedLegacyRoutine as never) : undefined

    expect(legacyRoutine?.weeks[0].days[0].exercises[0]?.muscle).toBe('PG')

    await saveRoutine({
      id: 'routine-legacy',
      name: legacyRoutine.name,
      status: legacyRoutine.status,
      progress: legacyRoutine.progress,
      createdAt: legacyRoutine.createdAt,
      weeks: [
        {
          ...legacyRoutine.weeks[0],
          days: [
            {
              ...legacyRoutine.weeks[0].days[0],
              exercises: [{ ...legacyRoutine.weeks[0].days[0].exercises[0], muscle: 'Pecho' }]
            }
          ]
        }
      ]
    })

    expect((await db.routines.get('routine-legacy'))?.weeks[0]?.days[0]?.exercises[0]?.muscle).toBe('Pecho')
  })
})
