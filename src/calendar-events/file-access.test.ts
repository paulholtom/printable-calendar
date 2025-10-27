import mockFs from "mock-fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readCalendarFiles, writeCalendarFile } from "./file-access";

vi.mock(import("electron"));

beforeEach(() => {
	vi.resetAllMocks();
	mockFs.restore();
});

describe(readCalendarFiles, () => {
	it("returns an empty object if the directory doesn't exist", async () => {
		// Arrange
		mockFs({});

		// Act
		const result = await readCalendarFiles("some-directory");

		// Assert
		expect(result).toEqual({});
	});

	it("returns an empty object if the directory exists but is empty", async () => {
		// Arrange
		const directory = "C:\\some-directory";
		mockFs({
			[join(directory, "invalid.txt")]: "something",
		});

		// Act
		const result = await readCalendarFiles(directory);

		// Assert
		expect(result).toEqual({});
	});

	it("returns the contents of ics files in the directory", async () => {
		// Arrange
		const directory = "C:\\some-directory";
		const firstValidFileName = "first";
		const firstValidFileContents = "some-content";
		const secondValidFileName = "second";
		const secondValidFileContents = "other-content";
		mockFs({
			[join(directory, "invalid.txt")]: "something",
			[join(directory, firstValidFileName + ".ics")]:
				firstValidFileContents,
			[join(directory, secondValidFileName + ".ics")]:
				secondValidFileContents,
		});

		// Act
		const result = await readCalendarFiles(directory);

		// Assert
		expect(result).toEqual({
			[firstValidFileName]: firstValidFileContents,
			[secondValidFileName]: secondValidFileContents,
		});
	});

	it("ignores files that can't be read", async () => {
		// Arrange
		const directory = "C:\\some-directory";
		const validFileName = "valid-file";
		const validFileContents = "valid contents";
		mockFs({
			[join(directory, "invalid-file.ics")]: mockFs.file({
				content: "something",
				mode: 0,
			}),
			[join(directory, validFileName + ".ics")]: validFileContents,
		});

		// Act
		const result = await readCalendarFiles(directory);

		// Assert
		expect(result).toEqual({
			[validFileName]: validFileContents,
		});
	});
});

describe(writeCalendarFile, () => {
	it("writes to the config file", async () => {
		// Arrange
		const directory = "C:\\some-directory";
		const calendarName = "some-calendar";
		const expectedContents = "file contents";
		const filePath = join(directory, calendarName + ".ics");
		mockFs({ [directory]: {} });

		// Act
		await writeCalendarFile(directory, calendarName, expectedContents);

		// Assert
		const fileContents = await readFileSync(filePath).toString();
		expect(fileContents).toBe(expectedContents);
	});
});
