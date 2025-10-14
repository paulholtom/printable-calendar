<template>
	<section class="dialog-layout" v-if="isOpen" role="dialog">
		<div class="dialog-wrapper">
			<header class="dialog-header">
				{{ title }}
				<button
					class="close-button"
					@click="close()"
					aria-label="Close"
				/>
			</header>
			<main class="dialog-content">
				<slot />
			</main>
			<footer class="dialog-footer" v-if="$slots.footer">
				<slot name="footer" />
			</footer>
		</div>
	</section>
</template>

<script setup lang="ts">
/**
 * If the dialog is currently open.
 */
const isOpen = defineModel<boolean>("isOpen", { required: true });

defineProps<{
	/**
	 * The title of the dialog.
	 */
	title: string;
}>();

function close() {
	isOpen.value = false;
}
</script>

<style scoped lang="css">
.dialog-layout {
	position: fixed;
	inset: 0;
	background-color: rgb(0 0 0 / 50%);
	z-index: 10;
	height: 100vh;
	width: 100vw;
	display: flex;
	justify-content: center;
	align-items: center;
}

.dialog-wrapper {
	background: #fff;
	max-width: 50vw;
	max-height: 50vh;
	overflow-y: auto;

	> * {
		padding: 5px;
	}
}

.dialog-header {
	border-bottom: 1px solid #ccc;
	background: #708090;
	position: relative;
	padding-right: 0;
	display: flex;
	flex-direction: row;
	align-items: center;

	.close-button {
		background: none;
		border: none;
		cursor: pointer;
		color: #555;
		margin-left: 5px;
		padding: 0 5px;
		align-self: start;

		&:hover {
			color: #000;
		}

		&::before {
			content: "\00d7";
			font-size: 16px;
			line-height: 0;
		}
	}
}
</style>
