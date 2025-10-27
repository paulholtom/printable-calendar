import { contextBridge, ipcRenderer } from "electron";
import { describe, expect, it, vi } from "vitest";
import { ELECTRON_API_EVENTS, ElectronApi } from "./electron-api";
import "./preload";

vi.mock(import("electron"), async (importOriginal) => {
	const original = await importOriginal();
	return {
		...original,
		contextBridge: {
			...original.contextBridge,
			exposeInMainWorld: vi.fn(),
		},
		ipcRenderer: {
			...original.ipcRenderer,
			invoke: vi.fn(),
		},
	};
});

function getElectronApi(): ElectronApi {
	return vi.mocked(contextBridge.exposeInMainWorld).mock.calls[0][1];
}

it("exposes the electron api in the main world", () => {
	// Arrange
	// Act
	// Assert
	expect(contextBridge.exposeInMainWorld).toHaveBeenCalledTimes(1);
	expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
		"electronApi",
		expect.anything(),
	);
});

describe("readUserConfigFile", () => {
	it(`invokes ${ELECTRON_API_EVENTS.READ_CONFIG_FILE}`, async () => {
		// Arrange
		const electronApi = getElectronApi();

		// Act
		await electronApi.readUserConfigFile();

		// Assert
		expect(ipcRenderer.invoke).toHaveBeenCalledWith(
			ELECTRON_API_EVENTS.READ_CONFIG_FILE,
		);
	});
});

describe("writeUserConfigFile", () => {
	it(`invokes ${ELECTRON_API_EVENTS.WRITE_CONFIG_FILE}`, async () => {
		// Arrange
		const contents = "some-file";
		const electronApi = getElectronApi();

		// Act
		await electronApi.writeUserConfigFile(contents);

		// Assert
		expect(ipcRenderer.invoke).toHaveBeenCalledWith(
			ELECTRON_API_EVENTS.WRITE_CONFIG_FILE,
			contents,
		);
	});
});

describe("readCalendarFiles", () => {
	it(`invokes ${ELECTRON_API_EVENTS.READ_CALENDAR_FILES}`, async () => {
		// Arrange
		const directory = "some-directory";
		const electronApi = getElectronApi();

		// Act
		await electronApi.readCalendarFiles(directory);

		// Assert
		expect(ipcRenderer.invoke).toHaveBeenCalledWith(
			ELECTRON_API_EVENTS.READ_CALENDAR_FILES,
			directory,
		);
	});
});

describe("writeCalendarEventsFile", () => {
	it(`invokes ${ELECTRON_API_EVENTS.WRITE_CALENDAR_FILE}`, async () => {
		// Arrange
		const directory = "some-directory";
		const calendarName = "some-calendar";
		const contents = "some-file";
		const electronApi = getElectronApi();

		// Act
		await electronApi.writeCalendarFile(directory, calendarName, contents);

		// Assert
		expect(ipcRenderer.invoke).toHaveBeenCalledWith(
			ELECTRON_API_EVENTS.WRITE_CALENDAR_FILE,
			directory,
			calendarName,
			contents,
		);
	});
});

describe("printToPdf", () => {
	it(`invokes ${ELECTRON_API_EVENTS.PRINT_PDF}`, async () => {
		// Arrange
		const filename = "some-file";
		const electronApi = getElectronApi();

		// Act
		await electronApi.printToPdf(filename);

		// Assert
		expect(ipcRenderer.invoke).toHaveBeenCalledWith(
			ELECTRON_API_EVENTS.PRINT_PDF,
			filename,
		);
	});
});

describe("selectDirectory", () => {
	it(`invokes ${ELECTRON_API_EVENTS.SELECT_DIRECTORY}`, async () => {
		// Arrange
		const title = "some-title";
		const electronApi = getElectronApi();

		// Act
		await electronApi.selectDirectory(title);

		// Assert
		expect(ipcRenderer.invoke).toHaveBeenCalledWith(
			ELECTRON_API_EVENTS.SELECT_DIRECTORY,
			title,
		);
	});
});

describe("closeWindow", () => {
	it(`invokes ${ELECTRON_API_EVENTS.CLOSE_WINDOW}`, async () => {
		// Arrange
		const electronApi = getElectronApi();

		// Act
		await electronApi.closeWindow();

		// Assert
		expect(ipcRenderer.invoke).toHaveBeenCalledWith(
			ELECTRON_API_EVENTS.CLOSE_WINDOW,
		);
	});
});
