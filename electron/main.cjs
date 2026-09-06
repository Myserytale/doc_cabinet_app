const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const SyncManager = require('./syncManager.cjs');

let mainWindow = null;
let tray = null;
let syncManager = null;
let isQuitting = false;

function createWindow() {
  const iconPath = path.join(__dirname, 'icon.png');
  const appIcon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#0a0d14',
    title: 'DocVault - Desktop',
    icon: appIcon.isEmpty() ? undefined : appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

  if (isDev) {
    mainWindow.loadURL(devUrl).catch(() => {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting && tray) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function updateTrayMenu() {
  if (!tray || !syncManager) return;

  try {
    const status = syncManager.getStatus();
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open DocVault Dashboard',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      { type: 'separator' },
      {
        label: status.autoSync ? 'Auto-Sync: Active' : 'Auto-Sync: Paused',
        enabled: false
      },
      {
        label: status.isProcessing ? `Syncing (${status.queueLength} in queue)...` : 'Sync Status: Idle',
        enabled: false
      },
      {
        label: 'Sync Watched Folders Now',
        click: () => {
          const result = syncManager.triggerManualSync();
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('sync:event', {
              type: 'manual_trigger',
              message: result.message
            });
          }
        }
      },
      {
        label: status.autoSync ? 'Pause Auto-Sync' : 'Resume Auto-Sync',
        click: () => {
          const newStatus = !status.autoSync;
          syncManager.saveConfig({ autoSync: newStatus });
        }
      },
      { type: 'separator' },
      {
        label: 'Quit DocVault',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip(`DocVault - ${status.watchedFolders.length} folders watched`);
  } catch (err) {
    console.warn('Tray menu update failed:', err.message);
  }
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, 'icon.png');
    const iconImg = nativeImage.createFromPath(iconPath);

    if (iconImg.isEmpty()) {
      console.warn('Tray icon is empty, skipping tray creation');
      return;
    }

    tray = new Tray(iconImg);
    updateTrayMenu();

    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.warn('System tray initialization skipped or failed:', err.message);
  }
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    syncManager = new SyncManager({
      userDataPath: app.getPath('userData'),
      onEvent: (eventData) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('sync:event', eventData);
        }
        updateTrayMenu();
      },
      onStatusChange: (status) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('sync:status', status);
        }
        updateTrayMenu();
      }
    });

    createWindow();
    createTray();
    syncManager.init();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else if (mainWindow) {
        mainWindow.show();
      }
    });
  });

  app.on('before-quit', () => {
    isQuitting = true;
    if (syncManager) {
      syncManager.stopWatcher();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      if (!tray) {
        app.quit();
      }
    }
  });
}

// IPC Handlers
ipcMain.handle('dialog:openDirectory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Folder to Watch for Auto-Sync'
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('config:get', () => {
  return syncManager ? syncManager.config : {};
});

ipcMain.handle('config:save', (_event, newConfig) => {
  if (!syncManager) return {};
  const updated = syncManager.saveConfig(newConfig);
  updateTrayMenu();
  return updated;
});

ipcMain.handle('sync:getStatus', () => {
  return syncManager ? syncManager.getStatus() : {};
});

ipcMain.handle('sync:trigger', () => {
  if (!syncManager) return { queued: 0 };
  return syncManager.triggerManualSync();
});

ipcMain.handle('sync:toggleAutoSync', (_event, enabled) => {
  if (!syncManager) return false;
  syncManager.saveConfig({ autoSync: enabled });
  return enabled;
});

ipcMain.handle('shell:openPath', async (_event, filePath) => {
  return await shell.openPath(filePath);
});

ipcMain.handle('shell:showItemInFolder', (_event, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('auth:testConnection', async (_event, { url, token }) => {
  try {
    const healthRes = await fetch(`${url}/actuator/health`, { signal: AbortSignal.timeout(5000) });
    const health = await healthRes.json();
    return { ok: healthRes.ok, health };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
