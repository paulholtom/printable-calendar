import fs from "node:fs";
import path from "node:path";
import { CalendarFileContents } from "./calendar-file-types";

/**
 * @param directory The path to read all calendar files from.
 * @returns The contents of the file or undefined if there are any errors reading it.
 */
export function readCalendarFiles(
	directory: string,
): Promise<CalendarFileContents> {
	const { promise, resolve } = Promise.withResolvers<CalendarFileContents>();

	fs.readdir(directory, async (err, files) => {
		if (err) {
			resolve({});
			return;
		}

		const fileContents: CalendarFileContents = {};
		const fileReadPromises: Promise<void>[] = [];
		files.forEach((fileName) => {
			if (path.extname(fileName) !== ".ics") {
				return;
			}
			const { promise: filePromise, resolve: fileResolve } =
				Promise.withResolvers<void>();
			fileReadPromises.push(filePromise);
			fs.readFile(path.join(directory, fileName), (err, data) => {
				if (err) {
					fileResolve();
					return;
				}

				fileContents[path.basename(fileName, ".ics")] = data.toString();
				fileResolve();
			});
		});

		await Promise.all(fileReadPromises);
		resolve(fileContents);
	});

	return promise;
}

/**
 * Writes a calendar file.
 *
 * @param directory The directory to write the file to.
 * @param calendarName The name of the calendar.
 * @param contents The contents of the file.
 * @returns A promise that resolves once the write is complete.
 */
export function writeCalendarFile(
	directory: string,
	calendarName: string,
	contents: string,
): Promise<void> {
	const { promise, resolve } = Promise.withResolvers<void>();
	fs.writeFile(path.join(directory, `${calendarName}.ics`), contents, () => {
		resolve();
	});
	return promise;
}
