import { useEffect, type PropsWithChildren } from "react";

import { PwaRuntimeBridge } from "./pwa-runtime";
import { ThemeProvider } from "./theme";

export function AppProviders({ children }: PropsWithChildren) {
	useEffect(() => {
		const splashScreen = document.getElementById("app-launch-splash");

		if (!splashScreen) {
			return;
		}

		const hideSplashScreen = window.setTimeout(() => {
			splashScreen.dataset.state = "hidden";
		}, 0);

		const removeSplashScreen = window.setTimeout(() => {
			splashScreen.remove();
		}, 220);

		return () => {
			window.clearTimeout(hideSplashScreen);
			window.clearTimeout(removeSplashScreen);
		};
	}, []);

	return (
		<ThemeProvider>
			<PwaRuntimeBridge />
			{children}
		</ThemeProvider>
	);
}
