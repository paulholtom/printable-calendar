import { inject, InjectionKey, provide } from "vue";
import { z } from "zod";

const calendarEvent = z.object({
	/**
	 * The start date and time of the event.
	 */
	start: z.coerce.date(),
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
	return {
		start: new Date(),
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
