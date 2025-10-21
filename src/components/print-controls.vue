<template>
	<fieldset class="print-controls">
		<legend>Print Controls</legend>
		<button @click="choosePdfDirectory()">Choose PDF Directory</button>
		{{ configFile.pdfDirectory }}
		<button @click="printPdf()">Print PDF</button>
	</fieldset>
</template>

<script setup lang="ts">
import { getDateDisplayValue } from "@/dates";
import { useUserConfig } from "@/user-config";

const configFile = useUserConfig();

async function printPdf(): Promise<void> {
	if (!configFile.value.pdfDirectory) {
		await choosePdfDirectory();
	}
	if (!configFile.value.pdfDirectory) {
		return;
	}
	const filename = `${configFile.value.pdfDirectory}\\${getDateDisplayValue(configFile.value.displayDate)}.pdf`;
	const finalFileName = await window.electronApi.printToPdf(filename);
	alert(`PDF file created: ${finalFileName}`);
}

async function choosePdfDirectory(): Promise<void> {
	configFile.value.pdfDirectory =
		(await window.electronApi.selectDirectory()) ??
		configFile.value.pdfDirectory;
}
</script>
