<template>
	<section class="calendar-month" role="grid">
		<header class="month-name">
			{{ getDateDisplayValue({ year, month }) }}
		</header>
		<ol class="days">
			<li
				v-for="weekdayName in daysOfWeek"
				:key="weekdayName"
				class="weekday-name"
			>
				{{ weekdayName }}
			</li>
			<li v-for="date in datesToDisplay" :key="date.getTime()">
				<CalendarDay
					:date="date"
					:variant="getCalendarDayVariant(date)"
					:events="eventsByDate.get(date.getTime())"
					@event-clicked="(event) => $emit('eventClicked', event)"
				/>
			</li>
		</ol>
	</section>
</template>

<script setup lang="ts">
import {
	EventOccurrence,
	EventsByDate,
	getEventsByDateFromCalendarCollection,
	useIcsCalendarCollection,
} from "@/calendar-events";
import { getDateDisplayValue } from "@/dates";
import { computed } from "vue";
import { CalendarDayVariant } from "./calendar-day-variant";
import CalendarDay from "./calendar-day.vue";

defineEmits<{ eventClicked: [event: EventOccurrence] }>();

const props = defineProps<{
	/**
	 * The number of the month. Using javascript conventions so January is 0.
	 */
	month: number;
	/**
	 * The year.
	 */
	year: number;
	/**
	 * Events by date provided by a parent component.
	 */
	parentEventsByDate?: EventsByDate;
}>();

const calendarCollection = useIcsCalendarCollection();

const firstOfMonth = computed(() => new Date(props.year, props.month));
const endOfMonth = computed(() => new Date(props.year, props.month + 1, 0));
const firstDisplayDate = computed(
	() => new Date(props.year, props.month, 1 - firstOfMonth.value.getDay()),
);
const lastDisplayDate = computed(
	() => new Date(props.year, props.month + 1, 6 - endOfMonth.value.getDay()),
);

const datesToDisplay = computed(() => {
	const dates: Date[] = [];
	const currentDate = new Date(firstDisplayDate.value.getTime());
	while (currentDate <= lastDisplayDate.value) {
		dates.push(new Date(currentDate.getTime()));
		currentDate.setDate(currentDate.getDate() + 1);
	}
	return dates;
});

const eventsByDate = computed(() => {
	return (
		props.parentEventsByDate ??
		getEventsByDateFromCalendarCollection(
			calendarCollection,
			firstDisplayDate.value,
			lastDisplayDate.value,
		)
	);
});

function getCalendarDayVariant(date: Date): CalendarDayVariant {
	if (date < firstOfMonth.value) {
		return "previous-month";
	}
	if (date > endOfMonth.value) {
		return "next-month";
	}
	return "current-month";
}

/**
 * This is an arbitrary date that is a Sunday.
 */
const dayOfWeek = new Date(2023, 0, 1);
const daysOfWeek: string[] = [];

for (let i = 0; i < 7; i++) {
	dayOfWeek.setDate(1 + i);
	daysOfWeek.push(
		dayOfWeek.toLocaleDateString(undefined, { weekday: "long" }),
	);
}
</script>

<style lang="css" scoped>
.calendar-month {
	display: flex;
	flex-direction: column;
	margin: 0;
	padding: 0;
	box-sizing: border-box;
	height: 100%;

	@media print {
		break-before: always;
		height: 100vh;
	}
}

.month-name {
	text-align: center;
	font: 600 2em / 2.5em sans-serif;
}

.weekday-name {
	text-align: center;
	font: 400 1.5em / 1.5em sans-serif;
}

.days {
	flex-grow: 1;
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	grid-template-rows: max-content;
	grid-auto-rows: 1fr;
	box-sizing: border-box;
	gap: 1px;
	margin: 0;
	padding: 0;

	li {
		display: block;
		outline: solid 1px #ccc;
	}
}
</style>
