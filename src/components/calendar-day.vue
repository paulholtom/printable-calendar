<template>
	<section
		class="calendar-day"
		:class="[variant]"
		@click="$emit('dayClicked', date)"
	>
		<header class="date-display">{{ date.getDate() }}</header>
		<p
			class="event"
			:class="{
				'event-with-time': event.event.start.type === 'DATE-TIME',
			}"
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
			<span class="summary">{{ getEventName(event) }}</span>
		</p>
	</section>
</template>

<script setup lang="ts">
import { EventOccurrence } from "@/calendar-events";
import { addOrdinalSuffix } from "@/services";
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

function getEventName(event: EventOccurrence) {
	if (
		event.instanceOfEvent === 0 ||
		event.event.nonStandard?.ordinalDisplay === undefined
	) {
		return event.event.summary;
	}

	return `${event.event.nonStandard.ordinalDisplay.before} ${addOrdinalSuffix(event.instanceOfEvent)} ${event.event.nonStandard.ordinalDisplay.after}`;
}
</script>

<style lang="css" scoped>
.date-display {
	text-align: center;
	font: 400 1.5em / 1.5em sans-serif;
}

.previous-month,
.next-month {
	opacity: 0.5;
}

.event {
	cursor: pointer;

	&.event-with-time {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 10px;
		align-items: center;
	}
}
</style>
