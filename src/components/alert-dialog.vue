<template>
	<DialogLayout
		title="Alert"
		role="alertdialog"
		v-model:is-open="showDialog"
		:include-close-button="false"
		class="alert-dialog"
	>
		{{ textContent }}
		<template #footer>
			<button @click="close()">OK</button>
		</template>
	</DialogLayout>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import DialogLayout from "./dialog-layout.vue";

const showDialog = ref(false);
const textContent = ref("");

let resolver: undefined | (() => void) = undefined;

/**
 * Show the alert dialog.
 *
 * @param content The text to show in the dialog.
 */
function show(content: string): Promise<void> {
	const { promise, resolve } = Promise.withResolvers<void>();
	resolver = resolve;

	textContent.value = content;
	showDialog.value = true;

	return promise;
}

function close() {
	resolver?.();
	showDialog.value = false;
	textContent.value = "";
}

defineExpose({ show });
</script>

<style lang="css" scoped>
.dialog-layout.alert-dialog {
	z-index: 11;
}
</style>
