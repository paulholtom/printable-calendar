import { generateIcsCalendar, IcsCalendar } from "ts-ics";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getDefaultIcsCalendar,
	getDefaultIcsEvent,
	parseIcsCalendarString,
} from "./parsing";

beforeEach(() => {
	vi.resetAllMocks();
});

describe(parseIcsCalendarString, () => {
	it("throws an error if the file is not in a valid format", () => {
		// Arrange
		// Act
		// Assert
		expect(() => parseIcsCalendarString("")).toThrowError();
	});

	it("parses an empty calendar", () => {
		// Arrange
		const calendar = getDefaultIcsCalendar();

		// Act
		const result = parseIcsCalendarString(generateIcsCalendar(calendar));

		// Assert
		expect(result).toEqual(calendar);
	});

	it("parses multiple events", () => {
		// Arrange

		const calendar: IcsCalendar = {
			...getDefaultIcsCalendar(),
			events: [
				{
					...getDefaultIcsEvent(),
					start: {
						date: new Date(Date.UTC(2010, 5, 6)),
						type: "DATE",
					},
					summary: "First Event",
				},
				{
					...getDefaultIcsEvent(),
					start: {
						date: new Date(Date.UTC(2015, 10, 26)),
						type: "DATE",
					},
					summary: "Second Event",
				},
			],
		};

		// Act
		const result = parseIcsCalendarString(generateIcsCalendar(calendar));

		// Assert
		expect(result).toEqual(calendar);
	});
});
