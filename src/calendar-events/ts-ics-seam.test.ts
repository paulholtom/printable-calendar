import { IcsDuration } from "ts-ics";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getDefaultIcsCalendar,
	getDefaultIcsCalendarCollection,
	getDefaultIcsEvent,
	IcsNonStandard,
	parseIcsCalendarString,
	serializeIcsCalendar,
} from "./ts-ics-seam";

beforeEach(() => {
	vi.resetAllMocks();
});

describe(getDefaultIcsCalendarCollection, () => {
	it("returns an empty collection", () => {
		// Arrange
		// Act
		const result = getDefaultIcsCalendarCollection();

		// Assert
		expect(result).toEqual({});
	});
});

describe(serializeIcsCalendar, () => {
	it("serializes a calendar with no DATE type start dates with no changes", () => {
		// Arrange
		const calendar = getDefaultIcsCalendar();

		// Act
		const result = serializeIcsCalendar(calendar);

		// Assert
		expect(result).toMatchInlineSnapshot(`
			"BEGIN:VCALENDAR
			VERSION:2.0
			PRODID:paulholtom/printable-calendar
			END:VCALENDAR
			"
		`);
	});

	it("serializes a calendar with DATE type start dates using the local date rather than the UTC date", () => {
		// Arrange
		const timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;
		const calendar = getDefaultIcsCalendar();
		const event = getDefaultIcsEvent();
		event.stamp.date = new Date(2025, 9, 24);
		event.uid = "some-static-uid";
		const date =
			timezoneOffset > 0
				? new Date(new Date(2025, 9, 26).getTime() - 1)
				: new Date(new Date(2025, 9, 25));
		event.start.date = date;
		event.start.type = "DATE";
		calendar.events = [event];

		// Act
		const result = serializeIcsCalendar(calendar);

		// Assert
		expect(result).toMatchInlineSnapshot(`
			"BEGIN:VCALENDAR
			VERSION:2.0
			PRODID:paulholtom/printable-calendar
			BEGIN:VEVENT
			DTSTAMP;VALUE=DATE-TIME:20251024T060000Z
			DTSTART;VALUE=DATE:20251025
			DURATION:PT1H
			SUMMARY:New Event
			UID:some-static-uid
			END:VEVENT
			END:VCALENDAR
			"
		`);
	});

	it("serializes a calendar with DATE-TIME type start dates using the UTC date and time", () => {
		// Arrange
		const calendar = getDefaultIcsCalendar();
		const event = getDefaultIcsEvent();
		event.stamp.date = new Date(2025, 9, 24);
		event.uid = "some-static-uid";
		event.start.date = new Date(2025, 9, 25, 12, 15);
		event.start.type = "DATE-TIME";
		calendar.events = [event];

		// Act
		const result = serializeIcsCalendar(calendar);

		// Assert
		expect(result).toMatchInlineSnapshot(`
			"BEGIN:VCALENDAR
			VERSION:2.0
			PRODID:paulholtom/printable-calendar
			BEGIN:VEVENT
			DTSTAMP;VALUE=DATE-TIME:20251024T060000Z
			DTSTART;VALUE=DATE-TIME:20251025T181500Z
			DURATION:PT1H
			SUMMARY:New Event
			UID:some-static-uid
			END:VEVENT
			END:VCALENDAR
			"
		`);
	});

	it("serializes a calendar with no type specified for the start dates using the UTC date and time", () => {
		// Arrange
		const calendar = getDefaultIcsCalendar();
		const event = getDefaultIcsEvent();
		event.stamp.date = new Date(2025, 9, 24);
		event.uid = "some-static-uid";
		event.start.date = new Date(2025, 9, 25, 12, 15);
		event.start.type = undefined;
		calendar.events = [event];

		// Act
		const result = serializeIcsCalendar(calendar);

		// Assert
		expect(result).toMatchInlineSnapshot(`
			"BEGIN:VCALENDAR
			VERSION:2.0
			PRODID:paulholtom/printable-calendar
			BEGIN:VEVENT
			DTSTAMP;VALUE=DATE-TIME:20251024T060000Z
			DTSTART:20251025T181500Z
			DURATION:PT1H
			SUMMARY:New Event
			UID:some-static-uid
			END:VEVENT
			END:VCALENDAR
			"
		`);
	});

	it("serializes an event with an ordinal display value", () => {
		// Arrange
		const calendar = getDefaultIcsCalendar();
		const event = getDefaultIcsEvent();
		event.stamp.date = new Date(2025, 9, 24);
		event.uid = "some-static-uid";
		event.start.date = new Date(2025, 9, 25, 12, 15);
		event.start.type = "DATE-TIME";
		event.nonStandard = {
			ordinalDisplay: {
				before: "Bob's",
				after: "Birthday",
			},
		};
		calendar.events = [event];

		// Act
		const result = serializeIcsCalendar(calendar);

		// Assert
		expect(result).toMatchInlineSnapshot(`
			"BEGIN:VCALENDAR
			VERSION:2.0
			PRODID:paulholtom/printable-calendar
			BEGIN:VEVENT
			DTSTAMP;VALUE=DATE-TIME:20251024T060000Z
			DTSTART;VALUE=DATE-TIME:20251025T181500Z
			DURATION:PT1H
			SUMMARY:New Event
			UID:some-static-uid
			X-PAULHOLTOM-PRINTABLECALENDAR-ORDINAL-DISPLAY:{"before":"Bob's","after":"B
			 irthday"}
			END:VEVENT
			END:VCALENDAR
			"
		`);
	});
});

