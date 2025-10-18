import {
	CALENDAR_EVENT_COLLECTION_KEY,
	CalendarEventCollection,
	getDefaultCalendarEventCollection,
} from "@/calendar-events";
import { fireEvent, render } from "@testing-library/vue";
import { beforeEach, expect, it, vi } from "vitest";
import EventControls from "./event-controls.vue";

beforeEach(() => {
	vi.resetAllMocks();
});

it("doesn't display the dialog initially", () => {
	// Arrange
	// Act
	const wrapper = render(EventControls, {
		global: {
			provide: {
				[CALENDAR_EVENT_COLLECTION_KEY]:
					getDefaultCalendarEventCollection(),
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
				[CALENDAR_EVENT_COLLECTION_KEY]:
					getDefaultCalendarEventCollection(),
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
		const events: CalendarEventCollection = { default: [] };
		const wrapper = render(EventControls, {
			global: { provide: { [CALENDAR_EVENT_COLLECTION_KEY]: events } },
		});
		const addButton = wrapper.getByRole("button", { name: "Add Event" });
		await fireEvent.click(addButton);

		// Act
		const closeButton = wrapper.getByRole("button", { name: buttonName });
		await fireEvent.click(closeButton);

		// Assert
		expect(wrapper.queryByRole("dialog")).toBeNull();
		expect(events.default.length).toBe(0);
	},
);

it("creates a new event when the save button is clicked based on values entered", async () => {
	// Arrange
	const enteredDescription = "A description";
	const events: CalendarEventCollection = { default: [] };
	const wrapper = render(EventControls, {
		global: { provide: { [CALENDAR_EVENT_COLLECTION_KEY]: events } },
	});
	const addButton = wrapper.getByRole("button", { name: "Add Event" });
	await fireEvent.click(addButton);

	// Act
	const dateInput = wrapper.getByLabelText("Date");
	await fireEvent.update(dateInput, "2010-05-03");
	const descriptionInput = wrapper.getByLabelText("Description");
	await fireEvent.update(descriptionInput, enteredDescription);
	const saveButton = wrapper.getByRole("button", { name: "Save" });
	await fireEvent.click(saveButton);

	// Assert
	expect(wrapper.queryByRole("dialog")).toBeNull();
	const expectedResult: CalendarEventCollection = {
		default: [
			{
				firstOccurance: {
					year: 2010,
					month: 4,
					date: 3,
				},
				description: enteredDescription,
			},
		],
	};
	expect(events).toEqual(expectedResult);
});
