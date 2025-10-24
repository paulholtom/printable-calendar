<template>
	<section
		class="calendar-day"
		:class="[variant]"
		@click="$emit('dayClicked', date)"
	>
		<header class="date-display">{{ date.getDate() }}</header>
		<p
			class="event"
			v-for="event in events"
			:key="event.date.getTime() + event.event.uid"
			@click.stop="$emit('eventClicked', event)"
		>
			<span class="time" v-if="event.event.start.type === 'DATE-TIME'">
				{{
					event.date.toLocaleTimeString(undefined, {
						hour: "numeric",
						minute: "2-digit",
					})
				}}
			</span>
			<span class="summary">{{ event.event.summary }}</span>
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

defineEmits<{
	eventClicked: [event: EventOccurrence];
	dayClicked: [day: Date];
}>();
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
	display: grid;
	grid-template-columns: max-content 1fr;
	gap: 5px;
	align-items: center;
}
</style>
