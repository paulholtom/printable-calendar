import {
	CALENDAR_EVENT_COLLECTION_KEY,
	CalendarEvent,
	getDefaultCalendarEvent,
	getDefaultCalendarEventCollection,
} from "@/calendar-events";
import { DateOnly } from "@/dates";
import { render } from "@testing-library/vue";
import { it } from "vitest";
import CalendarDay from "./calendar-day.vue";

it("displays the provided day", () => {
	// Arrange
	const date: DateOnly = { date: 10, month: 5, year: 2025 };

	// Act
	const wrapper = render(CalendarDay, {
		props: { date, variant: "current-month" },
		global: {
			provide: {
				[CALENDAR_EVENT_COLLECTION_KEY]:
					getDefaultCalendarEventCollection(),
			},
		},
	});

	// Assert
	wrapper.getByText(date.date);
});

it("displays events for the provided day", () => {
	// Arrange
	const date: DateOnly = { date: 10, month: 5, year: 2025 };
	const event: CalendarEvent = {
		...getDefaultCalendarEvent(),
		firstOccurance: date,
		description: "Some Event",
	};

	// Act
	const wrapper = render(CalendarDay, {
		props: { date, variant: "current-month" },
		global: {
			provide: {
				[CALENDAR_EVENT_COLLECTION_KEY]: {
					...getDefaultCalendarEventCollection(),
					default: [event],
				},
			},
		},
	});

	// Assert
	wrapper.getByText(event.description);
});
