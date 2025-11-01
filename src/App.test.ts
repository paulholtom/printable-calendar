import {
	CalendarFileContents,
	getDefaultIcsCalendar,
	getDefaultIcsCalendarCollection,
	getDefaultIcsEvent,
	IcsCalendarCollection,
	provideIcsCalendarCollection,
	serializeIcsCalendar,
} from "@/calendar-events";
import { fireEvent, render, RenderResult, within } from "@testing-library/vue";
import { IcsCalendar, IcsEvent } from "ts-ics";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import App from "./App.vue";
import { ElectronApi } from "./electron-api";
import {
	getDefaultUserConfig,
	provideUserConfig,
	UserConfig,
} from "./user-config";

vi.mock(import("@/user-config"), { spy: true });
vi.mock(import("@/calendar-events"), { spy: true });

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

const CALENDAR_DIRECTORY = "calendar-directory";
const FIRST_CALENDAR_NAME = "first-calendar-name";
const SECOND_CALENDAR_NAME = "second-calendar-name";

/**
 * @returns Gets a user config with the settings required to show the primary components.
 */
function getUserConfigWithRequiredSettings(): UserConfig {
	return {
		...getDefaultUserConfig(),
		calendarDirectory: CALENDAR_DIRECTORY,
		calendars: { [FIRST_CALENDAR_NAME]: { disabled: false } },
	};
}

function createFilePromises(fileContents?: {
	userConfig?: UserConfig | string;
	calendars?: Record<string, string>;
}): Promise<unknown>[] {
	// Config file
	const { promise: configFilePromise, resolve: resolveConfigFilePromise } =
		Promise.withResolvers<string>();
	mockElectronApi.readUserConfigFile.mockImplementationOnce(
		() => configFilePromise,
	);
	resolveConfigFilePromise(
		typeof fileContents?.userConfig === "string"
			? fileContents.userConfig
			: JSON.stringify(
					fileContents?.userConfig ??
						getUserConfigWithRequiredSettings(),
				),
	);

	const {
		promise: calendarFilesPromise,
		resolve: resolveCalendarFilesPromise,
	} = Promise.withResolvers<CalendarFileContents>();
	mockElectronApi.readCalendarFiles.mockImplementationOnce(
		() => calendarFilesPromise,
	);
	resolveCalendarFilesPromise(
		fileContents?.calendars ?? {
			[FIRST_CALENDAR_NAME]: serializeIcsCalendar(
				getDefaultIcsCalendar(),
			),
		},
	);

	return [configFilePromise, calendarFilesPromise];
}

function getProvidedCalendarCollection() {
	return vi.mocked(provideIcsCalendarCollection).mock.calls[0][0];
}

it("displays a progress bar until the files are loaded", async () => {
	// Arrange
	const filePromises = createFilePromises();

	// Act
	const wrapper = render(App);

	// Assert
	wrapper.getByRole("progressbar");
	await filePromises;
	expect(wrapper.queryByRole("progressbar")).toBeNull();
});

it("does not initially display any dialogs", async () => {
	// Arrange
	const filePromises = createFilePromises();

	// Act
	const wrapper = render(App);
	await Promise.all(filePromises);

	// Assert
	expect(wrapper.queryByRole("dialog")).toBeNull();
});

