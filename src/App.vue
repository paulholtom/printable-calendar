<template>
	<h1>Config File Contents</h1>
	<p>{{ configFile }}</p>
	<button @click="choosePdfDirectory()">Choose PDF Directory</button>
	{{ configFile.pdfDirectory }}
	<button @click="printPdf()">Print PDF</button>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import {
	getDefaultUserConfig,
	parseUserConfig,
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

watch(configFile, (newValue) => {
	window.electronApi.writeUserConfigFile(JSON.stringify(newValue));
});

async function printPdf(): Promise<void> {
	if (!configFile.pdfDirectory) {
		await choosePdfDirectory();
	}
	if (!configFile.pdfDirectory) {
		return;
	}
	const filename = `${configFile.pdfDirectory}\\test.pdf`;
	await window.electronApi.printToPdf(filename);
	alert(`PDF file created: ${filename}`);
}

async function choosePdfDirectory(): Promise<void> {
	configFile.pdfDirectory =
		(await window.electronApi.selectDirectory()) ?? configFile.pdfDirectory;
}
</script>
