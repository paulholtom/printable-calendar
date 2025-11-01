import { beforeEach, describe, expect, it, vi } from "vitest";
import { CsvReader } from "./csv-reader";

beforeEach(() => {
	vi.resetAllMocks();
});

describe(CsvReader.prototype.readNextRow, () => {
	it.each([
		{ fileContents: "", expectedValue: undefined },
		{ fileContents: "a,b", expectedValue: ["a", "b"] },
		{ fileContents: "a,b\n", expectedValue: ["a", "b"] },
		{ fileContents: '"a,a",b\n', expectedValue: ["a,a", "b"] },
	])(
		"returns $expectedValue if the file is $fileContents",
		({ fileContents, expectedValue }) => {
			// Arrange
			const reader = new CsvReader(fileContents);

			// Act
			const result = reader.readNextRow();

			// Assert
			expect(result).toEqual(expectedValue);
		},
	);

	it("advances to the next row on each call", () => {
		// Arrange
		const reader = new CsvReader("a,b\nc,d\ne,f\n");

		// Act
		const firstRow = reader.readNextRow();
		const secondRow = reader.readNextRow();
		const thirdRow = reader.readNextRow();
		const fourthRow = reader.readNextRow();

		// Assert
		expect(firstRow).toEqual(["a", "b"]);
		expect(secondRow).toEqual(["c", "d"]);
		expect(thirdRow).toEqual(["e", "f"]);
		expect(fourthRow).toBeUndefined();
	});
});
