export const ROUTINE_DAY_MIN = 1
export const ROUTINE_DAY_MAX = 7
export const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Hombro', 'Biceps', 'Triceps', 'Cuadriceps', 'Isquio', 'PG'] as const
export const DEFAULT_MUSCLE_GROUP = 'PG'

export type RoutineStatus = 'active' | 'paused' | 'completed'
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export type RoutineExercise = {
  id: string
  name: string
  targetSets: number
  targetRir: number | null
  muscle: MuscleGroup
}

export type RoutineDay = {
  id: string
  label: string
  exercises: RoutineExercise[]
}

export type RoutineWeek = {
  id: string
  label: string
  days: RoutineDay[]
}

export type RoutineProgress = {
  currentWeekIndex: number
  lastCompletedDayId: string | null
  lastCompletedAt: string | null
}

export type Routine = {
  id: string
  name: string
  status: RoutineStatus
  weekCount: number
  weeks: RoutineWeek[]
  progress: RoutineProgress
  createdAt: string
  updatedAt: string
}

export type RoutineDaySelection = {
  weekIndex: number
  dayIndex: number
  weekId: string
  weekLabel: string
  day: RoutineDay
}

export type ExerciseCatalogEntry = {
  id: string
  name: string
  normalizedName: string
  createdAt: string
  updatedAt: string
}

export type ActiveRoutineResolution = {
  repairedState: boolean
  routine: Routine | null
}

export type WeeklyMuscleVolume = Record<MuscleGroup, number>

type LegacyRoutineExercise = Omit<RoutineExercise, 'muscle'> & {
  muscle?: unknown
}

type LegacyRoutineDay = Omit<RoutineDay, 'exercises'> & {
  exercises: LegacyRoutineExercise[]
}

type LegacyRoutineWeek = Omit<RoutineWeek, 'days'> & {
  days: LegacyRoutineDay[]
}

type LegacyRoutine = Omit<Routine, 'weeks'> & {
  weeks: LegacyRoutineWeek[]
}

function isTrainableRoutineDay(day: RoutineDay): boolean {
  return day.exercises.length > 0
}

function createWeeklyMuscleVolume(): WeeklyMuscleVolume {
  return {
    Pecho: 0,
    Espalda: 0,
    Hombro: 0,
    Biceps: 0,
    Triceps: 0,
    Cuadriceps: 0,
    Isquio: 0,
    PG: 0
  }
}

export function isMuscleGroup(value: unknown): value is MuscleGroup {
  return typeof value === 'string' && MUSCLE_GROUPS.includes(value as MuscleGroup)
}

export function normalizeRoutineExercise(exercise: LegacyRoutineExercise): RoutineExercise {
  return {
    ...exercise,
    muscle: isMuscleGroup(exercise.muscle) ? exercise.muscle : DEFAULT_MUSCLE_GROUP
  }
}

export function normalizeRoutineWeek(week: LegacyRoutineWeek): RoutineWeek {
  return {
    ...week,
    days: week.days.map((day) => ({
      ...day,
      exercises: day.exercises.map(normalizeRoutineExercise)
    }))
  }
}

export function normalizeRoutineRecord(routine: LegacyRoutine): Routine {
  const normalizedWeeks = routine.weeks.map(normalizeRoutineWeek)

  return {
    ...routine,
    weekCount: normalizedWeeks.length,
    weeks: normalizedWeeks,
    progress: resolveRoutineProgress({
      ...routine,
      weekCount: normalizedWeeks.length,
      weeks: normalizedWeeks
    })
  }
}

export function createRoutineProgress(): RoutineProgress {
  return {
    currentWeekIndex: 0,
    lastCompletedDayId: null,
    lastCompletedAt: null
  }
}

export function createRoutineDay(index: number): RoutineDay {
  return {
    id: crypto.randomUUID(),
    label: `Día ${index + 1}`,
    exercises: []
  }
}

export function createRoutineWeek(index: number, dayCount = 1): RoutineWeek {
  return {
    id: crypto.randomUUID(),
    label: `Semana ${index + 1}`,
    days: Array.from({ length: dayCount }, (_, dayIndex) => createRoutineDay(dayIndex))
  }
}

export function isValidDayCount(dayCount: number): boolean {
  return Number.isInteger(dayCount) && dayCount >= ROUTINE_DAY_MIN && dayCount <= ROUTINE_DAY_MAX
}

export function normalizeExerciseName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function getWeeklyMuscleVolumeByWeek(routine: Routine, weekIndex: number): WeeklyMuscleVolume {
  const weeklyVolume = createWeeklyMuscleVolume()
  const week = routine.weeks[weekIndex]

  if (!week) {
    return weeklyVolume
  }

  for (const day of week.days) {
    for (const exercise of day.exercises) {
      weeklyVolume[normalizeRoutineExercise(exercise).muscle] += exercise.targetSets
    }
  }

  return weeklyVolume
}

