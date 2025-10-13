import { app } from "electron";
import mockFs from "mock-fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	CALENDAR_EVENTS_FILE_NAME,
	readCalendarEventsFile,
	writeCalendarEventsFile,
} from "./file-access";

vi.mock(import("electron"));

const FAKE_HOME_DIRECTORY = "C:\\user-home";

beforeEach(() => {
	vi.resetAllMocks();
	mockFs.restore();

	vi.mocked(app.getPath).mockReturnValue(FAKE_HOME_DIRECTORY);
});

describe(readCalendarEventsFile, () => {
	it("returns an empty string if the file doesn't exist", async () => {
		// Arrange
		mockFs({});

		// Act
		const result = await readCalendarEventsFile();

		// Assert
		expect(result).toEqual("");
	});

	it("returns the file contents if it exists", async () => {
		// Arrange
		const expectedFileContent = "some-file-content";
		mockFs({
			[join(FAKE_HOME_DIRECTORY, CALENDAR_EVENTS_FILE_NAME)]:
				expectedFileContent,
		});

		// Act
		const result = await readCalendarEventsFile();

		// Assert
		expect(result).toBe(expectedFileContent);
	});
});

describe(writeCalendarEventsFile, () => {
	it("writes to the config file", async () => {
		// Arrange
		const expectedContents = "config file contents";
		mockFs({ [FAKE_HOME_DIRECTORY]: {} });

		// Act
		await writeCalendarEventsFile(expectedContents);

		// Assert
		expect(await readCalendarEventsFile()).toEqual(expectedContents);
	});
});
