import { DateOnly, datesEqual } from "@/dates";
import { CalendarEvent } from "./parsing";

/**
 * @param event The event to check.
 * @param date The date to check.
 * @returns If the event should appear on the specified day.
 */
export function eventAppearsOnDay(
	event: CalendarEvent,
	date: DateOnly,
): boolean {
	return datesEqual(event.firstOccurance, date);
}
