import { app, BrowserWindow, dialog, ipcMain } from "electron";
import mockFs from "mock-fs";
import { writeFile } from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "./main";
import { readConfigFile, writeConfigFile } from "./user-config/file-access";

vi.hoisted(() => {
	vi.stubGlobal("MAIN_WINDOW_VITE_DEV_SERVER_URL", undefined);
	vi.stubGlobal("MAIN_WINDOW_VITE_NAME", "vite-name");
});

vi.mock(import("electron"));
vi.mock(import("update-electron-app"));
vi.mock(import("electron-squirrel-startup"), () => ({ default: false }));
vi.mock(import("./user-config/file-access"));
vi.mock(import("node:fs/promises"));

beforeEach(() => {
	vi.resetAllMocks();

	mockFs.restore();
});

function getCallback(
	event: string,
	source: typeof ipcMain.handle | typeof app.on,
): (...args: unknown[]) => unknown {
	for (const [eventName, callback] of vi.mocked(source).mock.calls) {
		if (eventName === event) {
			return callback;
		}
	}

	throw new Error(`Cloud not find callback event '${event}'`);
}

describe("app on window-all-closed", () => {
	const windowAllClosedCallback = getCallback("window-all-closed", app.on);

	it("closes the app if running on win32", () => {
		// Arrange
		vi.stubGlobal("process", { ...process, platform: "win32" });

		// Act
		windowAllClosedCallback();

		// Assert
		expect(app.quit).toHaveBeenCalledOnce();
	});

	it("doesn't close the app if running on darwin", () => {
		// Arrange
		vi.stubGlobal("process", { ...process, platform: "darwin" });

		// Act
		windowAllClosedCallback();

		// Assert
		expect(app.quit).not.toHaveBeenCalled();
	});
});

describe("app on activate", () => {
	const activateCallback = getCallback("activate", app.on);

	it("does not create a new window if there's already any open", () => {
		// Arrange
		vi.mocked(BrowserWindow.getAllWindows).mockReturnValueOnce([
			{} as BrowserWindow,
		]);

		// Act
		activateCallback();

		// Assert
		expect(BrowserWindow).not.toHaveBeenCalled();
	});

	it("creates a new window if none are open", () => {
		// Arrange
		vi.mocked(BrowserWindow.getAllWindows).mockReturnValueOnce([]);

		// Act
		activateCallback();

		// Assert
		expect(BrowserWindow).toHaveBeenCalled();
	});
});

describe("ipcMain handle read-config-file", () => {
	const readConfigFileCallback = getCallback(
		"read-config-file",
		ipcMain.handle,
	);

	it("calls the readConfigFile function", () => {
		// Arrange

		// Act
		readConfigFileCallback();

		// Assert
		expect(readConfigFile).toHaveBeenCalled();
	});
});

describe("ipcMain handle write-config-file", () => {
	const writeConfigFileCallback = getCallback(
		"write-config-file",
		ipcMain.handle,
	);

	it("calls the readConfigFile function", async () => {
		// Arrange
		const contents = "some-content";

		// Act
		await writeConfigFileCallback({}, contents);

		// Assert
		expect(writeConfigFile).toHaveBeenCalledWith(contents);
	});

	it("throws an error if there are no arguments", async () => {
		// Arrange
		// Act
		const act = async () => await writeConfigFileCallback({});

		// Assert
		await expect(act).rejects.toThrowError(
			"Invalid arguments to write-config-file. Expected [string], got []",
		);
	});

	it("throws an error if the argument is the wrong type", async () => {
		// Arrange
		// Act
		const act = async () => await writeConfigFileCallback({}, 5);

		// Assert
		await expect(act).rejects.toThrowError(
			"Invalid arguments to write-config-file. Expected [string], got [number]",
		);
	});

	it("throws an error if there are extra arguments", async () => {
		// Arrange
		// Act
		const act = async () =>
			await writeConfigFileCallback({}, "test", "test");

		// Assert
		await expect(act).rejects.toThrowError(
			"Invalid arguments to write-config-file. Expected [string], got [string,string]",
		);
	});
});

describe("ipcMain handle print-pdf", () => {
	const printPdfCallback = getCallback("print-pdf", ipcMain.handle);

	it("creates a pdf at the specified path if one doesn't already exist", async () => {
		// Arrange
		const filePath = "file-path";
		const contents = "some-content";

		// Act
		await printPdfCallback(
			{ sender: { printToPDF: () => contents } },
			filePath,
		);

		// Assert
		expect(writeFile).toHaveBeenCalledWith(filePath, contents);
	});

	it("appends a number to the file name if that file already exists and has no extension", async () => {
		// Arrange
		const filePath = "file-path";
		const contents = "some-content";
		mockFs({
			[filePath]: "anything",
		});

		// Act
		await printPdfCallback(
			{ sender: { printToPDF: () => contents } },
			filePath,
		);

		// Assert
		expect(writeFile).toHaveBeenCalledWith(`${filePath} (1)`, contents);
	});

	it("appends a number to the file name if that file already exists and has an extension", async () => {
		// Arrange
		const fileName = "file-name";
		const extension = "pdf";
		const contents = "some-content";
		mockFs({
			[`${fileName}.${extension}`]: "anything",
		});

		// Act
		await printPdfCallback(
			{ sender: { printToPDF: () => contents } },
			`${fileName}.${extension}`,
		);

		// Assert
		expect(writeFile).toHaveBeenCalledWith(
			`${fileName} (1).${extension}`,
			contents,
		);
	});

	it("throws an error if there are no arguments", async () => {
		// Arrange
		// Act
		const act = async () => await printPdfCallback({});

		// Assert
		await expect(act).rejects.toThrowError(
			"Invalid arguments to print-pdf. Expected [string], got []",
		);
	});

	it("throws an error if the argument is the wrong type", async () => {
		// Arrange
		// Act
		const act = async () => await printPdfCallback({}, 5);

		// Assert
		await expect(act).rejects.toThrowError(
			"Invalid arguments to print-pdf. Expected [string], got [number]",
		);
	});

	it("throws an error if there are extra arguments", async () => {
		// Arrange
		// Act
		const act = async () => await printPdfCallback({}, "test", "test");

		// Assert
		await expect(act).rejects.toThrowError(
			"Invalid arguments to print-pdf. Expected [string], got [string,string]",
		);
	});
});

describe("ipcMain handle select-directory", () => {
	const selectDirectoryCallback = getCallback(
		"select-directory",
		ipcMain.handle,
	);

	it("returns undefined if the user cancels", async () => {
		// Arrange
		vi.mocked(dialog.showOpenDialog).mockResolvedValueOnce({
			canceled: true,
			filePaths: [],
		});

		// Act
		const result = await selectDirectoryCallback();

		// Assert
		expect(result).toBeUndefined();
	});

	it("returns the first selected file path", async () => {
		// Arrange
		vi.mocked(dialog.showOpenDialog).mockResolvedValueOnce({
			canceled: false,
			filePaths: ["some-file-path"],
		});

		// Act
		const result = await selectDirectoryCallback();

		// Assert
		expect(result).toBe("some-file-path");
	});
});
