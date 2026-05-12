import { useEffect, type PropsWithChildren } from "react";

import { PwaRuntimeBridge } from "./pwa-runtime";
import { ThemeProvider } from "./theme";

type SplashWindow = Window & {
	__treinoSplashStart?: number;
};

const SPLASH_MIN_VISIBLE_MS = 1000;
const SPLASH_FADE_OUT_MS = 280;

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
			const hideSplashScreen = window.setTimeout(() => {
				splashScreen.dataset.state = "hidden";

				removeSplashScreen = window.setTimeout(() => {
					splashScreen.remove();
				}, SPLASH_FADE_OUT_MS);
			}, waitBeforeHide);

			splashScreen.dataset.hideTimer = String(hideSplashScreen);
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
