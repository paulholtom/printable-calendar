<template>
	<div>
		<div
			class="checkbox-and-label"
			v-for="({ name, id, weekdayDetails }, index) in daysOfWeek"
			:key="name"
		>
			<input
				type="checkbox"
				:id="id"
				:checked="isChecked(index)"
				@change="toggle(index)"
			/>
			<select
				v-if="weekdayDetails?.occurrence"
				v-model="weekdayDetails.occurrence"
			>
				<option
					v-for="{ label, value } in occurrenceOptions"
					:key="value"
					:value="value"
				>
					{{ label }}
				</option>
			</select>
			<label :for="id">{{ name }}</label>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ICS_WEEKDAY_MAP, IcsWeekdayNumber } from "@/calendar-events";
import { getDaysOfWeek } from "@/dates";
import { computed } from "vue";

const selectedValues = defineModel<IcsWeekdayNumber[]>({ required: true });

const props = defineProps<{
	/**
	 * If this should specify the occurence for each day of the week selected.
	 */
	specifyOccurrence: boolean;
}>();

const uniqueId = crypto.randomUUID();
const dayNames = getDaysOfWeek("long");

const daysOfWeek = computed(() => {
	return dayNames.map((name, index) => ({
		name,
		id: `${uniqueId}-${name}`,
		weekdayDetails: selectedValues.value.find(
			(weekday) => weekday.day === ICS_WEEKDAY_MAP[index],
		),
	}));
});

const occurrenceOptions: { label: string; value: number }[] = [
	{ label: "First", value: 1 },
	{ label: "Second", value: 2 },
	{ label: "Third", value: 3 },
	{ label: "Fourth", value: 4 },
	{ label: "Last", value: -1 },
];

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
		newValue.push({
			day: ICS_WEEKDAY_MAP[dayNumber],
			occurrence: props.specifyOccurrence ? 1 : undefined,
		});
	}
	selectedValues.value = newValue;
}
</script>
