const path = require("path");
const { app, BrowserWindow, Menu, shell, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");

const UPDATE_FEED_URL = "http://217.15.167.222/software/desktop-updates";
const WORKBENCH_INDEX = path.join(__dirname, "..", "workbench", "index.html");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 980,
    minHeight: 720,
    title: "Behring Desktop",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(WORKBENCH_INDEX);
}

function configureUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.setFeedURL({ provider: "generic", url: UPDATE_FEED_URL });

  autoUpdater.on("update-downloaded", () => {
    if (mainWindow) {
      mainWindow.webContents.send("behring:update-downloaded");
    }
  });

  autoUpdater.on("error", (error) => {
    if (mainWindow) {
      mainWindow.webContents.send("behring:update-error", String(error && error.message ? error.message : error));
    }
  });
}

function openVpsPath(route) {
  const cleanRoute = String(route || "/software").startsWith("/") ? route : "/software";
  shell.openExternal(`http://217.15.167.222${cleanRoute}`);
}

function buildMenu() {
  const template = [
    {
      label: "Behring",
      submenu: [
        { label: "Open Software Hub", click: () => openVpsPath("/software") },
        { label: "Check for Updates", click: () => autoUpdater.checkForUpdatesAndNotify() },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    {
      label: "Workbench",
      submenu: [
        { label: "New Cases", click: () => openVpsPath("/queue/new-cases/view") },
        { label: "Referral Form", click: () => openVpsPath("/orders/manual/view") },
        { label: "Label Templates", click: () => openVpsPath("/labels/set/LAB-1921-MSHAN") }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  configureUpdater();
  buildMenu();
  createWindow();
  autoUpdater.checkForUpdatesAndNotify().catch(() => {});

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("behring:get-version", () => app.getVersion());
ipcMain.handle("behring:check-updates", () => autoUpdater.checkForUpdatesAndNotify());
