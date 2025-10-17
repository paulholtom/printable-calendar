import z from "zod";

/**
 * Just a date, without time or timezones.
 */
export const dateOnly = z.object({
	/**
	 * The day of the month.
	 */
	date: z.number(),
	/**
	 * The month, using javascript conventions of 0 is January.
	 */
	month: z.number(),
	/**
	 * The year.
	 */
	year: z.number(),
});

/**
 * Just a date, without time or timezones.
 */
export type DateOnly = z.infer<typeof dateOnly>;

/**
 * @param date1 The first date to compare.
 * @param date2 The second date to compare.
 * @returns True if the dates are equal.
 */
export function datesEqual(date1: DateOnly, date2: DateOnly): boolean {
	return (
		date1.date === date2.date &&
		date1.month === date2.month &&
		date1.year === date2.year
	);
}

/**
 * The month/year to be shown.
 */
export const displayDate = z.object({
	/**
	 * The month, if not included a whole year will show.
	 */
	month: z.number().optional(),
	/**
	 * The year.
	 */
	year: z.number(),
});

/**
 * The month/year to be shown.
 */
export type DisplayDate = z.infer<typeof displayDate>;

/**
 * @param date The display date.
 * @returns A string representation to display to the user.
 */
export function getDateDisplayValue(date: DisplayDate): string {
	if (date.month === undefined) {
		return date.year.toString();
	}
	return new Date(date.year, date.month).toLocaleDateString(undefined, {
		year: "numeric",
		month: "long",
	});
}
