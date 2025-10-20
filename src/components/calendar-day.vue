<template>
	<section class="calendar-day" :class="[variant]">
		<header class="date-display">{{ date.getDate() }}</header>
		<p
			class="event"
			v-for="event in events"
			:key="event.date.getTime() + event.event.uid"
			@click="$emit('eventClicked', event)"
		>
			{{ event.event.summary }}
		</p>
	</section>
</template>

<script setup lang="ts">
import { EventOccurrence } from "@/calendar-events";
import { CalendarDayVariant } from "./calendar-day-variant";

defineProps<{
	/**
	 * The date to be displayed.
	 */
	date: Date;
	/**
	 * The variant to be displayed.
	 */
	variant: CalendarDayVariant;
	/**
	 * The events to be displayed for this date.
	 */
	events: EventOccurrence[] | undefined;
}>();

defineEmits<{ eventClicked: [event: EventOccurrence] }>();
</script>

<style lang="css" scoped>
.date-display {
	text-align: center;
}

.previous-month,
.next-month {
	opacity: 0.5;
}

.event {
	cursor: pointer;
}
</style>
