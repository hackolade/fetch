const { contextBridge, ipcRenderer } = require('electron');

// @see https://www.electronjs.org/docs/latest/tutorial/ipc#2-expose-ipcrendereron-via-preload
contextBridge.exposeInMainWorld('electronAPI', {
  onHckFetchResult: callback => ipcRenderer.on('hck-fetch-result', (event, ...args) => callback(event, ...args)),
  sendHckFetchResult: result => ipcRenderer.send('hck-fetch-result', result),
});
