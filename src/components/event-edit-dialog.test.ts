import { getDefaultIcsEvent } from "@/calendar-events";
import { fireEvent, render, RenderResult, within } from "@testing-library/vue";
import { IcsEvent, IcsRecurrenceRule } from "ts-ics";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, PropType } from "vue";
import {
	EVENT_EDIT_DIALOG_ACTION,
	EventEditDialogResult,
} from "./event-edit-dialog-result";
import EventEditDialog from "./event-edit-dialog.vue";

const TestingComponent = defineComponent({
	components: { EventEditDialog },
	template: `<div>
		<button @click="create()">createNewEvent</button>
		<button @click="update()">updateEvent</button>
		<EventEditDialog ref="eventEditDialog" />
	</div>`,
	props: {
		event: Object as PropType<IcsEvent>,
	},
	emits: ["dialogResult"],
	methods: {
		async create() {
			this.$emit(
				"dialogResult",
				await this.$refs.eventEditDialog.createNewEvent(),
			);
		},
		async update() {
			const event = this.$props.event ?? getDefaultIcsEvent();
			this.$emit(
				"dialogResult",
				await this.$refs.eventEditDialog.updateEvent(event),
			);
		},
	},
});

beforeEach(() => {
	vi.resetAllMocks();
	vi.useFakeTimers();

	window.confirm = vi.fn();
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
	event?: IcsEvent,
): Promise<RenderResult> {
	// Arrange
	const wrapper = render(TestingComponent, { props: { event } });

	// Act
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
		const wrapper = await callComponentFunction(eventName);

		// Assert
		wrapper.getByRole("dialog");
	});

	it.each([{ buttonName: "Cancel" }, { buttonName: "Close" }])(
		"emits a cancel result and closes the dialog if the $buttonName button is clicked",
		async ({ buttonName }) => {
			// Arrange
			const wrapper = await callComponentFunction(eventName);

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

	it("creates a recurrance rule if the frequency is set", async () => {
		// Arrange
		const wrapper = await callComponentFunction(eventName);

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
});

describe("createNewEvent", () => {
	it("doesn't display the delete button", async () => {
		// Arrange
		const wrapper = await callComponentFunction("createNewEvent");

		// Act
		const dialog = wrapper.getByRole("dialog");

		// Assert
		expect(
			within(dialog).queryByRole("button", { name: "Delete" }),
		).toBeNull();
	});

	it("returns a new event and closes the dialog if the save button is clicked", async () => {
		// Arrange
		const wrapper = await callComponentFunction("createNewEvent");

		// Act
		const dialog = wrapper.getByRole("dialog");
		const saveButton = within(dialog).getByRole("button", { name: "Save" });
		await fireEvent.click(saveButton);

		// Assert
		const expectedEmit: EventEditDialogResult = {
			action: EVENT_EDIT_DIALOG_ACTION.SAVE,
			event: {
				...getDefaultIcsEvent(),
				summary: "",
				uid: expect.any(String),
			},
		};
		expect(wrapper.emitted("dialogResult")).toEqual([[expectedEmit]]);
		expect(wrapper.queryByRole("dialog")).toBeNull();
	});
});

describe("updateEvent", () => {
	it("displays the delete button", async () => {
		// Arrange
		const wrapper = await callComponentFunction("updateEvent");

		// Act
		const dialog = wrapper.getByRole("dialog");

		// Assert
		within(dialog).getByRole("button", { name: "Delete" });
	});

	it("returns the original event and closes the dialog if the save button is clicked immediately", async () => {
		// Arrange
		const event: IcsEvent = {
			...getDefaultIcsEvent(),
			summary: "Something different",
		};
		const wrapper = await callComponentFunction("updateEvent", event);

		// Act
		const dialog = wrapper.getByRole("dialog");
		const saveButton = within(dialog).getByRole("button", { name: "Save" });
		await fireEvent.click(saveButton);

		// Assert
		const expectedEmit: EventEditDialogResult = {
			action: EVENT_EDIT_DIALOG_ACTION.SAVE,
			event,
		};
		expect(wrapper.emitted("dialogResult")).toEqual([[expectedEmit]]);
		expect(wrapper.queryByRole("dialog")).toBeNull();
	});

	it("indicates the event should be deleted and closes the dialog if the delete button is clicked and it's confirmed", async () => {
		// Arrange
		vi.mocked(window.confirm).mockReturnValue(true);
		const wrapper = await callComponentFunction("updateEvent");

		// Act
		const dialog = wrapper.getByRole("dialog");
		const deleteButton = within(dialog).getByRole("button", {
			name: "Delete",
		});
		await fireEvent.click(deleteButton);

		// Assert
		const expectedEmit: EventEditDialogResult = {
			action: EVENT_EDIT_DIALOG_ACTION.DELETE,
		};
		expect(wrapper.emitted("dialogResult")).toEqual([[expectedEmit]]);
		expect(wrapper.queryByRole("dialog")).toBeNull();
	});

	it("doesn't return or close the dialog if the delete button is clicked but it's not confirmed", async () => {
		// Arrange
		vi.mocked(window.confirm).mockReturnValue(false);
		const wrapper = await callComponentFunction("updateEvent");

		// Act
		const dialog = wrapper.getByRole("dialog");
		const deleteButton = within(dialog).getByRole("button", {
			name: "Delete",
		});
		await fireEvent.click(deleteButton);

		// Assert
		expect(wrapper.emitted("dialogResult")).toBeUndefined();
		wrapper.getByRole("dialog");
	});

	it("removes recurrance rule if the frequency changed to undefined", async () => {
		// Arrange
		const wrapper = await callComponentFunction("updateEvent", {
			...getDefaultIcsEvent(),
			recurrenceRule: { frequency: "MONTHLY" },
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
		const wrapper = await callComponentFunction("updateEvent", {
			...getDefaultIcsEvent(),
			recurrenceRule: { frequency: "MONTHLY" },
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
});
