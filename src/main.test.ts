import { beforeEach, it, vi } from "vitest";

vi.mock(import("electron"));

beforeEach(() => {
	vi.resetAllMocks();
});

it("does things", () => {
	// Arrange
});
