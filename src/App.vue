<template>
	<div class="app">
		<nav class="controls">
			<PrintControls />
			<NavigationControls />
			<EventControls />
		</nav>
		<main class="calendar-display">
			<CalendarMonth
				v-if="configFile.displayDate.month !== undefined"
				:year="configFile.displayDate.year"
				:month="configFile.displayDate.month"
			/>
			<CalendarYear v-else :year="configFile.displayDate.year" />
		</main>
	</div>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import {
	CalendarEventCollection,
	getDefaultCalendarEventCollection,
	parseCalendarEvents,
	provideCalendarEventCollection,
} from "./calendar-events";
import CalendarMonth from "./components/calendar-month.vue";
import CalendarYear from "./components/calendar-year.vue";
import EventControls from "./components/event-controls.vue";
import NavigationControls from "./components/navigation-controls.vue";
import PrintControls from "./components/print-controls.vue";
import {
	getDefaultUserConfig,
	parseUserConfig,
	provideUserConfig,
	UserConfig,
} from "./user-config";

const configFile = reactive<UserConfig>(getDefaultUserConfig());
async function setupConfig(): Promise<void> {
	Object.assign(
		configFile,
		parseUserConfig(await window.electronApi.readUserConfigFile()),
	);
}
setupConfig();
provideUserConfig(configFile);
watch(configFile, (newValue) => {
	window.electronApi.writeUserConfigFile(JSON.stringify(newValue));
});

const calendarEventCollection = reactive<CalendarEventCollection>(
	getDefaultCalendarEventCollection(),
);
async function setupCalendarEventCollection(): Promise<void> {
	calendarEventCollection.default = parseCalendarEvents(
		await window.electronApi.readCalendarEventsFile(),
	);
}
setupCalendarEventCollection();
provideCalendarEventCollection(calendarEventCollection);
watch(calendarEventCollection, (newValue) => {
	window.electronApi.writeCalendarEventsFile(
		JSON.stringify(newValue.default),
	);
});
</script>

<style lang="css" scoped>
.app {
	display: flex;
	flex-direction: column;
	height: 100vh;
	margin: 0;
	padding: 2px;
	box-sizing: border-box;
}

.calendar-display {
	flex-grow: 1;
	margin: 0;
	padding: 0;
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
