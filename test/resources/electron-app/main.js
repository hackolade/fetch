const { app, BrowserWindow, utilityProcess } = require('electron');
const express = require('express');
const path = require('path');
const { hckFetch } = require('../../../dist/cjs/index.cjs');

app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('enable-transparent-visuals');
app.disableHardwareAcceleration();

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });
  await win.loadFile('index.html');
};

app.whenReady().then(async () => {
  try {
    await createWindow();
    utilityProcess.fork(path.join(__dirname, 'utility.js'));
    await hckFetch('http://hck-fetch-test-server:3000/initiators/main', { method: 'PUT' });
  } finally {
    await wait(1000);
    startServer();
  }
});

function startServer() {
  const app = express();
  app.get('/status', (_, res) => {
    res.status(200).send({ status: 'OK' });
  });
  app.listen(process.env.PORT);
}