import { fireEvent, render } from "@testing-library/vue";
import { beforeEach, expect, it, vi } from "vitest";
import DialogLayout from "./dialog-layout.vue";

beforeEach(() => {
	vi.resetAllMocks();
});

it("doesn't display if not set to be open", () => {
	// Arrange
	// Act
	const wrapper = render(DialogLayout, {
		slots: { default: "Slot Content" },
		props: { title: "The Title", isOpen: false },
	});

	// Assert
	expect(wrapper.queryByRole("dialog")).toBeNull();
});

it("displays if set to be open", () => {
	// Arrange

	// Act
	const wrapper = render(DialogLayout, {
		slots: { default: "Slot Content" },
		props: { title: "The Title", isOpen: true },
	});

	// Assert
	wrapper.getByRole("dialog");
});

it("displays slot content", () => {
	// Arrange
	const slotContent = "Stuff";

	// Act
	const wrapper = render(DialogLayout, {
		slots: { default: slotContent },
		props: { title: "The Title", isOpen: true },
	});

	// Assert
	wrapper.getByText(slotContent);
});

it("displays the title", () => {
	// Arrange
	const title = "The Title";

	// Act
	const wrapper = render(DialogLayout, {
		slots: { default: "Slot content" },
		props: { title, isOpen: true },
	});

	// Assert
	wrapper.getByText(title);
});

it("toggles visiblity reactively", async () => {
	// Arrange
	const slotContent = "Stuff";

	// Act / Assert
	const wrapper = render(DialogLayout, {
		slots: { default: slotContent },
		props: { title: "The Title", isOpen: false },
	});

	expect(wrapper.queryByText(slotContent)).toBeNull();

	await wrapper.rerender({ isOpen: true });
	expect(wrapper.getByText(slotContent));

	await wrapper.rerender({ isOpen: false });
	expect(wrapper.queryByText(slotContent)).toBeNull();
});

it("emits a change to the isOpen prop when the close button is clicked", async () => {
	// Arrange
	let isOpen = true;
	const wrapper = render(DialogLayout, {
		props: {
			title: "The Title",
			isOpen,
			"onUpdate:isOpen": (newValue) => {
				isOpen = newValue;
			},
		},
	});

	// Act
	const closeButton = wrapper.getByRole("button", { name: "Close" });
	await fireEvent.click(closeButton);

	// Assert
	expect(isOpen).toBe(false);
});
