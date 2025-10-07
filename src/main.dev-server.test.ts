import { BrowserWindow } from "electron";
import { expect, it, vi } from "vitest";
import "./main";

vi.hoisted(() => {
	vi.stubGlobal("MAIN_WINDOW_VITE_DEV_SERVER_URL", "dev-server-url");
	vi.stubGlobal("MAIN_WINDOW_VITE_NAME", undefined);
});

vi.mock(import("electron"));
vi.mock(import("update-electron-app"));
vi.mock(import("electron-squirrel-startup"), () => ({ default: false }));

it("loads the dev server if it's set", () => {
	// Arrange
	// Act

	// Assert
	expect(new BrowserWindow().loadURL).toHaveBeenCalledWith("dev-server-url");
});
