const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopApi', {
  selectDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  getSyncStatus: () => ipcRenderer.invoke('sync:getStatus'),
  triggerSync: () => ipcRenderer.invoke('sync:trigger'),
  toggleAutoSync: (enabled) => ipcRenderer.invoke('sync:toggleAutoSync', enabled),
  openPath: (path) => ipcRenderer.invoke('shell:openPath', path),
  showItemInFolder: (path) => ipcRenderer.invoke('shell:showItemInFolder', path),
  testConnection: (url, token) => ipcRenderer.invoke('auth:testConnection', { url, token }),
  onSyncStatus: (callback) => {
    const handler = (_event, status) => callback(status);
    ipcRenderer.on('sync:status', handler);
    return () => ipcRenderer.removeListener('sync:status', handler);
  },
  onSyncEvent: (callback) => {
    const handler = (_event, eventData) => callback(eventData);
    ipcRenderer.on('sync:event', handler);
    return () => ipcRenderer.removeListener('sync:event', handler);
  }
});
