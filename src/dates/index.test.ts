import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDateDisplayValue, getDaysOfWeek } from "./index";

beforeEach(() => {
	vi.resetAllMocks();
});

describe(getDateDisplayValue, () => {
	it("gets the current locale's year and month if the month is specified", () => {
		// Arrange
		const month = 5;
		const year = 2012;

		// Act
		const result = getDateDisplayValue({ month, year });

		// Assert
		expect(result).toBe(
			new Date(year, month).toLocaleDateString(undefined, {
				year: "numeric",
				month: "long",
			}),
		);
	});

	it("gets just the year if no month is provided", () => {
		// Arrange
		const year = 2015;

		// Act
		const result = getDateDisplayValue({ year });

		// Assert
		expect(result).toBe("2015");
	});
});

describe(getDaysOfWeek, () => {
	it("gets values for all seven days of the week", () => {
		// Arrange

		// Act
		const result = getDaysOfWeek("long");

		// Assert
		expect(result.length).toBe(7);
	});
});
