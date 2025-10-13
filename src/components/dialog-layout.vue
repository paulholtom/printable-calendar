<template>
	<section class="dialog-layout" v-if="isOpen" role="dialog">
		<div class="dialog-wrapper">
			<header class="dialog-header">
				{{ title }}
				<button class="close-button" @click="close()">Close</button>
			</header>
			<main class="dialog-content">
				<slot />
			</main>
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
	background: lightblue;
	position: relative;
	padding-right: 35px;
	height: 30px;
	box-sizing: border-box;

	.close-button {
		width: 30px;
		height: 30px;
		position: absolute;
		right: 0;
		top: 0;
		color: transparent;
		padding: 3px;
		overflow: hidden;

		&::before {
			color: #000;
			content: "\00d7";
			font-size: 25px;
			line-height: 30px;
		}
	}
}
</style>
