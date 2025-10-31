<template>
	<DialogLayout
		title="Confirm"
		role="alertdialog"
		:is-open="showDialog"
		:include-close-button="false"
		class="confirm-dialog"
	>
		{{ textContent }}
		<template #footer>
			<button @click="close(true)">Yes</button>
			<button @click="close(false)">No</button>
		</template>
	</DialogLayout>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import DialogLayout from "./dialog-layout.vue";

const showDialog = ref(false);
const textContent = ref("");

let resolver: undefined | ((value: boolean) => void) = undefined;

/**
 * Show the confirm dialog.
 *
 * @param content The text to show in the dialog.
 */
function show(content: string): Promise<boolean> {
	const { promise, resolve } = Promise.withResolvers<boolean>();
	resolver = resolve;

	textContent.value = content;
	showDialog.value = true;

	return promise;
}

function close(value: boolean) {
	resolver?.(value);
	showDialog.value = false;
	textContent.value = "";
}

defineExpose({ show });
</script>

<style lang="css" scoped>
.dialog-layout.confirm-dialog {
	z-index: 11;
}
</style>
