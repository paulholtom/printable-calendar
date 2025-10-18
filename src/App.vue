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
		</template>
		<p role="progressbar" v-else>Loading...</p>
	</div>
</template>

<script setup lang="ts">
import { generateIcsCalendar } from "ts-ics";
import { computed, reactive, ref, watch } from "vue";
import {
	getDefaultIcsCalendarCollection,
	IcsCalendarCollection,
	parseIcsCalendarString,
	provideIcsCalendarCollection,
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

const errors = ref<unknown[]>([]);

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
