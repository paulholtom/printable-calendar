import {
	getDefaultIcsCalendar,
	getDefaultIcsCalendarCollection,
	getDefaultIcsEvent,
	ICS_CALENDAR_COLLECTION_KEY,
	IcsCalendarCollection,
} from "@/calendar-events";
import { convertGoogleContactsToCalendar } from "@/convert-contacts";
import { ElectronApi } from "@/electron-api";
import {
	getDefaultCalendarOptions,
	getDefaultUserConfig,
	USER_CONFIG_KEY,
	UserConfig,
} from "@/user-config";
import { fireEvent, render, within } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";
import CalendarListControls from "./calendar-list-controls.vue";

vi.mock(import("@/convert-contacts"));

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

describe.each([
	{ addButtonName: "Add a Calendar" },
	{ addButtonName: "Import Contacts" },
])("$buttonName", ({ addButtonName }) => {
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
			wrapper.getByRole("button", { name: addButtonName }),
		);
		await nextTick();

		// Assert
		const dialog = wrapper.getByRole("dialog");
		within(dialog).getByText("Create a Calendar");
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
			wrapper.getByRole("button", { name: addButtonName }),
		);

		// Assert
		const dialog = wrapper.getByRole("dialog");
		within(dialog).getByText("Create a Calendar");
	});

	it.each([{ closeButtonName: "Cancel" }, { closeButtonName: "Close" }])(
		"closes the add calendar dialog without adding a calender if $buttonName is clicked",
		async ({ closeButtonName }) => {
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
				within(dialog).getByRole("button", { name: closeButtonName }),
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
			wrapper.getByRole("button", { name: addButtonName }),
		);
		const dialog = wrapper.getByRole("dialog");
		await fireEvent.click(
			within(dialog).getByRole("button", { name: "Create Calendar" }),
		);

		// Assert
		within(wrapper.getByRole("alertdialog")).getByText("Enter a name.");
		expect(calendarCollection.value).toEqual(
			getDefaultIcsCalendarCollection(),
		);
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
			wrapper.getByRole("button", { name: addButtonName }),
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
});

describe("Add a Calendar", () => {
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
});

