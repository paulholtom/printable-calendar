import { IcsEvent } from "ts-ics";
import { describe, expect, it } from "vitest";
import { eventAppearsOnDay } from "./display";
import { getDefaultIcsEvent } from "./parsing";

describe(eventAppearsOnDay, () => {
	it("returns true if the event's first occurance is the specified date", () => {
		// Arrange
		const date = new Date(2025, 10, 23);
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			start: { date },
		};

		// Act
		const result = eventAppearsOnDay(event, date);

		// Assert
		expect(result).toBe(true);
	});

	it("returns false if the event's first occurance isn't the specified date", () => {
		// Arrange
		const date = new Date(2025, 5, 5);
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			start: {
				date: new Date(2025, 5, 7),
			},
		};

		// Act
		const result = eventAppearsOnDay(event, date);

		// Assert
		expect(result).toBe(false);
	});
});
