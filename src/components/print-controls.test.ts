import { getDateDisplayValue } from "@/dates";
import { ElectronApi } from "@/electron-api";
import {
	getDefaultUserConfig,
	USER_CONFIG_KEY,
	UserConfig,
} from "@/user-config";
import { fireEvent, render } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";
import PrintControls from "./print-controls.vue";

const mockElectronApi = {
	readUserConfigFile: vi.fn(),
	writeUserConfigFile: vi.fn(),
	printToPdf: vi.fn(),
	selectDirectory: vi.fn(),
	writeCalendarFile: vi.fn(),
	readCalendarFiles: vi.fn(),
	closeWindow: vi.fn(),
} satisfies ElectronApi;

beforeEach(() => {
	vi.resetAllMocks();

	window.electronApi = mockElectronApi;
	window.alert = vi.fn();
});

describe("select PDF directory", () => {
	it("updates the config if the PDF directory is changed", async () => {
		// Arrange
		const selectedDirectory = "selected-directory";
		mockElectronApi.selectDirectory.mockResolvedValueOnce(
			selectedDirectory,
		);
		const userConfig = ref(getDefaultUserConfig());
		const wrapper = render(PrintControls, {
			global: { provide: { [USER_CONFIG_KEY]: userConfig } },
		});

		// Act
		const selectDirectoryButton = wrapper.getByRole("button", {
			name: "Choose PDF Directory",
		});
		await fireEvent.click(selectDirectoryButton);

		// Assert
		expect(userConfig.value.pdfDirectory).toBe(selectedDirectory);
	});
});

describe("Print PDF", () => {
	it("doesn't print if no folder is provided", async () => {
		// Arrange
		const wrapper = render(PrintControls, {
			global: {
				provide: { [USER_CONFIG_KEY]: ref(getDefaultUserConfig()) },
			},
		});

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
		const userConfig = ref<UserConfig>({
			...getDefaultUserConfig(),
			pdfDirectory,
			displayDate: {
				month: 4,
				year: 2010,
			},
		});
		mockElectronApi.printToPdf.mockImplementation((path) => path);
		const expectedPath = `${pdfDirectory}\\${getDateDisplayValue(userConfig.value.displayDate)}.pdf`;
		const wrapper = render(PrintControls, {
			global: { provide: { [USER_CONFIG_KEY]: userConfig } },
		});

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
		const userConfig = ref(getDefaultUserConfig());
		mockElectronApi.selectDirectory.mockResolvedValueOnce(pdfDirectory);
		const expectedPath = `${pdfDirectory}\\${getDateDisplayValue(userConfig.value.displayDate)}.pdf`;
		const wrapper = render(PrintControls, {
			global: { provide: { [USER_CONFIG_KEY]: userConfig } },
		});
		mockElectronApi.printToPdf.mockImplementation((path) => path);

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
