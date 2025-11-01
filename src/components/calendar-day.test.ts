import {
	EventOccurrence,
	getDefaultIcsEvent,
	IcsEvent,
} from "@/calendar-events";
import { fireEvent, render } from "@testing-library/vue";
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
			events: [
				{ date, instanceOfEvent: 0, sourceCalendar: "default", event },
			],
		},
	});

	// Assert
	wrapper.getByText(event.summary);
});

it("displays the summary for the 0th instance of an event, even if there's an ordinal display specified", () => {
	// Arrange
	const date = new Date(2025, 5, 10);
	const event: IcsEvent = {
		...getDefaultIcsEvent(),
		summary: "Some Event",
		nonStandard: {
			ordinalDisplay: { before: "Don't", after: "Show" },
		},
	};

	// Act
	const wrapper = render(CalendarDay, {
		props: {
			date,
			variant: "current-month",
			events: [
				{ date, instanceOfEvent: 0, sourceCalendar: "default", event },
			],
		},
	});

	// Assert
	wrapper.getByText(event.summary);
});

it("uses the ordinal display settings for an instance other than 0", () => {
	// Arrange
	const date = new Date(2025, 5, 10);
	const event: IcsEvent = {
		...getDefaultIcsEvent(),
		summary: "Some Event",
		nonStandard: {
			ordinalDisplay: { before: "The", after: "Time" },
		},
	};

	// Act
	const wrapper = render(CalendarDay, {
		props: {
			date,
			variant: "current-month",
			events: [
				{ date, instanceOfEvent: 1, sourceCalendar: "default", event },
			],
		},
	});

	// Assert
	wrapper.getByText("The 1st Time");
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
			events: [
				{ date, instanceOfEvent: 0, sourceCalendar: "default", event },
			],
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
			events: [
				{ date, instanceOfEvent: 0, sourceCalendar: "default", event },
			],
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

it("emits when a day is clicked", async () => {
	// Arrange
	const date = new Date(2025, 5, 10);
	const wrapper = render(CalendarDay, {
		props: {
			date,
			variant: "current-month",
			events: [],
		},
	});
	const dayDisplay = wrapper.getByText("10");

	// Act
	await fireEvent.click(dayDisplay);

	// Assert
	expect(wrapper.emitted("dayClicked")).toEqual([[date]]);
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
			events: [
				{ date, instanceOfEvent: 0, sourceCalendar: "default", event },
			],
		},
	});
	const eventDisplay = wrapper.getByText(event.summary);

	// Act
	await fireEvent.click(eventDisplay);

	// Assert
	const expectedResult: EventOccurrence = {
		date,
		instanceOfEvent: 0,
		sourceCalendar: "default",
		event,
	};
	expect(wrapper.emitted("eventClicked")).toEqual([[expectedResult]]);
});
