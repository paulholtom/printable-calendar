import { EventOccurrence, getDefaultIcsEvent } from "@/calendar-events";
import { fireEvent, render } from "@testing-library/vue";
import { IcsEvent } from "ts-ics";
import { expect, it } from "vitest";
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

it("displays time if an event date is a DATE-TIME", () => {
	// Arrange
	const date = new Date(2025, 5, 10, 10, 5);
	const event: IcsEvent = {
		...getDefaultIcsEvent(),
		summary: "Some Event",
		start: {
			date,
			type: "DATE-TIME",
		},
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
	wrapper.getByText(
		date.toLocaleTimeString(undefined, {
			hour: "numeric",
			minute: "2-digit",
		}),
	);
});

it("doesn't display the time if an event date is a DATE", () => {
	// Arrange
	const date = new Date(2025, 5, 10, 10, 5);
	const event: IcsEvent = {
		...getDefaultIcsEvent(),
		summary: "Some Event",
		start: {
			date,
			type: "DATE",
		},
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
	expect(
		wrapper.queryByText(
			date.toLocaleTimeString(undefined, {
				hour: "numeric",
				minute: "2-digit",
			}),
		),
	).toBeNull();
});

it("emits when an event is clicked", async () => {
	// Arrange
	const date = new Date(2025, 5, 10);
	const event: IcsEvent = {
		...getDefaultIcsEvent(),
		summary: "Some Event",
	};
	const wrapper = render(CalendarDay, {
		props: {
			date,
			variant: "current-month",
			events: [{ date, sourceCalendar: "default", event }],
		},
	});
	const eventDisplay = wrapper.getByText(event.summary);

	// Act
	await fireEvent.click(eventDisplay);

	// Assert
	const expectedResult: EventOccurrence = {
		date,
		sourceCalendar: "default",
		event,
	};
	expect(wrapper.emitted("eventClicked")).toEqual([[expectedResult]]);
});
