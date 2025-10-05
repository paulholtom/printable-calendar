// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("configFile", {
	read: () => ipcRenderer.invoke("read-config-file"),
	write: (content: string) =>
		ipcRenderer.invoke("write-config-file", content),
});
