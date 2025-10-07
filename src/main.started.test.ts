import { app } from "electron";
import { expect, it, vi } from "vitest";
import "./main";

vi.hoisted(() => {
	vi.stubGlobal("MAIN_WINDOW_VITE_DEV_SERVER_URL", undefined);
	vi.stubGlobal("MAIN_WINDOW_VITE_NAME", undefined);
});

vi.mock(import("electron"));
vi.mock(import("update-electron-app"));
vi.mock(import("electron-squirrel-startup"), () => ({ default: true }));

it("calls app.quit if the app is already running", () => {
	// Arrange
	// Act

	// Assert
	expect(app.quit).toHaveBeenCalled();
});
