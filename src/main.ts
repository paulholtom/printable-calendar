import {
	app,
	BrowserWindow,
	dialog,
	ipcMain,
	Menu,
	nativeImage,
} from "electron";
import started from "electron-squirrel-startup";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { updateElectronApp } from "update-electron-app";
import iconPath from "./assets/calendar.png";
import {
	readCalendarFiles,
	writeCalendarFile,
} from "./calendar-events/file-access";
import { ELECTRON_API_EVENTS } from "./electron-api";
import { readConfigFile, writeConfigFile } from "./user-config/file-access";

updateElectronApp();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
	app.quit();
}

const createWindow = () => {
	// Create the browser window.
	const icon = nativeImage.createFromDataURL(iconPath);
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
		},
		icon,
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

function validateArguments(
	functionName: string,
	expectedTypes: string[],
	argumentsToValidate: unknown[],
) {
	const received = argumentsToValidate.map((arg) => typeof arg).toString();
	const expected = expectedTypes.toString();

	if (expected !== received) {
		throw new Error(
			`Invalid arguments to ${functionName}. Expected [${expected}], got [${received}]`,
		);
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	ipcMain.handle(ELECTRON_API_EVENTS.READ_CONFIG_FILE, readConfigFile);
	ipcMain.handle(
		ELECTRON_API_EVENTS.WRITE_CONFIG_FILE,
		async (_, ...args) => {
			validateArguments(
				ELECTRON_API_EVENTS.WRITE_CONFIG_FILE,
				["string"],
				args,
			);
			return writeConfigFile(args[0]);
		},
	);
	ipcMain.handle(
		ELECTRON_API_EVENTS.READ_CALENDAR_FILES,
		async (_, ...args) => {
			validateArguments(
				ELECTRON_API_EVENTS.READ_CALENDAR_FILES,
				["string"],
				args,
			);
			return readCalendarFiles(args[0]);
		},
	);
	ipcMain.handle(
		ELECTRON_API_EVENTS.WRITE_CALENDAR_FILE,
		async (_, ...args) => {
			validateArguments(
				ELECTRON_API_EVENTS.WRITE_CALENDAR_FILE,
				["string", "string", "string"],
				args,
			);
			return writeCalendarFile(args[0], args[1], args[2]);
		},
	);
	ipcMain.handle(ELECTRON_API_EVENTS.PRINT_PDF, async (event, ...args) => {
		validateArguments(ELECTRON_API_EVENTS.PRINT_PDF, ["string"], args);

		function buildFilePath(
			splitPath: path.ParsedPath,
			uniqueId: number,
		): string {
			return path.join(
				splitPath.dir,
				`${splitPath.name}${uniqueId ? ` (${uniqueId})` : ""}${splitPath.ext}`,
			);
		}

		const splitPath = path.parse(args[0]);
		let uniqueId = 0;
		let filePath = buildFilePath(splitPath, uniqueId);
		while (fs.existsSync(filePath)) {
			++uniqueId;
			filePath = buildFilePath(splitPath, uniqueId);
		}
		const pdfData = await event.sender.printToPDF({
			pageSize: "A2",
			margins: { top: 0, left: 0, right: 0, bottom: 0 },
			printBackground: true,
		});
		await fsPromises.writeFile(filePath, pdfData);
		return filePath;
	});
	ipcMain.handle(ELECTRON_API_EVENTS.SELECT_DIRECTORY, async (_, ...args) => {
		validateArguments(
			ELECTRON_API_EVENTS.SELECT_DIRECTORY,
			["string"],
			args,
		);
		const result = await dialog.showOpenDialog({
			title: args[0],
			properties: ["openDirectory", "createDirectory"],
		});
		if (result.canceled) {
			return undefined;
		} else {
			return result.filePaths[0];
		}
	});
	ipcMain.handle(ELECTRON_API_EVENTS.CLOSE_WINDOW, async (event) => {
		event.sender.close();
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
const appMenu = Menu.buildFromTemplate([
	{
		role: "editMenu",
	},
	{
		role: "viewMenu",
	},
]);

Menu.setApplicationMenu(appMenu);
