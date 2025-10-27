import {
	EventOccurrence,
	getDefaultIcsCalendar,
	getDefaultIcsCalendarCollection,
	getDefaultIcsEvent,
	getEventsByDateFromCalendarCollection,
	ICS_CALENDAR_COLLECTION_KEY,
} from "@/calendar-events";
import { getDateDisplayValue } from "@/dates";
import { getDefaultUserConfig, USER_CONFIG_KEY } from "@/user-config";
import { fireEvent, render } from "@testing-library/vue";
import { IcsEvent } from "ts-ics";
import { beforeEach, expect, it, vi } from "vitest";
import { ref } from "vue";
import CalendarMonth from "./calendar-month.vue";

vi.mock(import("@/calendar-events"), { spy: true });

beforeEach(() => {
	vi.resetAllMocks();
});

it("displays the provided month", () => {
	// Arrange
	const month = 8;
	const year = 2025;

	// Act
	const wrapper = render(CalendarMonth, {
		props: { year, month },
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
	wrapper.getByText(getDateDisplayValue({ year, month }));
});

it("gets the events for the month if they were not provided", () => {
	// Arrange
	const month = 5;
	const year = 2025;
	const calendarCollection = getDefaultIcsCalendarCollection();
	const userConfig = getDefaultUserConfig();

	// Act
	render(CalendarMonth, {
		props: { year, month },
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
		new Date(2025, 5, 1),
		new Date(2025, 6, 5),
	);
});

it("does not recalculate the events if they were provided", () => {
	// Arrange
	const month = 5;
	const year = 2025;
	const calendarCollection = getDefaultIcsCalendarCollection();

	// Act
	render(CalendarMonth, {
		props: { year, month, parentEventsByDate: new Map() },
		global: {
			provide: {
				[ICS_CALENDAR_COLLECTION_KEY]: ref(calendarCollection),
				[USER_CONFIG_KEY]: ref(getDefaultUserConfig()),
			},
		},
	});

	// Assert
	expect(getEventsByDateFromCalendarCollection).not.toHaveBeenCalled();
});

it("emits if a day was clicked", async () => {
	// Arrange
	const month = 5;
	const year = 2025;
	const calendarCollection = getDefaultIcsCalendarCollection();

	// Act
	const wrapper = render(CalendarMonth, {
		props: { year, month },
		global: {
			provide: {
				[ICS_CALENDAR_COLLECTION_KEY]: ref(calendarCollection),
				[USER_CONFIG_KEY]: ref(getDefaultUserConfig()),
			},
		},
	});
	const dayDisplay = wrapper.getByText("10");
	await fireEvent.click(dayDisplay);

	// Assert
	expect(wrapper.emitted("dayClicked")).toEqual([[new Date(2025, 5, 10)]]);
});

it("emits if an event was clicked", async () => {
	// Arrange
	const month = 5;
	const year = 2025;
	const calendarCollection = ref(getDefaultIcsCalendarCollection());
	const event: IcsEvent = {
		...getDefaultIcsEvent(),
		start: { date: new Date(2025, 5, 3) },
		summary: "My Event",
	};
	const calendarName = "some-calendar";
	calendarCollection.value[calendarName] = {
		...getDefaultIcsCalendar(),
		events: [event],
	};

	// Act
	const wrapper = render(CalendarMonth, {
		props: { year, month },
		global: {
			provide: {
				[ICS_CALENDAR_COLLECTION_KEY]: calendarCollection,
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
