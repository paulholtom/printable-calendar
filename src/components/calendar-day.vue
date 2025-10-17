<template>
	<section class="calendar-day" :class="[variant]">
		<header class="date-display">{{ date.date }}</header>
		<p v-for="event in events" :key="event.description">
			{{ event.description }}
		</p>
	</section>
</template>

<script setup lang="ts">
import {
	eventAppearsOnDay,
	useCalendarEventCollection,
} from "@/calendar-events";
import { DateOnly } from "@/dates";
import { computed } from "vue";
import { CalendarDayVariant } from "./calendar-day-variant";

const props = defineProps<{
	/**
	 * The date to be displayed.
	 */
	date: DateOnly;
	/**
	 * The variant to be displayed.
	 */
	variant: CalendarDayVariant;
}>();

const eventCollection = useCalendarEventCollection();

const events = computed(() =>
	Object.values(eventCollection)
		.flat()
		.filter((event) => eventAppearsOnDay(event, props.date)),
);
</script>

<style lang="css" scoped>
.date-display {
	text-align: center;
}

.previous-month,
.next-month {
	opacity: 0.5;
}
</style>
