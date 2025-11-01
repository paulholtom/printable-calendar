import {
	getDefaultIcsCalendar,
	getDefaultIcsEvent,
	IcsCalendar,
	IcsEvent,
} from "@/calendar-events";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COLUMN_HEADINGS, convertGoogleContactsToCalendar } from "./index";

beforeEach(() => {
	vi.resetAllMocks();
});

describe(convertGoogleContactsToCalendar, () => {
	it("returns an error if the file is empty", () => {
		// Arrange
		// Act
		const result = convertGoogleContactsToCalendar("");

		// Assert
		expect(result).toEqual([new Error("Contacts file is empty.")]);
	});

	it("returns an error for each missing heading", () => {
		// Arrange
		// Act
		const result = convertGoogleContactsToCalendar("not,right");

		// Assert
		expect(result).toEqual(
			Object.values(COLUMN_HEADINGS).map(
				(name) =>
					new Error(
						`Expected a column heading of ${name} but it wasn't found.`,
					),
			),
		);
	});
	const VALID_COLUMN_HEADINGS = `${COLUMN_HEADINGS.firstName},${COLUMN_HEADINGS.lastName},${COLUMN_HEADINGS.birthDay},${COLUMN_HEADINGS.eventName},${COLUMN_HEADINGS.eventDate}\n`;

	it("returns an error if a row has a different number of columns than the headings", () => {
		// Arrange
		// Act
		const result = convertGoogleContactsToCalendar(
			`${VALID_COLUMN_HEADINGS}a,b\n`,
		);

		// Assert
		expect(result).toEqual([
			new Error(
				`Row number 1 has 2 values but the headers have 5 values. Unable to convert this row.`,
			),
		]);
	});

	it.each<{
		produces: string;
		when: string;
		csvRows: Partial<Record<keyof typeof COLUMN_HEADINGS, string>>[];
		expectedEvents: IcsEvent[];
	}>([
		{
			produces: "an empty calendar",
			when: "there are no rows in the CSV file",
			csvRows: [],
			expectedEvents: [],
		},
		{
			produces: "an empty calendar",
			when: "no rows have birthdays or other events",
			csvRows: [{ firstName: "Bob", lastName: "Jones" }],
			expectedEvents: [],
		},
		{
			produces: "an annually recurring event",
			when: "a row has a birthday",
			csvRows: [
				{ firstName: "Bob", lastName: "Jones", birthDay: "2023-05-22" },
			],
			expectedEvents: [
				{
					...getDefaultIcsEvent(),
					uid: expect.any(String),
					start: { date: new Date(2023, 4, 22), type: "DATE" },
					summary: "Bob Jones Birthday",
					recurrenceRule: {
						frequency: "YEARLY",
					},
					nonStandard: {
						ordinalDisplay: {
							before: "Bob Jones",
							after: "Birthday",
						},
					},
				},
			],
		},
		{
			produces: "an annually recurring event",
			when: "a row has an event",
			csvRows: [
				{
					firstName: "Bob",
					lastName: "Jones",
					eventName: "Anniversary",
					eventDate: "2023-05-22",
				},
			],
			expectedEvents: [
				{
					...getDefaultIcsEvent(),
					uid: expect.any(String),
					start: { date: new Date(2023, 4, 22), type: "DATE" },
					summary: "Bob Jones Anniversary",
					recurrenceRule: {
						frequency: "YEARLY",
					},
					nonStandard: {
						ordinalDisplay: {
							before: "Bob Jones",
							after: "Anniversary",
						},
					},
				},
			],
		},
		{
			produces: "multiple annually recurring event",
			when: "a row has a birthday and an event",
			csvRows: [
				{
					firstName: "Bob",
					lastName: "Jones",
					birthDay: "2024-03-16",
					eventName: "Anniversary",
					eventDate: "2023-05-22",
				},
			],
			expectedEvents: [
				{
					...getDefaultIcsEvent(),
					uid: expect.any(String),
					start: { date: new Date(2024, 2, 16), type: "DATE" },
					summary: "Bob Jones Birthday",
					recurrenceRule: {
						frequency: "YEARLY",
					},
					nonStandard: {
						ordinalDisplay: {
							before: "Bob Jones",
							after: "Birthday",
						},
					},
				},
				{
					...getDefaultIcsEvent(),
					uid: expect.any(String),
					start: { date: new Date(2023, 4, 22), type: "DATE" },
					summary: "Bob Jones Anniversary",
					recurrenceRule: {
						frequency: "YEARLY",
					},
					nonStandard: {
						ordinalDisplay: {
							before: "Bob Jones",
							after: "Anniversary",
						},
					},
				},
			],
		},
		{
			produces: "all relevant events",
			when: "there are multiple rows with different events",
			csvRows: [
				{
					firstName: "Bob",
					lastName: "Jones",
					birthDay: "2024-03-16",
					eventName: "Anniversary",
					eventDate: "2023-05-22",
				},
				{ firstName: "NOBODY" },
				{ firstName: "Jane", birthDay: "2010-07-20" },
			],
			expectedEvents: [
				{
					...getDefaultIcsEvent(),
					uid: expect.any(String),
					start: { date: new Date(2024, 2, 16), type: "DATE" },
					summary: "Bob Jones Birthday",
					recurrenceRule: {
						frequency: "YEARLY",
					},
					nonStandard: {
						ordinalDisplay: {
							before: "Bob Jones",
							after: "Birthday",
						},
					},
				},
				{
					...getDefaultIcsEvent(),
					uid: expect.any(String),
					start: { date: new Date(2023, 4, 22), type: "DATE" },
					summary: "Bob Jones Anniversary",
					recurrenceRule: {
						frequency: "YEARLY",
					},
					nonStandard: {
						ordinalDisplay: {
							before: "Bob Jones",
							after: "Anniversary",
						},
					},
				},
				{
					...getDefaultIcsEvent(),
					uid: expect.any(String),
					start: { date: new Date(2010, 6, 20), type: "DATE" },
					summary: "Jane Birthday",
					recurrenceRule: {
						frequency: "YEARLY",
					},
					nonStandard: {
						ordinalDisplay: {
							before: "Jane",
							after: "Birthday",
						},
					},
				},
			],
		},
	])("produces $produces when $when", ({ csvRows, expectedEvents }) => {
		// Arrange
		const fileContents = `${VALID_COLUMN_HEADINGS}${csvRows
			.map(
				(row) =>
					`${row.firstName ?? ""},${row.lastName ?? ""},${row.birthDay ?? ""},${row.eventName ?? ""},${row.eventDate ?? ""}\n`,
			)
			.join("")}`;

		// Act
		const result = convertGoogleContactsToCalendar(fileContents);

		// Assert
		const expectedResult: IcsCalendar = {
			...getDefaultIcsCalendar(),
			events: expectedEvents,
		};
		expect(result).toEqual(expectedResult);
	});
});
