import {
	ICS_CALENDAR_COLLECTION_KEY,
	getDefaultIcsCalendarCollection,
} from "@/calendar-events";
import { render } from "@testing-library/vue";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import EventEditDialog from "./event-edit-dialog.vue";

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
	const wrapper = render(EventEditDialog, {
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
