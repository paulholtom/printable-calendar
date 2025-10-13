<template>
	<section class="event-controls">
		<DialogLayout title="Add Event" v-model:is-open="dialogOpen">
			<p>Content</p>
		</DialogLayout>
		<button @click="dialogOpen = true">Add Event</button>
	</section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import DialogLayout from "./dialog-layout.vue";

const dialogOpen = ref(false);
</script>
