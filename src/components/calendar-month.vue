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
			<li
				v-for="day in daysToDisplay"
				:key="`${day.year}-${day.month}-${day.date}`"
			>
				<CalendarDay
					:date="day.date"
					:month="day.month"
					:year="day.year"
					:variant="getCalendarDayVariant(day)"
				/>
			</li>
		</ol>
	</section>
</template>

<script setup lang="ts">
import { getDateDisplayValue } from "@/dates";
import { computed } from "vue";
import { CalendarDayVariant } from "./calendar-day-variant";
import CalendarDay from "./calendar-day.vue";

const props = defineProps<{
	/**
	 * The number of the month. Using javascript conventions so January is 0.
	 */
	month: number;
	/**
	 * The year.
	 */
	year: number;
}>();

type DateToDisplay = {
	date: number;
	month: number;
	year: number;
};

const daysToDisplay = computed(() => {
	const days: DateToDisplay[] = [];
	const firstOfMonth = new Date(props.year, props.month);
	const endOfMonth = new Date(props.year, props.month + 1, 0);
	const currentDate = new Date(
		props.year,
		props.month,
		firstOfMonth.getDay() - 6,
	);
	while (currentDate <= endOfMonth || days.length % 7 !== 0) {
		days.push({
			date: currentDate.getDate(),
			month: currentDate.getMonth(),
			year: currentDate.getFullYear(),
		});
		currentDate.setDate(currentDate.getDate() + 1);
	}
	return days;
});

function getCalendarDayVariant(date: DateToDisplay): CalendarDayVariant {
	if (date.month < props.month || date.year < props.year) {
		return "previous-month";
	}
	if (date.month > props.month || date.year > props.year) {
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
