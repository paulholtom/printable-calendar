import {
	getDefaultIcsCalendar,
	getDefaultIcsCalendarCollection,
	ICS_CALENDAR_COLLECTION_KEY,
	IcsCalendarCollection,
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

it("displays the dialog for adding a calendar if a calendar directory is already set", async () => {
	// Arrange
	const wrapper = render(CalendarListControls, {
		global: {
			provide: {
				[USER_CONFIG_KEY]: ref({
					...getDefaultUserConfig(),
					calendarDirectory: "some-directory",
				}),
				[ICS_CALENDAR_COLLECTION_KEY]: ref(
					getDefaultIcsCalendarCollection(),
				),
			},
		},
	});

	// Act
	await fireEvent.click(
		wrapper.getByRole("button", { name: "Add a Calendar" }),
	);

	// Assert
	const dialog = wrapper.getByRole("dialog");
	within(dialog).getByText("Enter a Name");
});

it.each([{ buttonName: "Cancel" }, { buttonName: "Close" }])(
	"closes the add calendar dialog without adding a calender if $buttonName is clicked",
	async ({ buttonName }) => {
		// Arrange
		const calendarCollection = ref(getDefaultIcsCalendarCollection());
		const wrapper = render(CalendarListControls, {
			global: {
				provide: {
					[USER_CONFIG_KEY]: ref({
						...getDefaultUserConfig(),
						calendarDirectory: "some-directory",
					}),
					[ICS_CALENDAR_COLLECTION_KEY]: calendarCollection,
				},
			},
		});

		// Act
		await fireEvent.click(
			wrapper.getByRole("button", { name: "Add a Calendar" }),
		);
		const dialog = wrapper.getByRole("dialog");
		await fireEvent.click(
			within(dialog).getByRole("button", { name: buttonName }),
		);

		// Assert
		expect(wrapper.queryByRole("dialog")).toBeNull();
		expect(calendarCollection.value).toEqual({});
	},
);

it("shows an error and adds nothing if no name is entered when trying to create a new calendar", async () => {
	// Arrange
	const calendarCollection = ref(getDefaultIcsCalendarCollection());
	const wrapper = render(CalendarListControls, {
		global: {
			provide: {
				[USER_CONFIG_KEY]: ref({
					...getDefaultUserConfig(),
					calendarDirectory: "some-directory",
				}),
				[ICS_CALENDAR_COLLECTION_KEY]: calendarCollection,
			},
		},
	});

	// Act
	await fireEvent.click(
		wrapper.getByRole("button", { name: "Add a Calendar" }),
	);
	const dialog = wrapper.getByRole("dialog");
	await fireEvent.click(
		within(dialog).getByRole("button", { name: "Create Calendar" }),
	);

	// Assert
	within(wrapper.getByRole("alertdialog")).getByText("Enter a name.");
	expect(calendarCollection.value).toEqual(getDefaultIcsCalendarCollection());
});

it("shows an error and adds nothing if the name of an existing calendar is entered when trying to create a new calendar", async () => {
	// Arrange
	const existingCalendarName = "existingCalendarName";
	const calendarCollection = ref<IcsCalendarCollection>({
		...getDefaultIcsCalendarCollection(),
		[existingCalendarName]: getDefaultIcsCalendar(),
	});
	const wrapper = render(CalendarListControls, {
		global: {
			provide: {
				[USER_CONFIG_KEY]: ref({
					...getDefaultUserConfig(),
					calendarDirectory: "some-directory",
				}),
				[ICS_CALENDAR_COLLECTION_KEY]: calendarCollection,
			},
		},
	});

	// Act
	await fireEvent.click(
		wrapper.getByRole("button", { name: "Add a Calendar" }),
	);
	const dialog = wrapper.getByRole("dialog");
	await fireEvent.update(
		within(dialog).getByLabelText("Name"),
		existingCalendarName,
	);
	await fireEvent.click(
		within(dialog).getByRole("button", { name: "Create Calendar" }),
	);

	// Assert
	within(wrapper.getByRole("alertdialog")).getByText(
		"A calendar with that name already exists.",
	);
	expect(calendarCollection.value).toEqual({
		...getDefaultIcsCalendarCollection(),
		[existingCalendarName]: getDefaultIcsCalendar(),
	});
});

it("creates a new calendar and closes the dialog when a valid name is provided", async () => {
	// Arrange
	const newCalendarName = "existingCalendarName";
	const calendarCollection = ref<IcsCalendarCollection>(
		getDefaultIcsCalendarCollection(),
	);
	const wrapper = render(CalendarListControls, {
		global: {
			provide: {
				[USER_CONFIG_KEY]: ref({
					...getDefaultUserConfig(),
					calendarDirectory: "some-directory",
				}),
				[ICS_CALENDAR_COLLECTION_KEY]: calendarCollection,
			},
		},
	});

	// Act
	await fireEvent.click(
		wrapper.getByRole("button", { name: "Add a Calendar" }),
	);
	const dialog = wrapper.getByRole("dialog");
	await fireEvent.update(
		within(dialog).getByLabelText("Name"),
		newCalendarName,
	);
	await fireEvent.click(
		within(dialog).getByRole("button", { name: "Create Calendar" }),
	);

	// Assert
	expect(wrapper.queryByRole("dialog")).toBeNull();
	expect(calendarCollection.value).toEqual({
		...getDefaultIcsCalendarCollection(),
		[newCalendarName]: getDefaultIcsCalendar(),
	});
});

it("toggles the disabled value of calenders when clicking on the checkboxes for them", async () => {
	// Arrange
	const calendarName = "some-calendar";
	const userConfig = ref<UserConfig>({
		...getDefaultUserConfig(),
		calendarDirectory: "some-directory",
		calendars: { [calendarName]: { disabled: false } },
	});
	const calendarCollection = ref<IcsCalendarCollection>({
		...getDefaultIcsCalendarCollection(),
		[calendarName]: getDefaultIcsCalendar(),
	});
	const wrapper = render(CalendarListControls, {
		global: {
			provide: {
				[USER_CONFIG_KEY]: userConfig,
				[ICS_CALENDAR_COLLECTION_KEY]: calendarCollection,
			},
		},
	});

	// Act
	await fireEvent.click(wrapper.getByLabelText(calendarName));

	// Assert
	expect(userConfig.value.calendars[calendarName]?.disabled).toBe(true);
});
