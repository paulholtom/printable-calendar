<template>
	<div class="app">
		<template v-if="errors.length > 0">
			<p>Encountered unrecoverable errors:</p>
			<p v-for="(error, index) in errors" :key="index">
				{{ error }}
			</p>
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
				/>
				<CalendarYear
					v-else
					:year="configFile.displayDate.year"
					@event-clicked="editEvent"
				/>
			</main>
		</template>
		<p role="progressbar" v-else>Loading...</p>
	</div>
</template>

<script setup lang="ts">
import { generateIcsCalendar } from "ts-ics";
import { computed, reactive, ref, useTemplateRef, watch } from "vue";
import {
	EventOccurrence,
	getDefaultIcsCalendarCollection,
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

const configFileLoaded = ref(false);
const configFile = reactive<UserConfig>(getDefaultUserConfig());
async function setupConfig(): Promise<void> {
	Object.assign(
		configFile,
		parseUserConfig(await window.electronApi.readUserConfigFile()),
	);

	configFileLoaded.value = true;

	watch(configFile, (newValue) => {
		window.electronApi.writeUserConfigFile(JSON.stringify(newValue));
	});
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

async function addEvent() {
	const result = await eventEditDialog.value?.createNewEvent();

	if (result?.action === EVENT_EDIT_DIALOG_ACTION.SAVE) {
		if (!icsCalendarCollection.default.events) {
			icsCalendarCollection.default.events = [];
		}

		icsCalendarCollection.default.events.push(result.event);
	}
}

async function editEvent(event: EventOccurrence) {
	const calendar = icsCalendarCollection[event.sourceCalendar];
	const foundEvent = calendar?.events?.find(
		(eventSearch) => eventSearch.uid === event.event.uid,
	);
	if (
		calendar === undefined ||
		calendar.events === undefined ||
		foundEvent === undefined
	) {
		errors.value.push("Could not find event to edit.");
		return;
	}

	const result = await eventEditDialog.value?.updateEvent(foundEvent);

	switch (result?.action) {
		case EVENT_EDIT_DIALOG_ACTION.SAVE:
			Object.assign(foundEvent, result.event);
			break;
		case EVENT_EDIT_DIALOG_ACTION.DELETE:
			calendar.events = calendar.events.filter(
				(eventSearch) => eventSearch.uid !== event.event.uid,
			);
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
