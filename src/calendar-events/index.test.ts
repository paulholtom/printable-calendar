import { beforeEach, describe, expect, it, vi } from "vitest";
import { inject, provide } from "vue";
import {
	CALENDAR_EVENT_COLLECTION_KEY,
	CalendarEventCollection,
	CalendarEvents,
	getDefaultCalendarEvent,
	getDefaultCalendarEventCollection,
	parseCalendarEvents,
	provideCalendarEventCollection,
	useCalendarEventCollection,
} from "./index";

vi.mock(import("vue"));

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
				year: 2010,
				month: 5,
				day: 6,
				description: "First Event",
			},
			{
				...getDefaultCalendarEvent(),
				year: 2015,
				month: 10,
				day: 26,
				description: "Second Event",
			},
		];

		// Act
		const result = parseCalendarEvents(JSON.stringify(events));

		// Assert
		expect(result).toEqual(events);
	});
});

describe(provideCalendarEventCollection, () => {
	it("provides the calendar event collection", () => {
		// Arrange
		const eventCollection: CalendarEventCollection =
			getDefaultCalendarEventCollection();

		// Act
		provideCalendarEventCollection(eventCollection);

		// Assert
		expect(provide).toHaveBeenCalledWith(
			CALENDAR_EVENT_COLLECTION_KEY,
			eventCollection,
		);
	});
});

describe(useCalendarEventCollection, () => {
	it("injects the calendar event collection", () => {
		// Arrange
		const calendarEventCollection = useCalendarEventCollection();
		vi.mocked(inject).mockImplementationOnce((key) =>
			key === CALENDAR_EVENT_COLLECTION_KEY
				? calendarEventCollection
				: undefined,
		);

		// Act
		const result = useCalendarEventCollection();

		// Assert
		expect(result).toBe(calendarEventCollection);
	});
});
