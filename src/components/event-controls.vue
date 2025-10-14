<template>
	<section class="event-controls">
		<DialogLayout title="Add Event" v-model:is-open="dialogOpen">
			<div class="input-and-label">
				<label :for="dateId">Date</label>
				<input :id="dateId" type="date" v-model="date" />
			</div>
			<div class="input-and-label">
				<label :for="descriptionId">Description</label>
				<input
					:id="descriptionId"
					type="text"
					placeholder="Enter a description"
					v-model="description"
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
import { CalendarEvent, useCalendarEventCollection } from "@/calendar-events";
import { ref } from "vue";
import DialogLayout from "./dialog-layout.vue";

const events = useCalendarEventCollection();

const dialogOpen = ref(false);
const defaultDate = new Date();
const date = ref(
	`${defaultDate.getFullYear()}-${(defaultDate.getMonth() + 1).toString().padStart(2, "0")}-${defaultDate.getDate().toString().padStart(2, "0")}`,
);
const dateId = crypto.randomUUID();

const description = ref("");
const descriptionId = crypto.randomUUID();

function save(): void {
	events.default.push({
		...parseDate(),
		description: description.value,
	});
	dialogOpen.value = false;
}

function parseDate(): Pick<CalendarEvent, "year" | "month" | "day"> {
	return {
		year: parseInt(date.value.substring(0, 4)),
		month: parseInt(date.value.substring(5, 7)) - 1,
		day: parseInt(date.value.substring(8, 10)),
	};
}
</script>
