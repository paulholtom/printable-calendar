import { beforeEach, describe, expect, it, vi } from "vitest";
import { DateOnly, datesEqual, getDateDisplayValue } from "./index";

beforeEach(() => {
	vi.resetAllMocks();
});

describe(datesEqual, () => {
	it.each<{ returns: boolean; date1: DateOnly; date2: DateOnly }>([
		{
			returns: true,
			date1: { date: 5, month: 6, year: 2025 },
			date2: { date: 5, month: 6, year: 2025 },
		},
		{
			returns: false,
			date1: { date: 6, month: 6, year: 2025 },
			date2: { date: 5, month: 6, year: 2025 },
		},
		{
			returns: false,
			date1: { date: 5, month: 7, year: 2025 },
			date2: { date: 5, month: 6, year: 2025 },
		},
		{
			returns: false,
			date1: { date: 5, month: 6, year: 2026 },
			date2: { date: 5, month: 6, year: 2025 },
		},
	])(
		"returns $returns when date1 is $date1 and date2 is $date2",
		({ returns, date1, date2 }) => {
			// Arrange

			// Act
			const result = datesEqual(date1, date2);

			// Assert
			expect(result).toBe(returns);
		},
	);
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
