<template>
	<PrintControls />
	<h1>Config File Contents</h1>
	<p>{{ configFile }}</p>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
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
</script>
