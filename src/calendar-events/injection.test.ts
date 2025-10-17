import { beforeEach, describe, expect, it, vi } from "vitest";
import { inject, provide } from "vue";
import {
	CALENDAR_EVENT_COLLECTION_KEY,
	provideCalendarEventCollection,
	useCalendarEventCollection,
} from "./injection";
import {
	CalendarEventCollection,
	getDefaultCalendarEventCollection,
} from "./parsing";

vi.mock(import("vue"));

beforeEach(() => {
	vi.resetAllMocks();
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
