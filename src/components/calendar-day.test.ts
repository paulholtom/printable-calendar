import { render } from "@testing-library/vue";
import { it } from "vitest";
import CalendarDay from "./calendar-day.vue";

it("displays the provided day", () => {
	// Arrange
	const date = 10;
	const month = 5;
	const year = 2025;

	// Act
	const wrapper = render(CalendarDay, {
		props: { year, month, date, variant: "current-month" },
	});

	// Assert
	wrapper.getByText(date);
});
