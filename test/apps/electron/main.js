const { app, BrowserWindow } = require('electron');
const { hckFetch } = require('../../../dist/cjs/index.cjs');

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });
  win.webContents.openDevTools();
  await win.loadFile('index.html');
};

app.whenReady().then(async () => {
  await createWindow();
  await hckFetch('http://127.0.0.1:3000/main');
});
