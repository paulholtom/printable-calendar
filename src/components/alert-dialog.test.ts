import { fireEvent, render } from "@testing-library/vue";
import { beforeEach, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import AlertDialog from "./alert-dialog.vue";

const TestingComponent = defineComponent({
	components: { AlertDialog },
	template: `
	<div>
		<AlertDialog ref="alertDialog" />
		<button @click="show()">Show</button>
	</div>
	`,
	props: {
		message: { type: String, required: true },
	},
	emits: ["dialogClosed"],
	methods: {
		async show() {
			await this.$refs.alertDialog.show(this.$props.message);
			this.$emit("dialogClosed");
		},
	},
});

beforeEach(() => {
	vi.resetAllMocks();
});

it("doesn't initially show a dialog", () => {
	// Arrange
	// Act
	const wrapper = render(TestingComponent, { props: { message: "Test" } });

	// Assert
	expect(wrapper.queryByRole("alertdialog")).toBeNull();
});

it("shows a dialog when the show function is called", async () => {
	// Arrange
	const wrapper = render(TestingComponent, { props: { message: "Test" } });

	// Act
	await fireEvent.click(wrapper.getByRole("button", { name: "Show" }));

	// Assert
	wrapper.getByRole("alertdialog");
});

it("closes when the OK button is clicked", async () => {
	// Arrange
	const wrapper = render(TestingComponent, { props: { message: "Test" } });
	await fireEvent.click(wrapper.getByRole("button", { name: "Show" }));

	// Act
	await fireEvent.click(wrapper.getByRole("button", { name: "OK" }));

	// Assert
	expect(wrapper.queryByRole("alertdialog")).toBeNull();
	expect(wrapper.emitted("dialogClosed")).toEqual([[]]);
});
