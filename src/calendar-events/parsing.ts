import { parseIcsCalendar } from "@ts-ics/schema-zod";
import { generateIcsCalendar, IcsCalendar, IcsEvent } from "ts-ics";

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
export type IcsCalendarCollection = Record<string, IcsCalendar | undefined>;

export function getDefaultIcsCalendar(): IcsCalendar {
	return {
		version: "2.0",
		prodId: "paulholtom/printable-calendar",
	};
}

/**
 * @returns A default calendar collection.
 */
export function getDefaultIcsCalendarCollection(): IcsCalendarCollection {
	return {};
}

/**
 * @param calendar The calendar to serialize.
 * @returns The ICS file contents.
 */
export function serializeIcsCalendar(calendar: IcsCalendar): string {
	const normalizedCalendar = {
		...calendar,
		events: calendar.events
			? calendar.events.map((event) => {
					if (event.start.type === "DATE") {
						return {
							...event,
							start: {
								...event.start,
								date: new Date(
									Date.UTC(
										event.start.date.getFullYear(),
										event.start.date.getMonth(),
										event.start.date.getDate(),
									),
								),
							},
						};
					}
					return event;
				})
			: undefined,
	};
	return generateIcsCalendar(normalizedCalendar);
}

/**
 * @param unparsed The raw ICS file to parse.
 * @returns The parsed calender.
 */
export function parseIcsCalendarString(unparsed: string): IcsCalendar {
	try {
		const calendar = parseIcsCalendar(unparsed);
		calendar.events?.forEach((event) => {
			if (event.start.type === "DATE") {
				event.start.date = new Date(
					event.start.date.getUTCFullYear(),
					event.start.date.getUTCMonth(),
					event.start.date.getUTCDate(),
				);
			}
		});
		return calendar;
	} catch (err) {
		throw new Error("Error reading calendar file.", { cause: err });
	}
}
