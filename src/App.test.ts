import { fireEvent, render } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import App from "./App.vue";
import { ElectronApi } from "./electron-api";
import { getDefaultUserConfig, UserConfig } from "./user-config";

const mockElectronApi = {
	readUserConfigFile: vi.fn(),
	writeUserConfigFile: vi.fn(),
	printToPdf: vi.fn(),
	selectDirectory: vi.fn(),
} satisfies ElectronApi;

beforeEach(() => {
	vi.resetAllMocks();

	window.electronApi = mockElectronApi;
	window.alert = vi.fn();
});

afterEach(() => {
	window.electronApi = undefined;
});

describe("select PDF directory", () => {
	it("updates the config if the PDF directory is changed", async () => {
		// Arrange
		const selectedDirectory = "selected-directory";
		mockElectronApi.selectDirectory.mockResolvedValueOnce(
			selectedDirectory,
		);
		const expectedConfig: UserConfig = {
			...getDefaultUserConfig(),
			pdfDirectory: selectedDirectory,
		};
		const wrapper = render(App);

		// Act
		const selectDirectoryButton = wrapper.getByRole("button", {
			name: "Choose PDF Directory",
		});
		await fireEvent.click(selectDirectoryButton);

		// Assert
		expect(mockElectronApi.writeUserConfigFile).toHaveBeenCalledWith(
			JSON.stringify(expectedConfig),
		);
	});
});

describe("Print PDF", () => {
	it("doesn't print if no folder is provided", async () => {
		// Arrange
		const wrapper = render(App);

		// Act
		const printPdfButton = wrapper.getByRole("button", {
			name: "Print PDF",
		});
		await fireEvent.click(printPdfButton);

		// Assert
		expect(mockElectronApi.printToPdf).not.toHaveBeenCalled();
	});

	it("writes to the path from the user config if one was loaded", async () => {
		// Arrange
		const pdfDirectory = "directory-from-config";
		const userConfig: UserConfig = {
			...getDefaultUserConfig(),
			pdfDirectory,
		};
		mockElectronApi.readUserConfigFile.mockResolvedValueOnce(
			JSON.stringify(userConfig),
		);
		const expectedPath = `${pdfDirectory}\\test.pdf`;
		const wrapper = render(App);

		// Act
		const printPdfButton = wrapper.getByRole("button", {
			name: "Print PDF",
		});
		await fireEvent.click(printPdfButton);
		await nextTick();

		// Assert
		expect(mockElectronApi.printToPdf).toHaveBeenCalledWith(expectedPath);
		expect(window.alert).toHaveBeenCalledWith(
			`PDF file created: ${expectedPath}`,
		);
	});

	it("prompts for a directory to be selected if there isn't already one", async () => {
		// Arrange
		const pdfDirectory = "selected-directory";
		mockElectronApi.selectDirectory.mockResolvedValueOnce(pdfDirectory);
		const expectedPath = `${pdfDirectory}\\test.pdf`;
		const wrapper = render(App);

		// Act
		const printPdfButton = wrapper.getByRole("button", {
			name: "Print PDF",
		});
		await fireEvent.click(printPdfButton);
		await nextTick();

		// Assert
		expect(mockElectronApi.printToPdf).toHaveBeenCalledWith(expectedPath);
		expect(window.alert).toHaveBeenCalledWith(
			`PDF file created: ${expectedPath}`,
		);
	});
});
