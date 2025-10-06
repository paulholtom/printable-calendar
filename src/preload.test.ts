import { contextBridge, ipcRenderer } from "electron";
import { describe, expect, it, vi } from "vitest";
import { ElectronApi } from "./electron-api";
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
	it("invokes read-config-file", async () => {
		// Arrange
		const electronApi = getElectronApi();

		// Act
		await electronApi.readUserConfigFile();

		// Assert
		expect(ipcRenderer.invoke).toHaveBeenCalledWith("read-config-file");
	});
});

describe("writeUserConfigFile", () => {
	it("invokes read-config-file", async () => {
		// Arrange
		const filename = "some-file";
		const electronApi = getElectronApi();

		// Act
		await electronApi.writeUserConfigFile(filename);

		// Assert
		expect(ipcRenderer.invoke).toHaveBeenCalledWith(
			"write-config-file",
			filename,
		);
	});
});

describe("printToPdf", () => {
	it("invokes print-pdf", async () => {
		// Arrange
		const filename = "some-file";
		const electronApi = getElectronApi();

		// Act
		await electronApi.printToPdf(filename);

		// Assert
		expect(ipcRenderer.invoke).toHaveBeenCalledWith("print-pdf", filename);
	});
});

describe("selectDirectory", () => {
	it("invokes select-directory", async () => {
		// Arrange
		const electronApi = getElectronApi();

		// Act
		await electronApi.selectDirectory();

		// Assert
		expect(ipcRenderer.invoke).toHaveBeenCalledWith("select-directory");
	});
});
