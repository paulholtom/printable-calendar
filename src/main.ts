import { app, BrowserWindow, dialog, ipcMain } from "electron";
import started from "electron-squirrel-startup";
import fs from "node:fs/promises";
import path from "node:path";
import { updateElectronApp } from "update-electron-app";
import { readConfigFile, writeConfigFile } from "./user-config/file-access";

updateElectronApp();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
	app.quit();
}

const createWindow = () => {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
		},
	});

	// and load the index.html of the app.
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(
			path.join(
				__dirname,
				`../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`,
			),
		);
	}
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	ipcMain.handle("read-config-file", readConfigFile);
	ipcMain.handle("write-config-file", async (_, ...args) => {
		if (args.length !== 1 || typeof args[0] !== "string") {
			throw new Error(
				`Invalid arguments to write-config-file. Expected [string], got [${args.map((arg) => typeof arg)}]`,
			);
		}
		return writeConfigFile(args[0]);
	});
	ipcMain.handle("print-pdf", async (event, ...args) => {
		if (args.length !== 1 || typeof args[0] !== "string") {
			throw new Error(
				`Invalid arguments to print-pdf. Expected [string], got [${args.map((arg) => typeof arg)}]`,
			);
		}
		const pdfData = await event.sender.printToPDF({ pageSize: "A2" });
		await fs.writeFile(args[0], pdfData);
	});
	ipcMain.handle("select-directory", async () => {
		const result = await dialog.showOpenDialog({
			properties: ["openDirectory", "createDirectory"],
		});
		if (result.canceled) {
			return undefined;
		} else {
			return result.filePaths[0];
		}
	});

	createWindow();

	app.on("activate", () => {
		// On OS X it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
