import {
	ICS_CALENDAR_COLLECTION_KEY,
	getDefaultIcsCalendarCollection,
	getEventsByDateFromCalendarCollection,
} from "@/calendar-events";
import { render } from "@testing-library/vue";
import { beforeEach, expect, it, vi } from "vitest";
import CalendarYear from "./calendar-year.vue";

vi.mock(import("@/calendar-events"), { spy: true });

beforeEach(() => {
	vi.resetAllMocks();
});

it("displays every month of the provided year", () => {
	// Arrange
	const year = 2025;

	// Act
	const wrapper = render(CalendarYear, {
		props: { year },
		global: {
			provide: {
				[ICS_CALENDAR_COLLECTION_KEY]:
					getDefaultIcsCalendarCollection(),
			},
		},
	});

	// Assert
	expect(wrapper.getAllByRole("grid").length).toBe(12);
});

it("gets the events for the month if they were not provided", () => {
	// Arrange
	const year = 2025;
	const calendarCollection = getDefaultIcsCalendarCollection();

	// Act
	render(CalendarYear, {
		props: { year },
		global: {
			provide: {
				[ICS_CALENDAR_COLLECTION_KEY]: calendarCollection,
			},
		},
	});

	// Assert
	expect(getEventsByDateFromCalendarCollection).toHaveBeenCalledWith(
		calendarCollection,
		new Date(2024, 11, 29),
		new Date(2026, 0, 3),
	);
});
