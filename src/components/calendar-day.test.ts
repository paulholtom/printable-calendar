import {
	getDefaultIcsCalendar,
	getDefaultIcsCalendarCollection,
	getDefaultIcsEvent,
	ICS_CALENDAR_COLLECTION_KEY,
	IcsCalendarCollection,
} from "@/calendar-events";
import { render } from "@testing-library/vue";
import { IcsEvent } from "ts-ics";
import { it } from "vitest";
import CalendarDay from "./calendar-day.vue";

it("displays the provided day", () => {
	// Arrange
	const date = new Date(2025, 10, 15);

	// Act
	const wrapper = render(CalendarDay, {
		props: { date, variant: "current-month" },
		global: {
			provide: {
				[ICS_CALENDAR_COLLECTION_KEY]:
					getDefaultIcsCalendarCollection(),
			},
		},
	});

	// Assert
	wrapper.getByText(date.getDate());
});

it("displays events for the provided day", () => {
	// Arrange
	const date = new Date(2025, 5, 10);
	const event: IcsEvent = {
		...getDefaultIcsEvent(),
		start: { date },
		summary: "Some Event",
	};
	const calendarCollection: IcsCalendarCollection = {
		...getDefaultIcsCalendarCollection(),
		default: {
			...getDefaultIcsCalendar(),
			events: [event],
		},
	};

	// Act
	const wrapper = render(CalendarDay, {
		props: { date, variant: "current-month" },
		global: {
			provide: {
				[ICS_CALENDAR_COLLECTION_KEY]: calendarCollection,
			},
		},
	});

	// Assert
	wrapper.getByText(event.summary);
});
