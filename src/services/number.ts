/**
 * @param num The number to add a suffix to.
 * @returns The number with the appropriate ordinal suffix added.
 */
export function addOrdinalSuffix(num: number): string {
	if (num <= 0) return num.toString();

	switch (num % 100) {
		case 11:
		case 12:
		case 13:
			return num + "th";
	}

	switch (num % 10) {
		case 1:
			return num + "st";
		case 2:
			return num + "nd";
		case 3:
			return num + "rd";
		default:
			return num + "th";
	}
}
