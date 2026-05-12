const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");
const { app, BrowserWindow, Menu, shell, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");

const UPDATE_FEED_URL = "http://217.15.167.222/software/desktop-updates";
const WORKBENCH_INDEX = path.join(__dirname, "..", "workbench", "index.html");
const PTOUCH_TEMPLATE_NAMES = {
  barcode: "barcode-label.lbx",
  quad: "quad-label.lbx"
};

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

function requestText(url, options = {}, body = "") {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === "https:" ? https : http;
    const request = transport.request(parsed, {
      method: options.method || "GET",
      headers: options.headers || {}
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        resolve({
          ok: response.statusCode >= 200 && response.statusCode < 300,
          statusCode: response.statusCode,
          body: Buffer.concat(chunks).toString("utf8")
        });
      });
    });
    request.on("error", reject);
    request.setTimeout(30000, () => {
      request.destroy(new Error("Request timed out."));
    });
    if (body) {
      request.write(body);
    }
    request.end();
  });
}

function parseJson(text) {
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    return { ok: false, error: text.slice(0, 300) };
  }
}

async function postJson(url, payload) {
  const body = JSON.stringify(payload || {});
  const response = await requestText(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Content-Length": Buffer.byteLength(body)
    }
  }, body);
  const data = parseJson(response.body);
  if (!response.ok || data.ok === false) {
    return { ok: false, error: data.error || `HTTP ${response.statusCode}` };
  }
  return data;
}

async function keycloakLogin(_event, request) {
  const baseUrl = String(request && request.baseUrl || "").replace(/\/$/, "");
  const realm = String(request && request.realm || "").trim();
  const clientId = String(request && request.clientId || "").trim();
  const clientSecret = String(request && request.clientSecret || "").trim();
  const username = String(request && request.username || "").trim();
  const password = String(request && request.password || "");

  if (!baseUrl || !realm || !clientId || !username || !password) {
    return { ok: false, error: "Missing Keycloak sign-in details." };
  }

  const form = new URLSearchParams();
  form.set("grant_type", "password");
  form.set("client_id", clientId);
  form.set("username", username);
  form.set("password", password);
  if (clientSecret) {
    form.set("client_secret", clientSecret);
  }

  try {
    const body = form.toString();
    const tokenUrl = `${baseUrl}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/token`;
    const response = await requestText(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    }, body);
    const data = parseJson(response.body);
    if (!response.ok || data.error) {
      return {
        ok: false,
        error: data.error_description || data.error || `Keycloak HTTP ${response.statusCode}`
      };
    }
    return {
      ok: true,
      access_token: data.access_token || "",
      refresh_token: data.refresh_token || "",
      expires_in: data.expires_in || 300,
      token_type: data.token_type || "Bearer"
    };
  } catch (error) {
    return { ok: false, error: String(error && error.message ? error.message : error) };
  }
}

async function workbenchAdminLogin(_event, request) {
  try {
    return await postJson("http://217.15.167.222/identity/admin/login", {
      username: request && request.username,
      password: request && request.password
    });
  } catch (error) {
    return { ok: false, error: String(error && error.message ? error.message : error) };
  }
}

function csvEscape(value) {
  return `"${String(value == null ? "" : value).replace(/"/g, '""')}"`;
}

function sanitize(value, fallback = "") {
  const text = String(value == null ? "" : value).trim();
  return text || fallback;
}

function ptouchBaseDir() {
  return path.join(app.getPath("documents"), "Behring P-touch Templates");
}

function sourceResourceDir(name) {
  const packaged = path.join(process.resourcesPath || "", name);
  if (fs.existsSync(packaged)) {
    return packaged;
  }
  return path.join(__dirname, "..", name);
}

