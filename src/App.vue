<template>
	<div class="app">
		<AlertDialog ref="alertDialog" />
		<template v-if="errors.length > 0">
			<p>Encountered unrecoverable errors:</p>
			<pre v-for="(error, index) in errors" :key="index" role="alert">{{
				displayError(error)
			}}</pre>
		</template>
		<template v-else-if="configFileLoaded">
			<nav class="controls">
				<CalendarListControls />
				<template v-if="calendarFilesLoaded">
					<EventEditDialog ref="eventEditDialog" />
					<PrintControls />
					<NavigationControls />
					<button @click="addEvent()">Add Event</button>
				</template>
			</nav>
			<main v-if="calendarFilesLoaded" class="calendar-display">
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
import { computed, ref, toRaw, useTemplateRef, watch, WatchHandle } from "vue";
import {
	EventOccurrence,
	getDefaultIcsCalendar,
	getDefaultIcsCalendarCollection,
	getDefaultIcsEvent,
	IcsCalendarCollection,
	IcsEvent,
	parseIcsCalendarString,
	provideIcsCalendarCollection,
	serializeIcsCalendar,
} from "./calendar-events";
import AlertDialog from "./components/alert-dialog.vue";
import CalendarListControls from "./components/calendar-list-controls.vue";
import CalendarMonth from "./components/calendar-month.vue";
import CalendarYear from "./components/calendar-year.vue";
import { EVENT_EDIT_DIALOG_ACTION } from "./components/event-edit-dialog-types";
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
const alertDialog = useTemplateRef("alertDialog");

function displayError(error: unknown): string {
	if (error instanceof Error) {
		return errorToString(error);
	}
	return `${error}`;
}

function errorToString(error: Error): string {
	let output = "";
	if (error.stack) {
		output += `${error.stack}\n`;
	}
	output += error.toString();
	if (error.cause) {
		output += `\nCaused by: ${displayError(error.cause)}`;
	}
	return output;
}

const configFileLoaded = ref(false);
const configFile = ref<UserConfig>(getDefaultUserConfig());
async function setupConfig(): Promise<void> {
	try {
		configFile.value = parseUserConfig(
			await window.electronApi.readUserConfigFile(),
		);
	} catch (err) {
		errors.value.push(err);
	}
	configFileLoaded.value = true;

	setupIcsCalendarCollection();
	watch(
		configFile,
		(newValue) => {
			window.electronApi.writeUserConfigFile(
				JSON.stringify(toRaw(newValue)),
			);
		},
		{ deep: true },
	);

	watch(
		() => configFile.value.calendarDirectory,
		(oldValue, newValue) => {
			if (newValue !== oldValue) {
				setupIcsCalendarCollection();
			}
		},
	);
}
setupConfig();
provideUserConfig(configFile);

const calendarFilesLoaded = ref(false);
const icsCalendarCollection = ref<IcsCalendarCollection>(
	getDefaultIcsCalendarCollection(),
);
let calendarCollectionWatchHandle: WatchHandle | undefined = undefined;
async function setupIcsCalendarCollection(): Promise<void> {
	calendarCollectionWatchHandle?.();
	calendarCollectionWatchHandle = undefined;
	if (configFile.value.calendarDirectory === undefined) {
		return;
	}
	calendarFilesLoaded.value = false;
	const fileContents = await window.electronApi.readCalendarFiles(
		configFile.value.calendarDirectory,
	);

	for (const existingCalendar of Object.keys(icsCalendarCollection.value)) {
		icsCalendarCollection.value[existingCalendar] = undefined;
	}

	for (const [calendarName, calendarFileContents] of Object.entries(
		fileContents,
	)) {
		if (calendarFileContents) {
			try {
				icsCalendarCollection.value[calendarName] =
					parseIcsCalendarString(calendarFileContents);
			} catch (err) {
				errors.value.push(err);
			}
		}
	}

	if (errors.value.length === 0) {
		const calendarNames = Object.keys(fileContents);

		const calendarConfig = structuredClone(
			toRaw(configFile.value.calendars),
		);

		calendarNames.forEach((calendarName) => {
			calendarConfig[calendarName] = calendarConfig[calendarName] ?? {
				disabled: false,
			};
		});

		configFile.value.calendars = Object.fromEntries(
			Object.entries(calendarConfig).filter(([name]) =>
				calendarNames.includes(name),
			),
		);
	}

	calendarFilesLoaded.value = true;

	calendarCollectionWatchHandle = watch(
		icsCalendarCollection,
		(newValue) => {
			for (const [calendarName, calendar] of Object.entries(newValue)) {
				if (calendar === undefined) {
					continue;
				}
				// This code isn't reachable by any user interactions it's only here to satisfy typescript.
				/* c8 ignore start */
				if (configFile.value.calendarDirectory === undefined) {
					errors.value.push(
						new Error(
							"Calendar directory isn't set when trying to save calendars.",
						),
					);
					return;
				}
				/* c8 ignore stop */
				window.electronApi.writeCalendarFile(
					configFile.value.calendarDirectory,
					calendarName,
					serializeIcsCalendar(calendar),
				);
			}
		},
		{ deep: true },
	);
}
provideIcsCalendarCollection(icsCalendarCollection);

const calendarNames = computed(() => Object.keys(configFile.value.calendars));

async function addEvent(date?: Date) {
	if (calendarNames.value.length === 0) {
		alertDialog.value?.show(
			"Tried to add an event while there are no available calendars.",
		);
		return;
	}
	const newEvent: IcsEvent = { ...getDefaultIcsEvent(), summary: "" };
	newEvent.start.date = date ?? new Date(new Date().toDateString());
	const result = await eventEditDialog.value?.createNewEvent({
		event: newEvent,
		calendarOptions: {
			calendarNames: calendarNames.value,
			sourceCalendar: calendarNames.value[0],
		},
	});

	if (result?.action === EVENT_EDIT_DIALOG_ACTION.SAVE) {
		addEventToCalendar(result.event, result.calendarName);
	}
}

function addEventToCalendar(event: IcsEvent, calendarName: string): void {
	// There's no user interaction that can cause this to be called with a calendar name that isn't in the collection, this ternary is necessary to satify typescript.
	/* c8 ignore start */
	const cal =
		icsCalendarCollection.value[calendarName] ?? getDefaultIcsCalendar();
	/* c8 ignore stop */
	if (!cal.events) {
		cal.events = [];
	}

	cal.events.push(event);

	// This code isn't reachable by any user interactions it's only here to satisfy typescript.
	/* c8 ignore start */
	if (!icsCalendarCollection.value[calendarName]) {
		icsCalendarCollection.value[calendarName] = cal;
	}
	/* c8 ignore stop */
}

async function editEvent(event: EventOccurrence) {
	const calendar = icsCalendarCollection.value[event.sourceCalendar];
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

	const result = await eventEditDialog.value?.updateEvent({
		event: calendar.events[foundIndex],
		calendarOptions: {
			calendarNames: calendarNames.value,
			sourceCalendar: event.sourceCalendar,
		},
	});

	switch (result?.action) {
		case EVENT_EDIT_DIALOG_ACTION.SAVE:
			if (result.calendarName === event.sourceCalendar) {
				calendar.events[foundIndex] = result.event;
			} else {
				calendar.events.splice(foundIndex, 1);
				addEventToCalendar(result.event, result.calendarName);
			}
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
