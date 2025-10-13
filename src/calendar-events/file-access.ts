import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

export const CALENDAR_EVENTS_FILE_NAME = "calendar-events.json";

function getCalendarEventsFileFullPath(): string {
	return path.join(app.getPath("userData"), CALENDAR_EVENTS_FILE_NAME);
}

export function readCalendarEventsFile(): Promise<string> {
	const { promise, resolve } = Promise.withResolvers<string>();

	fs.readFile(getCalendarEventsFileFullPath(), (err, data) => {
		if (err) {
			resolve("");
			return;
		}

		resolve(data.toString());
	});
	return promise;
}

export function writeCalendarEventsFile(config: string): Promise<void> {
	const { promise, resolve } = Promise.withResolvers<void>();
	fs.writeFile(getCalendarEventsFileFullPath(), config, () => {
		resolve();
	});
	return promise;
}
