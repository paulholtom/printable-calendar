import { inject, InjectionKey, provide, Ref } from "vue";
import { IcsCalendarCollection } from "./ts-ics-seam";

/**
 * The injection key for the calendar events.
 */
export const ICS_CALENDAR_COLLECTION_KEY: InjectionKey<
	Ref<IcsCalendarCollection>
> = Symbol("ics-calendar-collection");

/**
 * @returns The calendar events.
 */
export function useIcsCalendarCollection(): Ref<IcsCalendarCollection> {
	const injectedValue = inject(ICS_CALENDAR_COLLECTION_KEY);
	if (!injectedValue) {
		throw new Error(
			`Tried to inject ${ICS_CALENDAR_COLLECTION_KEY.toString()} but it has not been provided.`,
		);
	}

	return injectedValue;
}

/**
 * Provides the calendar events.
 *
 * @param calendarEventCollection The calendar events to be provided.
 */
export function provideIcsCalendarCollection(
	calendarEventCollection: Ref<IcsCalendarCollection>,
): void {
	provide(ICS_CALENDAR_COLLECTION_KEY, calendarEventCollection);
}
