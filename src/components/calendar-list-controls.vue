<template>
	<fieldset>
		<legend>Calendars</legend>
		<AlertDialog ref="alertDialog" />
		<DialogLayout
			v-model:is-open="newCalendarDialogOpen"
			title="Enter a Name"
			:include-close-button="true"
		>
			<label :for="getInputId('new-calendar-name')">Name</label>
			<input
				type="text"
				v-model="newCalendarName"
				:id="getInputId('new-calendar-name')"
			/>
			<template #footer>
				<button @click="closeAddDialog()">Cancel</button>
				<button @click="createCalendar()">Create Calendar</button>
			</template>
		</DialogLayout>
		<button @click="showAddDialog()">Add a Calendar</button>
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
	newCalendarDialogOpen.value = false;
	newCalendarName.value = "";
}

async function showAddDialog(): Promise<void> {
	if (userConfig.value.calendarDirectory === undefined) {
		await selectCalendarDirectory();
	}
	if (userConfig.value.calendarDirectory === undefined) {
		alertDialog.value?.show(
			"You have to set a directory for your calendars.",
		);
		return;
	}
	newCalendarDialogOpen.value = true;
	newCalendarName.value = "";
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

	calendarCollection.value[newCalendarName.value] = getDefaultIcsCalendar();
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
