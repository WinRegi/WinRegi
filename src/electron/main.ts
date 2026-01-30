import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

const isDev = !app.isPackaged;
const PY_PORT = 5000;

function getBackendPath(): { cmd: string, args: string[], cwd: string } {
    if (isDev) {
        // Run from source
        return {
            cmd: path.join(__dirname, '../backend/venv/Scripts/python.exe'),
            args: [path.join(__dirname, '../backend/server.py')],
            cwd: path.join(__dirname, '../backend')
        };
    } else {
        // Run from compiled exe in resources
        const exePath = path.join(process.resourcesPath, 'api.exe');
        return {
            cmd: exePath,
            args: [],
            cwd: path.dirname(exePath)
        };
    }
}

async function startBackend() {
    const { cmd, args, cwd } = getBackendPath();
    console.log(`Starting backend: ${cmd} ${args.join(' ')}`);

    // Check if backend already running on port (simple check skipped for brevity, handling via error)
    if (!fs.existsSync(cmd) && isDev) {
        console.error("Python executable not found. Ensure venv is created.");
        return;
    }

    backendProcess = spawn(cmd, args, {
        cwd: cwd,
        stdio: 'pipe'
    });

    if (backendProcess.stdout) {
        backendProcess.stdout.on('data', (data) => {
            console.log(`[Backend]: ${data}`);
        });
    }

    if (backendProcess.stderr) {
        backendProcess.stderr.on('data', (data) => {
            console.error(`[Backend API Error]: ${data}`);
        });
    }

    backendProcess.on('error', (err) => {
        console.error('Failed to start backend:', err);
    });

    backendProcess.on('exit', (code, signal) => {
        console.log(`Backend exited with code ${code} signal ${signal}`);
    });
}

function stopBackend() {
    if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        backgroundColor: '#0f172a', // Slate-900
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            devTools: isDev // Disable devTools in production
        },
        autoHideMenuBar: true,
        title: "WinRegi",
        icon: path.join(__dirname, '../../resources/icon.ico') // Ensure icon is loaded in dev/prod
    });


    mainWindow.on('ready-to-show', () => {
        if (mainWindow) mainWindow.show();
        // Check for updates and notify without user interaction for now (download in background)
        if (!isDev) {
            autoUpdater.checkForUpdatesAndNotify();
        }
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173').catch((e) => {
            console.log("Dev server failed to load, falling back to static build:", e);
            if (mainWindow) mainWindow.loadFile(path.join(__dirname, '../src/renderer/dist/index.html'));
        });
        mainWindow.webContents.openDevTools();
    } else {
        // Remove menu in production
        mainWindow.setMenu(null);
        mainWindow.loadFile(path.join(__dirname, '../src/renderer/dist/index.html'));
    }
}

app.whenReady().then(() => {
    startBackend();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        stopBackend();
        app.quit();
    }
});

app.on('before-quit', () => {
    stopBackend();
});

// Admin Relaunch Logic
ipcMain.handle('relaunch-as-admin', () => {
    const appPath = isDev ? process.execPath : app.getPath('exe');
    // For dev, process.execPath is electron.exe, need main script
    // It's tricky in Dev. In Prod it's straightforward.
    // We will use powershell Start-Process -Verb RunAs

    const cmd = isDev
        ? `Start-Process "${process.execPath}" -ArgumentList "${path.resolve('.')}" -Verb RunAs`
        : `Start-Process "${appPath}" -Verb RunAs`;

    spawn('powershell.exe', [cmd], { shell: true });
    app.quit();
});

ipcMain.handle('get-admin-status', async () => {
    try {
        const { exec } = require('child_process');
        return new Promise((resolve) => {
            exec('net session', (err: any) => {
                resolve(err ? false : true);
            });
        });
    } catch (e) {
        return false;
    }
});

ipcMain.handle('execute-command', async (_, command: string) => {
    try {
        const { exec } = require('child_process');
        console.log(`Executing: ${command}`);
        return new Promise((resolve, reject) => {
            // Use PowerShell to execute
            exec(`powershell.exe -Command "${command.replace(/"/g, '\\"')}"`, (err: any, stdout: any, stderr: any) => {
                if (err) {
                    console.error("Execution failed:", stderr);
                    reject(stderr || err.message);
                } else {
                    console.log("Execution success:", stdout);
                    resolve(stdout.trim());
                }
            });
        });
    } catch (e: any) {
        throw new Error(e.message);
    }
});

ipcMain.handle('open-external', async (_, url: string) => {
    await shell.openExternal(url);
});
