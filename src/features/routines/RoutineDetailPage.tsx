import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate, useParams } from "react-router-dom";

import { db } from "../../db/database";
import type {
	Routine,
	RoutineDay,
	RoutineExercise,
	RoutineWeek,
} from "../../domain/routines";
import { Button, Card, EmptyState, PageSection, StatusBanner } from "../../shared/ui";

export function RoutineDetailPage() {
	const { routineId = "" } = useParams();
	const navigate = useNavigate();
	const routine = useLiveQuery(
		() => db.routines.get(routineId),
		[routineId],
		undefined,
	);

	if (routine === undefined) {
		return (
			<PageSection
				description="Buscando la rutina en la base local."
				eyebrow="Rutinas"
				title="Cargando detalle"
				titleId="routine-detail-loading-title"
			>
				<StatusBanner tone="info">Cargando datos de la rutina...</StatusBanner>
			</PageSection>
		);
	}

	if (routine === null || routine === undefined) {
		return (
			<PageSection
				description="Esa rutina ya no existe o el enlace quedó viejo."
				eyebrow="Rutinas"
				title="Rutina no encontrada"
				titleId="routine-detail-missing-title"
			>
				<EmptyState
					className="history-empty"
					description="Volvé a la lista de rutinas y elegí una que todavía esté guardada."
					title="No encontramos esta rutina"
				/>
				<Button variant="secondary" onClick={() => navigate("/routines")}>
					Volver a rutinas
				</Button>
			</PageSection>
		);
	}

	return (
		<RoutineDetail routine={routine} onBack={() => navigate("/routines")} />
	);
}

function RoutineDetail({
	routine,
	onBack,
}: {
	routine: Routine;
	onBack: () => void;
}) {
	const totalDays = routine.weeks.reduce(
		(count, week) => count + week.days.length,
		0,
	);
	const totalExercises = routine.weeks.reduce(
		(count, week) =>
			count +
			week.days.reduce((dayCount, day) => dayCount + day.exercises.length, 0),
		0,
	);
	const totalSets = routine.weeks.reduce(
		(count, week) =>
			count +
			week.days.reduce(
				(dayCount, day) =>
					dayCount +
					day.exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0),
				0,
			),
		0,
	);

	return (
		<PageSection
			actions={
				<Button size="compact" variant="ghost" onClick={onBack}>
					Volver
				</Button>
			}
			description={`${totalDays} días · ${totalExercises} ejercicios · ${totalSets} series`}
			eyebrow="Rutinas"
			title={routine.name}
			titleId="routine-detail-title"
		>
			<div className="routine-detail-stack">
				{routine.weeks.map((week, weekIndex) => (
					<RoutineWeekCard
						key={week.id}
						week={week}
						weekIndex={weekIndex}
						currentWeekIndex={routine.progress.currentWeekIndex}
					/>
				))}
			</div>
		</PageSection>
	);
}

function RoutineWeekCard({
	week,
	weekIndex,
	currentWeekIndex,
}: {
	week: RoutineWeek;
	weekIndex: number;
	currentWeekIndex: number;
}) {
	const isCurrentWeek = weekIndex === currentWeekIndex;

	if (week.days.length === 0) {
		return (
			<Card as="article" className="routine-detail-week-card" key={week.id}>
				<div className="routine-detail-week-header">
					<h3 className="routine-card-title">{week.label}</h3>
					{isCurrentWeek ? (
						<span className="status-pill status-pill--active">
							Semana actual
						</span>
					) : null}
				</div>
				<p className="routine-summary">Sin días cargados en esta semana.</p>
			</Card>
		);
	}

	return (
		<Card as="article" className="routine-detail-week-card" key={week.id}>
			<div className="routine-detail-week-header">
				<h3 className="routine-card-title">{week.label}</h3>
				{isCurrentWeek ? (
					<span className="status-pill status-pill--active">Semana actual</span>
				) : null}
			</div>

			<div className="routine-detail-days-stack">
				{week.days.map((day) => (
					<RoutineDayCard key={day.id} day={day} />
				))}
			</div>
		</Card>
	);
}

function RoutineDayCard({ day }: { day: RoutineDay }) {
	return (
		<div className="routine-detail-day-card">
			<div className="routine-detail-day-header">
				<h4 className="routine-card-title">{day.label}</h4>
				<span className="routine-summary">
					{day.exercises.length} ejercicio
					{day.exercises.length !== 1 ? "s" : ""}
				</span>
			</div>

			{day.exercises.length === 0 ? (
				<p className="routine-summary">Sin ejercicios cargados en este día.</p>
			) : (
				<div className="routine-detail-exercise-stack">
					{day.exercises.map((exercise) => (
						<RoutineExerciseCard key={exercise.id} exercise={exercise} />
					))}
				</div>
			)}
		</div>
	);
}

function RoutineExerciseCard({ exercise }: { exercise: RoutineExercise }) {
	return (
		<div className="routine-detail-exercise-card">
			<div className="routine-detail-exercise-header">
				<h5 className="routine-card-title">{exercise.name}</h5>
				<span className="routine-summary">
					{exercise.targetSets} series
					{exercise.targetRir !== null
						? ` · RIR objetivo ${exercise.targetRir}`
						: ""}{" "}
					· {exercise.muscle}
				</span>
			</div>

			{exercise.setReferences &&
			exercise.setReferences.length > 0 &&
			exercise.setReferences.some(
				(ref) =>
					ref.weightTarget.trim() ||
					ref.repsTarget.trim() ||
					ref.rirTarget.trim(),
			) ? (
				<div className="routine-detail-set-table">
					<div
						className="routine-detail-set-grid routine-detail-set-grid--head"
						aria-hidden="true"
					>
						<span>Set</span>
						<span>Peso</span>
						<span>Reps</span>
						<span>RIR</span>
					</div>
					{exercise.setReferences.map((ref, idx) =>
						ref.weightTarget.trim() ||
						ref.repsTarget.trim() ||
						ref.rirTarget.trim() ? (
							<div className="routine-detail-set-grid" key={ref.id}>
								<span className="routine-detail-set-grid__index">
									{idx + 1}
								</span>
								<span>{ref.weightTarget || "—"}</span>
								<span>{ref.repsTarget || "—"}</span>
								<span>{ref.rirTarget || "—"}</span>
							</div>
						) : null,
					)}
				</div>
			) : null}
		</div>
	);
}
