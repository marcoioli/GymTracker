import {
	type Dispatch,
	type SetStateAction,
	Fragment,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../db/database";
import { parseSessionNumericInput } from "../../domain/sessions";
import {
	getWeightSuggestion,
	resolveEffectiveTargetReps,
	resolveRirTarget,
	type WeightSuggestion,
} from "../../domain/suggestions";
import {
	getRoutineDaySelection,
	normalizeExerciseName,
	type RoutineExerciseSetReference,
} from "../../domain/routines";
import {
	Button,
	Card,
	EmptyState,
	Field,
	FieldTextarea,
	PageSection,
	StatusBanner,
} from "../../shared/ui";
import {
	getPreviousSessionReferences,
	getWorkoutDayLabel,
	saveWorkoutSession,
	type PreviousExerciseReference,
	type PreviousSessionContext,
	type SessionExerciseInput,
} from "./sessionRepository";
import { WeightSuggestionBadge } from "./WeightSuggestionBadge";

type ExerciseDraftState = SessionExerciseInput;

export function WorkoutSessionScreen() {
	const navigate = useNavigate();
	const { routineId = "", weekIndex = "", dayId = "" } = useParams();
	const [searchParams] = useSearchParams();
	const startedAt = searchParams.get("startedAt") ?? new Date().toISOString();
	const routine = useLiveQuery(
		() => db.routines.get(routineId),
		[routineId],
		undefined,
	);
	const previousSessionContext = useLiveQuery(
		() => getPreviousSessionReferences(routineId, dayId),
		[routineId, dayId],
		{ exercises: {} },
	);

	const selection = useMemo(() => {
		if (!routine) {
			return null;
		}

		return getRoutineDaySelection(routine, Number(weekIndex), dayId);
	}, [dayId, routine, weekIndex]);

	if (!routine || !selection) {
		return (
			<section className="panel" aria-labelledby="session-missing-title">
				<h2 className="section-title" id="session-missing-title">
					No encontramos ese día de entrenamiento
				</h2>
				<EmptyState
					className="history-empty"
					description="Volvé al dashboard y arrancá desde la rutina activa para generar la sesión correcta, no una URL colgada sin contexto."
					title="La sesión ya no tiene contexto válido"
				/>
				<button
					className="cta-button"
					type="button"
					onClick={() => navigate("/")}
				>
					Volver al inicio
				</button>
			</section>
		);
	}

	return (
		<WorkoutSessionForm
			key={`${routine.id}:${selection.weekIndex}:${selection.day.id}:${startedAt}`}
			navigateHome={(status) =>
				navigate(status ? `/?sessionSaved=${status}` : "/")
			}
			previousSessionContext={previousSessionContext}
			routineId={routine.id}
			routineName={routine.name}
			selection={selection}
			startedAt={startedAt}
		/>
	);
}

function WorkoutSessionForm({
	navigateHome,
	previousSessionContext,
	routineId,
	selection,
	startedAt,
	routineName,
}: {
	navigateHome: (status?: "completed" | "ended-early") => void;
	previousSessionContext: PreviousSessionContext;
	routineId: string;
	selection: NonNullable<ReturnType<typeof getRoutineDaySelection>>;
	startedAt: string;
	routineName: string;
}) {
	const [exerciseDrafts, setExerciseDrafts] = useState<ExerciseDraftState[]>(
		() =>
			selection.day.exercises.map((exercise) => ({
				exerciseId: exercise.id,
				exerciseName: exercise.name,
				notes: "",
				sets: Array.from({ length: exercise.targetSets }, () => ({
					reps: "",
					weightKg: "",
					actualRir: "",
				})),
			})),
	);
	const [sessionNote, setSessionNote] = useState("");
	const [isSaving, setIsSaving] = useState<"completed" | "ended-early" | null>(
		null,
	);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [elapsedLabel, setElapsedLabel] = useState(() =>
		formatElapsed(startedAt, new Date().toISOString()),
	);

	const enteredVolume = useMemo(
		() =>
			exerciseDrafts.reduce(
				(total, exercise) =>
					total +
					exercise.sets.reduce(
						(exerciseTotal, set) =>
							exerciseTotal +
							((parseSessionNumericInput(set.reps) ?? 0) *
								(parseSessionNumericInput(set.weightKg) ?? 0) || 0),
						0,
					),
				0,
			),
		[exerciseDrafts],
	);
	const workingSetCount = useMemo(
		() =>
			exerciseDrafts.reduce(
				(total, exercise) => total + exercise.sets.length,
				0,
			),
		[exerciseDrafts],
	);
	const suggestions = useMemo(() => {
		const result = new Map<string, WeightSuggestion>();
		for (let eIdx = 0; eIdx < exerciseDrafts.length; eIdx++) {
			const exercise = selection.day.exercises[eIdx];
			const draft = exerciseDrafts[eIdx];
			if (!exercise || !draft) continue;

			const exerciseTargetRir = exercise.targetRir;

			for (let sIdx = 1; sIdx < draft.sets.length; sIdx++) {
				const prevSet = draft.sets[sIdx - 1];
				const nextSet = draft.sets[sIdx];

				// Badge hidden when next set already has input (REQ-13/REQ-9)
				if (nextSet?.weightKg || nextSet?.reps || nextSet?.actualRir) {
					continue;
				}

				const weight = parseSessionNumericInput(prevSet.weightKg);
				const reps = parseSessionNumericInput(prevSet.reps);
				const actualRir = parseSessionNumericInput(prevSet.actualRir);

				// All three must be present (REQ-8)
				if (weight === null || reps === null || actualRir === null) {
					continue;
				}

				// setReferences is 0-indexed: [0] = set 1 reference
				const completedSetIndex = sIdx - 1;
				const setRef = exercise.setReferences?.[completedSetIndex];
				const targetRir = resolveRirTarget(
					setRef?.rirTarget,
					exerciseTargetRir,
				);

				// No suggestion when targetRir is null (REQ-10)
				if (targetRir === null) continue;

				const targetRepsEff = resolveEffectiveTargetReps(setRef?.repsTarget);

				const suggestion = getWeightSuggestion({
					lastSet: { weightKg: weight, reps, actualRir },
					targetRepsEff,
					targetRir,
				});

				if (suggestion) {
					result.set(`${eIdx}:${sIdx}`, suggestion);
				}
			}
		}
		return result;
	}, [exerciseDrafts, selection]);

	const savingMessage =
		isSaving === "completed"
			? "Guardando sesión finalizada..."
			: isSaving === "ended-early"
				? "Guardando sesión terminada antes..."
				: null;

	useEffect(() => {
		const timer = window.setInterval(() => {
			setElapsedLabel(formatElapsed(startedAt, new Date().toISOString()));
		}, 1000);

		return () => window.clearInterval(timer);
	}, [startedAt]);

	async function handleFinish(status: "completed" | "ended-early") {
		setIsSaving(status);
		setErrorMessage(null);

		try {
			await saveWorkoutSession({
				routineId,
				weekIndex: selection.weekIndex,
				dayId: selection.day.id,
				startedAt,
				status,
				notes: sessionNote,
				exercises: exerciseDrafts,
			});

			navigateHome(status);
		} catch {
			setErrorMessage(
				"No pudimos guardar la sesión. Revisá los datos y probá de nuevo.",
			);
		} finally {
			setIsSaving(null);
		}
	}

	return (
		<PageSection
			actions={
				<Button size="compact" variant="ghost" onClick={() => navigateHome()}>
					Salir
				</Button>
			}
			description={routineName}
			eyebrow="Track Workout"
			title={selection.day.label}
			titleId="workout-session-title"
		>
			<Card as="article" className="track-workout-hero" variant="highlight">
				<div className="track-workout-hero__field">
					<span>Workout Name</span>
					<strong>{selection.day.label}</strong>
				</div>
				<div className="track-workout-hero__field track-workout-hero__field--muted">
					<span>Referencia</span>
					<strong>{getWorkoutDayLabel(selection)}</strong>
				</div>

				{previousSessionContext.sessionNote ? (
					<div
						className="track-note-callout"
						aria-label="Última nota de la sesión"
					>
						<span className="track-note-callout__label">
							Última nota de la sesión
						</span>
						<p>{previousSessionContext.sessionNote}</p>
					</div>
				) : null}

				<Field
					className="track-note-field"
					hint="Visible en el historial y cuando vuelvas a entrenar este mismo día."
					htmlFor="session-quick-note"
					label="Nota rápida de la sesión"
				>
					<FieldTextarea
						id="session-quick-note"
						maxLength={280}
						placeholder="Ej: me faltó aire al final, bajar descanso o repetir este día más fresco."
						rows={3}
						value={sessionNote}
						onChange={(event) => setSessionNote(event.target.value)}
					/>
				</Field>

				<div className="track-workout-hero__stats">
					<SessionStat value={`${workingSetCount}`} label="Working Sets" />
					<SessionStat value={elapsedLabel} label="Duration" />
					<SessionStat
						value={`${Math.round(enteredVolume).toLocaleString("es-AR")} kg`}
						label="Logged Volume"
					/>
				</div>
			</Card>

			{savingMessage ? (
				<StatusBanner tone="info">{savingMessage}</StatusBanner>
			) : null}

			{errorMessage ? (
				<StatusBanner tone="error">{errorMessage}</StatusBanner>
			) : null}

			<div className="track-workout-stack">
				{selection.day.exercises.map((exercise, exerciseIndex) => {
					const exerciseDraft = exerciseDrafts[exerciseIndex];
					const reference =
						previousSessionContext.exercises[exercise.id] ??
						previousSessionContext.exercises[
							normalizeExerciseName(exercise.name)
						];

					return (
						<Card
							as="article"
							className="track-exercise-card"
							key={exercise.id}
						>
							<div className="track-exercise-card__header">
								<div>
									<h3 className="routine-card-title">{exercise.name}</h3>
									<p className="routine-summary">
										{exercise.targetSets} series{" "}
										{exercise.targetRir !== null
											? `· objetivo RIR ${exercise.targetRir}`
											: ""}
									</p>
								</div>
								<span className="track-exercise-card__badge">
									{exerciseDraft.sets.length} sets
								</span>
							</div>

							<div
								className="track-set-grid track-set-grid--head"
								aria-hidden="true"
							>
								<span>Set</span>
								<span>Previous</span>
								<span>Weight</span>
								<span>Reps</span>
								<span>RIR</span>
							</div>

							{reference?.notes ? (
								<div
									className="track-note-callout track-note-callout--exercise"
									aria-label={`Última nota de ${exercise.name}`}
								>
									<span className="track-note-callout__label">Última nota</span>
									<p>{reference.notes}</p>
								</div>
							) : null}

							<div className="track-set-stack">
								{exerciseDraft.sets.map((set, setIndex) => (
									<Fragment key={`${exercise.id}:set-${setIndex + 1}`}>
										<div className="track-set-grid">
											<span className="track-set-grid__index">
												{setIndex + 1}
											</span>
											<span className="track-set-grid__previous">
												{formatCompactReference(reference, setIndex)}
											</span>

											<input
												aria-label={`Peso kg serie ${setIndex + 1}`}
												className="track-set-input"
												inputMode="decimal"
												placeholder={getPlannedSetPlaceholder(
													exercise.setReferences?.[setIndex],
													"weightTarget",
												)}
												type="text"
												value={set.weightKg ?? ""}
												onChange={(event) =>
													updateExerciseDraft(
														setExerciseDrafts,
														exerciseIndex,
														setIndex,
														"weightKg",
														event.target.value,
													)
												}
											/>

											<input
												aria-label={`Reps serie ${setIndex + 1}`}
												className="track-set-input"
												inputMode="numeric"
												placeholder={getPlannedSetPlaceholder(
													exercise.setReferences?.[setIndex],
													"repsTarget",
												)}
												type="text"
												value={set.reps ?? ""}
												onChange={(event) =>
													updateExerciseDraft(
														setExerciseDrafts,
														exerciseIndex,
														setIndex,
														"reps",
														event.target.value,
													)
												}
											/>

											<input
												aria-label={`RIR real serie ${setIndex + 1}`}
												className="track-set-input track-set-input--subtle"
												inputMode="numeric"
												placeholder={getPlannedSetPlaceholder(
													exercise.setReferences?.[setIndex],
													"rirTarget",
												)}
												type="text"
												value={set.actualRir ?? ""}
												onChange={(event) =>
													updateExerciseDraft(
														setExerciseDrafts,
														exerciseIndex,
														setIndex,
														"actualRir",
														event.target.value,
													)
												}
											/>
										</div>
										{suggestions.get(`${exerciseIndex}:${setIndex + 1}`) && (
											<WeightSuggestionBadge
												suggestion={
													suggestions.get(`${exerciseIndex}:${setIndex + 1}`)!
												}
											/>
										)}
									</Fragment>
								))}
							</div>

							<Field
								className="track-note-field track-note-field--exercise"
								htmlFor={`exercise-note-${exercise.id}`}
								label="Nota rápida del ejercicio"
							>
								<FieldTextarea
									id={`exercise-note-${exercise.id}`}
									maxLength={220}
									placeholder="Ej: cuidar la técnica, subir 2.5 kg o mantener el mismo rango."
									rows={2}
									value={exerciseDraft.notes ?? ""}
									onChange={(event) =>
										updateExerciseNotes(
											setExerciseDrafts,
											exerciseIndex,
											event.target.value,
										)
									}
								/>
							</Field>
						</Card>
					);
				})}
			</div>

			<div className="session-actions" aria-label="Acciones de la sesión">
				<Button
					disabled={isSaving !== null}
					size="touch"
					variant="danger"
					onClick={() => handleFinish("ended-early")}
				>
					{isSaving === "ended-early" ? "Guardando corte..." : "Terminar antes"}
				</Button>
				<Button
					disabled={isSaving !== null}
					fullWidth
					size="touch"
					onClick={() => handleFinish("completed")}
				>
					{isSaving === "completed"
						? "Guardando finalización..."
						: "Finalizar sesión"}
				</Button>
			</div>
		</PageSection>
	);
}

function SessionStat({ value, label }: { value: string; label: string }) {
	return (
		<div className="track-session-stat">
			<strong>{value}</strong>
			<span>{label}</span>
		</div>
	);
}

function formatElapsed(startedAt: string, now: string) {
	const diffMs = Math.max(
		new Date(now).getTime() - new Date(startedAt).getTime(),
		0,
	);
	const totalSeconds = Math.floor(diffMs / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return `${hours > 0 ? `${hours}:` : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatCompactReference(
	reference: PreviousExerciseReference | undefined,
	setIndex: number,
) {
	const setReference = reference?.sets[setIndex];

	if (!setReference) {
		return "—";
	}

	const weight =
		setReference.weightKg !== null ? `${setReference.weightKg} kg` : "— kg";
	const reps = setReference.reps !== null ? `${setReference.reps}` : "—";

	return `(${weight}) × ${reps}`;
}

function getPlannedSetPlaceholder(
	reference: RoutineExerciseSetReference | undefined,
	field: "weightTarget" | "repsTarget" | "rirTarget",
): string | undefined {
	const value = reference?.[field]?.trim();
	return value ? value : undefined;
}

function updateExerciseNotes(
	setExerciseDrafts: Dispatch<SetStateAction<ExerciseDraftState[]>>,
	exerciseIndex: number,
	value: string,
) {
	setExerciseDrafts((current) =>
		current.map((exercise, currentExerciseIndex) =>
			currentExerciseIndex === exerciseIndex
				? {
						...exercise,
						notes: value,
					}
				: exercise,
		),
	);
}

function updateExerciseDraft(
	setExerciseDrafts: Dispatch<SetStateAction<ExerciseDraftState[]>>,
	exerciseIndex: number,
	setIndex: number,
	field: "reps" | "weightKg" | "actualRir",
	value: string,
) {
	setExerciseDrafts((current) =>
		current.map((exercise, currentExerciseIndex) => {
			if (currentExerciseIndex !== exerciseIndex) {
				return exercise;
			}

			return {
				...exercise,
				sets: exercise.sets.map((set, currentSetIndex) =>
					currentSetIndex === setIndex
						? {
								...set,
								[field]: value,
							}
						: set,
				),
			};
		}),
	);
}
