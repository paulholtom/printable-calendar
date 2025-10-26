import type { CalendarFileContents } from "./calendar-events";

export interface ElectronApi {
	/**
	 * Reads the user config file.
	 *
	 * @returns A promise that resolves to the contents of the file or an empty string if the file couldn't be read.
	 */
	readUserConfigFile(): Promise<string>;
	/**
	 * Write to the user config file.
	 *
	 * @param contents The contents of the file to be written.
	 * @returns A promise that resolves when the file is successfully written.
	 */
	writeUserConfigFile(contents: string): Promise<void>;
	/**
	 * Write to the specified calendar file.
	 *
	 * @param directory The directory to write the file to.
	 * @param calendarName The name of the calendar.
	 * @param contents The contents of the file to be written.
	 * @returns A promise that resolves when the file is successfully written.
	 */
	writeCalendarFile(
		directory: string,
		calendarName: string,
		contents: string,
	): Promise<void>;
	/**
	 * Reads all of the calendar files in a driector.
	 *
	 * @param directory The directory to read the calendar files from.
	 * @returns A promise that resolves to the contents of the file or undefined if the file couldn't be read.
	 */
	readCalendarFiles(directory: string): Promise<CalendarFileContents>;
	/**
	 * Create a PDF of the current page.
	 *
	 * @param fileNameAndPath The full path of the file to be created. Numbers will be appended if this file already exists.
	 * @returns A promise that resolves to the path of the created PDF file.
	 */
	printToPdf(fileNameAndPath: string): Promise<string>;
	/**
	 * Select a directory on the user's computer.
	 *
	 * @param title The title to show in the dialog for selecting a directory.
	 * @returns A promise that resolves to a directory path or undefined if the user didn't select one.
	 */
	selectDirectory(title: string): Promise<string | undefined>;
	/**
	 * Close the window that triggered this event.
	 */
	closeWindow(): Promise<void>;
}

/**
 * The strings identifying different electron api events for inter process control.
 */
export enum ELECTRON_API_EVENTS {
	READ_CONFIG_FILE = "read-config-file",
	WRITE_CONFIG_FILE = "write-config-file",
	READ_CALENDAR_FILES = "read-calendar-files",
	WRITE_CALENDAR_FILE = "write-calendar-file",
	PRINT_PDF = "print-pdf",
	SELECT_DIRECTORY = "select-directory",
	CLOSE_WINDOW = "close-window",
}
