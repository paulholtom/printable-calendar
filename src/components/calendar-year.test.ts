import {
	EventOccurrence,
	getDefaultIcsCalendar,
	getDefaultIcsCalendarCollection,
	getDefaultIcsEvent,
	getEventsByDateFromCalendarCollection,
	ICS_CALENDAR_COLLECTION_KEY,
	IcsEvent,
} from "@/calendar-events";
import { getDefaultUserConfig, USER_CONFIG_KEY } from "@/user-config";
import { fireEvent, render, within } from "@testing-library/vue";
import { beforeEach, expect, it, vi } from "vitest";
import { ref } from "vue";
import CalendarYear from "./calendar-year.vue";

vi.mock(import("@/calendar-events"), { spy: true });

beforeEach(() => {
	vi.resetAllMocks();
});

it("displays every month of the provided year", () => {
	// Arrange
	const year = 2025;

	// Act
	const wrapper = render(CalendarYear, {
		props: { year },
		global: {
			provide: {
				[ICS_CALENDAR_COLLECTION_KEY]: ref(
					getDefaultIcsCalendarCollection(),
				),
				[USER_CONFIG_KEY]: ref(getDefaultUserConfig()),
			},
		},
	});

	// Assert
	expect(wrapper.getAllByRole("grid").length).toBe(12);
});

it("gets the events for the month if they were not provided", () => {
	// Arrange
	const year = 2025;
	const calendarCollection = getDefaultIcsCalendarCollection();
	const userConfig = getDefaultUserConfig();

	// Act
	render(CalendarYear, {
		props: { year },
		global: {
			provide: {
				[ICS_CALENDAR_COLLECTION_KEY]: ref(calendarCollection),
				[USER_CONFIG_KEY]: ref(userConfig),
			},
		},
	});

	// Assert
	expect(getEventsByDateFromCalendarCollection).toHaveBeenCalledWith(
		calendarCollection,
		userConfig,
		new Date(2024, 11, 29),
		new Date(2026, 0, 3),
	);
});

it("emits if a day was clicked", async () => {
	// Arrange
	const year = 2025;
	const calendarCollection = getDefaultIcsCalendarCollection();

	// Act
	const wrapper = render(CalendarYear, {
		props: { year },
		global: {
			provide: {
				[ICS_CALENDAR_COLLECTION_KEY]: ref(calendarCollection),
				[USER_CONFIG_KEY]: ref(getDefaultUserConfig()),
			},
		},
	});
	const january = wrapper.getAllByRole("grid")[0];
	const dayDisplay = within(january).getByText("10");
	await fireEvent.click(dayDisplay);

	// Assert
	expect(wrapper.emitted("dayClicked")).toEqual([[new Date(2025, 0, 10)]]);
});

it("emits if an event was clicked", async () => {
	// Arrange
	const year = 2025;
	const calendarCollection = getDefaultIcsCalendarCollection();
	const event: IcsEvent = {
		...getDefaultIcsEvent(),
		start: { date: new Date(2025, 5, 3) },
		summary: "My Event",
	};
	const calendarName = "some-calendar";
	calendarCollection[calendarName] = {
		...getDefaultIcsCalendar(),
		events: [event],
	};

	// Act
	const wrapper = render(CalendarYear, {
		props: { year },
		global: {
			provide: {
				[ICS_CALENDAR_COLLECTION_KEY]: ref(calendarCollection),
				[USER_CONFIG_KEY]: ref(getDefaultUserConfig()),
			},
		},
	});
	const eventDisplay = wrapper.getByText(event.summary);
	await fireEvent.click(eventDisplay);

	// Assert
	const expectedResult: EventOccurrence = {
		date: event.start.date,
		sourceCalendar: calendarName,
		event,
	};
	expect(wrapper.emitted("eventClicked")).toEqual([[expectedResult]]);
});
