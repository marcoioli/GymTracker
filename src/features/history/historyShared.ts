import { getSessionVolume } from '../../domain/analytics'
import type { WorkoutSession } from '../../domain/sessions'

export type SessionFilterOption = {
  key: string
  label: string
}

export type RangeFilter = 'all' | 'week' | 'month'

export function getSessionRoutineName(session: WorkoutSession, routineLabels: Map<string, string>): string {
  return session.routineName ?? routineLabels.get(session.routineId) ?? 'Rutina archivada'
}

export function getSessionWeekLabel(session: WorkoutSession): string {
  return session.weekLabel ?? `Semana ${session.weekIndex + 1}`
}

export function getSessionWorkoutTitle(session: WorkoutSession): string {
  return session.dayLabel ?? 'Entrenamiento guardado'
}

export function getSessionDayLabel(session: WorkoutSession): string {
  return `${getSessionWeekLabel(session)} · ${getSessionWorkoutTitle(session)}`
}

export function getSessionDayKey(session: WorkoutSession): string {
  return `${session.weekIndex}:${session.dayId}:${session.weekLabel ?? ''}:${session.dayLabel ?? ''}`
}

export function formatSessionDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

export function getSessionSetCount(session: WorkoutSession): number {
  return session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)
}

export function getSessionDurationLabel(session: WorkoutSession): string {
  return formatDurationFromIso(session.startedAt, session.endedAt)
}

export function formatVolume(sets: WorkoutSession['exercises'][number]['sets']): string {
  const totalVolume = sets.reduce((total, set) => total + (set.reps !== null && set.weightKg !== null ? set.reps * set.weightKg : 0), 0)

  return `${totalVolume.toFixed(0)} kg volumen`
}

export function filterSessionsByRange(sessions: WorkoutSession[], range: RangeFilter): WorkoutSession[] {
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monday = getWeekMonday(now).toISOString().slice(0, 10)

  if (range === 'week') {
    return sessions.filter((session) => session.endedAt.slice(0, 10) >= monday)
  }

  if (range === 'month') {
    return sessions.filter((session) => session.endedAt.slice(0, 7) === thisMonth)
  }

  return sessions
}

export function buildSummary(sessions: WorkoutSession[]) {
  const totalMinutes = sessions.reduce((total, session) => total + Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000), 0)
  const hours = Math.floor(Math.max(totalMinutes, 0) / 60)
  const minutes = Math.max(totalMinutes, 0) % 60
  const totalVolume = sessions.reduce((total, session) => total + getSessionVolume(session), 0)

  return {
    sessionCount: sessions.length,
    totalDuration: `${hours}h ${String(minutes).padStart(2, '0')}m`,
    totalVolume: `${Math.round(totalVolume).toLocaleString('es-AR')} kg`
  }
}

export function parseRangeFilter(value: string | null): RangeFilter {
  return value === 'week' || value === 'month' ? value : 'all'
}

export function buildHistorySearchParams(filters: {
  dayKey?: string
  range?: RangeFilter
  routineId?: string
}) {
  const searchParams = new URLSearchParams()

  if (filters.range && filters.range !== 'all') {
    searchParams.set('range', filters.range)
  }

  if (filters.routineId && filters.routineId !== 'all') {
    searchParams.set('routineId', filters.routineId)
  }

  if (filters.dayKey && filters.dayKey !== 'all') {
    searchParams.set('dayKey', filters.dayKey)
  }

  return searchParams
}

function formatDurationFromIso(startedAt: string, endedAt: string): string {
  const diffMs = Math.max(new Date(endedAt).getTime() - new Date(startedAt).getTime(), 0)
  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours > 0 ? `${hours}:` : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getWeekMonday(anchor: Date): Date {
  const current = new Date(Date.UTC(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()))
  const day = current.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  current.setUTCDate(current.getUTCDate() + diff)
  return current
}
