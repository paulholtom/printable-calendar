<template>
	<DialogLayout
		title="Event"
		v-model:is-open="dialogOpen"
		@close="cancel()"
		:include-close-button="true"
	>
		<AlertDialog ref="alertDialog" />
		<ConfirmDialog ref="confirmDialog" />
		<div class="input-and-label">
			<label :for="getInputId('calendar')">Calendar</label>
			<select v-model="calendar" :id="getInputId('calendar')">
				<option
					v-for="calendarName in calendarNames"
					:key="calendarName"
					:value="calendarName"
				>
					{{ calendarName }}
				</option>
			</select>
		</div>
		<div class="input-and-label">
			<input
				type="checkbox"
				:id="getInputId('displayWithOrdinal')"
				v-model="displayWithOrdinal"
			/>
			<label :for="getInputId('displayWithOrdinal')"
				>Display with ordinal</label
			>
		</div>
		<template
			v-if="isOrdinalDisplay(eventModel.nonStandard?.ordinalDisplay)"
		>
			<div class="input-and-label">
				<label :for="getInputId('beforeOrdinal')">Before ordinal</label>
				<input
					type="text"
					:id="getInputId('beforeOrdinal')"
					v-model="eventModel.nonStandard.ordinalDisplay.before"
				/>
			</div>
			<div class="input-and-label">
				<label :for="getInputId('afterOrdinal')">After ordinal</label>
				<input
					type="text"
					:id="getInputId('afterOrdinal')"
					v-model="eventModel.nonStandard.ordinalDisplay.after"
				/>
			</div>
		</template>
		<div class="input-and-label">
			<label :for="getInputId('date')">Date</label>
			<input :id="getInputId('date')" type="date" v-model="dateModel" />
		</div>
		<div class="input-and-label">
			<label :for="getInputId('summary')">Summary</label>
			<input
				:id="getInputId('summary')"
				type="text"
				placeholder="Enter a summary"
				v-model="eventModel.summary"
			/>
		</div>
		<div class="input-and-label">
			<input
				type="checkbox"
				v-model="allDayModel"
				:id="getInputId('all-day')"
			/>
			<label :for="getInputId('all-day')">All Day</label>
		</div>
		<div class="input-and-label" v-if="!allDayModel">
			<label :for="getInputId('time')">Time</label>
			<input type="time" v-model="timeModel" :id="getInputId('time')" />
		</div>
		<div class="input-and-label">
			<label :for="getInputId('frequency')">Repeats</label>
			<select :id="getInputId('frequency')" v-model="recurranceFrequency">
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
		<div class="monthly-type" v-if="recurranceFrequency === 'MONTHLY'">
			<div
				class="input-and-label"
				v-for="[value, label] in Object.entries(monthlyTypes)"
				:key="value"
			>
				<input
					type="radio"
					:id="getInputId(`monthly-type-${value}`)"
					:value="value"
					v-model="monthlyType"
				/>
				<label :for="getInputId(`monthly-type-${value}`)">{{
					label
				}}</label>
			</div>
		</div>
		<div
			class="input-and-label"
			v-if="eventModel.recurrenceRule?.byMonthday"
		>
			<label :for="getInputId('month-day')">Days of the Month</label>
			<select
				:id="getInputId('month-day')"
				multiple
				v-model="eventModel.recurrenceRule.byMonthday"
			>
				<option
					v-for="dayOfMonth in 31"
					:key="dayOfMonth"
					:value="dayOfMonth"
				>
					{{ dayOfMonth }}
				</option>
			</select>
		</div>
		<DayOfWeekInput
			v-if="eventModel.recurrenceRule?.byDay"
			v-model="eventModel.recurrenceRule.byDay"
			:specify-occurrence="
				eventModel.recurrenceRule.frequency === 'MONTHLY'
			"
		/>
		<template #footer>
			<button @click="cancel()">Cancel</button>
			<button v-if="allowDelete" @click="deleteEvent()">Delete</button>
			<button @click="save()">Save</button>
		</template>
	</DialogLayout>
</template>

<script setup lang="ts">
import {
	getDefaultIcsEvent,
	ICS_WEEKDAY_MAP,
	IcsEvent,
	IcsRecurrenceRuleFrequency,
} from "@/calendar-events";
import { computed, ref, toRaw, useTemplateRef } from "vue";
import AlertDialog from "./alert-dialog.vue";
import ConfirmDialog from "./confirm-dialog.vue";
import DayOfWeekInput from "./day-of-week-input.vue";
import DialogLayout from "./dialog-layout.vue";
import {
	EVENT_EDIT_DIALOG_ACTION,
	EventEditDialogOptions,
	EventEditDialogResult,
} from "./event-edit-dialog-types";
const alertDialog = useTemplateRef("alertDialog");
const confirmDialog = useTemplateRef("confirmDialog");
const dialogOpen = ref(false);

const calendar = ref<string>("");
const calendarNames = ref<string[]>([]);

