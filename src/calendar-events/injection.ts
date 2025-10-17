import { inject, InjectionKey, provide } from "vue";
import { CalendarEventCollection } from "./parsing";

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
