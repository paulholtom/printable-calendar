import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { inject, provide, ref } from "vue";
import {
	getDefaultUserConfig,
	parseUserConfig,
	provideUserConfig,
	USER_CONFIG_KEY,
	UserConfig,
	useUserConfig,
} from "./index";

vi.mock("vue");

beforeEach(() => {
	vi.clearAllMocks();
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe(getDefaultUserConfig, () => {
	it("defaults the display date to the current month and year", () => {
		// Arrange
		const expectedMonth = 5;
		const expectedYear = 2023;
		vi.setSystemTime(new Date(expectedYear, expectedMonth));

		// Act
		const result = getDefaultUserConfig();

		// Assert
		expect(result.displayDate).toEqual({
			month: expectedMonth,
			year: expectedYear,
		});
	});
});

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

describe(provideUserConfig, () => {
	it("provides the user config", () => {
		// Arrange
		const config = ref(getDefaultUserConfig());

		// Act
		provideUserConfig(config);

		// Assert
		expect(provide).toHaveBeenCalledWith(USER_CONFIG_KEY, config);
	});
});

describe(useUserConfig, () => {
	it("throws an error if the user config has not been provided", () => {
		// Arrange
		vi.mocked(inject).mockImplementationOnce(() => undefined);

		// Act / Assert
		expect(() => useUserConfig()).toThrowError();
	});

	it("injects the user config", () => {
		// Arrange
		const config = getDefaultUserConfig();
		vi.mocked(inject).mockImplementationOnce((key) =>
			key === USER_CONFIG_KEY ? config : undefined,
		);

		// Act
		const result = useUserConfig();

		// Assert
		expect(result).toBe(config);
	});
});
