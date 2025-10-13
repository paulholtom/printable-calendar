import { describe, expect, it } from "vitest";
import {
	CalendarEvents,
	getDefaultCalendarEvent,
	parseCalendarEvents,
} from "./index";

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
				start: new Date(2010, 5, 6),
				description: "First Event",
			},
			{
				...getDefaultCalendarEvent(),
				start: new Date(2015, 10, 26),
				description: "Second Event",
			},
		];

		// Act
		const result = parseCalendarEvents(JSON.stringify(events));

		// Assert
		expect(result).toEqual(events);
	});
});
