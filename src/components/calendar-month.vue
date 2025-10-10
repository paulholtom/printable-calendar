<template>
	<section class="calendar-month">
		<header class="month-name">
			{{
				firstOfMonth.toLocaleDateString(undefined, {
					year: "numeric",
					month: "long",
				})
			}}
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
				v-for="n in firstOfMonth.getDay()"
				:key="n"
				class="day-of-previous-month"
			></li>
			<li
				v-for="dayOfMonth in lastDayOfMonth.getDate()"
				:key="dayOfMonth"
				class="day-of-current-month"
			>
				{{ dayOfMonth }}
			</li>
			<li
				v-for="n in 6 - lastDayOfMonth.getDay()"
				:key="n"
				class="day-of-next-month"
			></li>
		</ol>
	</section>
</template>

<script setup lang="ts">
import { computed } from "vue";

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

const firstOfMonth = computed(() => new Date(props.year, props.month));
const lastDayOfMonth = computed(() => new Date(props.year, props.month + 1, 0));

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
.month-name {
	text-align: center;
	font: 600 2em / 2.5em sans-serif;
}

.weekday-name {
	text-align: center;
	font: 400 1.5em / 1.5em sans-serif;
}

.days {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	grid-template-rows: max-content;
	grid-auto-rows: 1fr;
	box-sizing: border-box;
	gap: 1px;
	height: 100vh;

	li {
		display: block;
		outline: solid 1px #ccc;
	}
}
</style>
