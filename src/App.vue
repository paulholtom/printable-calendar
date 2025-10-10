<template>
	<div class="app">
		<nav class="controls">
			<PrintControls />
		</nav>
		<main class="calendar-display">
			<CalendarMonth :year="year" :month="month" />
		</main>
	</div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import CalendarMonth from "./components/calendar-month.vue";
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

const year = ref(new Date().getFullYear());
const month = ref(new Date().getMonth());
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
