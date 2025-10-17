import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	CalendarEvents,
	getDefaultCalendarEvent,
	parseCalendarEvents,
} from "./parsing";

beforeEach(() => {
	vi.resetAllMocks();
});

describe(parseCalendarEvents, () => {
	it("parses invalid JSON as an empty array", () => {
		// Arrange
		// Act
		const result = parseCalendarEvents("");

		// Assert
		expect(result).toEqual([]);
	});

	it("parses an empty array", () => {
		// Arrange
		// Act
		const result = parseCalendarEvents(JSON.stringify([]));

		// Assert
		expect(result).toEqual([]);
	});

	it("parses multiple events", () => {
		// Arrange

		const events: CalendarEvents = [
			{
				...getDefaultCalendarEvent(),
				firstOccurance: { year: 2010, month: 5, date: 6 },
				description: "First Event",
			},
			{
				...getDefaultCalendarEvent(),
				firstOccurance: { year: 2015, month: 10, date: 26 },
				description: "Second Event",
			},
		];

		// Act
		const result = parseCalendarEvents(JSON.stringify(events));

		// Assert
		expect(result).toEqual(events);
	});
});
