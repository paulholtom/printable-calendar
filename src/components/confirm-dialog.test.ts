import { fireEvent, render } from "@testing-library/vue";
import { beforeEach, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import ConfirmDialog from "./confirm-dialog.vue";

const TestingComponent = defineComponent({
	components: { ConfirmDialog },
	template: `
	<div>
		<ConfirmDialog ref="confirmDialog" />
		<button @click="show()">Show</button>
	</div>
	`,
	props: {
		message: { type: String, required: true },
	},
	emits: ["dialogClosed"],
	methods: {
		async show() {
			const result = await this.$refs.confirmDialog.show(
				this.$props.message,
			);
			this.$emit("dialogClosed", result);
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

it.each([
	{ buttonName: "Yes", expectedResult: true },
	{ buttonName: "No", expectedResult: false },
])(
	"closes when the $buttonName button is clicked with a result of $expectedResult",
	async ({ buttonName, expectedResult }) => {
		// Arrange
		const wrapper = render(TestingComponent, {
			props: { message: "Test" },
		});
		await fireEvent.click(wrapper.getByRole("button", { name: "Show" }));

		// Act
		await fireEvent.click(
			wrapper.getByRole("button", { name: buttonName }),
		);

		// Assert
		expect(wrapper.queryByRole("alertdialog")).toBeNull();
		expect(wrapper.emitted("dialogClosed")).toEqual([[expectedResult]]);
	},
);
