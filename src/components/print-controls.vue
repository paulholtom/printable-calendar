<template>
	<fieldset class="print-controls">
		<legend>Print Controls</legend>
		<AlertDialog ref="alertDialog" />
		<button @click="choosePdfDirectory()">Choose PDF Directory</button>
		{{ configFile.pdfDirectory }}
		<button @click="printPdf()">Print PDF</button>
	</fieldset>
</template>

<script setup lang="ts">
import { getDateDisplayValue } from "@/dates";
import { useUserConfig } from "@/user-config";
import { useTemplateRef } from "vue";
import AlertDialog from "./alert-dialog.vue";

const alertDialog = useTemplateRef("alertDialog");
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
	alertDialog.value?.show(`PDF file created: ${finalFileName}`);
}

async function choosePdfDirectory(): Promise<void> {
	configFile.value.pdfDirectory =
		(await window.electronApi.selectDirectory("Select PDF Directory")) ??
		configFile.value.pdfDirectory;
}
</script>
