import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const CONFIG_FILE_NAME = "printable-calendar-config.json";

function getConfigFileFullPath(): string {
	return path.join(os.homedir(), CONFIG_FILE_NAME);
}

export function readConfigFile(): Promise<string> {
	const { promise, resolve } = Promise.withResolvers<string>();

	fs.readFile(getConfigFileFullPath(), (err, data) => {
		if (err) {
			resolve("");
			return;
		}

		resolve(data.toString());
	});
	return promise;
}

export function writeConfigFile(config: string): Promise<void> {
	const { promise, resolve } = Promise.withResolvers<void>();
	fs.writeFile(getConfigFileFullPath(), config, () => {
		resolve();
	});
	return promise;
}