describe("configFile", () => {
	it("displays an error if there is an issue parsing the file", async () => {
		// Arrange
		const userConfig = "bad file";
		const filePromises = createFilePromises({ userConfig });

		// Act
		const wrapper = render(App);
		// wait for the file to be parsed.
		await Promise.all(filePromises);
		await nextTick();

		// Assert
		expect(mockElectronApi.writeCalendarFile).not.toHaveBeenCalled();
		expect(wrapper.getByRole("alert").textContent).contains(
			"Error reading config file",
		);
	});

	it("parses and provides the config file without writing it back out immediately", async () => {
		// Arrange
		const pdfDirectory = "directory-from-config";
		const userConfig: UserConfig = {
			...getDefaultUserConfig(),
			pdfDirectory,
		};
		const filePromises = createFilePromises({ userConfig });

		// Act
		render(App);
		// wait for the files to be read.
		await Promise.all(filePromises);

		// // Assert
		expect(mockElectronApi.writeUserConfigFile).not.toHaveBeenCalled();
		// There's no good way to compare the provided ref with any expected value, so check the value of the provided ref.
		expect(vi.mocked(provideUserConfig).mock.calls[0][0].value).toEqual(
			userConfig,
		);
	});

	it("saves changes made to the user config", async () => {
		// Arrange
		const pdfDirectory = "new-pdf-directory";
		const userConfig: UserConfig = getDefaultUserConfig();
		const filePromises = createFilePromises({ userConfig });
		render(App);
		await Promise.all(filePromises);

		// Act
		const providedConfig = vi.mocked(provideUserConfig).mock.calls[0][0];
		providedConfig.value.pdfDirectory = pdfDirectory;
		await nextTick();

		// Assert
		expect(mockElectronApi.writeUserConfigFile).toHaveBeenCalledTimes(1);
		const expectedConfig: UserConfig = {
			...userConfig,
			pdfDirectory,
		};
		expect(mockElectronApi.writeUserConfigFile).toHaveBeenCalledWith(
			JSON.stringify(expectedConfig),
		);
	});
});

describe("calendar collection", () => {
	it("displays an error if there is an issue parsing the file", async () => {
		// Arrange
		const calendar = "bad file";
		const filePromises = createFilePromises({
			calendars: { [FIRST_CALENDAR_NAME]: calendar },
		});

		// Act
		const wrapper = render(App);
		// wait for the file to be parsed.
		await Promise.all(filePromises);
		await nextTick();

		// Assert
		expect(mockElectronApi.writeCalendarFile).not.toHaveBeenCalled();
		expect(wrapper.getByRole("alert").textContent).contains(
			"Error reading calendar file",
		);
	});

	it("parses and provides the calendar event collection without writing it back out immediately", async () => {
		// Arrange
		const calendar = getDefaultIcsCalendar();
		const filePromises = createFilePromises();

		// Act
		render(App);
		// wait for the file to be parsed.
		await Promise.all(filePromises);
		await nextTick();

		// Assert
		expect(mockElectronApi.writeCalendarFile).not.toHaveBeenCalled();
		const expectedCollection: IcsCalendarCollection = {
			...getDefaultIcsCalendarCollection(),
			[FIRST_CALENDAR_NAME]: calendar,
		};
		expect(
			vi.mocked(provideIcsCalendarCollection).mock.calls[0][0].value,
		).toEqual(expectedCollection);
	});

	it("parses and provides the calendar event collection from the new location when the calendar directory is changed without writing it back out immediately", async () => {
		// Arrange
		const originalCalendar: IcsCalendar = {
			...getDefaultIcsCalendar(),
			name: "original",
		};
		const filePromises = createFilePromises({
			calendars: {
				[FIRST_CALENDAR_NAME]: serializeIcsCalendar(originalCalendar),
			},
		});
		const {
			promise: altCalendarFilesPromise,
			resolve: resolveAltCalendarFilesPromise,
		} = Promise.withResolvers<CalendarFileContents>();
		const altCalendarName = "different-calendar";
		const altCalendar: IcsCalendar = {
			...getDefaultIcsCalendar(),
			name: "alternte",
		};
		mockElectronApi.readCalendarFiles.mockImplementationOnce(
			() => altCalendarFilesPromise,
		);
		resolveAltCalendarFilesPromise({
			[altCalendarName]: serializeIcsCalendar(altCalendar),
		});
		mockElectronApi.selectDirectory.mockResolvedValueOnce("new-directory");

		// Act
		const wrapper = render(App);
		await Promise.all(filePromises);
		await nextTick();
		await fireEvent.click(
			wrapper.getByRole("button", { name: "Select Calendar Directory" }),
		);
		await altCalendarFilesPromise;

		// Assert
		expect(mockElectronApi.writeCalendarFile).not.toHaveBeenCalled();
		const expectedCollection: IcsCalendarCollection = {
			...getDefaultIcsCalendarCollection(),
			[altCalendarName]: altCalendar,
		};
		expect(
			vi.mocked(provideIcsCalendarCollection).mock.calls[0][0].value,
		).toEqual(expectedCollection);
	});

	it("saves changes made to the calendar events", async () => {
		// Arrange
		const newEvent = getDefaultIcsEvent();
		const calendar: IcsCalendar = getDefaultIcsCalendar();
		const filePromises = createFilePromises({
			calendars: {
				[FIRST_CALENDAR_NAME]: serializeIcsCalendar(calendar),
			},
		});
		render(App);
		await Promise.all(filePromises);

		// Act
		const providedCalendarCollection = getProvidedCalendarCollection();
		if (providedCalendarCollection.value[FIRST_CALENDAR_NAME]) {
			providedCalendarCollection.value[FIRST_CALENDAR_NAME].events = [];
			providedCalendarCollection.value[FIRST_CALENDAR_NAME].events.push(
				newEvent,
			);
		}
		await nextTick();

		// Assert
		expect(mockElectronApi.writeCalendarFile).toHaveBeenCalledTimes(1);
		const expectedEvents: IcsCalendar = {
			...getDefaultIcsCalendar(),
			events: [newEvent],
		};
		expect(mockElectronApi.writeCalendarFile).toHaveBeenCalledWith(
			CALENDAR_DIRECTORY,
			FIRST_CALENDAR_NAME,
			serializeIcsCalendar(expectedEvents),
		);
	});

	it("does not overwrite existing files if a calendar is removed from the collection", async () => {
		// Arrange
		const filePromises = createFilePromises();
		render(App);
		await Promise.all(filePromises);

		// Act
		const providedCalendarCollection = getProvidedCalendarCollection();
		if (providedCalendarCollection.value[FIRST_CALENDAR_NAME]) {
			providedCalendarCollection.value[FIRST_CALENDAR_NAME] = undefined;
		}
		await nextTick();

		// Assert
		expect(mockElectronApi.writeCalendarFile).not.toHaveBeenCalled();
	});

	it("displays a warning if trying to add an event when no calendars exist", async () => {
		// Arrange
		const filePromises = createFilePromises({ calendars: {} });
		const wrapper = render(App);
		await Promise.all(filePromises);
		await nextTick();

		// Act
		await fireEvent.click(
			wrapper.getByRole("button", { name: "Add Event" }),
		);

		// Assert
		within(wrapper.getByRole("alertdialog")).getByText(
			"Tried to add an event while there are no available calendars.",
		);
	});
});

