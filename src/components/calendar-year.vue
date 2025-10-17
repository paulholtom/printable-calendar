<template>
	<section class="calendar-year">
		<CalendarMonth
			v-for="month in 12"
			:month="month - 1"
			:year="year"
			:key="month"
		/>
	</section>
</template>

<script setup lang="ts">
import CalendarMonth from "./calendar-month.vue";

defineProps<{
	/**
	 * The year.
	 */
	year: number;
}>();
</script>

<style scoped lang="css">
.calendar-year {
	height: 100%;
}
</style>
