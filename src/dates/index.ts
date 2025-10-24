import z from "zod";

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

/**
 * Get the days of the week.
 */
export function getDaysOfWeek(
	format: Exclude<Intl.DateTimeFormatOptions["weekday"], undefined>,
): typeof daysOfWeek {
	const daysOfWeek: string[] = [];

	/**
	 * This is an arbitrary date that is a Sunday.
	 */
	const dayOfWeek = new Date(2023, 0, 1);

	for (let i = 0; i < 7; i++) {
		dayOfWeek.setDate(1 + i);
		daysOfWeek.push(
			dayOfWeek.toLocaleDateString(undefined, { weekday: format }),
		);
	}

	return daysOfWeek;
}
