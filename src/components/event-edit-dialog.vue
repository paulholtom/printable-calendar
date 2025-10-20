<template>
	<DialogLayout title="Event" v-model:is-open="dialogOpen" @close="cancel()">
		<div class="input-and-label">
			<label :for="dateId">Date</label>
			<input :id="dateId" type="date" v-model="date" />
		</div>
		<div class="input-and-label">
			<label :for="summaryId">Summary</label>
			<input
				:id="summaryId"
				type="text"
				placeholder="Enter a summary"
				v-model="summary"
			/>
		</div>
		<template #footer>
			<button @click="cancel()">Cancel</button>
			<button @click="deleteEvent()">Delete</button>
			<button @click="save()">Save</button>
		</template>
	</DialogLayout>
</template>

<script setup lang="ts">
import { getDefaultIcsEvent } from "@/calendar-events";
import { IcsEvent } from "ts-ics";
import { ref } from "vue";
import DialogLayout from "./dialog-layout.vue";
import {
	EVENT_EDIT_DIALOG_ACTION,
	EventEditDialogResult,
} from "./event-edit-dialog-result";

const dialogOpen = ref(false);

let promiseResolver: ((result: EventEditDialogResult) => void) | undefined =
	undefined;

const date = ref(``);
const dateId = crypto.randomUUID();

const summary = ref("");
const summaryId = crypto.randomUUID();

function cancel() {
	promiseResolver?.({ action: EVENT_EDIT_DIALOG_ACTION.CANCEL });
	promiseResolver = undefined;

	dialogOpen.value = false;
}

function deleteEvent() {
	if (confirm("Are you sure you want to delete this event?")) {
		promiseResolver?.({ action: EVENT_EDIT_DIALOG_ACTION.DELETE });
		promiseResolver = undefined;
		dialogOpen.value = false;
	}
}

function save(): void {
	promiseResolver?.({
		action: EVENT_EDIT_DIALOG_ACTION.SAVE,
		event: {
			...getDefaultIcsEvent(),
			start: { date: parseDate() },
			summary: summary.value,
		},
	});
	promiseResolver = undefined;

	dialogOpen.value = false;
}

function parseDate(): Date {
	return new Date(
		parseInt(date.value.substring(0, 4)),
		parseInt(date.value.substring(5, 7)) - 1,
		parseInt(date.value.substring(8, 10)),
	);
}

/**
 * Create a new calendar event.
 *
 * @returns Promise that resolves with the details of the user's actions in the dialog.
 */
function createNewEvent(): Promise<EventEditDialogResult> {
	return updateEvent({ ...getDefaultIcsEvent(), summary: "" });
}

/**
 * Update an existing calendar event.
 *
 * @param event The event to be updated.
 * @returns Promise that resolves with the details of the user's actions in the dialog.
 */
function updateEvent(event: IcsEvent): Promise<EventEditDialogResult> {
	const startDate = event.start.date;
	date.value = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, "0")}-${startDate.getDate().toString().padStart(2, "0")}`;

	summary.value = event.summary;

	const { resolve, promise } = Promise.withResolvers<EventEditDialogResult>();
	promiseResolver = resolve;

	dialogOpen.value = true;
	return promise;
}

defineExpose({ createNewEvent, updateEvent });
</script>
