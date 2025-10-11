import { ElectronApi } from "@/electron-api";
import {
	getDefaultUserConfig,
	USER_CONFIG_KEY,
	UserConfig,
} from "@/user-config";
import { fireEvent, render } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NavigationControls from "./navigation-controls.vue";

const mockElectronApi = {
	readUserConfigFile: vi.fn(),
	writeUserConfigFile: vi.fn(),
	printToPdf: vi.fn(),
	selectDirectory: vi.fn(),
} satisfies ElectronApi;

beforeEach(() => {
	vi.resetAllMocks();

	window.electronApi = mockElectronApi;
	window.alert = vi.fn();
});

afterEach(() => {
	window.electronApi = undefined;
});

it("sets the month from the user config", async () => {
	// Arrange
	const userConfig: UserConfig = getDefaultUserConfig();
	userConfig.displayDate.month = 5;

	// Act
	const wrapper = render(NavigationControls, {
		global: { provide: { [USER_CONFIG_KEY]: userConfig } },
	});

	// Assert
	wrapper.getByDisplayValue(
		new Date(2000, 5).toLocaleString(undefined, { month: "long" }),
	);
});

it("updates the month in the user config when it is changed from the drop down", async () => {
	// Arrange
	const userConfig: UserConfig = getDefaultUserConfig();
	userConfig.displayDate.month = 5;
	const wrapper = render(NavigationControls, {
		global: { provide: { [USER_CONFIG_KEY]: userConfig } },
	});

	// Act
	const monthSelector = wrapper.getByRole("combobox");
	await fireEvent.update(monthSelector, "7");

	// Assert
	expect(userConfig.displayDate.month).toBe(7);
});

it("sets the year from the user config", async () => {
	// Arrange
	const userConfig: UserConfig = getDefaultUserConfig();
	userConfig.displayDate.year = 2025;

	// Act
	const wrapper = render(NavigationControls, {
		global: { provide: { [USER_CONFIG_KEY]: userConfig } },
	});

	// Assert
	wrapper.getByDisplayValue("2025");
});

it("updates the year in the user config when it is changed from the input", async () => {
	// Arrange
	const userConfig: UserConfig = getDefaultUserConfig();
	userConfig.displayDate.year = 2025;
	const wrapper = render(NavigationControls, {
		global: { provide: { [USER_CONFIG_KEY]: userConfig } },
	});

	// Act
	const input = wrapper.getByRole("spinbutton");
	await fireEvent.update(input, "2027");

	// Assert
	expect(userConfig.displayDate.year).toBe(2027);
});

describe("previous", () => {
	it.each([
		{
			original: { month: 6, year: 2025 },
			expected: { month: 5, year: 2025 },
		},
		{
			original: { month: 0, year: 2026 },
			expected: { month: 11, year: 2025 },
		},
		{
			original: { month: undefined, year: 2026 },
			expected: { month: undefined, year: 2025 },
		},
	])(
		"changes the selected date from $original to",
		async ({ original, expected }) => {
			// Arrange
			const userConfig: UserConfig = getDefaultUserConfig();
			userConfig.displayDate = original;
			const wrapper = render(NavigationControls, {
				global: { provide: { [USER_CONFIG_KEY]: userConfig } },
			});

			// Act
			const button = wrapper.getByRole("button", { name: "<<" });
			await fireEvent.click(button);

			// Assert
			expect(userConfig.displayDate).toEqual(expected);
		},
	);
});

describe("next", () => {
	it.each([
		{
			original: { month: 5, year: 2025 },
			expected: { month: 6, year: 2025 },
		},
		{
			original: { month: 11, year: 2025 },
			expected: { month: 0, year: 2026 },
		},
		{
			original: { month: undefined, year: 2025 },
			expected: { month: undefined, year: 2026 },
		},
	])(
		"changes the selected date from $original to",
		async ({ original, expected }) => {
			// Arrange
			const userConfig: UserConfig = getDefaultUserConfig();
			userConfig.displayDate = original;
			const wrapper = render(NavigationControls, {
				global: { provide: { [USER_CONFIG_KEY]: userConfig } },
			});

			// Act
			const button = wrapper.getByRole("button", { name: ">>" });
			await fireEvent.click(button);

			// Assert
			expect(userConfig.displayDate).toEqual(expected);
		},
	);
});
