import {
	CalendarEvent,
	CalendarEventCollection,
	CalendarEvents,
	getDefaultCalendarEvent,
	getDefaultCalendarEventCollection,
	provideCalendarEventCollection,
} from "@/calendar-events";
import { render } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
	readCalendarEventsFile: vi.fn(),
	writeCalendarEventsFile: vi.fn(),
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

function createUserConfigPromise(userConfig: UserConfig): Promise<string> {
	const { promise: filePromise, resolve: resolveFilePromise } =
		Promise.withResolvers<string>();
	mockElectronApi.readUserConfigFile.mockImplementationOnce(
		() => filePromise,
	);
	resolveFilePromise(JSON.stringify(userConfig));

	return filePromise;
}

describe("configFile", () => {
	it("parses and provides the config file", async () => {
		// Arrange
		const pdfDirectory = "directory-from-config";
		const userConfig: UserConfig = {
			...getDefaultUserConfig(),
			pdfDirectory,
		};
		const filePromise = createUserConfigPromise(userConfig);

		// Act
		render(App);
		// wait for the file to be parsed.
		await filePromise;

		// Assert
		expect(provideUserConfig).toHaveBeenCalledWith(userConfig);
	});

	it("saves changes made to the user config", async () => {
		// Arrange
		const pdfDirectory = "new-pdf-directory";
		const userConfig: UserConfig = getDefaultUserConfig();
		const filePromise = createUserConfigPromise(userConfig);
		render(App);
		await filePromise;

		// Act
		const providedConfig = vi.mocked(provideUserConfig).mock.calls[0][0];
		providedConfig.pdfDirectory = pdfDirectory;
		await nextTick();

		// Assert
		const expectedConfig: UserConfig = {
			...userConfig,
			pdfDirectory,
		};
		expect(mockElectronApi.writeUserConfigFile).toHaveBeenCalledWith(
			JSON.stringify(expectedConfig),
		);
	});
});

describe("calendarEventsFile", () => {
	function createCalendarEventsPromise(
		calendarEvents: CalendarEvents,
	): Promise<string> {
		const { promise: filePromise, resolve: resolveFilePromise } =
			Promise.withResolvers<string>();
		mockElectronApi.readCalendarEventsFile.mockImplementationOnce(
			() => filePromise,
		);
		resolveFilePromise(JSON.stringify(calendarEvents));

		return filePromise;
	}

	it("parses and provides the calendar event collection", async () => {
		// Arrange
		const calendarEvents: CalendarEvents = [getDefaultCalendarEvent()];
		const filePromise = createCalendarEventsPromise(calendarEvents);

		// Act
		render(App);
		// wait for the file to be parsed.
		await filePromise;

		// Assert

		const expectedCollection: CalendarEventCollection = {
			...getDefaultCalendarEventCollection(),
			default: calendarEvents,
		};
		expect(provideCalendarEventCollection).toHaveBeenCalledWith(
			expectedCollection,
		);
	});

	it("saves changes made to the calendar events", async () => {
		// Arrange
		const newEvent: CalendarEvent = getDefaultCalendarEvent();
		const calendarEvents: CalendarEvents = [];
		const filePromise = createCalendarEventsPromise(calendarEvents);
		render(App);
		await filePromise;

		// Act
		const providedConfig = vi.mocked(provideCalendarEventCollection).mock
			.calls[0][0];
		providedConfig.default.push(newEvent);
		await nextTick();

		// Assert
		const expectedEvents: CalendarEvents = [newEvent];
		expect(mockElectronApi.writeCalendarEventsFile).toHaveBeenCalledWith(
			JSON.stringify(expectedEvents),
		);
	});
});

describe("calendar display", () => {
	it("displays a single month if one is specified in the user config", async () => {
		// Arrange
		const userConfig: UserConfig = getDefaultUserConfig();
		userConfig.displayDate.month = 0;
		const filePromise = createUserConfigPromise(userConfig);

		// Act
		const wrapper = render(App);
		// wait for the file to be parsed.
		await filePromise;

		// Assert
		expect(wrapper.getAllByRole("grid").length).toBe(1);
	});

	it("displays an entire year if no month is specified", async () => {
		// Arrange
		const userConfig: UserConfig = getDefaultUserConfig();
		userConfig.displayDate.month = undefined;
		const filePromise = createUserConfigPromise(userConfig);

		// Act
		const wrapper = render(App);
		// wait for the file to be parsed.
		await filePromise;

		// Assert
		expect(wrapper.getAllByRole("grid").length).toBe(12);
	});
});
