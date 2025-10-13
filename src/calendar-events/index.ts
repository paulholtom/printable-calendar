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
