<template>
	<h1>Config File Contents</h1>
	<p>{{ configFile }}</p>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { parseUserConfig, UserConfig } from "./user-config";

const configFile = ref<UserConfig>();

async function setupConfig(): Promise<void> {
	configFile.value = parseUserConfig(await window.configFile.read());
}
setupConfig();

watch(configFile, (newValue) => {
	window.configFile.write(JSON.stringify(newValue));
});
</script>
