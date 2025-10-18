import {
	ICS_CALENDAR_COLLECTION_KEY,
	getDefaultIcsCalendarCollection,
} from "@/calendar-events";
import { render } from "@testing-library/vue";
import { expect, it } from "vitest";
import CalendarYear from "./calendar-year.vue";

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
