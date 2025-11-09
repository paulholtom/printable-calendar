import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { inject, provide, ref } from "vue";
import {
	CalendarOptions,
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

	it("sets default values for the background and foreground colour for a calendar if they aren't set", () => {
		// Arrange
		const original: Omit<UserConfig, "calendars"> & {
			calendars: Record<string, Partial<CalendarOptions> | undefined>;
		} = {
			...getDefaultUserConfig(),
			calendars: {
				"some-calendar": { disabled: false },
			},
		};

		// Act
		const result = parseUserConfig(JSON.stringify(original));

		// Assert
		const expected: UserConfig = {
			...original,
			calendars: {
				"some-calendar": {
					disabled: false,
					backgroundColour: "#ffffff",
					foregroundColour: "#000000",
				},
			},
		};
		expect(result).toEqual(expected);
	});

	it("keeps background and foreground colours for a calendar if they are set", () => {
		// Arrange
		const expected: UserConfig = {
			...getDefaultUserConfig(),
			calendars: {
				"some-calendar": {
					disabled: false,
					backgroundColour: "#cccccc",
					foregroundColour: "#dddddd",
				},
			},
		};

		// Act
		const result = parseUserConfig(JSON.stringify(expected));

		// Assert
		expect(result).toEqual(expected);
	});

	it("throws an error if the value is invalid", () => {
		// Arrange
		// Act
		// Assert
		expect(() => parseUserConfig("")).toThrowError();
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
