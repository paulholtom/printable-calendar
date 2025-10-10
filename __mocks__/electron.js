import { vi } from "vitest";

export const app = {
	whenReady: vi.fn(async () => {
		// Do nothing.
	}),
	on: vi.fn(),
	quit: vi.fn(),
	getPath: vi.fn(),
};
export const ipcMain = {
	handle: vi.fn(),
};

const loadURL = vi.fn();
const loadFile = vi.fn();

const BrowserWindow = vi.fn(function () {
	this.loadURL = loadURL;
	this.loadFile = loadFile;
});
BrowserWindow.getAllWindows = vi.fn();

export { BrowserWindow };

export const dialog = {
	showOpenDialog: vi.fn(),
};

const Menu = vi.fn(function () {});
Menu.buildFromTemplate = vi.fn();
Menu.setApplicationMenu = vi.fn();

export { Menu };
