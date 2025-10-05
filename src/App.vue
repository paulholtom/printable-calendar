<template>
	<button @click="count++">Increase count</button>
	<p>{{ count }}</p>
</template>

<script setup lang="ts">
import { ref } from "vue";

const count = ref(0);
</script>
