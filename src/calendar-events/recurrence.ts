import { extendByRecurrenceRule, IcsEvent } from "ts-ics";
import { IcsCalendarCollection } from "./parsing";

/**
 * @param event The event to check.
 * @param date The date to check.
 * @returns If the event should appear on the specified day.
 */
export function eventAppearsOnDay(event: IcsEvent, date: Date): boolean {
	return event.start.date.getTime() === date.getTime();
}

/**
 * @param date The date to check.
 * @param rangeStart The start of the range.
 * @param rangeEnd Then end of the range.
 * @returns True if the date is in the provided range, false otherwise.
 * Since this does not ensure the end date is after the start date providing an end date after the start date will always result in this returning false.
 */
function dateInRange(date: Date, rangeStart: Date, rangeEnd: Date): boolean {
	return (
		date.getTime() >= rangeStart.getTime() &&
		date.getTime() <= rangeEnd.getTime()
	);
}

/**
 * @param event The event to check.
 * @param rangeStart The start of the range.
 * @param rangeEnd The end of the range.
 * @returns All dates the provided event should appear for in the provided range.
 */
export function getDaysForEventInRange(
	event: IcsEvent,
	rangeStart: Date,
	rangeEnd: Date,
): Date[] {
	if (!event.recurrenceRule) {
		if (dateInRange(event.start.date, rangeStart, rangeEnd)) {
			return [event.start.date];
		}
		return [];
	}
	return extendByRecurrenceRule(event.recurrenceRule, {
		start: event.start.date,
		end: rangeEnd,
	}).filter((date) => dateInRange(date, rangeStart, rangeEnd));
}

/**
 * A specific occurrence of an event.
 */
export type EventOccurrence<CalendarCollection extends IcsCalendarCollection> =
	{
		/**
		 * The date and time of this specific occurence.
		 */
		date: Date;
		/**
		 * The calendar the event came from.
		 */
		sourceCalendar: keyof CalendarCollection;
		/**
		 * Details of the event.
		 */
		event: IcsEvent;
	};

/**
 * Event occurences grouped and sorted by date.
 *
 * The keys are timestamps as dates won't be equal in a map.
 */
export type EventsByDate<CalendarCollection extends IcsCalendarCollection> =
	Map<number, EventOccurrence<CalendarCollection>[]>;

export function getEventsByDateFromCalendarCollection<
	CalendarCollection extends IcsCalendarCollection,
>(
	collection: CalendarCollection,
	rangeStart: Date,
	rangeEnd: Date,
): EventsByDate<CalendarCollection> {
	const events: EventsByDate<CalendarCollection> = new Map();

	const dateToAdd = new Date(rangeStart.getTime());

	while (dateToAdd.getTime() <= rangeEnd.getTime()) {
		events.set(dateToAdd.getTime(), []);
		dateToAdd.setDate(dateToAdd.getDate() + 1);
	}

	for (const [calendarName, calendar] of Object.entries(collection)) {
		calendar.events?.forEach((event) => {
			const datesOfEvent = getDaysForEventInRange(
				event,
				rangeStart,
				rangeEnd,
			);

			datesOfEvent.forEach((eventDate) => {
				const dateWithoutTime = new Date(
					eventDate.toDateString(),
				).getTime();
				events.get(dateWithoutTime)?.push({
					date: eventDate,
					sourceCalendar: calendarName as keyof CalendarCollection,
					event,
				});
			});
		});
	}

	return events;
}
