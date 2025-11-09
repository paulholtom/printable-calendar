<template>
	<fieldset class="navigation-controls">
		<legend>Navigation Controls</legend>
		<button @click="previous">&lt;&lt;</button>
		<select v-model="configFile.displayDate.month">
			<option :value="undefined">Entire Year</option>
			<option
				v-for="(monthName, index) in monthNames"
				:key="monthName"
				:value="index"
			>
				{{ monthName }}
			</option>
		</select>
		<input
			class="year-input"
			type="number"
			v-model="configFile.displayDate.year"
		/>
		<button @click="next">&gt;&gt;</button>
	</fieldset>
</template>

<script setup lang="ts">
import { useUserConfig } from "@/user-config";

const configFile = useUserConfig();

const monthNames: string[] = [];
const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "long" });

for (let i = 0; i < 12; i++) {
	const date = new Date(2000, i);
	monthNames.push(monthFormatter.format(date));
}

function previous() {
	if (configFile.value.displayDate.month === undefined) {
		configFile.value.displayDate.year--;
	} else if (configFile.value.displayDate.month === 0) {
		configFile.value.displayDate.month = 11;
		configFile.value.displayDate.year--;
	} else {
		configFile.value.displayDate.month--;
	}
}

function next() {
	if (configFile.value.displayDate.month === undefined) {
		configFile.value.displayDate.year++;
	} else if (configFile.value.displayDate.month === 11) {
		configFile.value.displayDate.month = 0;
		configFile.value.displayDate.year++;
	} else {
		configFile.value.displayDate.month++;
	}
}
</script>

<style lang="css" scoped>
.year-input {
	width: 50px;
}
</style>