export function getCurrentWeeklyMuscleVolume(routine: Routine): WeeklyMuscleVolume {
  return getWeeklyMuscleVolumeByWeek(normalizeRoutineRecord(routine), resolveRoutineProgress(routine).currentWeekIndex)
}

export function listRoutineDaySelections(routine: Routine): RoutineDaySelection[] {
  return routine.weeks.flatMap((week, weekIndex) =>
    week.days.map((day, dayIndex) => ({
      weekIndex,
      dayIndex,
      weekId: week.id,
      weekLabel: week.label,
      day
    }))
  )
}

export function getRoutineDaySelection(
  routine: Routine,
  weekIndex: number,
  dayId: string
): RoutineDaySelection | null {
  const week = routine.weeks[weekIndex]

  if (!week) {
    return null
  }

  const dayIndex = week.days.findIndex((day) => day.id === dayId)

  if (dayIndex === -1) {
    return null
  }

  return {
    weekIndex,
    dayIndex,
    weekId: week.id,
    weekLabel: week.label,
    day: week.days[dayIndex]
  }
}

export function resolveRoutineProgress(routine: Routine): RoutineProgress {
  if (routine.weeks.length === 0) {
    return createRoutineProgress()
  }

  const currentWeekIndex = Math.min(Math.max(routine.progress.currentWeekIndex, 0), routine.weeks.length - 1)
  const hasMatchingCompletedDay = listRoutineDaySelections(routine).some((selection) => selection.day.id === routine.progress.lastCompletedDayId)

  return {
    currentWeekIndex,
    lastCompletedDayId: hasMatchingCompletedDay ? routine.progress.lastCompletedDayId : null,
    lastCompletedAt: hasMatchingCompletedDay ? routine.progress.lastCompletedAt : null
  }
}

export function getSuggestedRoutineDay(routine: Routine): RoutineDaySelection | null {
  const selections = listRoutineDaySelections(routine).filter((selection) => isTrainableRoutineDay(selection.day))
  const progress = resolveRoutineProgress(routine)

  if (selections.length === 0) {
    return null
  }

  const preferredWeekIndex = Math.min(Math.max(progress.currentWeekIndex, 0), routine.weeks.length - 1)

  if (!progress.lastCompletedDayId) {
    return (
      selections.find((selection) => selection.weekIndex === preferredWeekIndex) ?? null
    )
  }

  const lastCompleted = selections.find((selection) => selection.day.id === progress.lastCompletedDayId)

  if (!lastCompleted) {
    return selections[0]
  }

  const nextDayInSameWeek = selections.find(
    (selection) => selection.weekIndex === lastCompleted.weekIndex && selection.dayIndex > lastCompleted.dayIndex
  )

  if (nextDayInSameWeek) {
    return nextDayInSameWeek
  }

  const nextWeekIndex = (lastCompleted.weekIndex + 1) % routine.weeks.length
  return selections.find((selection) => selection.weekIndex === nextWeekIndex) ?? selections[0]
}

export function listTrainableRoutineDaySelections(routine: Routine): RoutineDaySelection[] {
  return listRoutineDaySelections(routine).filter((selection) => isTrainableRoutineDay(selection.day))
}

export function advanceRoutineProgress(
  routine: Routine,
  selection: RoutineDaySelection,
  completedAt: string
): RoutineProgress {
  const week = routine.weeks[selection.weekIndex]
  const nextWeekIndex = week && selection.dayIndex === week.days.length - 1 ? (selection.weekIndex + 1) % routine.weeks.length : selection.weekIndex

  return {
    currentWeekIndex: nextWeekIndex,
    lastCompletedDayId: selection.day.id,
    lastCompletedAt: completedAt
  }
}

export function resolveActiveRoutine(routines: Routine[], activeRoutineId: string | null): ActiveRoutineResolution {
  const validRoutineIds = new Set(routines.map((routine) => routine.id))
  const validPointer = activeRoutineId && validRoutineIds.has(activeRoutineId) ? activeRoutineId : null
  const activeCandidates = routines.filter((routine) => routine.status === 'active').sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  const chosenRoutine = validPointer ? (routines.find((routine) => routine.id === validPointer) ?? activeCandidates[0] ?? null) : (activeCandidates[0] ?? null)

  return {
    repairedState: Boolean(activeRoutineId && !validPointer) || activeCandidates.length > 1 || (chosenRoutine ? chosenRoutine.status !== 'active' : false),
    routine: chosenRoutine
  }
}
