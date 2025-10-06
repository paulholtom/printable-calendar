import { z } from "zod";

export const calendarDate = z.object({
	description: z.string(),
});
export type CalendarDate = z.infer<typeof calendarDate>;

export const userConfig = z.object({
	pdfDirectory: z.string().optional(),
	dates: z.array(calendarDate),
});

export type UserConfig = z.infer<typeof userConfig>;

export function getDefaultUserConfig(): UserConfig {
	return { dates: [] };
}

export function parseUserConfig(unparsed: string): UserConfig {
	try {
		return userConfig.parse(JSON.parse(unparsed));
	} catch {
		return getDefaultUserConfig();
	}
}
