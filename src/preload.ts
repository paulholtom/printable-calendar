// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";
import { ElectronApi } from "./electron-api";

const electronApi: ElectronApi = {
	readUserConfigFile() {
		return ipcRenderer.invoke("read-config-file");
	},
	writeUserConfigFile(contents) {
		return ipcRenderer.invoke("write-config-file", contents);
	},
	printToPdf(fileNameAndPath) {
		return ipcRenderer.invoke("print-pdf", fileNameAndPath);
	},
	selectDirectory() {
		return ipcRenderer.invoke("select-directory");
	},
};
contextBridge.exposeInMainWorld("electronApi", electronApi);
