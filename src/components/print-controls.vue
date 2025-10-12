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
	if (!configFile.pdfDirectory) {
		await choosePdfDirectory();
	}
	if (!configFile.pdfDirectory) {
		return;
	}
	const filename = `${configFile.pdfDirectory}\\${getDateDisplayValue(configFile.displayDate)}.pdf`;
	const finalFileName = await window.electronApi.printToPdf(filename);
	alert(`PDF file created: ${finalFileName}`);
}

async function choosePdfDirectory(): Promise<void> {
	configFile.pdfDirectory =
		(await window.electronApi.selectDirectory()) ?? configFile.pdfDirectory;
}
</script>
