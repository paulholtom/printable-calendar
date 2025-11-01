import { beforeEach, describe, expect, it, vi } from "vitest";
import { addOrdinalSuffix } from "./number";

beforeEach(() => {
	vi.resetAllMocks();
});

describe(addOrdinalSuffix, () => {
	it.each([
		{ num: -1, expectedResult: "-1" },
		{ num: 0, expectedResult: "0" },
		{ num: 1, expectedResult: "1st" },
		{ num: 2, expectedResult: "2nd" },
		{ num: 3, expectedResult: "3rd" },
		{ num: 4, expectedResult: "4th" },
		{ num: 5, expectedResult: "5th" },
		{ num: 11, expectedResult: "11th" },
		{ num: 12, expectedResult: "12th" },
		{ num: 13, expectedResult: "13th" },
		{ num: 14, expectedResult: "14th" },
		{ num: 21, expectedResult: "21st" },
		{ num: 22, expectedResult: "22nd" },
		{ num: 23, expectedResult: "23rd" },
		{ num: 24, expectedResult: "24th" },
	])(
		"returns $expectedResult for a value of $num",
		({ num, expectedResult }) => {
			// Arrange
			// Act
			const result = addOrdinalSuffix(num);

			// Assert
			expect(result).toBe(expectedResult);
		},
	);
});
