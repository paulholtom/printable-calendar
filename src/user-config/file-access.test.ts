import { app } from "electron";
import mockFs from "mock-fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	CONFIG_FILE_NAME,
	readConfigFile,
	writeConfigFile,
} from "./file-access";

vi.mock(import("electron"));

const FAKE_HOME_DIRECTORY = "C:\\user-home";

beforeEach(() => {
	vi.resetAllMocks();
	mockFs.restore();

	vi.mocked(app.getPath).mockReturnValue(FAKE_HOME_DIRECTORY);
});

describe(readConfigFile, () => {
	it("returns an empty string if the file doesn't exist", async () => {
		// Arrange
		mockFs({});

		// Act
		const result = await readConfigFile();

		// Assert
		expect(result).toEqual("");
	});

	it("returns the file contents if it exists", async () => {
		// Arrange
		const expectedFileContent = "some-file-content";
		mockFs({
			[join(FAKE_HOME_DIRECTORY, CONFIG_FILE_NAME)]: expectedFileContent,
		});

		// Act
		const result = await readConfigFile();

		// Assert
		expect(result).toBe(expectedFileContent);
	});
});

describe(writeConfigFile, () => {
	it("writes to the config file", async () => {
		// Arrange
		const expectedContents = "config file contents";
		mockFs({ [FAKE_HOME_DIRECTORY]: {} });

		// Act
		await writeConfigFile(expectedContents);

		// Assert
		expect(await readConfigFile()).toEqual(expectedContents);
	});
});
