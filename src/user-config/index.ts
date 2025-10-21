import { displayDate } from "@/dates";
import { inject, InjectionKey, provide, Ref } from "vue";
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
export const USER_CONFIG_KEY: InjectionKey<Ref<UserConfig>> =
	Symbol("user-config");

/**
 * @returns The user config.
 */
export function useUserConfig(): Ref<UserConfig> {
	const injectedValue = inject(USER_CONFIG_KEY);
	if (!injectedValue) {
		throw new Error(
			`Tried to inject ${USER_CONFIG_KEY.toString()} but it has not been provided.`,
		);
	}
	return injectedValue;
}

/**
 * Provides the user config for child components.
 *
 * @param config The config to be provided.
 */
export function provideUserConfig(config: Ref<UserConfig>): void {
	provide(USER_CONFIG_KEY, config);
}
