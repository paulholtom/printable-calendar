<template>
	<section class="calendar-year">
		<CalendarMonth
			v-for="month in 12"
			:month="month - 1"
			:year="year"
			:key="month"
			:parent-events-by-date="eventsByDate"
			@event-clicked="(event) => $emit('eventClicked', event)"
			@day-clicked="(day) => $emit('dayClicked', day)"
		/>
	</section>
</template>

<script setup lang="ts">
import {
	EventOccurrence,
	getEventsByDateFromCalendarCollection,
	useIcsCalendarCollection,
} from "@/calendar-events";
import { computed } from "vue";
import CalendarMonth from "./calendar-month.vue";

defineEmits<{
	eventClicked: [event: EventOccurrence];
	dayClicked: [day: Date];
}>();

const props = defineProps<{
	/**
	 * The year.
	 */
	year: number;
}>();

const calendarCollection = useIcsCalendarCollection();

const firstOfYear = computed(() => new Date(props.year, 0, 1));
const endOfYear = computed(() => new Date(props.year, 11, 31));
const firstDisplayDate = computed(
	() =>
		new Date(
			props.year,
			firstOfYear.value.getMonth(),
			1 - firstOfYear.value.getDay(),
		),
);
const lastDisplayDate = computed(
	() => new Date(props.year, 11, 37 - endOfYear.value.getDay()),
);

const eventsByDate = computed(() => {
	return getEventsByDateFromCalendarCollection(
		calendarCollection,
		firstDisplayDate.value,
		lastDisplayDate.value,
	);
});
</script>

<style scoped lang="css">
.calendar-year {
	height: 100%;
}
</style>
