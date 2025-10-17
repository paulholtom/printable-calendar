import {
	CALENDAR_EVENT_COLLECTION_KEY,
	getDefaultCalendarEventCollection,
} from "@/calendar-events";
import { getDateDisplayValue } from "@/dates";
import { render } from "@testing-library/vue";
import { it } from "vitest";
import CalendarMonth from "./calendar-month.vue";

it("displays the provided month", () => {
	// Arrange
	const month = 5;
	const year = 2025;

	// Act
	const wrapper = render(CalendarMonth, {
		props: { year, month },
		global: {
			provide: {
				[CALENDAR_EVENT_COLLECTION_KEY]:
					getDefaultCalendarEventCollection(),
			},
		},
	});

	// Assert
	wrapper.getByText(getDateDisplayValue({ year, month }));
});
