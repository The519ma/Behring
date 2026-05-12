const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("behringDesktop", {
  version: () => ipcRenderer.invoke("behring:get-version"),
  checkForUpdates: () => ipcRenderer.invoke("behring:check-updates"),
  openPtouchLabel: (request) => ipcRenderer.invoke("behring:open-ptouch-label", request),
  onUpdateDownloaded: (handler) => ipcRenderer.on("behring:update-downloaded", handler),
  onUpdateError: (handler) => ipcRenderer.on("behring:update-error", (_event, message) => handler(message))
});
