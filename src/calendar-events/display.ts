import { IcsEvent } from "ts-ics";

/**
 * @param event The event to check.
 * @param date The date to check.
 * @returns If the event should appear on the specified day.
 */
export function eventAppearsOnDay(event: IcsEvent, date: Date): boolean {
	return event.start.date.getTime() === date.getTime();
}
