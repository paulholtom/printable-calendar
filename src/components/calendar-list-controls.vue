<template>
	<fieldset>
		<legend>Calendars</legend>
		<AlertDialog ref="alertDialog" />
		<DialogLayout
			v-model:is-open="newCalendarDialogOpen"
			title="Create a Calendar"
			:include-close-button="true"
		>
			<div class="input-and-label">
				<label :for="getInputId('new-calendar-name')">Name</label>
				<input
					type="text"
					v-model="newCalendarName"
					:id="getInputId('new-calendar-name')"
				/>
			</div>
			<div class="input-and-label" v-if="addDialogMode === 'import'">
				<label :for="getInputId('import-file')">Select File</label>
				<input
					type="file"
					accept=".csv"
					:id="getInputId('import-file')"
					@change="importFileChanged"
				/>
			</div>
			<template #footer>
				<button @click="closeAddDialog()">Cancel</button>
				<button @click="createCalendar()">Create Calendar</button>
			</template>
		</DialogLayout>
		<button @click="showAddDialog('new')">Add a Calendar</button>
		<button @click="showAddDialog('import')">Import Contacts</button>
		<button @click="selectCalendarDirectory()">
			Select Calendar Directory
		</button>
		<p>{{ userConfig.calendarDirectory }}</p>
		<div
			class="calendar-settings"
			v-for="{ calendarName, calendarSettings } in filteredCalendars"
			:key="calendarName"
		>
			<input
				type="checkbox"
				v-model="calendarSettings.disabled"
				:id="getInputId('cal-' + calendarName)"
				:true-value="false"
				:false-value="true"
			/>
			<label :for="getInputId('cal-' + calendarName)">{{
				calendarName
			}}</label>
		</div>
	</fieldset>
</template>

<script setup lang="ts">
import {
	getDefaultIcsCalendar,
	useIcsCalendarCollection,
} from "@/calendar-events";
import { convertGoogleContactsToCalendar } from "@/convert-contacts";
import { useUserConfig } from "@/user-config";
import { computed, ref, useTemplateRef } from "vue";
import AlertDialog from "./alert-dialog.vue";
import DialogLayout from "./dialog-layout.vue";

const alertDialog = useTemplateRef("alertDialog");

const uniqueId = crypto.randomUUID();
function getInputId(inputName: string): string {
	return `${uniqueId}-${inputName}`;
}

const userConfig = useUserConfig();
const calendarCollection = useIcsCalendarCollection();
const newCalendarDialogOpen = ref(false);
const newCalendarName = ref("");

function closeAddDialog(): void {
	importFileContents.value = undefined;
	newCalendarDialogOpen.value = false;
	newCalendarName.value = "";
}

const addDialogMode = ref<"new" | "import">("new");
async function showAddDialog(
	mode: (typeof addDialogMode)["value"],
): Promise<void> {
	if (userConfig.value.calendarDirectory === undefined) {
		await selectCalendarDirectory();
	}
	if (userConfig.value.calendarDirectory === undefined) {
		alertDialog.value?.show(
			"You have to set a directory for your calendars.",
		);
		return;
	}
	addDialogMode.value = mode;
	newCalendarDialogOpen.value = true;
	newCalendarName.value = "";
}

const importFileContents = ref<string | undefined>(undefined);
async function importFileChanged(event: Event) {
	if (
		!(event.target instanceof HTMLInputElement) ||
		event.target.files?.length !== 1
	) {
		importFileContents.value = undefined;
		return;
	}
	importFileContents.value = await event.target.files[0].text();
}

async function selectCalendarDirectory(): Promise<void> {
	userConfig.value.calendarDirectory =
		(await window.electronApi.selectDirectory(
			"Choose Calendar Directory",
		)) ?? userConfig.value.calendarDirectory;
}

function createCalendar(): void {
	if (!newCalendarName.value) {
		alertDialog.value?.show("Enter a name.");
		return;
	}
	if (calendarCollection.value[newCalendarName.value]) {
		alertDialog.value?.show("A calendar with that name already exists.");
		return;
	}
	if (
		addDialogMode.value === "import" &&
		importFileContents.value === undefined
	) {
		alertDialog.value?.show("You haven't selected a file to import.");
		return;
	}
	const newCalendar =
		addDialogMode.value === "import" && importFileContents.value
			? convertGoogleContactsToCalendar(importFileContents.value)
			: getDefaultIcsCalendar();

	if (Array.isArray(newCalendar)) {
		alertDialog.value?.show(
			newCalendar.map((error) => error.message).join("\n"),
		);
		return;
	}

	calendarCollection.value[newCalendarName.value] = newCalendar;
	userConfig.value.calendars[newCalendarName.value] = {
		disabled: false,
	};

	closeAddDialog();
}

const filteredCalendars = computed(() =>
	Object.entries(userConfig.value.calendars)
		.map(([calendarName, calendarSettings]) => ({
			calendarName,
			calendarSettings,
		}))
		.filter(
			(
				calendarDetails,
			): calendarDetails is {
				calendarName: string;
				calendarSettings: { disabled: boolean };
			} => calendarDetails.calendarSettings !== undefined,
		),
);
</script>
