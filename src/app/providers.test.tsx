import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppProviders } from "./providers";

describe("AppProviders splash boot flow", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("hides and removes the launch splash after mount", () => {
		const splashScreen = document.createElement("div");
		splashScreen.id = "app-launch-splash";
		document.body.appendChild(splashScreen);

		render(
			<AppProviders>
				<div>Treino listo</div>
			</AppProviders>,
		);

		expect(screen.getByText("Treino listo")).toBeInTheDocument();
		expect(document.getElementById("app-launch-splash")).toBe(splashScreen);

		vi.advanceTimersByTime(1);
		expect(splashScreen).toHaveAttribute("data-state", "hidden");

		vi.advanceTimersByTime(220);
		expect(
			document.getElementById("app-launch-splash"),
		).not.toBeInTheDocument();
	});
});
