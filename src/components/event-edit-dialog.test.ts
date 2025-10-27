import { getDefaultIcsEvent } from "@/calendar-events";
import { getDaysOfWeek } from "@/dates";
import { fireEvent, render, RenderResult, within } from "@testing-library/vue";
import { IcsEvent, IcsRecurrenceRule } from "ts-ics";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, PropType } from "vue";
import {
	EVENT_EDIT_DIALOG_ACTION,
	EventEditDialogOptions,
	EventEditDialogResult,
} from "./event-edit-dialog-types";
import EventEditDialog from "./event-edit-dialog.vue";

vi.mock(import("@/dates"));

// Create a mock for the days of the week so tests don't need to worry about different localization.
const DAYS_OF_WEEK = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

const TestingComponent = defineComponent({
	components: { EventEditDialog },
	template: `<div>
		<button @click="create()">createNewEvent</button>
		<button @click="update()">updateEvent</button>
		<EventEditDialog ref="eventEditDialog" />
	</div>`,
	props: {
		options: {
			required: true,
			type: Object as PropType<EventEditDialogOptions>,
		},
	},
	emits: ["dialogResult"],
	methods: {
		async create() {
			this.$emit(
				"dialogResult",
				await this.$refs.eventEditDialog.createNewEvent(
					this.$props.options,
				),
			);
		},
		async update() {
			this.$emit(
				"dialogResult",
				await this.$refs.eventEditDialog.updateEvent(
					this.$props.options,
				),
			);
		},
	},
});

beforeEach(() => {
	vi.resetAllMocks();
	vi.useFakeTimers();

	vi.mocked(getDaysOfWeek).mockReturnValue(DAYS_OF_WEEK);
});

afterEach(() => {
	vi.useRealTimers();
});

it("doesn't display the dialog initially", () => {
	// Arrange
	// Act
	const wrapper = render(EventEditDialog);

	// Assert
	expect(wrapper.queryByRole("dialog")).toBeNull();
});

async function callComponentFunction(
	functionName: "createNewEvent" | "updateEvent",
	options: EventEditDialogOptions,
): Promise<RenderResult> {
	const wrapper = render(TestingComponent, { props: { options } });

	const createButton = wrapper.getByRole("button", { name: functionName });
	await fireEvent.click(createButton);

	return wrapper;
}

function getEmittedEvent(wrapper: RenderResult): IcsEvent {
	const result = getEmittedResult(wrapper);
	if (result.action !== EVENT_EDIT_DIALOG_ACTION.SAVE) {
		expect.fail("Emitted result was not a save.");
	}
	return result.event;
}

function getEmittedResult(wrapper: RenderResult): EventEditDialogResult {
	const dialogResultEmit = wrapper.emitted("dialogResult");
	if (
		!Array.isArray(dialogResultEmit) ||
		dialogResultEmit.length !== 1 ||
		!Array.isArray(dialogResultEmit[0]) ||
		dialogResultEmit[0].length !== 1 ||
		!isEventEditDialogResult(dialogResultEmit[0][0])
	) {
		expect.fail("Emitted result couldn't be found.");
	}

	return dialogResultEmit[0][0];
}

function isEventEditDialogResult(obj: unknown): obj is EventEditDialogResult {
	return !!obj && typeof obj == "object" && "action" in obj;
}

