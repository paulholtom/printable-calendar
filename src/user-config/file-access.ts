import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CONFIG_FILE_NAME = "printable-calendar-config.json";
const configFileFullPath = path.join(os.homedir(), CONFIG_FILE_NAME);

export function readConfigFile(): Promise<string> {
	const { promise, resolve } = Promise.withResolvers<string>();

	fs.readFile(configFileFullPath, (err, data) => {
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
	fs.writeFile(configFileFullPath, config, () => {
		resolve();
	});
	return promise;
}
