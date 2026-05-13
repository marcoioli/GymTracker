import { useEffect, type PropsWithChildren } from "react";

import { PwaRuntimeBridge } from "./pwa-runtime";
import { ThemeProvider } from "./theme";

type SplashWindow = Window & {
	__treinoSplashStart?: number;
};

const SPLASH_MIN_VISIBLE_MS = 1000;
const SHATTER_DURATION_MS = 600;
const FRAGMENT_COUNT = 4;

function createShatterFragments(splash: HTMLElement): HTMLElement[] {
	const container = splash.querySelector(".launch-splash__shatter");

	if (!container) {
		return [];
	}

	const fragments: HTMLElement[] = [];

	for (let i = 0; i < FRAGMENT_COUNT; i++) {
		const piece = document.createElement("div");
		piece.className = "launch-splash__fragment";
		piece.dataset.piece = String(i);
		piece.setAttribute("aria-hidden", "true");
		container.appendChild(piece);
		fragments.push(piece);
	}

	return fragments;
}

export function AppProviders({ children }: PropsWithChildren) {
	useEffect(() => {
		const splashScreen = document.getElementById("app-launch-splash");

		if (!splashScreen) {
			return;
		}

		const splashWindow = window as SplashWindow;
		const splashStart =
			splashWindow.__treinoSplashStart ??
			window.performance?.now?.() ??
			Date.now();
		const now = window.performance?.now?.() ?? Date.now();
		const waitBeforeHide = Math.max(
			0,
			SPLASH_MIN_VISIBLE_MS - (now - splashStart),
		);

		let removeSplashScreen = 0;
		const frame = window.requestAnimationFrame(() => {
			const shatterSplash = window.setTimeout(() => {
				// Create fragments before triggering the animation
				createShatterFragments(splashScreen);

				// Trigger the shatter animation
				splashScreen.dataset.state = "shatter";

				// Remove after animation completes
				removeSplashScreen = window.setTimeout(() => {
					splashScreen.remove();
				}, SHATTER_DURATION_MS);
			}, waitBeforeHide);

			splashScreen.dataset.hideTimer = String(shatterSplash);
		});

		return () => {
			window.cancelAnimationFrame(frame);
			const hideTimer = Number(splashScreen.dataset.hideTimer ?? 0);

			if (hideTimer) {
				window.clearTimeout(hideTimer);
			}

			if (removeSplashScreen) {
				window.clearTimeout(removeSplashScreen);
			}
		};
	}, []);

	return (
		<ThemeProvider>
			<PwaRuntimeBridge />
			{children}
		</ThemeProvider>
	);
}
