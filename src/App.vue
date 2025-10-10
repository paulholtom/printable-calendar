<template>
	<PrintControls />
	<CalendarMonth :year="year" :month="month" />
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
