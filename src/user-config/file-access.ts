import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import { getDefaultUserConfig } from ".";

export const CONFIG_FILE_NAME = "user-config.json";

function getConfigFileFullPath(): string {
	return path.join(app.getPath("userData"), CONFIG_FILE_NAME);
}

export function readConfigFile(): Promise<string> {
	const { promise, resolve } = Promise.withResolvers<string>();

	if (!fs.existsSync(getConfigFileFullPath())) {
		resolve(JSON.stringify(getDefaultUserConfig()));
	} else {
		fs.readFile(getConfigFileFullPath(), (err, data) => {
			if (err) {
				resolve("");
				return;
			}

			resolve(data.toString());
		});
	}
	return promise;
}

export function writeConfigFile(config: string): Promise<void> {
	const { promise, resolve } = Promise.withResolvers<void>();
	fs.writeFile(getConfigFileFullPath(), config, () => {
		resolve();
	});
	return promise;
}
