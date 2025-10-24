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
import { ICS_WEEKDAY_MAP } from "@/calendar-events";
import { getDaysOfWeek } from "@/dates";
import { IcsWeekdayNumber } from "ts-ics";

const selectedValues = defineModel<IcsWeekdayNumber[]>({ required: true });

const daysOfWeek = getDaysOfWeek("long").map((name) => ({
	name,
	id: crypto.randomUUID(),
}));

function isChecked(dayNumber: number): boolean {
	return (
		selectedValues.value.find(
			(weekday) => weekday.day === ICS_WEEKDAY_MAP[dayNumber],
		) !== undefined
	);
}

function toggle(dayNumber: number): void {
	if (isChecked(dayNumber)) {
		selectedValues.value = selectedValues.value.filter(
			(weekday) => weekday.day !== ICS_WEEKDAY_MAP[dayNumber],
		);
	}
	// For some reason structure clone throws errors trying to clone these objects, so clone manually.
	const newValue: IcsWeekdayNumber[] = selectedValues.value.map((value) => ({
		...value,
	}));

	const foundIndex = newValue.findIndex(
		(weekday) => weekday.day === ICS_WEEKDAY_MAP[dayNumber],
	);
	if (foundIndex >= 0) {
		newValue.splice(foundIndex, 1);
	} else {
		newValue.push({ day: ICS_WEEKDAY_MAP[dayNumber] });
	}
	selectedValues.value = newValue;
}
</script>
