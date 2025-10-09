<template>
	<fieldset class="print-controls">
		<legend>Print Controls</legend>
		<button @click="choosePdfDirectory()">Choose PDF Directory</button>
		{{ configFile.pdfDirectory }}
		<button @click="printPdf()">Print PDF</button>
	</fieldset>
</template>

<script setup lang="ts">
import { useUserConfig } from "@/user-config";

const configFile = useUserConfig();

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

<style lang="css" scoped>
@media print {
	.print-controls {
		display: none;
	}
}
</style>
