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
	 * Write to the calendar event collection file.
	 *
	 * @param contents The contents of the file to be written.
	 * @returns A promise that resolves when the file is successfully written.
	 */
	writeCalendarEventsFile(contents: string): Promise<void>;
	/**
	 * Reads the calendar event collection file.
	 *
	 * @returns A promise that resolves to the contents of the file or an empty string if the file couldn't be read.
	 */
	readCalendarEventsFile(): Promise<string>;
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
	 * @returns A promise that resolves to a directory path or undefined if the user didn't select one.
	 */
	selectDirectory(): Promise<string | undefined>;
}
