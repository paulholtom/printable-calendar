import {
	CALENDAR_EVENT_COLLECTION_KEY,
	CalendarEventCollection,
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
	const wrapper = render(EventControls);

	// Assert
	expect(wrapper.queryByRole("dialog")).toBeNull();
});

it("displays the dialog if the add button is clicked", async () => {
	// Arrange
	const wrapper = render(EventControls);

	// Act
	const addButton = wrapper.getByRole("button", { name: "Add Event" });
	await fireEvent.click(addButton);

	// Assert
	wrapper.getByRole("dialog");
});

it("closes the dialog without modifying the events when the dialog's close button is clicked", async () => {
	// Arrange
	const events: CalendarEventCollection = { default: [] };
	const wrapper = render(EventControls, {
		global: { provide: { [CALENDAR_EVENT_COLLECTION_KEY]: events } },
	});
	const addButton = wrapper.getByRole("button", { name: "Add Event" });
	await fireEvent.click(addButton);

	// Act
	const closeButton = wrapper.getByRole("button", { name: "Close" });
	await fireEvent.click(closeButton);

	// Assert
	expect(wrapper.queryByRole("dialog")).toBeNull();
	expect(events.default.length).toBe(0);
});
