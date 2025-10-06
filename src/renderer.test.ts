import { expect, it, vi } from "vitest";
import { createApp } from "vue";
import App from "./App.vue";
import "./renderer";

vi.mock(import("vue"), async (importOriginal) => {
	const original = await importOriginal();
	const fakeMount = vi.fn();
	return {
		...original,
		createApp: vi.fn((component) => {
			return { ...original.createApp(component), mount: fakeMount };
		}),
	};
});

it("creates and mounts the app", () => {
	// Arrange
	// Act
	// Assert
	expect(createApp).toHaveBeenCalledWith(App);
	expect(createApp(App).mount).toHaveBeenCalledWith("#app");
});
