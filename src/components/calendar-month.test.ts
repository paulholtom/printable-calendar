import { render } from "@testing-library/vue";
import { it } from "vitest";
import CalendarMonth from "./calendar-month.vue";

it("displays the provided month", () => {
	// Arrange
	const month = 5;
	const year = 2025;

	// Act
	const wrapper = render(CalendarMonth, { props: { month, year } });

	// Assert
	wrapper.getByText(
		new Date(year, month).toLocaleDateString(undefined, {
			year: "numeric",
			month: "long",
		}),
	);
});