describe("Import Contacts", () => {
	it("shows an error and adds nothing if no file is selected", async () => {
		// Arrange
		const calendarName = "calendar-name";
		const calendarCollection = ref<IcsCalendarCollection>({
			...getDefaultIcsCalendarCollection(),
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
			wrapper.getByRole("button", { name: "Import Contacts" }),
		);
		const dialog = wrapper.getByRole("dialog");
		await fireEvent.update(
			within(dialog).getByLabelText("Name"),
			calendarName,
		);
		await fireEvent.click(
			within(dialog).getByRole("button", { name: "Create Calendar" }),
		);

		// Assert
		within(wrapper.getByRole("alertdialog")).getByText(
			"You haven't selected a file to import.",
		);
		expect(calendarCollection.value).toEqual({
			...getDefaultIcsCalendarCollection(),
		});
	});

	it("shows an error and adds nothing if a file is selected then unselected", async () => {
		// Arrange
		const calendarName = "calendar-name";
		const calendarCollection = ref<IcsCalendarCollection>({
			...getDefaultIcsCalendarCollection(),
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
			wrapper.getByRole("button", { name: "Import Contacts" }),
		);
		const dialog = wrapper.getByRole("dialog");
		await fireEvent.update(
			within(dialog).getByLabelText("Name"),
			calendarName,
		);
		const fileInput = within(dialog).getByLabelText(
			"Select File",
		) as HTMLInputElement;
		const mockFilesGet = vi.fn();
		Object.defineProperty(fileInput, "files", { get: mockFilesGet });
		mockFilesGet.mockReturnValue([{ text: () => "some-text" }]);
		await fireEvent.update(fileInput);
		mockFilesGet.mockReturnValue([]);
		await fireEvent.update(fileInput);
		await fireEvent.click(
			within(dialog).getByRole("button", { name: "Create Calendar" }),
		);

		// Assert
		within(wrapper.getByRole("alertdialog")).getByText(
			"You haven't selected a file to import.",
		);
		expect(calendarCollection.value).toEqual({
			...getDefaultIcsCalendarCollection(),
		});
	});

	it("shows any errors returned from trying to convert the selected file to a calendar", async () => {
		// Arrange
		const calendarName = "calendar-name";
		const calendarCollection = ref<IcsCalendarCollection>({
			...getDefaultIcsCalendarCollection(),
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
		const fileContent = "some-content";
		const expectedErrorMessage = "bad-file";
		vi.mocked(convertGoogleContactsToCalendar).mockReturnValue([
			new Error(expectedErrorMessage),
		]);

		// Act
		await fireEvent.click(
			wrapper.getByRole("button", { name: "Import Contacts" }),
		);
		const dialog = wrapper.getByRole("dialog");
		await fireEvent.update(
			within(dialog).getByLabelText("Name"),
			calendarName,
		);
		const fileInput = within(dialog).getByLabelText(
			"Select File",
		) as HTMLInputElement;
		const mockFilesGet = vi.fn();
		Object.defineProperty(fileInput, "files", { get: mockFilesGet });
		mockFilesGet.mockReturnValue([{ text: () => fileContent }]);
		await fireEvent.update(fileInput);
		await fireEvent.click(
			within(dialog).getByRole("button", { name: "Create Calendar" }),
		);

		// Assert
		expect(convertGoogleContactsToCalendar).toHaveBeenCalledWith(
			fileContent,
		);
		within(wrapper.getByRole("alertdialog")).getByText(
			expectedErrorMessage,
		);
		expect(calendarCollection.value).toEqual({
			...getDefaultIcsCalendarCollection(),
		});
	});

	it("adds a new calendar to the collection if one is created successfully", async () => {
		// Arrange
		const calendarName = "calendar-name";
		const calendarCollection = ref<IcsCalendarCollection>({
			...getDefaultIcsCalendarCollection(),
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
		const fileContent = "some-content";
		const newCalendar = getDefaultIcsCalendar();
		newCalendar.events = [getDefaultIcsEvent()];
		vi.mocked(convertGoogleContactsToCalendar).mockReturnValue(newCalendar);

		// Act
		await fireEvent.click(
			wrapper.getByRole("button", { name: "Import Contacts" }),
		);
		const dialog = wrapper.getByRole("dialog");
		await fireEvent.update(
			within(dialog).getByLabelText("Name"),
			calendarName,
		);
		const fileInput = within(dialog).getByLabelText(
			"Select File",
		) as HTMLInputElement;
		const mockFilesGet = vi.fn();
		Object.defineProperty(fileInput, "files", { get: mockFilesGet });
		mockFilesGet.mockReturnValue([{ text: () => fileContent }]);
		await fireEvent.update(fileInput);
		await fireEvent.click(
			within(dialog).getByRole("button", { name: "Create Calendar" }),
		);

		// Assert
		expect(calendarCollection.value).toEqual({
			...getDefaultIcsCalendarCollection(),
			[calendarName]: newCalendar,
		});
	});
});

it("toggles the disabled value of calenders when clicking on the checkboxes for them", async () => {
	// Arrange
	const calendarName = "some-calendar";
	const userConfig = ref<UserConfig>({
		...getDefaultUserConfig(),
		calendarDirectory: "some-directory",
		calendars: {
			[calendarName]: { ...getDefaultCalendarOptions(), disabled: false },
		},
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

it("sets the background colour of calendars", async () => {
	// Arrange
	const calendarName = "some-calendar";
	const userConfig = ref<UserConfig>({
		...getDefaultUserConfig(),
		calendarDirectory: "some-directory",
		calendars: {
			[calendarName]: { ...getDefaultCalendarOptions(), disabled: false },
		},
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
	const newColour = "#cccccc";

	// Act
	const calendarGroup = wrapper.getByRole("group", { name: calendarName });
	await fireEvent.update(
		within(calendarGroup).getByLabelText("Background"),
		newColour,
	);

	// Assert
	expect(userConfig.value.calendars[calendarName]?.backgroundColour).toBe(
		newColour,
	);
});

it("sets the foreground colour of calendars", async () => {
	// Arrange
	const calendarName = "some-calendar";
	const userConfig = ref<UserConfig>({
		...getDefaultUserConfig(),
		calendarDirectory: "some-directory",
		calendars: {
			[calendarName]: { ...getDefaultCalendarOptions(), disabled: false },
		},
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
	const newColour = "#cccccc";

	// Act
	const calendarGroup = wrapper.getByRole("group", { name: calendarName });
	await fireEvent.update(
		within(calendarGroup).getByLabelText("Text"),
		newColour,
	);

	// Assert
	expect(userConfig.value.calendars[calendarName]?.foregroundColour).toBe(
		newColour,
	);
});
