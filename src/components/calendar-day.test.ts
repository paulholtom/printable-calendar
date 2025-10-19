import { getDefaultIcsEvent } from "@/calendar-events";
import { render } from "@testing-library/vue";
import { IcsEvent } from "ts-ics";
import { it } from "vitest";
import CalendarDay from "./calendar-day.vue";

it("displays the provided day", () => {
	// Arrange
	const date = new Date(2025, 10, 15);

	// Act
	const wrapper = render(CalendarDay, {
		props: { date, variant: "current-month", events: undefined },
	});

	// Assert
	wrapper.getByText(date.getDate());
});

it("displays provided events", () => {
	// Arrange
	const date = new Date(2025, 5, 10);
	const event: IcsEvent = {
		...getDefaultIcsEvent(),
		summary: "Some Event",
	};

	// Act
	const wrapper = render(CalendarDay, {
		props: {
			date,
			variant: "current-month",
			events: [{ date, sourceCalendar: "default", event }],
		},
	});

	// Assert
	wrapper.getByText(event.summary);
});
