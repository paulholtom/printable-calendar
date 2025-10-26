// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";
import { ELECTRON_API_EVENTS, ElectronApi } from "./electron-api";

const electronApi: ElectronApi = {
	readUserConfigFile() {
		return ipcRenderer.invoke(ELECTRON_API_EVENTS.READ_CONFIG_FILE);
	},
	writeUserConfigFile(contents) {
		return ipcRenderer.invoke(
			ELECTRON_API_EVENTS.WRITE_CONFIG_FILE,
			contents,
		);
	},
	readCalendarFiles(directory) {
		return ipcRenderer.invoke(
			ELECTRON_API_EVENTS.READ_CALENDAR_FILES,
			directory,
		);
	},
	writeCalendarFile(directory, calendarName, contents) {
		return ipcRenderer.invoke(
			ELECTRON_API_EVENTS.WRITE_CALENDAR_FILE,
			directory,
			calendarName,
			contents,
		);
	},
	printToPdf(fileNameAndPath) {
		return ipcRenderer.invoke(
			ELECTRON_API_EVENTS.PRINT_PDF,
			fileNameAndPath,
		);
	},
	selectDirectory(title) {
		return ipcRenderer.invoke(ELECTRON_API_EVENTS.SELECT_DIRECTORY, title);
	},
	closeWindow() {
		return ipcRenderer.invoke(ELECTRON_API_EVENTS.CLOSE_WINDOW);
	},
};
contextBridge.exposeInMainWorld("electronApi", electronApi);
