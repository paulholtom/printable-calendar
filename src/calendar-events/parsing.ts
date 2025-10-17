import { dateOnly } from "@/dates";
import { z } from "zod";

const calendarEvent = z.object({
	/**
	 * The first time this event occurs.
	 */
	firstOccurance: dateOnly,
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
		firstOccurance: {
			year: now.getFullYear(),
			month: now.getMonth(),
			date: now.getDate(),
		},
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
