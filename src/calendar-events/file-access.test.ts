import { app } from "electron";
import mockFs from "mock-fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	DEFAULT_CALENDAR_FILE_NAME,
	readCalendarFile,
	writeCalendarFile,
} from "./file-access";

vi.mock(import("electron"));

const FAKE_HOME_DIRECTORY = "C:\\user-home";

beforeEach(() => {
	vi.resetAllMocks();
	mockFs.restore();

	vi.mocked(app.getPath).mockReturnValue(FAKE_HOME_DIRECTORY);
});

describe(readCalendarFile, () => {
	it("returns undefined if the file doesn't exist", async () => {
		// Arrange
		mockFs({});

		// Act
		const result = await readCalendarFile();

		// Assert
		expect(result).toBeUndefined();
	});

	it("returns the file contents if it exists", async () => {
		// Arrange
		const expectedFileContent = "some-file-content";
		mockFs({
			[join(FAKE_HOME_DIRECTORY, DEFAULT_CALENDAR_FILE_NAME)]:
				expectedFileContent,
		});

		// Act
		const result = await readCalendarFile();

		// Assert
		expect(result).toBe(expectedFileContent);
	});
});

describe(writeCalendarFile, () => {
	it("writes to the config file", async () => {
		// Arrange
		const expectedContents = "config file contents";
		mockFs({ [FAKE_HOME_DIRECTORY]: {} });

		// Act
		await writeCalendarFile(expectedContents);

		// Assert
		expect(await readCalendarFile()).toEqual(expectedContents);
	});
});
