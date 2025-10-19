import {
	ICS_CALENDAR_COLLECTION_KEY,
	IcsCalendarCollection,
	getDefaultIcsCalendar,
	getDefaultIcsCalendarCollection,
	getDefaultIcsEvent,
} from "@/calendar-events";
import { fireEvent, render } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EventControls from "./event-controls.vue";

beforeEach(() => {
	vi.resetAllMocks();
	vi.useFakeTimers();
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

describe.each([{ closeButtonName: "Close" }, { closeButtonName: "Cancel" }])(
	"$closeButtonName button",
	({ closeButtonName }) => {
		it("closes the dialog without modifying the events when the %s button is clicked", async () => {
			// Arrange
			const calendar: IcsCalendarCollection =
				getDefaultIcsCalendarCollection();
			const wrapper = render(EventControls, {
				global: {
					provide: { [ICS_CALENDAR_COLLECTION_KEY]: calendar },
				},
			});
			const addButton = wrapper.getByRole("button", {
				name: "Add Event",
			});
			await fireEvent.click(addButton);

			// Act
			const closeButton = wrapper.getByRole("button", {
				name: closeButtonName,
			});
			await fireEvent.click(closeButton);

			// Assert
			expect(wrapper.queryByRole("dialog")).toBeNull();
			expect(calendar.default.events).toBeUndefined();
		});

		it("clears previously entered values if the dialog is closed then opened again", async () => {
			// Arrange
			vi.setSystemTime(new Date(2010, 5, 7));
			const calendar: IcsCalendarCollection =
				getDefaultIcsCalendarCollection();
			const wrapper = render(EventControls, {
				global: {
					provide: { [ICS_CALENDAR_COLLECTION_KEY]: calendar },
				},
			});
			const addButton = wrapper.getByRole("button", {
				name: "Add Event",
			});
			await fireEvent.click(addButton);

			// Act
			const dateInput = wrapper.getByLabelText("Date");
			await fireEvent.update(dateInput, "2010-05-03");
			const closeButton = wrapper.getByRole("button", {
				name: closeButtonName,
			});
			await fireEvent.click(closeButton);
			await fireEvent.click(addButton);

			// Assert
			expect(wrapper.getByLabelText<HTMLInputElement>("Date").value).toBe(
				"2010-06-07",
			);
		});
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
