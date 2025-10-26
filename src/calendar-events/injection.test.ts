import { beforeEach, describe, expect, it, vi } from "vitest";
import { inject, provide, ref } from "vue";
import {
	ICS_CALENDAR_COLLECTION_KEY,
	provideIcsCalendarCollection,
	useIcsCalendarCollection,
} from "./injection";
import { getDefaultIcsCalendarCollection } from "./parsing";

vi.mock(import("vue"));

beforeEach(() => {
	vi.resetAllMocks();
});

describe(provideIcsCalendarCollection, () => {
	it("provides the calendar event collection", () => {
		// Arrange
		const eventCollection = ref(getDefaultIcsCalendarCollection());

		// Act
		provideIcsCalendarCollection(eventCollection);

		// Assert
		expect(provide).toHaveBeenCalledWith(
			ICS_CALENDAR_COLLECTION_KEY,
			eventCollection,
		);
	});
});

describe(useIcsCalendarCollection, () => {
	it("throws an error if the calendar collection has been provided", () => {
		// Arrange
		// Act / Assert
		expect(() => useIcsCalendarCollection()).toThrowError();
	});

	it("injects the calendar event collection", () => {
		// Arrange
		const calendarEventCollection = getDefaultIcsCalendarCollection();
		vi.mocked(inject).mockImplementationOnce((key) =>
			key === ICS_CALENDAR_COLLECTION_KEY
				? calendarEventCollection
				: undefined,
		);

		// Act
		const result = useIcsCalendarCollection();

		// Assert
		expect(result).toBe(calendarEventCollection);
	});
});
