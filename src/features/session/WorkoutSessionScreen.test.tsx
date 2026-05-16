import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../db/database";
import * as sessionRepository from "./sessionRepository";
import { WorkoutSessionScreen } from "./WorkoutSessionScreen";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
	const actual =
		await vi.importActual<typeof import("react-router-dom")>(
			"react-router-dom",
		);

	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

describe("WorkoutSessionScreen", () => {
	beforeEach(() => {
		mockNavigate.mockReset();
		vi.restoreAllMocks();
	});

	it("shows previous references and communicates when a set has no prior snapshot", async () => {
		await seedRoutine();

		await db.sessions.add({
			id: "session-old",
			routineId: "routine-1",
			routineName: "Upper Lower",
			dayId: "day-1",
			dayLabel: "Pull",
			weekIndex: 0,
			weekLabel: "Semana 1",
			status: "completed",
			notes: "volver más fresco para no perder postura",
			startedAt: "2026-05-04T10:00:00.000Z",
			endedAt: "2026-05-04T10:40:00.000Z",
			exercises: [
				{
					id: "snapshot-old",
					exerciseTemplateId: "exercise-1",
					exerciseName: "Remo con barra",
					targetSets: 2,
					targetRir: 1,
					muscle: "Espalda",
					notes: "mantener pecho arriba y no tirar con bíceps",
					sets: [
						{ id: "set-1", setNumber: 1, reps: 8, weightKg: 70, actualRir: 1 },
					],
				},
			],
		});

		renderSessionScreen();

		expect(await screen.findByText(/\(70 kg\) × 8/i)).toBeInTheDocument();
		expect(screen.getByText(/^—$/)).toBeInTheDocument();
		expect(
			screen.getByText(/volver más fresco para no perder postura/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/mantener pecho arriba y no tirar con bíceps/i),
		).toBeInTheDocument();
	});

	it("uses routine targets as placeholders and saves decimal weights with comma input", async () => {
		const user = userEvent.setup();
		await seedRoutine();

		renderSessionScreen();

		expect(await screen.findByLabelText(/peso kg serie 1/i)).toHaveAttribute(
			"placeholder",
			"22,5",
		);
		expect(screen.getByLabelText(/reps serie 1/i)).toHaveAttribute(
			"placeholder",
			"8-10",
		);
		expect(screen.getByLabelText(/rir real serie 1/i)).toHaveAttribute(
			"placeholder",
			"2",
		);
		expect(screen.getByLabelText(/peso kg serie 2/i)).not.toHaveAttribute(
			"placeholder",
		);
		expect(screen.getByLabelText(/reps serie 2/i)).toHaveAttribute(
			"placeholder",
			"10-12",
		);
		expect(screen.getByLabelText(/rir real serie 2/i)).toHaveAttribute(
			"placeholder",
			"1",
		);

		await user.type(screen.getByLabelText(/peso kg serie 1/i), "22,5");
		await user.type(screen.getByLabelText(/reps serie 1/i), "10");
		await user.type(screen.getByLabelText(/rir real serie 1/i), "1");
		await user.click(screen.getByRole("button", { name: /finalizar sesión/i }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith("/?sessionSaved=completed");
		});

		const savedSession = await db.sessions.orderBy("endedAt").last();

		expect(savedSession?.exercises[0]?.sets[0]).toMatchObject({
			weightKg: 22.5,
			reps: 10,
			actualRir: 1,
		});
	});

	it("shows visible saving feedback and returns with a success flag", async () => {
		const user = userEvent.setup();
		await seedRoutine();

		let resolveSave:
			| ((
					value: Awaited<
						ReturnType<typeof sessionRepository.saveWorkoutSession>
					>,
			  ) => void)
			| null = null;
		const savePromise = new Promise<
			Awaited<ReturnType<typeof sessionRepository.saveWorkoutSession>>
		>((resolve) => {
			resolveSave = resolve;
		});

		vi.spyOn(sessionRepository, "saveWorkoutSession").mockReturnValue(
			savePromise,
		);

		renderSessionScreen();

		await screen.findByRole("heading", { name: "Pull" });
		await user.type(
			screen.getByLabelText(/nota rápida de la sesión/i),
			"sentí poca estabilidad al final",
		);
		await user.type(
			screen.getByLabelText(/nota rápida del ejercicio/i),
			"subir 2.5 kg si mantengo forma",
		);
		await user.click(screen.getByRole("button", { name: /finalizar sesión/i }));

		expect(sessionRepository.saveWorkoutSession).toHaveBeenCalledWith(
			expect.objectContaining({
				notes: "sentí poca estabilidad al final",
				exercises: [
					expect.objectContaining({ notes: "subir 2.5 kg si mantengo forma" }),
				],
			}),
		);

		expect(screen.getByRole("status")).toHaveTextContent(
			/guardando sesión finalizada/i,
		);
		expect(
			screen.getByRole("button", { name: /guardando finalización/i }),
		).toBeDisabled();

		resolveSave?.({
			id: "session-new",
			routineId: "routine-1",
			routineName: "Upper Lower",
			dayId: "day-1",
			dayLabel: "Pull",
			weekIndex: 0,
			weekLabel: "Semana 1",
			status: "completed",
			notes: "sentí poca estabilidad al final",
			startedAt: "2026-05-05T10:00:00.000Z",
			endedAt: "2026-05-05T10:30:00.000Z",
			exercises: [],
		});

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith("/?sessionSaved=completed");
		});
	});
});

