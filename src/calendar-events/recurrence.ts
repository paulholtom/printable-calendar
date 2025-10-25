import {
	extendByRecurrenceRule,
	IcsEvent,
	IcsRecurrenceRule,
	IcsWeekdayNumber,
} from "ts-ics";
import { IcsCalendarCollection } from "./parsing";

export const ICS_WEEKDAY_MAP: IcsWeekdayNumber["day"][] = [
	"SU",
	"MO",
	"TU",
	"WE",
	"TH",
	"FR",
	"SA",
];

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

	// Monthly recurrence by weekday has some flaws in ts-ics. Work around those.
	if (
		event.recurrenceRule.frequency === "MONTHLY" &&
		event.recurrenceRule.byDay
	) {
		/**
		 * Positive occurrences will get midnight UTC time of the next date.
		 * Negative occurrences will get midnight UTC time of the correct date.
		 *
		 * Since they're wrong in slightly different ways, split them up, so we can handle them separately.
		 * In this situation an undefined or 0 occurrence doesn't make sense so they're ignored.
		 */
		const positiveOccurences: IcsRecurrenceRule = {
			...event.recurrenceRule,
			byDay: event.recurrenceRule.byDay.filter(
				(weekday) => (weekday.occurrence ?? 0) > 0,
			),
		};

		const negativeOccurences: IcsRecurrenceRule = {
			...event.recurrenceRule,
			byDay: event.recurrenceRule.byDay.filter(
				(weekday) => (weekday.occurrence ?? 0) < 0,
			),
		};

		return [
			// Positve are ahead by 1 day, subtract 1 from the UTC date and combine with the event time.
			...extendByRecurrenceRule(positiveOccurences, {
				start: event.start.date,
				// Since the determine date is ahead by 1 day, extend the date range being checked.
				end: new Date(rangeEnd.getTime() + 24 * 60 * 60 * 1000),
			}).map(
				(date) =>
					new Date(
						date.getUTCFullYear(),
						date.getUTCMonth(),
						date.getUTCDate() - 1,
						event.start.date.getHours(),
						event.start.date.getMinutes(),
					),
			),
			// Negative have the correct date, extract the UTC date and combine with the time.
			...extendByRecurrenceRule(negativeOccurences, {
				start: event.start.date,
				end: rangeEnd,
			}).map(
				(date) =>
					new Date(
						date.getUTCFullYear(),
						date.getUTCMonth(),
						date.getUTCDate(),
						event.start.date.getHours(),
						event.start.date.getMinutes(),
					),
			),
		].filter((date) => dateInRange(date, rangeStart, rangeEnd));
	}

	return extendByRecurrenceRule(event.recurrenceRule, {
		start: event.start.date,
		end: rangeEnd,
	}).filter((date) => dateInRange(date, rangeStart, rangeEnd));
}

/**
 * A specific occurrence of an event.
 */
export type EventOccurrence = {
	/**
	 * The date and time of this specific occurence.
	 */
	date: Date;
	/**
	 * The calendar the event came from.
	 */
	sourceCalendar: string;
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
export type EventsByDate = Map<number, EventOccurrence[]>;

export function getEventsByDateFromCalendarCollection<
	CalendarCollection extends IcsCalendarCollection,
>(
	collection: CalendarCollection,
	rangeStart: Date,
	rangeEnd: Date,
): EventsByDate {
	const events: EventsByDate = new Map();

	const dateToAdd = new Date(rangeStart.getTime());

	while (dateToAdd.getTime() <= rangeEnd.getTime()) {
		events.set(dateToAdd.getTime(), []);
		dateToAdd.setDate(dateToAdd.getDate() + 1);
	}

	for (const [calendarName, calendar] of Object.entries(collection)) {
		calendar?.events?.forEach((event) => {
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
					sourceCalendar: calendarName,
					event,
				});
			});
		});
	}

	return events;
}
