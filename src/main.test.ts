import { app, BrowserWindow, dialog, ipcMain } from "electron";
import mockFs from "mock-fs";
import { writeFile } from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	readCalendarFiles,
	writeCalendarFile,
} from "./calendar-events/file-access";
import { ELECTRON_API_EVENTS } from "./electron-api";
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
vi.mock(import("./calendar-events/file-access"));
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

describe(`ipcMain handle ${ELECTRON_API_EVENTS.READ_CONFIG_FILE}`, () => {
	const readConfigFileCallback = getCallback(
		ELECTRON_API_EVENTS.READ_CONFIG_FILE,
		ipcMain.handle,
	);

	it(`calls the ${readConfigFile.name} function`, () => {
		// Arrange

		// Act
		readConfigFileCallback();

		// Assert
		expect(readConfigFile).toHaveBeenCalled();
	});
});

describe(`ipcMain handle ${ELECTRON_API_EVENTS.WRITE_CONFIG_FILE}`, () => {
	const writeConfigFileCallback = getCallback(
		ELECTRON_API_EVENTS.WRITE_CONFIG_FILE,
		ipcMain.handle,
	);

	it(`calls the ${writeConfigFile.name} function`, async () => {
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
			`Invalid arguments to ${ELECTRON_API_EVENTS.WRITE_CONFIG_FILE}. Expected [string], got []`,
		);
	});

	it("throws an error if the argument is the wrong type", async () => {
		// Arrange
		// Act
		const act = async () => await writeConfigFileCallback({}, 5);

		// Assert
		await expect(act).rejects.toThrowError(
			`Invalid arguments to ${ELECTRON_API_EVENTS.WRITE_CONFIG_FILE}. Expected [string], got [number]`,
		);
	});

	it("throws an error if there are extra arguments", async () => {
		// Arrange
		// Act
		const act = async () =>
			await writeConfigFileCallback({}, "test", "test");

		// Assert
		await expect(act).rejects.toThrowError(
			`Invalid arguments to ${ELECTRON_API_EVENTS.WRITE_CONFIG_FILE}. Expected [string], got [string,string]`,
		);
	});
});

describe(`ipcMain handle ${ELECTRON_API_EVENTS.READ_CALENDAR_FILES}`, () => {
	const readCalendarFilesCallback = getCallback(
		ELECTRON_API_EVENTS.READ_CALENDAR_FILES,
		ipcMain.handle,
	);

	it(`calls the ${readCalendarFiles.name} function`, () => {
		// Arrange

		// Act
		readCalendarFilesCallback({}, "test");

		// Assert
		expect(readCalendarFiles).toHaveBeenCalledWith("test");
	});

	it("throws an error for invalid arguments", async () => {
		// Arrange
		// Act
		const act = async () => await readCalendarFilesCallback({}, 5);

		// Assert
		await expect(act).rejects.toThrowError(
			`Invalid arguments to ${ELECTRON_API_EVENTS.READ_CALENDAR_FILES}. Expected [string], got [number]`,
		);
	});
});

describe(`ipcMain handle ${ELECTRON_API_EVENTS.WRITE_CALENDAR_FILE}`, () => {
	const writeCalendarFileCallback = getCallback(
		ELECTRON_API_EVENTS.WRITE_CALENDAR_FILE,
		ipcMain.handle,
	);

	it(`calls the ${writeCalendarFile.name} function`, async () => {
		// Arrange
		const directoryName = "some-directory";
		const calendarName = "some-calendar";
		const contents = "some-content";

		// Act
		await writeCalendarFileCallback(
			{},
			directoryName,
			calendarName,
			contents,
		);

		// Assert
		expect(writeCalendarFile).toHaveBeenCalledWith(
			directoryName,
			calendarName,
			contents,
		);
	});

	it("throws an error for invalid arguments", async () => {
		// Arrange
		// Act
		const act = async () => await writeCalendarFileCallback({}, 5, "test");

		// Assert
		await expect(act).rejects.toThrowError(
			`Invalid arguments to ${ELECTRON_API_EVENTS.WRITE_CALENDAR_FILE}. Expected [string,string,string], got [number,string]`,
		);
	});
});

describe(`ipcMain handle ${ELECTRON_API_EVENTS.PRINT_PDF}`, () => {
	const printPdfCallback = getCallback(
		ELECTRON_API_EVENTS.PRINT_PDF,
		ipcMain.handle,
	);

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

describe(`ipcMain handle ${ELECTRON_API_EVENTS.SELECT_DIRECTORY}`, () => {
	const selectDirectoryCallback = getCallback(
		ELECTRON_API_EVENTS.SELECT_DIRECTORY,
		ipcMain.handle,
	);

	it("throws an error if invalid arguments are provided", async () => {
		// Arrange
		// Act
		const act = async () => await selectDirectoryCallback({}, 5);

		// Assert
		await expect(act).rejects.toThrowError(
			`Invalid arguments to ${ELECTRON_API_EVENTS.SELECT_DIRECTORY}. Expected [string], got [number]`,
		);
	});

	it("returns undefined if the user cancels", async () => {
		// Arrange
		const title = "some-title";
		vi.mocked(dialog.showOpenDialog).mockResolvedValueOnce({
			canceled: true,
			filePaths: [],
		});

		// Act
		const result = await selectDirectoryCallback({}, title);

		// Assert
		expect(dialog.showOpenDialog).toHaveBeenCalledWith({
			title,
			properties: ["openDirectory", "createDirectory"],
		});
		expect(result).toBeUndefined();
	});

	it("returns the first selected file path", async () => {
		// Arrange
		const title = "some-title";
		vi.mocked(dialog.showOpenDialog).mockResolvedValueOnce({
			canceled: false,
			filePaths: ["some-file-path"],
		});

		// Act
		const result = await selectDirectoryCallback({}, title);

		// Assert
		expect(dialog.showOpenDialog).toHaveBeenCalledWith({
			title,
			properties: ["openDirectory", "createDirectory"],
		});
		expect(result).toBe("some-file-path");
	});
});

describe(`ipcMain handle ${ELECTRON_API_EVENTS.CLOSE_WINDOW}`, () => {
	const closeWindowCallback = getCallback(
		ELECTRON_API_EVENTS.CLOSE_WINDOW,
		ipcMain.handle,
	);

	it("closes the browser window", async () => {
		// Arrange
		const close = vi.fn();

		// Act
		await closeWindowCallback({ sender: { close } });

		// Assert
		expect(close).toHaveBeenCalled();
	});
});
