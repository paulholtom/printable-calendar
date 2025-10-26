import { displayDate } from "@/dates";
import { inject, InjectionKey, provide, Ref } from "vue";
import { z } from "zod";

/**
 * Options for a calendar.
 */
const calendarOptions = z.object({
	/**
	 * If events from this calendar should be disabled.
	 */
	disabled: z.boolean(),
});

/**
 * Options for a calendar.
 */
export type CalendarOptions = z.infer<typeof calendarOptions>;

const userConfig_v1_0_0 = z.object({
	version: z.literal("1.0.0"),
	pdfDirectory: z.string().optional(),
	calendarDirectory: z.string().optional(),
	displayDate: displayDate,
	calendars: z.record(z.string(), z.union([calendarOptions, z.undefined()])),
});

const userConfigParser = z.union([userConfig_v1_0_0]);

export type UserConfig = z.infer<typeof userConfig_v1_0_0>;

export function getDefaultUserConfig(): UserConfig {
	const currentDate = new Date();
	return {
		version: "1.0.0",
		displayDate: {
			month: currentDate.getMonth(),
			year: currentDate.getFullYear(),
		},
		calendars: {},
	};
}

/**
 * @param unparsed The JSON string for the file.
 * @returns The string parsed and validated.
 * @throws If there is any errors parsing or validating the config file.
 */
export function parseUserConfig(unparsed: string): UserConfig {
	try {
		return userConfigParser.parse(JSON.parse(unparsed));
	} catch (err) {
		throw new Error("Error reading config file.", { cause: err });
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
