import { DateOnly } from "@/dates";
import { describe, expect, it } from "vitest";
import { eventAppearsOnDay } from "./display";
import { CalendarEvent, getDefaultCalendarEvent } from "./parsing";

describe(eventAppearsOnDay, () => {
	it("returns true if the event's first occurance is the specified date", () => {
		// Arrange
		const date: DateOnly = {
			date: 5,
			month: 5,
			year: 2025,
		};
		const event: CalendarEvent = {
			...getDefaultCalendarEvent(),
			firstOccurance: date,
		};

		// Act
		const result = eventAppearsOnDay(event, date);

		// Assert
		expect(result).toBe(true);
	});

	it("returns false if the event's first occurance isn't the specified date", () => {
		// Arrange
		const date: DateOnly = {
			date: 5,
			month: 5,
			year: 2025,
		};
		const event: CalendarEvent = {
			...getDefaultCalendarEvent(),
			firstOccurance: {
				date: 7,
				month: 5,
				year: 2025,
			},
		};

		// Act
		const result = eventAppearsOnDay(event, date);

		// Assert
		expect(result).toBe(false);
	});
});
