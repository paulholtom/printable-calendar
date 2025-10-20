import { IcsEvent } from "ts-ics";

/**
 * The action taken by the user that closed the event edit dialog.
 */
export enum EVENT_EDIT_DIALOG_ACTION {
	/**
	 * Cancelled the edit, make no changes.
	 */
	CANCEL = "cancel",
	/**
	 * Delete the event.
	 */
	DELETE = "delete",
	/**
	 * Save the event.
	 */
	SAVE = "save",
}

/**
 * The result of a user's interaction with the event edit dialog.
 */
export type EventEditDialogResult =
	| {
			/**
			 * The action to be taken.
			 */
			action:
				| EVENT_EDIT_DIALOG_ACTION.CANCEL
				| EVENT_EDIT_DIALOG_ACTION.DELETE;
	  }
	| {
			/**
			 * The action to be taken.
			 */
			action: EVENT_EDIT_DIALOG_ACTION.SAVE;
			/**
			 * The event to be saved.
			 */
			event: IcsEvent;
	  };
