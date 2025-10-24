<template>
	<div class="app">
		<template v-if="errors.length > 0">
			<p>Encountered unrecoverable errors:</p>
			<pre v-for="(error, index) in errors" :key="index">{{
				displayError(error)
			}}</pre>
		</template>
		<template v-else-if="allReady">
			<nav class="controls">
				<EventEditDialog ref="eventEditDialog" />
				<PrintControls />
				<NavigationControls />
				<button @click="addEvent()">Add Event</button>
			</nav>
			<main class="calendar-display">
				<CalendarMonth
					v-if="configFile.displayDate.month !== undefined"
					:year="configFile.displayDate.year"
					:month="configFile.displayDate.month"
					@event-clicked="editEvent"
					@day-clicked="(day) => addEvent(day)"
				/>
				<CalendarYear
					v-else
					:year="configFile.displayDate.year"
					@event-clicked="editEvent"
					@day-clicked="(day) => addEvent(day)"
				/>
			</main>
		</template>
		<p role="progressbar" v-else>Loading...</p>
	</div>
</template>

<script setup lang="ts">
import { generateIcsCalendar, IcsEvent } from "ts-ics";
import { computed, reactive, ref, toRaw, useTemplateRef, watch } from "vue";
import {
	EventOccurrence,
	getDefaultIcsCalendarCollection,
	getDefaultIcsEvent,
	IcsCalendarCollection,
	parseIcsCalendarString,
	provideIcsCalendarCollection,
} from "./calendar-events";
import CalendarMonth from "./components/calendar-month.vue";
import CalendarYear from "./components/calendar-year.vue";
import { EVENT_EDIT_DIALOG_ACTION } from "./components/event-edit-dialog-result";
import EventEditDialog from "./components/event-edit-dialog.vue";
import NavigationControls from "./components/navigation-controls.vue";
import PrintControls from "./components/print-controls.vue";
import {
	getDefaultUserConfig,
	parseUserConfig,
	provideUserConfig,
	UserConfig,
} from "./user-config";

const errors = ref<unknown[]>([]);
const eventEditDialog = useTemplateRef("eventEditDialog");

function displayError(error: unknown): string {
	if (error instanceof Error) {
		return errorToString(error);
	}
	return `${error}`;
}

function errorToString(error: Error): string {
	let output = error.toString();
	if (error.stack) {
		output = `${error.stack}`;
	}
	if (error.cause) {
		output += `\nCaused by: ${displayError(error.cause)}`;
	}
	return output;
}

const configFileLoaded = ref(false);
const configFile = ref<UserConfig>(getDefaultUserConfig());
async function setupConfig(): Promise<void> {
	configFile.value = parseUserConfig(
		await window.electronApi.readUserConfigFile(),
	);
	configFileLoaded.value = true;

	watch(
		configFile,
		(newValue) => {
			window.electronApi.writeUserConfigFile(
				JSON.stringify(toRaw(newValue)),
			);
		},
		{ deep: true },
	);
}
setupConfig();
provideUserConfig(configFile);

const calendarFileLoaded = ref(false);
const icsCalendarCollection = reactive<IcsCalendarCollection>(
	getDefaultIcsCalendarCollection(),
);
async function setupIcsCalendarCollection(): Promise<void> {
	const fileContents = await window.electronApi.readCalendarFile();

	if (fileContents) {
		try {
			icsCalendarCollection.default =
				parseIcsCalendarString(fileContents);
		} catch (err) {
			errors.value.push(err);
		}
	}

	calendarFileLoaded.value = true;

	watch(icsCalendarCollection, (newValue) => {
		window.electronApi.writeCalendarFile(
			generateIcsCalendar(newValue.default),
		);
	});
}
setupIcsCalendarCollection();
provideIcsCalendarCollection(icsCalendarCollection);

const allReady = computed(
	() => configFileLoaded.value && calendarFileLoaded.value,
);

async function addEvent(date?: Date) {
	const newEvent: IcsEvent = { ...getDefaultIcsEvent(), summary: "" };
	newEvent.start.date = date ?? new Date(new Date().toDateString());
	const result = await eventEditDialog.value?.createNewEvent(newEvent);

	if (result?.action === EVENT_EDIT_DIALOG_ACTION.SAVE) {
		if (!icsCalendarCollection.default.events) {
			icsCalendarCollection.default.events = [];
		}

		icsCalendarCollection.default.events.push(result.event);
	}
}

async function editEvent(event: EventOccurrence) {
	const calendar = icsCalendarCollection[event.sourceCalendar];
	const foundIndex = calendar?.events?.findIndex(
		(eventSearch) => eventSearch.uid === event.event.uid,
	);
	if (
		calendar === undefined ||
		calendar.events === undefined ||
		foundIndex === undefined ||
		foundIndex < 0
	) {
		errors.value.push("Could not find event to edit.");
		return;
	}

	const result = await eventEditDialog.value?.updateEvent(
		calendar.events[foundIndex],
	);

	switch (result?.action) {
		case EVENT_EDIT_DIALOG_ACTION.SAVE:
			calendar.events[foundIndex] = result.event;
			break;
		case EVENT_EDIT_DIALOG_ACTION.DELETE:
			calendar.events.splice(foundIndex, 1);
			break;
	}
}
</script>

<style lang="css" scoped>
.app {
	display: flex;
	flex-direction: column;
	height: 100vh;
	max-height: 100vh;
	margin: 0;
	padding: 2px;
	box-sizing: border-box;
}

.calendar-display {
	flex-grow: 1;
	margin: 0;
	padding: 0;
	overflow: auto;

	@media print {
		overflow: visible;
	}
}

@media print {
	.app {
		height: unset;
		padding: 0 1px;
	}

	.controls {
		display: none;
	}
}
</style>
