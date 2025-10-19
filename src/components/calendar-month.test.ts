import {
	ICS_CALENDAR_COLLECTION_KEY,
	getDefaultIcsCalendarCollection,
	getEventsByDateFromCalendarCollection,
} from "@/calendar-events";
import { getDateDisplayValue } from "@/dates";
import { render } from "@testing-library/vue";
import { beforeEach, expect, it, vi } from "vitest";
import CalendarMonth from "./calendar-month.vue";

vi.mock(import("@/calendar-events"), { spy: true });

beforeEach(() => {
	vi.resetAllMocks();
});

it("displays the provided month", () => {
	// Arrange
	const month = 5;
	const year = 2025;

	// Act
	const wrapper = render(CalendarMonth, {
		props: { year, month },
		global: {
			provide: {
				[ICS_CALENDAR_COLLECTION_KEY]:
					getDefaultIcsCalendarCollection(),
			},
		},
	});

	// Assert
	wrapper.getByText(getDateDisplayValue({ year, month }));
});

it("gets the events for the month if they were not provided", () => {
	// Arrange
	const month = 5;
	const year = 2025;
	const calendarCollection = getDefaultIcsCalendarCollection();

	// Act
	render(CalendarMonth, {
		props: { year, month },
		global: {
			provide: {
				[ICS_CALENDAR_COLLECTION_KEY]: calendarCollection,
			},
		},
	});

	// Assert
	expect(getEventsByDateFromCalendarCollection).toHaveBeenCalledWith(
		calendarCollection,
		new Date(2025, 5, 1),
		new Date(2025, 6, 5),
	);
});

it("does not recalculate the events if they were provided", () => {
	// Arrange
	const month = 5;
	const year = 2025;
	const calendarCollection = getDefaultIcsCalendarCollection();

	// Act
	render(CalendarMonth, {
		props: { year, month, parentEventsByDate: new Map() },
		global: {
			provide: {
				[ICS_CALENDAR_COLLECTION_KEY]: calendarCollection,
			},
		},
	});

	// Assert
	expect(getEventsByDateFromCalendarCollection).not.toHaveBeenCalled();
});