const eventModel = ref<IcsEvent>(getDefaultIcsEvent());

const uniqueId = crypto.randomUUID();

function getInputId(input: string): string {
	return `${uniqueId}-${input}`;
}

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
		} else {
			eventModel.value.recurrenceRule.frequency = newValue;
		}
		if (newValue === "WEEKLY") {
			eventModel.value.recurrenceRule.byDay = [
				{ day: ICS_WEEKDAY_MAP[eventModel.value.start.date.getDay()] },
			];
		} else if (newValue === "MONTHLY") {
			monthlyType.value = "dayOfMonth";
		} else {
			eventModel.value.recurrenceRule.byDay = undefined;
		}
	},
});

const recurranceFrequencyOptions: {
	[Value in IcsRecurrenceRuleFrequency]?: string;
} = {
	DAILY: "Daily",
	WEEKLY: "Weekly",
	MONTHLY: "Monthly",
	YEARLY: "Annually",
};

const monthlyTypes = {
	dayOfMonth: "Day of month",
	other: "Weekday in month",
};

const monthlyType = computed<keyof typeof monthlyTypes>({
	get() {
		return eventModel.value.recurrenceRule?.byDay ? "other" : "dayOfMonth";
	},
	set(newValue) {
		// This code isn't reachable by any user interactions it's only here to satisfy typescript.
		/* c8 ignore start */
		if (!eventModel.value.recurrenceRule) {
			return;
		}
		/* c8 ignore stop */
		const startDate = eventModel.value.start.date;
		if (newValue === "dayOfMonth") {
			eventModel.value.recurrenceRule.byDay = undefined;
			eventModel.value.recurrenceRule.byMonthday = [startDate.getDate()];
			return;
		} else {
			eventModel.value.recurrenceRule.byMonthday = undefined;
			const occurrence = Math.ceil(startDate.getDate() / 7);
			eventModel.value.recurrenceRule.byDay = [
				{
					day: ICS_WEEKDAY_MAP[startDate.getDay()],
					occurrence: occurrence <= 4 ? occurrence : -1,
				},
			];
		}
	},
});

const displayWithOrdinal = computed({
	get() {
		return isOrdinalDisplay(eventModel.value.nonStandard?.ordinalDisplay);
	},
	set(newValue) {
		if (newValue) {
			if (!eventModel.value.nonStandard) {
				eventModel.value.nonStandard = {};
			}
			eventModel.value.nonStandard.ordinalDisplay = {
				before: "",
				after: "",
			};
		} else {
			if (eventModel.value.nonStandard) {
				eventModel.value.nonStandard.ordinalDisplay = undefined;
			}
		}
	},
});

type OrdinalDisplaySettings = {
	/**
	 * Text to display before the ordinal.
	 */
	before: string;
	/**
	 * Text to display after the ordinal.
	 */
	after: string;
};

function isOrdinalDisplay(obj: unknown): obj is OrdinalDisplaySettings {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"before" in obj &&
		typeof obj.before === "string" &&
		"after" in obj &&
		typeof obj.after === "string"
	);
}

function cancel() {
	promiseResolver?.({ action: EVENT_EDIT_DIALOG_ACTION.CANCEL });
	promiseResolver = undefined;

	dialogOpen.value = false;
}

async function deleteEvent() {
	if (
		await confirmDialog.value?.show(
			"Are you sure you want to delete this event?",
		)
	) {
		promiseResolver?.({ action: EVENT_EDIT_DIALOG_ACTION.DELETE });
		promiseResolver = undefined;
		dialogOpen.value = false;
	}
}

function save(): void {
	if (eventModel.value.summary.trim() === "") {
		alertDialog.value?.show("You need to enter a summary.");
		return;
	}

	promiseResolver?.({
		action: EVENT_EDIT_DIALOG_ACTION.SAVE,
		event: structuredClone(toRaw(eventModel.value)),
		calendarName: calendar.value,
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
function createNewEvent(
	options: EventEditDialogOptions,
): Promise<EventEditDialogResult> {
	allowDelete.value = false;
	return setupForEvent(options);
}

/**
 * Update an existing calendar event.
 *
 * @param event The event to be updated.
 * @returns Promise that resolves with the details of the user's actions in the dialog.
 */
function updateEvent(
	options: EventEditDialogOptions,
): Promise<EventEditDialogResult> {
	allowDelete.value = true;
	return setupForEvent(options);
}

function setupForEvent(
	options: EventEditDialogOptions,
): Promise<EventEditDialogResult> {
	eventModel.value = structuredClone(toRaw(options.event));

	calendar.value = options.calendarOptions.sourceCalendar;
	calendarNames.value = options.calendarOptions.calendarNames;

	const { resolve, promise } = Promise.withResolvers<EventEditDialogResult>();
	promiseResolver = resolve;

	dialogOpen.value = true;
	return promise;
}

defineExpose({ createNewEvent, updateEvent });
</script>
