import {
	getDefaultIcsCalendar,
	getDefaultIcsCalendarCollection,
	getDefaultIcsEvent,
	IcsCalendarCollection,
	provideIcsCalendarCollection,
} from "@/calendar-events";
import { render } from "@testing-library/vue";
import { generateIcsCalendar, IcsCalendar } from "ts-ics";
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
	readCalendarFile: vi.fn(),
	writeCalendarFile: vi.fn(),
	printToPdf: vi.fn(),
	selectDirectory: vi.fn(),
	closeWindow: vi.fn(),
} satisfies ElectronApi;

beforeEach(() => {
	vi.resetAllMocks();

	window.electronApi = mockElectronApi;
	window.alert = vi.fn();
});

function createFilePromises(fileContents?: {
	userConfig?: UserConfig;
	defaultCalendar?: IcsCalendar | string;
}): Promise<unknown>[] {
	// Config file
	const { promise: configFilePromise, resolve: resolveConfigFilePromise } =
		Promise.withResolvers<string>();
	mockElectronApi.readUserConfigFile.mockImplementationOnce(
		() => configFilePromise,
	);
	resolveConfigFilePromise(
		JSON.stringify(fileContents?.userConfig ?? getDefaultUserConfig()),
	);

	// Default calendar
	const {
		promise: defaultCalendarFilePromise,
		resolve: resolveDefaultCalendarFilePromise,
	} = Promise.withResolvers<string | undefined>();
	mockElectronApi.readCalendarFile.mockImplementationOnce(
		() => defaultCalendarFilePromise,
	);
	resolveDefaultCalendarFilePromise(
		typeof fileContents?.defaultCalendar === "string"
			? fileContents.defaultCalendar
			: fileContents?.defaultCalendar
				? generateIcsCalendar(fileContents.defaultCalendar)
				: undefined,
	);

	return [configFilePromise, defaultCalendarFilePromise];
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

describe("configFile", () => {
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

		// Assert
		expect(mockElectronApi.writeUserConfigFile).not.toHaveBeenCalled();
		expect(provideUserConfig).toHaveBeenCalledWith(userConfig);
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
		providedConfig.pdfDirectory = pdfDirectory;
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

describe("calendarEventsFile", () => {
	it("displays an error if there is an issue parsing the file", async () => {
		// Arrange
		const defaultCalendar = "bad file";
		const filePromises = createFilePromises({ defaultCalendar });

		// Act
		const wrapper = render(App);
		// wait for the file to be parsed.
		await Promise.all(filePromises);

		// Assert
		expect(mockElectronApi.writeCalendarFile).not.toHaveBeenCalled();
		wrapper.getByText("Error: Error reading calendar file.");
	});

	it("parses and provides the calendar event collection without writing it back out immediately", async () => {
		// Arrange
		const defaultCalendar = getDefaultIcsCalendar();
		const filePromises = createFilePromises({ defaultCalendar });

		// Act
		render(App);
		// wait for the file to be parsed.
		await Promise.all(filePromises);

		// Assert
		expect(mockElectronApi.writeCalendarFile).not.toHaveBeenCalled();
		const expectedCollection: IcsCalendarCollection = {
			...getDefaultIcsCalendarCollection(),
			default: defaultCalendar,
		};
		expect(provideIcsCalendarCollection).toHaveBeenCalledWith(
			expectedCollection,
		);
	});

	it("saves changes made to the calendar events", async () => {
		// Arrange
		const newEvent = getDefaultIcsEvent();
		const defaultCalendar: IcsCalendar = getDefaultIcsCalendar();
		const filePromises = createFilePromises({ defaultCalendar });
		render(App);
		await Promise.all(filePromises);

		// Act
		const providedCalendarCollection = vi.mocked(
			provideIcsCalendarCollection,
		).mock.calls[0][0];
		providedCalendarCollection.default.events = [];
		providedCalendarCollection.default.events.push(newEvent);
		await nextTick();

		// Assert
		expect(mockElectronApi.writeCalendarFile).toHaveBeenCalledTimes(1);
		const expectedEvents: IcsCalendar = {
			...getDefaultIcsCalendar(),
			events: [newEvent],
		};
		expect(mockElectronApi.writeCalendarFile).toHaveBeenCalledWith(
			generateIcsCalendar(expectedEvents),
		);
	});
});

describe("calendar display", () => {
	it("displays a single month if one is specified in the user config", async () => {
		// Arrange
		const userConfig: UserConfig = getDefaultUserConfig();
		userConfig.displayDate.month = 0;
		const filePromises = createFilePromises({ userConfig });

		// Act
		const wrapper = render(App);
		// wait for the file to be parsed.
		await Promise.all(filePromises);

		// Assert
		expect(wrapper.getAllByRole("grid").length).toBe(1);
	});

	it("displays an entire year if no month is specified", async () => {
		// Arrange
		const userConfig: UserConfig = getDefaultUserConfig();
		userConfig.displayDate.month = undefined;
		const filePromises = createFilePromises({ userConfig });

		// Act
		const wrapper = render(App);
		// wait for the file to be parsed.
		await Promise.all(filePromises);

		// Assert
		expect(wrapper.getAllByRole("grid").length).toBe(12);
	});
});
