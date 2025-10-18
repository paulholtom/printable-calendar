import {
	ICS_CALENDAR_COLLECTION_KEY,
	IcsCalendarCollection,
	getDefaultIcsCalendar,
	getDefaultIcsCalendarCollection,
	getDefaultIcsEvent,
} from "@/calendar-events";
import { fireEvent, render } from "@testing-library/vue";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import EventControls from "./event-controls.vue";

beforeEach(() => {
	vi.resetAllMocks();
	vi.useFakeTimers();
	vi.setSystemTime(new Date(2010, 5, 7));
});

afterEach(() => {
	vi.useRealTimers();
});

it("doesn't display the dialog initially", () => {
	// Arrange
	// Act
	const wrapper = render(EventControls, {
		global: {
			provide: {
				[ICS_CALENDAR_COLLECTION_KEY]:
					getDefaultIcsCalendarCollection(),
			},
		},
	});

	// Assert
	expect(wrapper.queryByRole("dialog")).toBeNull();
});

it("displays the dialog if the add button is clicked", async () => {
	// Arrange
	const wrapper = render(EventControls, {
		global: {
			provide: {
				[ICS_CALENDAR_COLLECTION_KEY]:
					getDefaultIcsCalendarCollection(),
			},
		},
	});

	// Act
	const addButton = wrapper.getByRole("button", { name: "Add Event" });
	await fireEvent.click(addButton);

	// Assert
	wrapper.getByRole("dialog");
});

it.each(["Close", "Cancel"])(
	"closes the dialog without modifying the events when the %s button is clicked",
	async (buttonName) => {
		// Arrange
		const calendar: IcsCalendarCollection =
			getDefaultIcsCalendarCollection();
		const wrapper = render(EventControls, {
			global: { provide: { [ICS_CALENDAR_COLLECTION_KEY]: calendar } },
		});
		const addButton = wrapper.getByRole("button", { name: "Add Event" });
		await fireEvent.click(addButton);

		// Act
		const closeButton = wrapper.getByRole("button", { name: buttonName });
		await fireEvent.click(closeButton);

		// Assert
		expect(wrapper.queryByRole("dialog")).toBeNull();
		expect(calendar.default.events).toBeUndefined();
	},
);

it("creates a new event when the save button is clicked based on values entered", async () => {
	// Arrange
	const enteredSummary = "A Summary";
	const events: IcsCalendarCollection = getDefaultIcsCalendarCollection();
	const wrapper = render(EventControls, {
		global: { provide: { [ICS_CALENDAR_COLLECTION_KEY]: events } },
	});
	const addButton = wrapper.getByRole("button", { name: "Add Event" });
	await fireEvent.click(addButton);

	// Act
	const dateInput = wrapper.getByLabelText("Date");
	await fireEvent.update(dateInput, "2010-05-03");
	const summaryInput = wrapper.getByLabelText("Summary");
	await fireEvent.update(summaryInput, enteredSummary);
	const saveButton = wrapper.getByRole("button", { name: "Save" });
	await fireEvent.click(saveButton);

	// Assert
	expect(wrapper.queryByRole("dialog")).toBeNull();
	const expectedResult: IcsCalendarCollection = {
		...getDefaultIcsCalendarCollection(),
		default: {
			...getDefaultIcsCalendar(),
			events: [
				{
					...getDefaultIcsEvent(),
					start: {
						date: new Date(2010, 4, 3),
					},
					summary: enteredSummary,
					uid: expect.stringContaining(
						"@paulholtom/printable-calendar",
					),
				},
			],
		},
	};
	expect(events).toEqual(expectedResult);
});
