import { describe, expect, it } from "vitest";
import { getDefaultUserConfig, parseUserConfig, UserConfig } from "./index";

describe(parseUserConfig, () => {
	it("returns a parsed value for a valid string", () => {
		// Arrange
		const expected: UserConfig = {
			...getDefaultUserConfig(),
			pdfDirectory: "some-folder",
		};

		// Act
		const result = parseUserConfig(JSON.stringify(expected));

		// Assert
		expect(result).toEqual(expected);
	});

	it("returns a default object if the value is invalid", () => {
		// Arrange
		// Act
		const result = parseUserConfig("");

		// Assert
		expect(result).toEqual(getDefaultUserConfig());
	});
});
