<template>
	<DialogLayout title="Event" v-model:is-open="dialogOpen" @close="cancel()">
		<div class="input-and-label">
			<label :for="dateId">Date</label>
			<input :id="dateId" type="date" v-model="dateModel" />
		</div>
		<div class="input-and-label">
			<label :for="summaryId">Summary</label>
			<input
				:id="summaryId"
				type="text"
				placeholder="Enter a summary"
				v-model="eventModel.summary"
			/>
		</div>
		<div class="input-and-label">
			<input type="checkbox" v-model="allDayModel" :id="allDayId" />
			<label :for="allDayId">All Day</label>
		</div>
		<div class="input-and-label" v-if="!allDayModel">
			<label :for="timeId">Time</label>
			<input type="time" v-model="timeModel" :id="timeId" />
		</div>
		<div class="input-and-label">
			<label :for="recurranceFrequencyId">Repeats</label>
			<select :id="recurranceFrequencyId" v-model="recurranceFrequency">
				<option :value="undefined">Never</option>
				<option
					v-for="[optionValue, optionText] in Object.entries(
						recurranceFrequencyOptions,
					)"
					:key="optionValue"
					:value="optionValue"
				>
					{{ optionText }}
				</option>
			</select>
		</div>
		<template #footer>
			<button @click="cancel()">Cancel</button>
			<button v-if="allowDelete" @click="deleteEvent()">Delete</button>
			<button @click="save()">Save</button>
		</template>
	</DialogLayout>
</template>

<script setup lang="ts">
import { getDefaultIcsEvent } from "@/calendar-events";
import { IcsEvent, IcsRecurrenceRuleFrequency } from "ts-ics";
import { computed, ref, toRaw } from "vue";
import DialogLayout from "./dialog-layout.vue";
import {
	EVENT_EDIT_DIALOG_ACTION,
	EventEditDialogResult,
} from "./event-edit-dialog-result";

const dialogOpen = ref(false);

const eventModel = ref<IcsEvent>(getDefaultIcsEvent());

let promiseResolver: ((result: EventEditDialogResult) => void) | undefined =
	undefined;

const dateModel = computed({
	get() {
		const startDate = eventModel.value.start.date;
		return `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, "0")}-${startDate.getDate().toString().padStart(2, "0")}`;
	},
	set(newValue) {
		eventModel.value.start.date = new Date(
			parseInt(newValue.substring(0, 4)),
			parseInt(newValue.substring(5, 7)) - 1,
			parseInt(newValue.substring(8, 10)),
			eventModel.value.start.date.getHours(),
			eventModel.value.start.date.getMinutes(),
		);
	},
});
const dateId = crypto.randomUUID();

const allDayModel = computed({
	get() {
		return eventModel.value.start.type !== "DATE-TIME";
	},
	set(newValue) {
		eventModel.value.start.type = newValue ? "DATE" : "DATE-TIME";

		if (newValue) {
			const startDate = eventModel.value.start.date;
			eventModel.value.start.date = new Date(
				startDate.getFullYear(),
				startDate.getMonth(),
				startDate.getDate(),
			);
		}
	},
});
const allDayId = crypto.randomUUID();

const timeModel = computed({
	get() {
		const startDate = eventModel.value.start.date;
		return `${startDate.getHours().toString().padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")}`;
	},
	set(newValue) {
		const startDate = eventModel.value.start.date;
		eventModel.value.start.date = new Date(
			startDate.getFullYear(),
			startDate.getMonth(),
			startDate.getDate(),
			parseInt(newValue.substring(0, 2)),
			parseInt(newValue.substring(3, 5)),
		);
	},
});
const timeId = crypto.randomUUID();

const summaryId = crypto.randomUUID();

const recurranceFrequency = computed({
	get() {
		return eventModel.value.recurrenceRule?.frequency;
	},
	set(newValue) {
		if (!newValue) {
			eventModel.value.recurrenceRule = undefined;
			return;
		}
		if (!eventModel.value.recurrenceRule) {
			eventModel.value.recurrenceRule = { frequency: newValue };
			return;
		}
		eventModel.value.recurrenceRule.frequency = newValue;
	},
});
const recurranceFrequencyId = crypto.randomUUID();
const recurranceFrequencyOptions: {
	[Value in IcsRecurrenceRuleFrequency]?: string;
} = {
	DAILY: "Daily",
	WEEKLY: "Weekly",
	MONTHLY: "Monthly",
	YEARLY: "Annually",
};

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
		event: structuredClone(toRaw(eventModel.value)),
	});
	promiseResolver = undefined;

	dialogOpen.value = false;
}

const allowDelete = ref(false);

/**
 * Create a new calendar event.
 *
 * @returns Promise that resolves with the details of the user's actions in the dialog.
 */
function createNewEvent(): Promise<EventEditDialogResult> {
	allowDelete.value = false;
	return setupForEvent({ ...getDefaultIcsEvent(), summary: "" });
}

/**
 * Update an existing calendar event.
 *
 * @param event The event to be updated.
 * @returns Promise that resolves with the details of the user's actions in the dialog.
 */
function updateEvent(event: IcsEvent): Promise<EventEditDialogResult> {
	allowDelete.value = true;
	return setupForEvent(event);
}

function setupForEvent(event: IcsEvent): Promise<EventEditDialogResult> {
	eventModel.value = structuredClone(toRaw(event));

	const { resolve, promise } = Promise.withResolvers<EventEditDialogResult>();
	promiseResolver = resolve;

	dialogOpen.value = true;
	return promise;
}

defineExpose({ createNewEvent, updateEvent });
</script>
