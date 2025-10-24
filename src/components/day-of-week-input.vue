<template>
	<div>
		<div
			class="checkbox-and-label"
			v-for="({ name, id }, index) in daysOfWeek"
			:key="name"
		>
			<input
				type="checkbox"
				:id="id"
				:checked="isChecked(index)"
				@change="toggle(index)"
			/>
			<label :for="id">{{ name }}</label>
		</div>
	</div>
</template>

<script setup lang="ts">
import { getDaysOfWeek } from "@/dates";
import { IcsWeekdayNumber } from "ts-ics";

const selectedValues = defineModel<IcsWeekdayNumber[]>({ required: true });

const daysOfWeek = getDaysOfWeek("long").map((name) => ({
	name,
	id: crypto.randomUUID(),
}));

const weekdayMap: IcsWeekdayNumber["day"][] = [
	"SU",
	"MO",
	"TU",
	"WE",
	"TH",
	"FR",
	"SA",
];

function isChecked(dayNumber: number): boolean {
	return (
		selectedValues.value.find(
			(weekday) => weekday.day === weekdayMap[dayNumber],
		) !== undefined
	);
}

function toggle(dayNumber: number): void {
	if (isChecked(dayNumber)) {
		selectedValues.value = selectedValues.value.filter(
			(weekday) => weekday.day !== weekdayMap[dayNumber],
		);
	}
	// For some reason structure clone throws errors trying to clone these objects, so clone manually.
	const newValue: IcsWeekdayNumber[] = selectedValues.value.map((value) => ({
		...value,
	}));

	const foundIndex = newValue.findIndex(
		(weekday) => weekday.day === weekdayMap[dayNumber],
	);
	if (foundIndex >= 0) {
		newValue.splice(foundIndex, 1);
	} else {
		newValue.push({ day: weekdayMap[dayNumber] });
	}
	selectedValues.value = newValue;
}
</script>
