const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('clg', {
  getSettings: () => ipcRenderer.invoke('app:settings:get'),
  saveSettings: value => ipcRenderer.invoke('app:settings:save', value),
  listVersions: () => ipcRenderer.invoke('versions:list'),
  checkJava: () => ipcRenderer.invoke('java:check'),
  launch: options => ipcRenderer.invoke('game:launch', options),
  openGameFolder: () => ipcRenderer.invoke('app:open-folder'),
  onLog: callback => ipcRenderer.on('game:log', (_e, value) => callback(value)),
  onProgress: callback => ipcRenderer.on('game:progress', (_e, value) => callback(value)),
  onClosed: callback => ipcRenderer.on('game:closed', (_e, code) => callback(code))
});