describe(parseIcsCalendarString, () => {
	it("throws an error if the file is not in a valid format", () => {
		// Arrange
		// Act
		// Assert
		expect(() => parseIcsCalendarString("")).toThrowError();
	});

	it("parses an empty calendar", () => {
		// Arrange
		const calendar = getDefaultIcsCalendar();

		// Act
		const result = parseIcsCalendarString(serializeIcsCalendar(calendar));

		// Assert
		expect(result).toEqual(calendar);
	});

	it("sets the summary to (No title) when an event has no summary instead of throwing an error", () => {
		// Arrange
		const calendar = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:paulholtom/printable-calendar
BEGIN:VEVENT
DTSTAMP;VALUE=DATE-TIME:20251024T060000Z
DTSTART;VALUE=DATE-TIME:20251025T181500Z
DURATION:PT1H
UID:some-static-uid
END:VEVENT
END:VCALENDAR`;

		// Act
		const result = parseIcsCalendarString(calendar);

		// Assert
		expect(result.events?.[0].summary).toEqual("(No title)");
	});

	it("sets the duration to 1 hour when an event has no duration or end time instead of throwing an error", () => {
		// Arrange
		const calendar = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:paulholtom/printable-calendar
BEGIN:VEVENT
DTSTAMP;VALUE=DATE-TIME:20251024T060000Z
DTSTART;VALUE=DATE-TIME:20251025T181500Z
SUMMARY:Some event
UID:some-static-uid
END:VEVENT
END:VCALENDAR`;

		// Act
		const result = parseIcsCalendarString(calendar);

		// Assert
		const expectedDuration: IcsDuration = { hours: 1 };
		expect(result.events?.[0].duration).toEqual(expectedDuration);
	});

	it("parses DATE type start times as midnight local time", () => {
		// Arrange
		const calendar = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:paulholtom/printable-calendar
BEGIN:VEVENT
DTSTAMP;VALUE=DATE-TIME:20251024T060000Z
DTSTART;VALUE=DATE:20251025
DURATION:PT1H
SUMMARY:New Event
UID:some-static-uid
END:VEVENT
END:VCALENDAR`;

		// Act
		const result = parseIcsCalendarString(calendar);

		// Assert
		expect(result.events?.[0].start.date).toEqual(new Date(2025, 9, 25));
	});

	it("parses a valid ordinal display value", () => {
		// Arrange
		const calendar = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:paulholtom/printable-calendar
BEGIN:VEVENT
DTSTAMP;VALUE=DATE-TIME:20251024T060000Z
DTSTART;VALUE=DATE-TIME:20251025T181500Z
DURATION:PT1H
SUMMARY:New Event
UID:some-static-uid
X-PAULHOLTOM-PRINTABLECALENDAR-ORDINAL-DISPLAY:{"before":"Bob's","after":"Birthday"}
END:VEVENT
END:VCALENDAR`;

		// Act
		const result = parseIcsCalendarString(calendar);

		// Assert
		const expectedNonStandard: IcsNonStandard = {
			ordinalDisplay: {
				before: "Bob's",
				after: "Birthday",
			},
		};
		expect(result.events?.[0].nonStandard).toEqual(expectedNonStandard);
	});

	it.each([{ invalidValue: "{}" }, { invalidValue: "plain" }])(
		"throws an error if the ordinal display value is $invalidValue",
		({ invalidValue }) => {
			// Arrange
			const calendar = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:paulholtom/printable-calendar
BEGIN:VEVENT
DTSTAMP;VALUE=DATE-TIME:20251024T060000Z
DTSTART;VALUE=DATE-TIME:20251025T181500Z
DURATION:PT1H
SUMMARY:New Event
UID:some-static-uid
X-PAULHOLTOM-PRINTABLECALENDAR-ORDINAL-DISPLAY:${invalidValue}
END:VEVENT
END:VCALENDAR`;

			// Act
			const act = () => parseIcsCalendarString(calendar);

			// Assert
			expect(act).toThrowError();
		},
	);
});
