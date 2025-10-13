import { inject, InjectionKey, provide } from "vue";
import { z } from "zod";

const calendarEvent = z.object({
	/**
	 * The year of the first occurance of this event.
	 */
	year: z.number(),
	/**
	 * The month of the first occurance of this event.
	 *
	 * January is 0.
	 */
	month: z.number(),
	/**
	 * The day of the month of the first occurance of this event.
	 */
	day: z.number(),
	/**
	 * The description of the event.
	 */
	description: z.string(),
});

/**
 * A single event to display in the calendar
 */
export type CalendarEvent = z.infer<typeof calendarEvent>;

/**
 * @returns An event with defaults for all required values.
 */
export function getDefaultCalendarEvent(): CalendarEvent {
	const now = new Date();
	return {
		year: now.getFullYear(),
		month: now.getMonth(),
		day: now.getDate(),
		description: "Unnamed Event",
	};
}

const calendarEvents = z.array(calendarEvent);

/**
 * A collection of calendar events.
 */
export type CalendarEvents = z.infer<typeof calendarEvents>;

/**
 * A collection of differently grouped events.
 */
export type CalendarEventCollection = { default: CalendarEvents };

/**
 * @returns A default calendar event collection.
 */
export function getDefaultCalendarEventCollection(): CalendarEventCollection {
	return { default: [] };
}

/**
 * @param unparsed The raw JSON string to parse.
 * @returns The parsed calender events.
 */
export function parseCalendarEvents(unparsed: string): CalendarEvents {
	try {
		return calendarEvents.parse(JSON.parse(unparsed));
	} catch {
		return [];
	}
}

/**
 * The injection key for the calendar events.
 */
export const CALENDAR_EVENT_COLLECTION_KEY: InjectionKey<CalendarEventCollection> =
	Symbol("calendar-event-collection");

/**
 * @returns The calendar events.
 */
export function useCalendarEventCollection(): CalendarEventCollection {
	return inject(CALENDAR_EVENT_COLLECTION_KEY);
}

/**
 * Provides the calendar events.
 *
 * @param calendarEventCollection The calendar events to be provided.
 */
export function provideCalendarEventCollection(
	calendarEventCollection: CalendarEventCollection,
): void {
	provide(CALENDAR_EVENT_COLLECTION_KEY, calendarEventCollection);
}
