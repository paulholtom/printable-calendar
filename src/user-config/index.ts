import { inject, InjectionKey, provide } from "vue";
import { z } from "zod";

export const displayDate = z.object({
	month: z.number().optional(),
	year: z.number(),
});
export type DisplayDate = z.infer<typeof displayDate>;

export const userConfig = z.object({
	pdfDirectory: z.string().optional(),
	displayDate: displayDate,
});

export type UserConfig = z.infer<typeof userConfig>;

export function getDefaultUserConfig(): UserConfig {
	const currentDate = new Date();
	return {
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
