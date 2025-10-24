import { getDaysOfWeek } from "@/dates";
import { fireEvent, render } from "@testing-library/vue";
import { IcsWeekdayNumber } from "ts-ics";
import { beforeEach, expect, it, vi } from "vitest";
import DayOfWeekInput from "./day-of-week-input.vue";

vi.mock(import("@/dates"));

// Create a mock for the days of the week so test don't need to worry about different localization.
const DAYS_OF_WEEK = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

beforeEach(() => {
	vi.resetAllMocks();

	vi.mocked(getDaysOfWeek).mockReturnValue(DAYS_OF_WEEK);
});

it("displays a checkbox for each day of the week", () => {
	// Arrange
	// Act
	const wrapper = render(DayOfWeekInput, {
		props: { modelValue: [] },
	});

	// Assert
	DAYS_OF_WEEK.forEach((dayOfWeek) => {
		wrapper.getByRole("checkbox", { name: dayOfWeek });
	});
});

it("sets a selected value in the model value", async () => {
	// Arrange
	let modelValue: IcsWeekdayNumber[] = [];
	const wrapper = render(DayOfWeekInput, {
		props: {
			modelValue,
			"onUpdate:modelValue": (newValue) => {
				modelValue = newValue;
				wrapper.rerender({ modelValue });
			},
		},
	});

	// Act
	const dayCheck = wrapper.getByRole("checkbox", { name: DAYS_OF_WEEK[0] });
	await fireEvent.click(dayCheck);

	// Assert
	const expected: IcsWeekdayNumber[] = [{ day: "SU" }];
	expect(modelValue).toEqual(expected);
});

it("sets multiple selected values in the model value", async () => {
	// Arrange
	let modelValue: IcsWeekdayNumber[] = [];
	const wrapper = render(DayOfWeekInput, {
		props: {
			modelValue,
			"onUpdate:modelValue": (newValue) => {
				modelValue = newValue;
				wrapper.rerender({ modelValue });
			},
		},
	});

	// Act
	const fifthDay = wrapper.getByRole("checkbox", { name: DAYS_OF_WEEK[5] });
	await fireEvent.click(fifthDay);
	const secondDay = wrapper.getByRole("checkbox", { name: DAYS_OF_WEEK[2] });
	await fireEvent.click(secondDay);

	// Assert
	const expected: IcsWeekdayNumber[] = [{ day: "FR" }, { day: "TU" }];
	expect(modelValue).toEqual(expected);
});

it("removes already selected values", async () => {
	// Arrange
	let modelValue: IcsWeekdayNumber[] = [
		{ day: "SU" },
		{ day: "TU" },
		{ day: "WE" },
	];
	const wrapper = render(DayOfWeekInput, {
		props: {
			modelValue,
			"onUpdate:modelValue": (newValue) => {
				modelValue = newValue;
				wrapper.rerender({ modelValue });
			},
		},
	});

	// Act
	const secondDay = wrapper.getByRole("checkbox", { name: DAYS_OF_WEEK[2] });
	await fireEvent.click(secondDay);

	// Assert
	const expected: IcsWeekdayNumber[] = [{ day: "SU" }, { day: "WE" }];
	expect(modelValue).toEqual(expected);
});
