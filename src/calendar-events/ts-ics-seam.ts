import { zIcsCalendar } from "@ts-ics/schema-zod";
import {
	convertIcsCalendar,
	extendByRecurrenceRule,
	generateIcsCalendar,
	IcsCalendar as TsIcsCalendar,
	IcsEvent as TsIcsEvent,
	IcsRecurrenceRule as TsIcsRecurrenceRule,
	IcsRecurrenceRuleFrequency as TsIcsRecurrenceRuleFrequency,
	IcsWeekdayNumber as TsIcsWeekdayNumber,
} from "ts-ics";
import z from "zod";

/**
 * How to display an event with an ordinal.
 */
export type OrdinalDisplaySettings = {
	/**
	 * Text to display before the ordinal.
	 */
	before: string;
	/**
	 * Text to display after the ordinal.
	 */
	after: string;
};

/**
 * Non standard event properties.
 */
export type IcsNonStandard = {
	/**
	 * How to display an event with an ordinal.
	 */
	ordinalDisplay?: OrdinalDisplaySettings;
};

/**
 * A calendar.
 */
export type IcsCalendar = TsIcsCalendar<IcsNonStandard>;

/**
 * A single calendar event.
 */
export type IcsEvent = TsIcsEvent<IcsNonStandard>;

/**
 * Rules describe how an event recurrs.
 */
export type IcsRecurrenceRule = TsIcsRecurrenceRule;

/**
 * Describe a day of the week within an Ics object.
 */
export type IcsWeekdayNumber = TsIcsWeekdayNumber;

/**
 * The frequency of a recurrence rule.
 */
export type IcsRecurrenceRuleFrequency = TsIcsRecurrenceRuleFrequency;

export { extendByRecurrenceRule };

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
		nonStandard: {},
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
		nonStandard: {},
	};
}

/**
 * @returns A default calendar collection.
 */
export function getDefaultIcsCalendarCollection(): IcsCalendarCollection {
	return {};
}

/**
 * The name used for the ordinal display object in calendar files.
 */
export const ORIDNAL_DISPLAY_NAME =
	"X-PAULHOLTOM-PRINTABLECALENDAR-ORDINAL-DISPLAY";

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
	return generateIcsCalendar<IcsNonStandard>(normalizedCalendar, {
		nonStandard: {
			ordinalDisplay: {
				name: ORIDNAL_DISPLAY_NAME,
				generate(value) {
					return { value: JSON.stringify(value) };
				},
			},
		},
	});
}

/**
 * @param unparsed The raw ICS file to parse.
 * @returns The parsed calendar.
 */
export function parseIcsCalendarString(unparsed: string): IcsCalendar {
	try {
		const calendar = convertIcsCalendar<IcsNonStandard>(
			undefined,
			unparsed,
			{
				nonStandard: {
					ordinalDisplay: {
						name: ORIDNAL_DISPLAY_NAME,
						convert(line) {
							return JSON.parse(line.value);
						},
						schema: z.object({
							before: z.string(),
							after: z.string(),
						}),
					},
				},
			},
		);

		// Fix some potential errors before validating with zod.
		if (calendar.events) {
			for (let i = 0; i < calendar.events.length; ++i) {
				if (calendar.events[i].summary === undefined) {
					calendar.events[i].summary = "(No title)";
				}
				if (
					calendar.events[i].duration === undefined &&
					calendar.events[i].end === undefined
				) {
					calendar.events[i].duration = { hours: 1 };
				}
			}
		}

		zIcsCalendar.parse(calendar);
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