describe("calendar display", () => {
	it("displays a single month if one is specified in the user config", async () => {
		// Arrange
		const userConfig: UserConfig = getUserConfigWithRequiredSettings();
		userConfig.displayDate.month = 0;
		const filePromises = createFilePromises({ userConfig });

		// Act
		const wrapper = render(App);
		// wait for the file to be parsed.
		await Promise.all(filePromises);
		await nextTick();

		// Assert
		expect(wrapper.getAllByRole("grid").length).toBe(1);
	});

	it("displays an entire year if no month is specified", async () => {
		// Arrange
		const userConfig: UserConfig = getUserConfigWithRequiredSettings();
		userConfig.displayDate.month = undefined;
		const filePromises = createFilePromises({ userConfig });

		// Act
		const wrapper = render(App);
		// wait for the file to be parsed.
		await Promise.all(filePromises);
		await nextTick();

		// Assert
		expect(wrapper.getAllByRole("grid").length).toBe(12);
	});
});

describe("event editing", () => {
	it("displays the event editing dialog if the add event button is clicked", async () => {
		// Arrange
		const filePromises = createFilePromises();
		const wrapper = render(App);
		await Promise.all(filePromises);
		await nextTick();

		// Act
		const addButton = wrapper.getByRole("button", { name: "Add Event" });
		await fireEvent.click(addButton);

		// Assert
		wrapper.getByRole("dialog");
	});

	it("displays the event creation dialog if a specific day is clicked on a monthly calendar", async () => {
		// Arrange
		const userConfig: UserConfig = getUserConfigWithRequiredSettings();
		userConfig.displayDate.month = 5;
		userConfig.displayDate.year = 2025;
		const filePromises = createFilePromises({
			userConfig,
		});
		const wrapper = render(App);
		await Promise.all(filePromises);
		await nextTick();

		// Act
		const dateButton = wrapper.getByText("10");
		await fireEvent.click(dateButton);

		// Assert
		wrapper.getByRole("dialog");
	});

	it("displays the event creation dialog if a specific day is clicked on a yearly calendar", async () => {
		// Arrange
		const userConfig: UserConfig = getUserConfigWithRequiredSettings();
		userConfig.displayDate.month = undefined;
		userConfig.displayDate.year = 2025;
		const filePromises = createFilePromises({
			userConfig,
		});
		const wrapper = render(App);
		await Promise.all(filePromises);
		await nextTick();

		// Act
		const january = wrapper.getAllByRole("grid")[0];
		const dateButton = within(january).getByText("10");
		await fireEvent.click(dateButton);

		// Assert
		wrapper.getByRole("dialog");
	});

	it("saves an event created through the dialog", async () => {
		// Arrange
		const newEventSummary = "My shiny new event";
		const filePromises = createFilePromises();
		const wrapper = render(App);
		await Promise.all(filePromises);
		await nextTick();
		const addButton = wrapper.getByRole("button", { name: "Add Event" });
		await fireEvent.click(addButton);

		// Act
		const dialog = wrapper.getByRole("dialog");
		const dateInput = within(dialog).getByLabelText("Date");
		await fireEvent.update(dateInput, "2010-05-03");
		const summaryInput = within(dialog).getByLabelText("Summary");
		await fireEvent.update(summaryInput, newEventSummary);
		const saveButton = within(dialog).getByRole("button", { name: "Save" });
		await fireEvent.click(saveButton);

		// Assert
		const collection = getProvidedCalendarCollection();
		expect(collection.value[FIRST_CALENDAR_NAME]?.events).toEqual([
			expect.objectContaining({
				summary: newEventSummary,
				start: expect.objectContaining({ date: new Date(2010, 4, 3) }),
			}),
		]);
	});

	it.each([{ buttonName: "Cancel" }, { buttonName: "Close" }])(
		"does not create a new event if the $buttonName button is clicked",
		async ({ buttonName }) => {
			// Arrange
			const filePromises = createFilePromises();
			const wrapper = render(App);
			await Promise.all(filePromises);
			await nextTick();
			const addButton = wrapper.getByRole("button", {
				name: "Add Event",
			});
			await fireEvent.click(addButton);

			// Act
			const dialog = wrapper.getByRole("dialog");
			const saveButton = within(dialog).getByRole("button", {
				name: buttonName,
			});
			await fireEvent.click(saveButton);

			// Assert
			const collection = getProvidedCalendarCollection();
			expect(
				collection.value[FIRST_CALENDAR_NAME]?.events,
			).toBeUndefined();
		},
	);

	async function renderAppWithClickableEvent(
		eventOrSummary: IcsEvent | string,
	): Promise<RenderResult> {
		const userConfig: UserConfig = getUserConfigWithRequiredSettings();
		userConfig.displayDate.month = 5;
		userConfig.displayDate.year = 2025;
		const calendar = getDefaultIcsCalendar();
		calendar.events = [
			typeof eventOrSummary == "string"
				? {
						...getDefaultIcsEvent(),
						start: { date: new Date(2025, 5, 6) },
						summary: eventOrSummary,
					}
				: { ...eventOrSummary, start: { date: new Date(2025, 5, 6) } },
		];
		const filePromises = createFilePromises({
			userConfig,
			calendars: {
				[FIRST_CALENDAR_NAME]: serializeIcsCalendar(calendar),
				[SECOND_CALENDAR_NAME]: serializeIcsCalendar(
					getDefaultIcsCalendar(),
				),
			},
		});
		const wrapper = render(App);
		await Promise.all(filePromises);
		await nextTick();

		return wrapper;
	}

	it("displays the event editing dialog when an event is clicked", async () => {
		// Arrange
		const eventSummary = "My Event";
		const wrapper = await renderAppWithClickableEvent(eventSummary);

		// Act
		const eventDisplay = wrapper.getByText(eventSummary);
		await fireEvent.click(eventDisplay);

		// Assert
		wrapper.getByRole("dialog");
	});

	it("displays an error if an event is clicked but that event can't be found", async () => {
		// Arrange
		const eventSummary = "My Event";
		const wrapper = await renderAppWithClickableEvent(eventSummary);

		// Act
		const calendarCollection = getProvidedCalendarCollection();
		if (calendarCollection.value[FIRST_CALENDAR_NAME]) {
			calendarCollection.value[FIRST_CALENDAR_NAME].events = [];
		}
		const eventDisplay = wrapper.getByText(eventSummary);
		await fireEvent.click(eventDisplay);

		// Assert
		wrapper.getByText("Could not find event to edit.");
	});

	it("deletes an event if the delete button is clicked", async () => {
		// Arrange
		const eventSummary = "My Event";
		const wrapper = await renderAppWithClickableEvent(eventSummary);
		const calendarCollection = getProvidedCalendarCollection();

		// Act
		const eventDisplay = wrapper.getByText(eventSummary);
		await fireEvent.click(eventDisplay);
		const dialog = wrapper.getByRole("dialog");
		const deleteButton = within(dialog).getByRole("button", {
			name: "Delete",
		});
		await fireEvent.click(deleteButton);
		await fireEvent.click(
			within(wrapper.getByRole("alertdialog")).getByRole("button", {
				name: "Yes",
			}),
		);

		// Assert
		expect(calendarCollection.value[FIRST_CALENDAR_NAME]?.events).toEqual(
			[],
		);
	});

	it("updates an event if the save button is clicked", async () => {
		// Arrange
		const originalEventSummary = "My Event";
		const newEventSummary = "My shiny new event";
		const wrapper = await renderAppWithClickableEvent(originalEventSummary);
		const calendarCollection = getProvidedCalendarCollection();

		// Act
		const eventDisplay = wrapper.getByText(originalEventSummary);
		await fireEvent.click(eventDisplay);
		const dialog = wrapper.getByRole("dialog");
		const summaryInput = within(dialog).getByLabelText("Summary");
		await fireEvent.update(summaryInput, newEventSummary);
		const saveButton = within(dialog).getByRole("button", { name: "Save" });
		await fireEvent.click(saveButton);

		// Assert
		expect(
			calendarCollection.value[FIRST_CALENDAR_NAME]?.events?.[0].summary,
		).toEqual(newEventSummary);
	});

	it("removes an event from the original calendar and adds it to the new one if the calendar is changed during editing", async () => {
		// Arrange
		const originalEventSummary = "My Event";
		const wrapper = await renderAppWithClickableEvent(originalEventSummary);
		const calendarCollection = getProvidedCalendarCollection();

		// Act
		const eventDisplay = wrapper.getByText(originalEventSummary);
		await fireEvent.click(eventDisplay);
		const dialog = wrapper.getByRole("dialog");
		const calendarInput = within(dialog).getByLabelText("Calendar");
		await fireEvent.update(calendarInput, SECOND_CALENDAR_NAME);
		const saveButton = within(dialog).getByRole("button", { name: "Save" });
		await fireEvent.click(saveButton);

		// Assert
		expect(calendarCollection.value[FIRST_CALENDAR_NAME]?.events).toEqual(
			[],
		);
		expect(calendarCollection.value[SECOND_CALENDAR_NAME]?.events).toEqual([
			expect.objectContaining({ summary: originalEventSummary }),
		]);
	});

	it("does not update the original event if cancel is clicked", async () => {
		// Arrange
		const originalEventSummary = "My Event";
		const newEventSummary = "My shiny new event";
		const wrapper = await renderAppWithClickableEvent(originalEventSummary);
		const calendarCollection = getProvidedCalendarCollection();

		// Act
		const eventDisplay = wrapper.getByText(originalEventSummary);
		await fireEvent.click(eventDisplay);
		const dialog = wrapper.getByRole("dialog");
		const summaryInput = within(dialog).getByLabelText("Summary");
		await fireEvent.update(summaryInput, newEventSummary);
		const cancelButton = within(dialog).getByRole("button", {
			name: "Cancel",
		});
		await fireEvent.click(cancelButton);

		// Assert
		expect(
			calendarCollection.value[FIRST_CALENDAR_NAME]?.events?.[0].summary,
		).toEqual(originalEventSummary);
	});
});
