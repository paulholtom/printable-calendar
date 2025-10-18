import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

export const DEFAULT_CALENDAR_FILE_NAME = "default.ics";

function getCalendarEventsFileFullPath(): string {
	return path.join(app.getPath("userData"), DEFAULT_CALENDAR_FILE_NAME);
}

export function readCalendarFile(): Promise<string | undefined> {
	const { promise, resolve } = Promise.withResolvers<string | undefined>();

	fs.readFile(getCalendarEventsFileFullPath(), (err, data) => {
		if (err) {
			resolve(undefined);
			return;
		}

		resolve(data.toString());
	});
	return promise;
}

export function writeCalendarFile(contents: string): Promise<void> {
	const { promise, resolve } = Promise.withResolvers<void>();
	fs.writeFile(getCalendarEventsFileFullPath(), contents, () => {
		resolve();
	});
	return promise;
}
