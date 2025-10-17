<template>
	<section class="calendar-day" :class="[variant]">
		<header class="date-display">{{ date }}</header>
	</section>
</template>

<script setup lang="ts">
import { CalendarDayVariant } from "./calendar-day-variant";

defineProps<{
	/**
	 * The day of the month.
	 */
	date: number;
	/**
	 * The number of the month. Using javascript conventions so January is 0.
	 */
	month: number;
	/**
	 * The year.
	 */
	year: number;
	/**
	 * The variant to be displayed.
	 */
	variant: CalendarDayVariant;
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
</style>
