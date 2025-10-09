import { render } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import App from "./App.vue";
import { ElectronApi } from "./electron-api";
import {
	getDefaultUserConfig,
	provideUserConfig,
	UserConfig,
} from "./user-config";

vi.mock(import("@/user-config"), { spy: true });

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

describe("configFile", () => {
	it("parses and provides the config file", async () => {
		// Arrange
		const pdfDirectory = "directory-from-config";
		const userConfig: UserConfig = {
			...getDefaultUserConfig(),
			pdfDirectory,
		};
		const { promise: filePromise, resolve: resolveFilePromise } =
			Promise.withResolvers<string>();
		mockElectronApi.readUserConfigFile.mockImplementationOnce(
			() => filePromise,
		);
		resolveFilePromise(JSON.stringify(userConfig));

		// Act
		render(App);
		// wait for the file to be parsed.
		await filePromise;

		// Assert
		expect(provideUserConfig).toHaveBeenCalledWith(userConfig);
	});

	it("saves changes made to the user config", async () => {
		// Arrange
		const pdfDirectory = "new-pdf-directory";
		const userConfig: UserConfig = getDefaultUserConfig();
		const { promise: filePromise, resolve: resolveFilePromise } =
			Promise.withResolvers<string>();
		mockElectronApi.readUserConfigFile.mockImplementationOnce(
			() => filePromise,
		);
		resolveFilePromise(JSON.stringify(userConfig));
		render(App);
		await filePromise;

		// Act
		const providedConfig = vi.mocked(provideUserConfig).mock.calls[0][0];
		providedConfig.pdfDirectory = pdfDirectory;
		await nextTick();

		// Assert
		const expectedConfig: UserConfig = {
			...userConfig,
			pdfDirectory,
		};
		expect(mockElectronApi.writeUserConfigFile).toHaveBeenCalledWith(
			JSON.stringify(expectedConfig),
		);
	});
});