function ensurePtouchFiles() {
  const baseDir = ptouchBaseDir();
  const currentDir = path.join(baseDir, "current");
  const archiveDir = path.join(baseDir, "archive");
  fs.mkdirSync(currentDir, { recursive: true });
  fs.mkdirSync(archiveDir, { recursive: true });

  const templateDir = sourceResourceDir("ptouch-templates");
  Object.values(PTOUCH_TEMPLATE_NAMES).forEach((name) => {
    const target = path.join(baseDir, name);
    const source = path.join(templateDir, name);
    if (fs.existsSync(source) && !fs.existsSync(target)) {
      fs.copyFileSync(source, target);
    }
  });

  const readmeSource = path.join(templateDir, "README.txt");
  const readmeTarget = path.join(baseDir, "README.txt");
  if (fs.existsSync(readmeSource) && !fs.existsSync(readmeTarget)) {
    fs.copyFileSync(readmeSource, readmeTarget);
  }

  return { baseDir, currentDir, archiveDir };
}

function buildBarcodeCsv(data) {
  const caseId = sanitize(data.caseId, "LAB-UNSET");
  return [
    "barcode_value,label_kind",
    [caseId, "barcode"].map(csvEscape).join(","),
    ["LAB-PLACEHOLDER", "barcode"].map(csvEscape).join(",")
  ].join("\n") + "\n";
}

function buildQuadCsv(data) {
  const firstName = sanitize(data.firstName, "Unknown");
  const age = sanitize(data.ageDisplay);
  const gender = sanitize(data.genderShort);
  const labShort = sanitize(data.labNumberShort, sanitize(data.caseId, "LAB-UNSET").replace(/^LAB-/i, ""));
  const compactFirst = firstName.toUpperCase().slice(0, 3);
  const line1 = [firstName, age, gender].filter(Boolean).join("/") || firstName;
  const compact = [compactFirst, gender, age].filter(Boolean).join("/") || line1;
  return [
    "quad_line_1,quad_line_2,quad_compact",
    [line1, labShort, compact].map(csvEscape).join(","),
    ["PLACEHOLDER/0/X", "0000-PLACE", "PLA/X/0"].map(csvEscape).join(",")
  ].join("\n") + "\n";
}

async function openPtouchLabel(_event, request) {
  const kind = String((request && request.kind) || "barcode").toLowerCase() === "quad" ? "quad" : "barcode";
  const data = (request && request.data) || {};
  const caseId = sanitize(data.caseId || (request && request.caseId), "LAB-UNSET");
  const paths = ensurePtouchFiles();
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const barcodeCsv = buildBarcodeCsv({ ...data, caseId });
  const quadCsv = buildQuadCsv({ ...data, caseId });
  const barcodeCurrent = path.join(paths.currentDir, "barcode-label.csv");
  const quadCurrent = path.join(paths.currentDir, "quad-label.csv");
  const barcodeArchive = path.join(paths.archiveDir, `${caseId}-barcode-${timestamp}.csv`);
  const quadArchive = path.join(paths.archiveDir, `${caseId}-quad-${timestamp}.csv`);

  fs.writeFileSync(barcodeCurrent, barcodeCsv, "utf8");
  fs.writeFileSync(quadCurrent, quadCsv, "utf8");
  fs.writeFileSync(barcodeArchive, barcodeCsv, "utf8");
  fs.writeFileSync(quadArchive, quadCsv, "utf8");

  const template = path.join(paths.baseDir, PTOUCH_TEMPLATE_NAMES[kind]);
  if (!fs.existsSync(template)) {
    shell.showItemInFolder(paths.baseDir);
    return { ok: false, error: `Missing ${PTOUCH_TEMPLATE_NAMES[kind]}`, paths };
  }

  const error = await shell.openPath(template);
  return {
    ok: !error,
    error: error || "",
    kind,
    template,
    paths: {
      baseDir: paths.baseDir,
      barcodeCurrent,
      quadCurrent,
      barcodeArchive,
      quadArchive
    }
  };
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
ipcMain.handle("behring:keycloak-login", keycloakLogin);
ipcMain.handle("behring:workbench-admin-login", workbenchAdminLogin);
ipcMain.handle("behring:open-ptouch-label", openPtouchLabel);
