import { app, BrowserWindow } from "electron";
import { join } from "node:path";
import { updateElectronApp } from "update-electron-app";
import { expect, it, vi } from "vitest";
import "./main";

vi.hoisted(() => {
	vi.stubGlobal("MAIN_WINDOW_VITE_DEV_SERVER_URL", undefined);
	vi.stubGlobal("MAIN_WINDOW_VITE_NAME", "vite-name");
});

vi.mock(import("electron"));
vi.mock(import("update-electron-app"));
vi.mock(import("electron-squirrel-startup"), () => ({ default: false }));

it("checks for app updates", () => {
	// Arrange
	// Act

	// Assert
	expect(updateElectronApp).toHaveBeenCalledTimes(1);
});

it("does not call app.quit if the app isn't already running", () => {
	// Arrange
	// Act

	// Assert
	expect(app.quit).not.toHaveBeenCalled();
});

it("initializes the browser window", () => {
	// Arrange
	// Act

	// Assert
	expect(BrowserWindow).toHaveBeenCalledWith({
		height: 600,
		width: 800,
		webPreferences: {
			preload: join(__dirname, "preload.js"),
		},
	});
});

it("loads the renderer's index file", () => {
	// Arrange
	// Act

	// Assert
	expect(new BrowserWindow().loadFile).toHaveBeenCalledWith(
		join(__dirname, "../renderer/vite-name/index.html"),
	);
});
