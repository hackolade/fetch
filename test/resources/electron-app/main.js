const { app, BrowserWindow, utilityProcess } = require('electron');
const path = require('path');
const { hckFetch } = require('../../../dist/cjs/index.cjs');

app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('enable-transparent-visuals');
app.disableHardwareAcceleration();

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });
  await win.loadFile('index.html');
};

app.whenReady().then(async () => {
  await createWindow();
  await hckFetch('http://127.0.0.1:3000/main');
  utilityProcess.fork(path.join(__dirname, 'utility.js'));
});
