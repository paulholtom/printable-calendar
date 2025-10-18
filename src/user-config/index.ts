import { displayDate } from "@/dates";
import { inject, InjectionKey, provide } from "vue";
import { z } from "zod";

export const userConfig = z.object({
	version: z.object({
		major: z.number(),
		minor: z.number(),
		patch: z.number(),
	}),
	pdfDirectory: z.string().optional(),
	displayDate: displayDate,
});

export type UserConfig = z.infer<typeof userConfig>;

export function getDefaultUserConfig(): UserConfig {
	const currentDate = new Date();
	return {
		version: { major: 1, minor: 0, patch: 0 },
		displayDate: {
			month: currentDate.getMonth(),
			year: currentDate.getFullYear(),
		},
	};
}

export function parseUserConfig(unparsed: string): UserConfig {
	try {
		return userConfig.parse(JSON.parse(unparsed));
	} catch {
		return getDefaultUserConfig();
	}
}

/**
 * The injection key for the user config.
 */
export const USER_CONFIG_KEY: InjectionKey<UserConfig> = Symbol("user-config");

/**
 * @returns The user config.
 */
export function useUserConfig(): UserConfig {
	return inject(USER_CONFIG_KEY);
}

/**
 * Provides the user config for child components.
 *
 * @param config The config to be provided.
 */
export function provideUserConfig(config: UserConfig): void {
	provide(USER_CONFIG_KEY, config);
}
