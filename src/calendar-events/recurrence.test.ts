import { IcsEvent } from "ts-ics";
import { describe, expect, it } from "vitest";
import {
	getDefaultIcsCalendar,
	getDefaultIcsCalendarCollection,
	getDefaultIcsEvent,
	IcsCalendarCollection,
} from "./parsing";
import {
	EventOccurrence,
	EventsByDate,
	getDaysForEventInRange,
	getEventsByDateFromCalendarCollection,
} from "./recurrence";

describe(getDaysForEventInRange, () => {
	it.each<{
		produces: string;
		when: string;
		event: IcsEvent;
		rangeStart: Date;
		rangeEnd: Date;
		expected: Date[];
	}>([
		{
			produces: "The event start date",
			when: "There is no recurrence rule and the event start date is in the range",
			event: {
				...getDefaultIcsEvent(),
				start: { date: new Date(Date.UTC(2025, 5, 5)) },
			},
			rangeStart: new Date(Date.UTC(2025, 5, 1)),
			rangeEnd: new Date(Date.UTC(2025, 6, 0)),
			expected: [new Date(Date.UTC(2025, 5, 5))],
		},
		{
			produces: "An empty array",
			when: "There is no recurrence rule and the event start date is before the range",
			event: {
				...getDefaultIcsEvent(),
				start: { date: new Date(Date.UTC(2025, 3, 5)) },
			},
			rangeStart: new Date(Date.UTC(2025, 5, 1)),
			rangeEnd: new Date(Date.UTC(2025, 6, 0)),
			expected: [],
		},
		{
			produces: "An empty array",
			when: "There is no recurrence rule and the event start date is after the range",
			event: {
				...getDefaultIcsEvent(),
				start: { date: new Date(Date.UTC(2025, 7, 5)) },
			},
			rangeStart: new Date(Date.UTC(2025, 5, 1)),
			rangeEnd: new Date(Date.UTC(2025, 6, 0)),
			expected: [],
		},
		{
			produces: "The date in the range",
			when: "There is an annual recurrance from 10 years ago that falls in the date range",
			event: {
				...getDefaultIcsEvent(),
				start: { date: new Date(Date.UTC(2015, 5, 5)) },
				recurrenceRule: {
					frequency: "YEARLY",
				},
			},
			rangeStart: new Date(Date.UTC(2025, 5, 1)),
			rangeEnd: new Date(Date.UTC(2025, 6, 0)),
			expected: [new Date(Date.UTC(2025, 5, 5))],
		},
		{
			produces: "An empty array",
			when: "There is an annual recurrance from 10 years ago that falls outside of the date range",
			event: {
				...getDefaultIcsEvent(),
				start: { date: new Date(Date.UTC(2015, 6, 5)) },
				recurrenceRule: {
					frequency: "YEARLY",
				},
			},
			rangeStart: new Date(Date.UTC(2025, 5, 1)),
			rangeEnd: new Date(Date.UTC(2025, 6, 0)),
			expected: [],
		},
	])(
		"Produces $produces when $when",
		({ event, rangeStart, rangeEnd, expected }) => {
			// Arrange

			// Act
			const result = getDaysForEventInRange(event, rangeStart, rangeEnd);

			// Assert
			expect(result).toEqual(expected);
		},
	);
});

describe(getEventsByDateFromCalendarCollection, () => {
	const RANGE_START = new Date(2025, 5, 5);
	const RANGE_END = new Date(2025, 5, 10);

	function createExpectedEventsByDate(options?: {
		5?: EventOccurrence[];
		6?: EventOccurrence[];
		7?: EventOccurrence[];
		8?: EventOccurrence[];
		9?: EventOccurrence[];
		10?: EventOccurrence[];
	}): EventsByDate {
		return new Map<number, EventOccurrence[]>([
			[new Date(2025, 5, 5).getTime(), options?.[5] ?? []],
			[new Date(2025, 5, 6).getTime(), options?.[6] ?? []],
			[new Date(2025, 5, 7).getTime(), options?.[7] ?? []],
			[new Date(2025, 5, 8).getTime(), options?.[8] ?? []],
			[new Date(2025, 5, 9).getTime(), options?.[9] ?? []],
			[new Date(2025, 5, 10).getTime(), options?.[10] ?? []],
		] satisfies [number, EventOccurrence[]][]);
	}

	it("gets an empty map of the provided date range if the collection has no events", () => {
		// Arrange
		const calendar = getDefaultIcsCalendarCollection();

		// Act
		const result = getEventsByDateFromCalendarCollection(
			calendar,
			RANGE_START,
			RANGE_END,
		);

		// Assert
		expect(result).toEqual(createExpectedEventsByDate());
	});

	it("doesn't include events outside the range", () => {
		// Arrange
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			start: { date: new Date(2025, 5, 2) },
		};
		const calendarCollection: IcsCalendarCollection = {
			...getDefaultIcsCalendarCollection(),
			default: {
				...getDefaultIcsCalendar(),
				events: [event],
			},
		};

		// Act
		const result = getEventsByDateFromCalendarCollection(
			calendarCollection,
			RANGE_START,
			RANGE_END,
		);

		// Assert
		expect(result).toEqual(createExpectedEventsByDate());
	});

	it("includes single events in the range", () => {
		// Arrange
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			start: { date: new Date(2025, 5, 7) },
		};
		const calendarCollection: IcsCalendarCollection = {
			...getDefaultIcsCalendarCollection(),
			default: {
				...getDefaultIcsCalendar(),
				events: [event],
			},
		};

		// Act
		const result = getEventsByDateFromCalendarCollection(
			calendarCollection,
			RANGE_START,
			RANGE_END,
		);

		// Assert
		expect(result).toEqual(
			createExpectedEventsByDate({
				7: [
					{
						date: new Date(2025, 5, 7),
						sourceCalendar: "default",
						event,
					},
				],
			}),
		);
	});

	it("includes recurring events within the range", () => {
		// Arrange
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			start: { date: new Date(2025, 5, 2) },
			recurrenceRule: {
				frequency: "DAILY",
				count: 5,
			},
		};
		const calendarCollection: IcsCalendarCollection = {
			...getDefaultIcsCalendarCollection(),
			default: {
				...getDefaultIcsCalendar(),
				events: [event],
			},
		};

		// Act
		const result = getEventsByDateFromCalendarCollection(
			calendarCollection,
			RANGE_START,
			RANGE_END,
		);

		// Assert
		expect(result).toEqual(
			createExpectedEventsByDate({
				5: [
					{
						date: new Date(2025, 5, 5),
						sourceCalendar: "default",
						event,
					},
				],
				6: [
					{
						date: new Date(2025, 5, 6),
						sourceCalendar: "default",
						event,
					},
				],
			}),
		);
	});
});