function renderSessionScreen() {
	return render(
		<MemoryRouter
			initialEntries={[
				"/session/routine-1/0/day-1?startedAt=2026-05-05T10:00:00.000Z",
			]}
		>
			<Routes>
				<Route
					path="/session/:routineId/:weekIndex/:dayId"
					element={<WorkoutSessionScreen />}
				/>
			</Routes>
		</MemoryRouter>,
	);
}

async function seedRoutine() {
	await db.routines.add({
		id: "routine-1",
		name: "Upper Lower",
		status: "active",
		weekCount: 1,
		weeks: [
			{
				id: "week-1",
				label: "Semana 1",
				days: [
					{
						id: "day-1",
						label: "Pull",
						exercises: [
							{
								id: "exercise-1",
								name: "Remo con barra",
								targetSets: 2,
								targetRir: 1,
								muscle: "Espalda",
								setReferences: [
									{
										id: "ref-1",
										weightTarget: "22,5",
										repsTarget: "8-10",
										rirTarget: "2",
									},
									{
										id: "ref-2",
										weightTarget: "",
										repsTarget: "10-12",
										rirTarget: "1",
									},
								],
							},
						],
					},
				],
			},
		],
		progress: {
			currentWeekIndex: 0,
			lastCompletedDayId: null,
			lastCompletedAt: null,
		},
		createdAt: "2026-05-05T10:00:00.000Z",
		updatedAt: "2026-05-05T10:00:00.000Z",
	});
}

describe("Weight Suggestion Badge", () => {
	beforeEach(async () => {
		mockNavigate.mockReset();
		vi.restoreAllMocks();
		await db.routines.clear();
		await db.sessions.clear();
	});

	it("IT-1 (SC-23): appears after completing Set 1", async () => {
		const user = userEvent.setup();
		await seedRoutine();

		renderSessionScreen();

		await screen.findByRole("heading", { name: "Pull" });
		await user.type(screen.getByLabelText(/peso kg serie 1/i), "25");
		await user.type(screen.getByLabelText(/reps serie 1/i), "10");
		await user.type(screen.getByLabelText(/rir real serie 1/i), "1");

		// Badge should appear between sets (after set 1, before set 2)
		await waitFor(() => {
			const badge = screen.queryByText(/💡/i);
			expect(badge).toBeInTheDocument();
		});
	});

	it("IT-2 (SC-24): disappears when next set gets input", async () => {
		const user = userEvent.setup();
		await seedRoutine();

		renderSessionScreen();

		await screen.findByRole("heading", { name: "Pull" });

		// Complete Set 1
		await user.type(screen.getByLabelText(/peso kg serie 1/i), "25");
		await user.type(screen.getByLabelText(/reps serie 1/i), "10");
		await user.type(screen.getByLabelText(/rir real serie 1/i), "1");

		// Badge should be visible
		await waitFor(() => {
			expect(screen.queryByText(/💡/i)).toBeInTheDocument();
		});

		// Start typing in Set 2 — badge should disappear
		await user.type(screen.getByLabelText(/peso kg serie 2/i), "2");

		await waitFor(() => {
			expect(screen.queryByText(/💡/i)).not.toBeInTheDocument();
		});
	});

	it("IT-3 (SC-25): no badge before any set is logged", async () => {
		await seedRoutine();

		renderSessionScreen();

		// No badge should appear before first set is logged
		expect(screen.queryByText(/💡/i)).not.toBeInTheDocument();
	});

	it("IT-4 (SC-26): no badge after last set", async () => {
		const user = userEvent.setup();
		await seedRoutine();

		renderSessionScreen();

		await screen.findByRole("heading", { name: "Pull" });

		// Complete Set 1 — badge should appear between sets
		await user.type(screen.getByLabelText(/peso kg serie 1/i), "25");
		await user.type(screen.getByLabelText(/reps serie 1/i), "10");
		await user.type(screen.getByLabelText(/rir real serie 1/i), "1");

		await waitFor(() => {
			expect(screen.queryByText(/💡/i)).toBeInTheDocument();
		});

		// Complete Set 2 (last set) — badge should disappear and not reappear
		await user.type(screen.getByLabelText(/peso kg serie 2/i), "20");
		await user.type(screen.getByLabelText(/reps serie 2/i), "12");
		await user.type(screen.getByLabelText(/rir real serie 2/i), "1");

		// No badge at all — last set has no suggestion
		expect(screen.queryByText(/💡/i)).not.toBeInTheDocument();
	});

	it("IT-5 (SC-27): Set 2 inputs remain empty when badge is shown", async () => {
		const user = userEvent.setup();
		await seedRoutine();

		renderSessionScreen();

		await screen.findByRole("heading", { name: "Pull" });
		await user.type(screen.getByLabelText(/peso kg serie 1/i), "25");
		await user.type(screen.getByLabelText(/reps serie 1/i), "10");
		await user.type(screen.getByLabelText(/rir real serie 1/i), "1");

		// Badge should be visible
		await waitFor(() => {
			expect(screen.queryByText(/💡/i)).toBeInTheDocument();
		});

		// Set 2 inputs should still be empty (no pre-fill)
		expect(screen.getByLabelText(/peso kg serie 2/i)).toHaveValue("");
		expect(screen.getByLabelText(/reps serie 2/i)).toHaveValue("");
		expect(screen.getByLabelText(/rir real serie 2/i)).toHaveValue("");
	});
});
