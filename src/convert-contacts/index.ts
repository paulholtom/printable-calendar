import {
	getDefaultIcsCalendar,
	getDefaultIcsEvent,
	IcsCalendar,
} from "@/calendar-events";
import { IcsEvent } from "ts-ics";
import { CsvReader } from "./csv-reader";

/**
 * Headings for the relevant columns.
 */
export const COLUMN_HEADINGS = {
	firstName: "First Name",
	lastName: "Last Name",
	birthDay: "Birthday",
	eventName: "Event 1 - Label",
	eventDate: "Event 1 - Value",
} satisfies Record<string, string>;

/**
 * Extracts birthdays and up to 1 event from google contacts, turning them into an IcsCalendar.
 *
 * @param contactsFileContent The contents of the google contacts CSV file.
 * @returns A calendar or a list of errors encountered while trying to convert the contacts.
 */
export function convertGoogleContactsToCalendar(
	contactsFileContent: string,
): IcsCalendar | Error[] {
	const reader = new CsvReader(contactsFileContent);
	const firstRow = reader.readNextRow();

	if (!firstRow) {
		return [new Error("Contacts file is empty.")];
	}

	const columnIndexes = Object.fromEntries(
		Object.entries(COLUMN_HEADINGS).map(([type, name]) => [
			type,
			firstRow.findIndex((value) => value === name),
		]),
	) as Record<keyof typeof COLUMN_HEADINGS, number>;

	const errors = Object.entries(columnIndexes)
		.map(([type, index]) =>
			index < 0
				? new Error(
						`Expected a column heading of ${COLUMN_HEADINGS[type as keyof typeof COLUMN_HEADINGS]} but it wasn't found.`,
					)
				: undefined,
		)
		.filter((error): error is Error => error !== undefined);

	if (errors.length > 0) {
		return errors;
	}

	const calendar = getDefaultIcsCalendar();
	calendar.events = [];

	let row = reader.readNextRow();
	let currentRow = 1;
	while (row !== undefined) {
		if (row.length !== firstRow.length) {
			errors.push(
				new Error(
					`Row number ${currentRow} has ${row.length} values but the headers have ${firstRow.length} values. Unable to convert this row.`,
				),
			);
		} else {
			const contactName =
				`${row[columnIndexes.firstName]} ${row[columnIndexes.lastName]}`.trim();

			const unparsedBirthday = row[columnIndexes.birthDay];
			if (unparsedBirthday.length === 10) {
				calendar.events.push(
					createEvent({
						contactName,
						unparsedDate: unparsedBirthday,
						eventDescription: "Birthday",
					}),
				);
			}

			const unparsedEventDate = row[columnIndexes.eventDate];
			const eventDescription = row[columnIndexes.eventName];
			if (unparsedEventDate.length === 10 && eventDescription) {
				calendar.events.push(
					createEvent({
						contactName,
						unparsedDate: unparsedEventDate,
						eventDescription,
					}),
				);
			}
		}
		row = reader.readNextRow();
		++currentRow;
	}

	if (errors.length > 0) {
		return errors;
	}

	return calendar;
}

/**
 * @param parameters Details of the event.
 * @returns An ics event based on the provided parameters.
 */
function createEvent(parameters: {
	contactName: string;
	unparsedDate: string;
	eventDescription: string;
}): IcsEvent {
	const date = parseDate(parameters.unparsedDate);
	return {
		...getDefaultIcsEvent(),
		summary: `${parameters.contactName} ${parameters.eventDescription}`,
		start: {
			date,
			type: "DATE",
		},
		recurrenceRule: {
			frequency: "YEARLY",
		},
		nonStandard: {
			ordinalDisplay: {
				before: parameters.contactName,
				after: parameters.eventDescription,
			},
		},
	};
}

/**
 * Parses a date from a contact event.
 *
 * @param dateString The unparsed date string.
 * @returns The date.
 */
function parseDate(dateString: string) {
	return new Date(
		parseInt(dateString.substring(0, 4)),
		parseInt(dateString.substring(5, 7)) - 1,
		parseInt(dateString.substring(8, 10)),
	);
}
