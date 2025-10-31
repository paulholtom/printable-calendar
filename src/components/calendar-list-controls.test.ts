import {
	getDefaultIcsCalendarCollection,
	ICS_CALENDAR_COLLECTION_KEY,
} from "@/calendar-events";
import { ElectronApi } from "@/electron-api";
import {
	getDefaultUserConfig,
	USER_CONFIG_KEY,
	UserConfig,
} from "@/user-config";
import { fireEvent, render, within } from "@testing-library/vue";
import { beforeEach, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";
import CalendarListControls from "./calendar-list-controls.vue";

const mockElectronApi = {
	readUserConfigFile: vi.fn(),
	writeUserConfigFile: vi.fn(),
	readCalendarFiles: vi.fn(),
	writeCalendarFile: vi.fn(),
	printToPdf: vi.fn(),
	selectDirectory: vi.fn(),
	closeWindow: vi.fn(),
} satisfies ElectronApi;

beforeEach(() => {
	vi.resetAllMocks();

	window.electronApi = mockElectronApi;
});

it("displays the selected calendar directory", () => {
	// Arrange
	const calendarDirectory = "some-directory";
	const userConfig: UserConfig = {
		...getDefaultUserConfig(),
		calendarDirectory,
	};

	// Act
	const wrapper = render(CalendarListControls, {
		global: {
			provide: {
				[USER_CONFIG_KEY]: ref(userConfig),
				[ICS_CALENDAR_COLLECTION_KEY]: ref(
					getDefaultIcsCalendarCollection(),
				),
			},
		},
	});

	// Assert
	wrapper.getByText(calendarDirectory);
});

it("shows an error message if trying to add a calendar without specifying the calendar directory", async () => {
	// Arrange
	const wrapper = render(CalendarListControls, {
		global: {
			provide: {
				[USER_CONFIG_KEY]: ref(getDefaultUserConfig()),
				[ICS_CALENDAR_COLLECTION_KEY]: ref(
					getDefaultIcsCalendarCollection(),
				),
			},
		},
	});
	mockElectronApi.selectDirectory.mockResolvedValue(undefined);

	// Act
	await fireEvent.click(
		wrapper.getByRole("button", { name: "Add a Calendar" }),
	);
	await nextTick();

	// Assert
	expect(mockElectronApi.selectDirectory).toHaveBeenCalledWith(
		"Choose Calendar Directory",
	);
	wrapper.getByText("You have to set a directory for your calendars.");
});

it("displays the dialog for adding a calendar if a calendar directory is selected", async () => {
	// Arrange
	const wrapper = render(CalendarListControls, {
		global: {
			provide: {
				[USER_CONFIG_KEY]: ref(getDefaultUserConfig()),
				[ICS_CALENDAR_COLLECTION_KEY]: ref(
					getDefaultIcsCalendarCollection(),
				),
			},
		},
	});
	mockElectronApi.selectDirectory.mockResolvedValue("some-directory");

	// Act
	await fireEvent.click(
		wrapper.getByRole("button", { name: "Add a Calendar" }),
	);
	await nextTick();

	// Assert
	const dialog = wrapper.getByRole("dialog");
	within(dialog).getByText("Enter a Name");
});
