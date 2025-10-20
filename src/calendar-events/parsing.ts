import { parseIcsCalendar } from "@ts-ics/schema-zod";
import { IcsCalendar, IcsEvent } from "ts-ics";

/**
 * @returns An event with defaults for all required values.
 */
export function getDefaultIcsEvent(): IcsEvent {
	const now = new Date();
	// Clear the milliseconds since the ics standard doesn't support those.
	now.setMilliseconds(0);
	return {
		stamp: {
			date: now,
			type: "DATE-TIME",
		},
		start: {
			date: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
			type: "DATE",
		},
		duration: { hours: 1 },
		summary: "New Event",
		uid: `${crypto.randomUUID()}@paulholtom/printable-calendar`,
	};
}

/**
 * A collection of differently grouped events.
 */
export type IcsCalendarCollection = Record<string, IcsCalendar | undefined> & {
	default: IcsCalendar;
};

export function getDefaultIcsCalendar(): IcsCalendar {
	return {
		version: "2.0",
		prodId: "paulholtom/printable-calendar",
	};
}

/**
 * @returns A default calendar event collection.
 */
export function getDefaultIcsCalendarCollection(): IcsCalendarCollection {
	return { default: getDefaultIcsCalendar() };
}

/**
 * @param unparsed The raw JSON string to parse.
 * @returns The parsed calender events.
 */
export function parseIcsCalendarString(unparsed: string): IcsCalendar {
	try {
		return parseIcsCalendar(unparsed);
	} catch (err) {
		throw new Error("Error reading calendar file.", { cause: err });
	}
}
