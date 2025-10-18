<template>
	<section class="event-controls">
		<DialogLayout title="Add Event" v-model:is-open="dialogOpen">
			<div class="input-and-label">
				<label :for="dateId">Date</label>
				<input :id="dateId" type="date" v-model="date" />
			</div>
			<div class="input-and-label">
				<label :for="summaryId">Summary</label>
				<input
					:id="summaryId"
					type="text"
					placeholder="Enter a summary"
					v-model="summary"
				/>
			</div>
			<template #footer>
				<button @click="dialogOpen = false">Cancel</button>
				<button @click="save()">Save</button>
			</template>
		</DialogLayout>
		<button @click="dialogOpen = true">Add Event</button>
	</section>
</template>

<script setup lang="ts">
import {
	getDefaultIcsEvent,
	useIcsCalendarCollection,
} from "@/calendar-events";
import { ref } from "vue";
import DialogLayout from "./dialog-layout.vue";

const calendar = useIcsCalendarCollection();

const dialogOpen = ref(false);
const defaultDate = new Date();
const date = ref(
	`${defaultDate.getFullYear()}-${(defaultDate.getMonth() + 1).toString().padStart(2, "0")}-${defaultDate.getDate().toString().padStart(2, "0")}`,
);
const dateId = crypto.randomUUID();

const summary = ref("");
const summaryId = crypto.randomUUID();

function save(): void {
	if (calendar.default.events === undefined) {
		calendar.default.events = [];
	}

	calendar.default.events.push({
		...getDefaultIcsEvent(),
		start: { date: parseDate() },
		summary: summary.value,
	});
	dialogOpen.value = false;
}

function parseDate(): Date {
	return new Date(
		parseInt(date.value.substring(0, 4)),
		parseInt(date.value.substring(5, 7)) - 1,
		parseInt(date.value.substring(8, 10)),
	);
}
</script>
