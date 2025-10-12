import { DisplayDate } from "@/user-config";

export function getDateDisplayValue(date: DisplayDate): string {
	if (date.month === undefined) {
		return date.year.toString();
	}
	return new Date(date.year, date.month).toLocaleDateString(undefined, {
		year: "numeric",
		month: "long",
	});
}
