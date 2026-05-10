import {
  getCurrentWeekFrequencySummary,
  getExerciseMilestoneSummary,
  getExerciseProgressPoints,
  getRoutineAdherenceSummary,
  getWeeklyVolumeSummaries,
  getWorkoutFrequencySummaries
} from './analytics'
import { createRoutineProgress } from './routines'
import type { Routine } from './routines'
import type { WorkoutSession } from './sessions'

describe('analytics selectors', () => {
  const routine: Routine = {
    id: 'routine-1',
    name: 'Upper Lower',
    status: 'active',
    weekCount: 1,
    weeks: [
      {
        id: 'week-1',
        label: 'Semana 1',
        days: [
          { id: 'day-1', label: 'Push', exercises: [{ id: 'exercise-1', name: 'Press banca', targetSets: 2, targetRir: 2 }] },
          { id: 'day-2', label: 'Pull', exercises: [{ id: 'exercise-2', name: 'Remo', targetSets: 2, targetRir: 2 }] }
        ]
      }
    ],
    progress: createRoutineProgress(),
    createdAt: '2026-05-01T10:00:00.000Z',
    updatedAt: '2026-05-01T10:00:00.000Z'
  }

  const sessions: WorkoutSession[] = [
    {
      id: 'session-1',
      routineId: 'routine-1',
      routineName: 'Upper Lower',
      weekIndex: 0,
      weekLabel: 'Semana 1',
      dayId: 'day-1',
      dayLabel: 'Push',
      status: 'completed',
      startedAt: '2026-05-04T09:00:00.000Z',
      endedAt: '2026-05-04T09:45:00.000Z',
      exercises: [
        {
          id: 'snap-1',
          exerciseTemplateId: 'exercise-1',
          exerciseName: 'Press banca',
          targetSets: 2,
          targetRir: 2,
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
      routineName: 'Upper Lower',
      weekIndex: 0,
      weekLabel: 'Semana 1',
      dayId: 'day-1',
      dayLabel: 'Push',
      status: 'completed',
      startedAt: '2026-05-12T09:00:00.000Z',
      endedAt: '2026-05-12T09:45:00.000Z',
      exercises: [
        {
          id: 'snap-2',
          exerciseTemplateId: 'exercise-1',
          exerciseName: 'Press banca',
          targetSets: 2,
          targetRir: 2,
          sets: [
            { id: 'set-3', setNumber: 1, reps: 9, weightKg: 82.5, actualRir: 2 },
            { id: 'set-4', setNumber: 2, reps: 8, weightKg: 85, actualRir: 1 }
          ]
        }
      ]
    },
    {
      id: 'session-3',
      routineId: 'routine-1',
      routineName: 'Upper Lower',
      weekIndex: 0,
      weekLabel: 'Semana 1',
      dayId: 'day-2',
      dayLabel: 'Pull',
      status: 'ended-early',
      startedAt: '2026-05-14T09:00:00.000Z',
      endedAt: '2026-05-14T09:30:00.000Z',
      exercises: [
        {
          id: 'snap-3',
          exerciseTemplateId: 'exercise-2',
          exerciseName: 'Remo',
          targetSets: 2,
          targetRir: 2,
          sets: [
            { id: 'set-5', setNumber: 1, reps: 10, weightKg: 60, actualRir: 2 },
            { id: 'set-6', setNumber: 2, reps: null, weightKg: null, actualRir: null }
          ]
        }
      ]
    }
  ]

  it('aggregates weekly frequency and volume from local session history', () => {
    expect(getWorkoutFrequencySummaries(sessions)).toEqual([
      { weekStart: '2026-05-04', sessionCount: 1 },
      { weekStart: '2026-05-11', sessionCount: 2 }
    ])

    expect(getWeeklyVolumeSummaries(sessions)).toEqual([
      { weekStart: '2026-05-04', totalVolume: 1300 },
      { weekStart: '2026-05-11', totalVolume: 2022.5 }
    ])
  })

  it('calculates current week frequency and adherence against planned days', () => {
    const frequency = getCurrentWeekFrequencySummary(sessions, '2026-05-15T10:00:00.000Z')
    const adherence = getRoutineAdherenceSummary(routine, sessions, '2026-05-15T10:00:00.000Z')

    expect(frequency).toEqual({ weekStart: '2026-05-11', sessionCount: 2 })
    expect(adherence).toEqual({
      routineId: 'routine-1',
      completedDays: 2,
      plannedDays: 2,
      adherenceRate: 1
    })
  })

  it('builds exercise progress points from immutable session snapshots', () => {
    expect(getExerciseProgressPoints(sessions, 'exercise-1')).toEqual([
      {
        exerciseName: 'Press banca',
        sessionId: 'session-1',
        performedAt: '2026-05-04T09:45:00.000Z',
        bestWeightKg: 82.5,
        bestSetVolume: 660,
        totalReps: 16,
        totalVolume: 1300,
        hitBestWeight: false,
        hitBestSet: false
      },
      {
        exerciseName: 'Press banca',
        sessionId: 'session-2',
        performedAt: '2026-05-12T09:45:00.000Z',
        bestWeightKg: 85,
        bestSetVolume: 742.5,
        totalReps: 17,
        totalVolume: 1422.5,
        hitBestWeight: true,
        hitBestSet: true
      }
    ])
  })

  it('tracks best weight and best set as separate historical milestones', () => {
    const milestoneSessions: WorkoutSession[] = [
      sessions[0],
      {
        ...sessions[1],
        exercises: [
          {
            ...sessions[1].exercises[0],
            sets: [
              { id: 'set-3', setNumber: 1, reps: 10, weightKg: 80, actualRir: 2 },
              { id: 'set-4', setNumber: 2, reps: 8, weightKg: 85, actualRir: 1 }
            ]
          }
        ]
      }
    ]

    expect(getExerciseProgressPoints(milestoneSessions, 'exercise-1')).toEqual([
      {
        exerciseName: 'Press banca',
        sessionId: 'session-1',
        performedAt: '2026-05-04T09:45:00.000Z',
        bestWeightKg: 82.5,
        bestSetVolume: 660,
        totalReps: 16,
        totalVolume: 1300,
        hitBestWeight: false,
        hitBestSet: false
      },
      {
        exerciseName: 'Press banca',
        sessionId: 'session-2',
        performedAt: '2026-05-12T09:45:00.000Z',
        bestWeightKg: 85,
        bestSetVolume: 800,
        totalReps: 18,
        totalVolume: 1480,
        hitBestWeight: true,
        hitBestSet: true
      }
    ])

    expect(getExerciseMilestoneSummary(milestoneSessions, 'exercise-1')).toEqual({
      exerciseName: 'Press banca',
      bestWeightKg: 85,
      bestSetVolume: 800,
      sessionsWithBestWeight: 1,
      sessionsWithBestSet: 1,
      sessionsWithAnyMilestone: 1,
      latestBestWeightAt: '2026-05-12T09:45:00.000Z',
      latestBestSetAt: '2026-05-12T09:45:00.000Z',
      latestMilestoneAt: '2026-05-12T09:45:00.000Z'
    })
  })

  it('ignores invalid exercise fragments and stale progress safely', () => {
    const staleRoutine: Routine = {
      ...routine,
      progress: {
        currentWeekIndex: 99,
        lastCompletedDayId: 'missing-day',
        lastCompletedAt: '2026-05-15T10:00:00.000Z'
      }
    }

    const brokenSessions: WorkoutSession[] = [
      ...sessions,
      {
        id: 'session-broken',
        routineId: 'routine-1',
        routineName: 'Upper Lower',
        weekIndex: 0,
        weekLabel: 'Semana 1',
        dayId: 'day-2',
        dayLabel: 'Pull',
        status: 'completed',
        startedAt: '2026-05-15T09:00:00.000Z',
        endedAt: '2026-05-15T09:30:00.000Z',
        exercises: [{ id: 'broken', exerciseTemplateId: null, exerciseName: '   ', targetSets: 1, targetRir: null, sets: [] }]
      }
    ]

    expect(getRoutineAdherenceSummary(staleRoutine, brokenSessions, '2026-05-15T10:00:00.000Z')).toMatchObject({
      plannedDays: 2,
      completedDays: 2,
      adherenceRate: 1
    })

    expect(getExerciseProgressPoints(brokenSessions, 'exercise-1')).toHaveLength(2)
  })
})