describe.each([
	{ eventName: "createNewEvent" as const },
	{ eventName: "updateEvent" as const },
])("$eventName", ({ eventName }) => {
	it("displays the dialog", async () => {
		// Arrange
		// Act
		const wrapper = await callComponentFunction(eventName, {
			event: getDefaultIcsEvent(),
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Assert
		wrapper.getByRole("dialog");
	});

	it.each([{ buttonName: "Cancel" }, { buttonName: "Close" }])(
		"emits a cancel result and closes the dialog if the $buttonName button is clicked",
		async ({ buttonName }) => {
			// Arrange
			const wrapper = await callComponentFunction(eventName, {
				event: getDefaultIcsEvent(),
				calendarOptions: {
					sourceCalendar: "some-calendar",
					calendarNames: ["some-calendar"],
				},
			});

			// Act
			const dialog = wrapper.getByRole("dialog");
			const button = within(dialog).getByRole("button", {
				name: buttonName,
			});
			await fireEvent.click(button);

			// Assert
			const expectedEmit: EventEditDialogResult = {
				action: EVENT_EDIT_DIALOG_ACTION.CANCEL,
			};
			expect(wrapper.emitted("dialogResult")).toEqual([[expectedEmit]]);
			expect(wrapper.queryByRole("dialog")).toBeNull();
		},
	);

	it("displays an alert and doesn't close the dialog if the save button is clicked without a summary specified", async () => {
		// Arrange
		const event: IcsEvent = { ...getDefaultIcsEvent(), summary: "" };
		const wrapper = await callComponentFunction(eventName, {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		const saveButton = within(dialog).getByRole("button", { name: "Save" });
		await fireEvent.click(saveButton);
		await fireEvent.click(
			within(wrapper.getByRole("alertdialog")).getByRole("button", {
				name: "OK",
			}),
		);

		// Assert
		expect(wrapper.emitted("dialogResult")).toBeUndefined();
		wrapper.getByRole("dialog");
	});

	it("returns the event and closes the dialog if the save button is clicked after specifying a summary", async () => {
		// Arrange
		const specifiedSummary = "New Summary";
		const calendarName = "some-calendar";
		const originalEvent: IcsEvent = getDefaultIcsEvent();
		const wrapper = await callComponentFunction(eventName, {
			event: originalEvent,
			calendarOptions: {
				sourceCalendar: calendarName,
				calendarNames: [calendarName],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		const summaryInput = within(dialog).getByLabelText("Summary");
		await fireEvent.update(summaryInput, specifiedSummary);
		const saveButton = within(dialog).getByRole("button", { name: "Save" });
		await fireEvent.click(saveButton);

		// Assert
		const expectedEmit: EventEditDialogResult = {
			action: EVENT_EDIT_DIALOG_ACTION.SAVE,
			calendarName,
			event: {
				...originalEvent,
				summary: specifiedSummary,
			},
		};
		expect(wrapper.emitted("dialogResult")).toEqual([[expectedEmit]]);
		expect(wrapper.queryByRole("dialog")).toBeNull();
	});

	it("returns the original event and closes the dialog if the save button is clicked immediately", async () => {
		// Arrange
		const calendarName = "some-calendar";
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			summary: "Something different",
		};
		const wrapper = await callComponentFunction(eventName, {
			event,
			calendarOptions: {
				sourceCalendar: calendarName,
				calendarNames: [calendarName],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		const saveButton = within(dialog).getByRole("button", { name: "Save" });
		await fireEvent.click(saveButton);

		// Assert
		const expectedEmit: EventEditDialogResult = {
			action: EVENT_EDIT_DIALOG_ACTION.SAVE,
			calendarName,
			event,
		};
		expect(wrapper.emitted("dialogResult")).toEqual([[expectedEmit]]);
		expect(wrapper.queryByRole("dialog")).toBeNull();
	});

	it("creates a recurrance rule if the frequency is set", async () => {
		// Arrange
		const wrapper = await callComponentFunction(eventName, {
			event: getDefaultIcsEvent(),
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		const frequencyInput = within(dialog).getByLabelText("Repeats");
		await fireEvent.update(frequencyInput, "DAILY");
		const saveButton = within(dialog).getByRole("button", { name: "Save" });
		await fireEvent.click(saveButton);

		// Assert
		const expectedResult: IcsRecurrenceRule = {
			frequency: "DAILY",
		};
		expect(getEmittedEvent(wrapper).recurrenceRule).toEqual(expectedResult);
	});

	it("updates the date, preserving the time if the date input is changed", async () => {
		// Arrange
		const date = new Date(2025, 10, 4, 13, 6);
		const newYear = 2027;
		const newMonth = 8;
		const newDate = 22;
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			start: { date, type: "DATE-TIME" },
		};
		const wrapper = await callComponentFunction(eventName, {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		const dateInput = within(dialog).getByLabelText("Date");
		await fireEvent.update(
			dateInput,
			`${newYear}-${(newMonth + 1).toString().padStart(2, "0")}-${newDate.toString().padEnd(2, "0")}`,
		);
		const saveButton = within(dialog).getByRole("button", {
			name: "Save",
		});
		await fireEvent.click(saveButton);

		// Assert
		expect(getEmittedEvent(wrapper).start.date).toEqual(
			new Date(
				newYear,
				newMonth,
				newDate,
				date.getHours(),
				date.getMinutes(),
			),
		);
	});

	it.each<{
		initialValue: "DATE" | "DATE-TIME" | undefined;
		expectedValue: "DATE" | "DATE-TIME";
	}>([
		{ initialValue: "DATE", expectedValue: "DATE-TIME" },
		{ initialValue: undefined, expectedValue: "DATE-TIME" },
		{ initialValue: "DATE-TIME", expectedValue: "DATE" },
	])(
		"toggles the start date type from $initialValue to $expectedValue if the all day checkbox is clicked",
		async ({ initialValue, expectedValue }) => {
			// Arrange
			const event: IcsEvent = {
				...getDefaultIcsEvent(),
				start: { date: new Date(), type: initialValue },
			};
			const wrapper = await callComponentFunction(eventName, {
				event,
				calendarOptions: {
					sourceCalendar: "some-calendar",
					calendarNames: ["some-calendar"],
				},
			});

			// Act
			const dialog = wrapper.getByRole("dialog");
			const allDayCheckbox = within(dialog).getByRole("checkbox", {
				name: "All Day",
			});
			await fireEvent.click(allDayCheckbox);
			const saveButton = within(dialog).getByRole("button", {
				name: "Save",
			});
			await fireEvent.click(saveButton);

			// Assert
			expect(getEmittedEvent(wrapper).start.type).toBe(expectedValue);
		},
	);

	it("clears the time if the all day check box is toggled off", async () => {
		// Arrange
		const date = new Date(2025, 6, 7, 10, 13);
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			start: { date, type: "DATE-TIME" },
		};
		const wrapper = await callComponentFunction(eventName, {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		const allDayCheckbox = within(dialog).getByRole("checkbox", {
			name: "All Day",
		});
		await fireEvent.click(allDayCheckbox);
		const saveButton = within(dialog).getByRole("button", {
			name: "Save",
		});
		await fireEvent.click(saveButton);

		// Assert
		expect(getEmittedEvent(wrapper).start.date).toEqual(
			new Date(date.getFullYear(), date.getMonth(), date.getDate()),
		);
	});

	it("doesn't display the time input if the start date is of type DATE", async () => {
		// Arrange
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			start: {
				date: new Date(),
				type: "DATE",
			},
		};
		const wrapper = await callComponentFunction(eventName, {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");

		// Assert
		expect(within(dialog).queryByLabelText("Time")).toBeNull();
	});

	it("displays the time input if the start date is of type DATE-TIME", async () => {
		// Arrange
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			start: { date: new Date(), type: "DATE-TIME" },
		};
		const wrapper = await callComponentFunction(eventName, {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");

		// Assert
		within(dialog).getByLabelText("Time");
	});

	it("updates the time if the time input is changed", async () => {
		// Arrange
		const date = new Date(2025, 6, 7, 10, 13);
		const newHour = 12;
		const newMinute = 54;
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			start: { date, type: "DATE-TIME" },
		};
		const wrapper = await callComponentFunction(eventName, {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		const timeInput = within(dialog).getByLabelText("Time");
		await fireEvent.update(
			timeInput,
			`${newHour.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`,
		);
		const saveButton = within(dialog).getByRole("button", {
			name: "Save",
		});
		await fireEvent.click(saveButton);

		// Assert
		expect(getEmittedEvent(wrapper).start.date).toEqual(
			new Date(
				date.getFullYear(),
				date.getMonth(),
				date.getDate(),
				newHour,
				newMinute,
			),
		);
	});

	it("removes recurrance rule if the frequency changed to undefined", async () => {
		// Arrange
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			recurrenceRule: { frequency: "MONTHLY" },
		};
		const wrapper = await callComponentFunction(eventName, {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		const frequencyInput = within(dialog).getByLabelText("Repeats");
		await fireEvent.update(frequencyInput, undefined);
		const saveButton = within(dialog).getByRole("button", { name: "Save" });
		await fireEvent.click(saveButton);

		// Assert
		expect(getEmittedEvent(wrapper).recurrenceRule).toBeUndefined();
	});

	it("updates the recurrence frequency from one value to another", async () => {
		// Arrange
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			recurrenceRule: { frequency: "MONTHLY" },
		};
		const wrapper = await callComponentFunction(eventName, {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		const frequencyInput = within(dialog).getByLabelText("Repeats");
		await fireEvent.update(frequencyInput, "YEARLY");
		const saveButton = within(dialog).getByRole("button", { name: "Save" });
		await fireEvent.click(saveButton);

		// Assert
		const expectedResult: IcsRecurrenceRule = {
			frequency: "YEARLY",
		};
		expect(getEmittedEvent(wrapper).recurrenceRule).toEqual(expectedResult);
	});

	it("sets the by day value of the recurrence rule when switching to WEEKLY frequency", async () => {
		// Arrange
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			start: { date: new Date(2010, 5, 7) },
			recurrenceRule: { frequency: "MONTHLY" },
		};
		const wrapper = await callComponentFunction(eventName, {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		const frequencyInput = within(dialog).getByLabelText("Repeats");
		await fireEvent.update(frequencyInput, "WEEKLY");
		const saveButton = within(dialog).getByRole("button", { name: "Save" });
		await fireEvent.click(saveButton);

		// Assert
		const expectedResult: IcsRecurrenceRule = {
			frequency: "WEEKLY",
			byDay: [
				{
					day: "MO",
				},
			],
		};
		expect(getEmittedEvent(wrapper).recurrenceRule).toEqual(expectedResult);
	});

	it("updates the by day value to match selected days of the week", async () => {
		// Arrange
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			recurrenceRule: { frequency: "WEEKLY", byDay: [{ day: "SA" }] },
		};
		const wrapper = await callComponentFunction(eventName, {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		await fireEvent.click(within(dialog).getByLabelText("Saturday"));
		await fireEvent.click(within(dialog).getByLabelText("Monday"));
		const saveButton = within(dialog).getByRole("button", { name: "Save" });
		await fireEvent.click(saveButton);

		// Assert
		const expectedResult: IcsRecurrenceRule = {
			frequency: "WEEKLY",
			byDay: [
				{
					day: "MO",
				},
			],
		};
		expect(getEmittedEvent(wrapper).recurrenceRule).toEqual(expectedResult);
	});

	it("defaults to repeating on the same day of the month as the start date when changing to a monthly frequency", async () => {
		// Arrange
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			start: {
				date: new Date(2025, 9, 25),
			},
		};
		const wrapper = await callComponentFunction(eventName, {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		await fireEvent.update(
			within(dialog).getByLabelText("Repeats"),
			"MONTHLY",
		);
		await fireEvent.click(
			within(dialog).getByRole("button", { name: "Save" }),
		);

		// Assert
		const expectedResult: IcsRecurrenceRule = {
			frequency: "MONTHLY",
			byMonthday: [25],
		};
		expect(getEmittedEvent(wrapper).recurrenceRule).toEqual(expectedResult);
	});

	it("defaults to repeating on the same day of the month as the start date when changing from repeating monthly by weekday to repeating by days of the month", async () => {
		// Arrange
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			start: {
				date: new Date(2025, 9, 25),
			},
			recurrenceRule: {
				frequency: "MONTHLY",
				byDay: [{ day: "TH", occurrence: 1 }],
			},
		};
		const wrapper = await callComponentFunction(eventName, {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		await fireEvent.click(within(dialog).getByLabelText("Day of month"));
		await fireEvent.click(
			within(dialog).getByRole("button", { name: "Save" }),
		);

		// Assert
		const expectedResult: IcsRecurrenceRule = {
			frequency: "MONTHLY",
			byMonthday: [25],
		};
		expect(getEmittedEvent(wrapper).recurrenceRule).toEqual(expectedResult);
	});

	it("defaults to repeating on the same weekday as the start date when repeating monthly if switching from repeating by day of month to by weekdays", async () => {
		// Arrange
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			start: {
				date: new Date(2025, 9, 25),
			},
			recurrenceRule: {
				frequency: "MONTHLY",
				byMonthday: [25],
			},
		};
		const wrapper = await callComponentFunction(eventName, {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		await fireEvent.click(
			within(dialog).getByLabelText("Weekday in month"),
		);
		await fireEvent.click(
			within(dialog).getByRole("button", { name: "Save" }),
		);

		// Assert
		const expectedResult: IcsRecurrenceRule = {
			frequency: "MONTHLY",
			byDay: [{ day: "SA", occurrence: 4 }],
		};
		expect(getEmittedEvent(wrapper).recurrenceRule).toEqual(expectedResult);
	});

	it("defaults to repeating on the last weekday as if the start date > 28 when repeating monthly if switching from repeating by day of month to by weekdays", async () => {
		// Arrange
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			start: {
				date: new Date(2025, 9, 29),
			},
			recurrenceRule: {
				frequency: "MONTHLY",
				byMonthday: [29],
			},
		};
		const wrapper = await callComponentFunction(eventName, {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		await fireEvent.click(
			within(dialog).getByLabelText("Weekday in month"),
		);
		await fireEvent.click(
			within(dialog).getByRole("button", { name: "Save" }),
		);

		// Assert
		const expectedResult: IcsRecurrenceRule = {
			frequency: "MONTHLY",
			byDay: [{ day: "WE", occurrence: -1 }],
		};
		expect(getEmittedEvent(wrapper).recurrenceRule).toEqual(expectedResult);
	});

	it("can select different days when repeating monthly by day of the month", async () => {
		// Arrange
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			start: {
				date: new Date(2025, 9, 22),
			},
			recurrenceRule: {
				frequency: "MONTHLY",
				byMonthday: [22],
			},
		};
		const wrapper = await callComponentFunction(eventName, {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		await fireEvent.update(
			within(dialog).getByLabelText("Days of the Month"),
			"29",
		);
		await fireEvent.click(
			within(dialog).getByRole("button", { name: "Save" }),
		);

		// Assert
		const expectedResult: IcsRecurrenceRule = {
			frequency: "MONTHLY",
			byMonthday: [29],
		};
		expect(getEmittedEvent(wrapper).recurrenceRule).toEqual(expectedResult);
	});
});

describe("createNewEvent", () => {
	it("doesn't display the delete button", async () => {
		// Arrange
		const event: IcsEvent = getDefaultIcsEvent();
		const wrapper = await callComponentFunction("createNewEvent", {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");

		// Assert
		expect(
			within(dialog).queryByRole("button", { name: "Delete" }),
		).toBeNull();
	});
});

describe("updateEvent", () => {
	it("displays the delete button", async () => {
		// Arrange
		const event: IcsEvent = getDefaultIcsEvent();
		const wrapper = await callComponentFunction("updateEvent", {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");

		// Assert
		within(dialog).getByRole("button", { name: "Delete" });
	});

	it("indicates the event should be deleted and closes the dialog if the delete button is clicked and it's confirmed", async () => {
		// Arrange
		const event = getDefaultIcsEvent();
		const wrapper = await callComponentFunction("updateEvent", {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		const deleteButton = within(dialog).getByRole("button", {
			name: "Delete",
		});
		await fireEvent.click(deleteButton);
		await fireEvent.click(
			within(wrapper.getByRole("alertdialog")).getByRole("button", {
				name: "Yes",
			}),
		);

		// Assert
		const expectedEmit: EventEditDialogResult = {
			action: EVENT_EDIT_DIALOG_ACTION.DELETE,
		};
		expect(wrapper.emitted("dialogResult")).toEqual([[expectedEmit]]);
		expect(wrapper.queryByRole("dialog")).toBeNull();
	});

	it("doesn't return or close the dialog if the delete button is clicked but it's not confirmed", async () => {
		// Arrange
		const event = getDefaultIcsEvent();
		const wrapper = await callComponentFunction("updateEvent", {
			event,
			calendarOptions: {
				sourceCalendar: "some-calendar",
				calendarNames: ["some-calendar"],
			},
		});

		// Act
		const dialog = wrapper.getByRole("dialog");
		const deleteButton = within(dialog).getByRole("button", {
			name: "Delete",
		});
		await fireEvent.click(deleteButton);
		await fireEvent.click(
			within(wrapper.getByRole("alertdialog")).getByRole("button", {
				name: "No",
			}),
		);

		// Assert
		expect(wrapper.emitted("dialogResult")).toBeUndefined();
		wrapper.getByRole("dialog");
	});
});
