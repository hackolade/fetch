const debug = require('debug');
const { app, BrowserWindow, utilityProcess } = require('electron');
const express = require('express');
const path = require('path');
const { hckFetch } = require('../../../dist/cjs/index.cjs');

app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('enable-transparent-visuals');
app.disableHardwareAcceleration();

const log = debug('hck-fetch').extend('test-app');

const PORT = Number.parseInt(process.env.PORT);
if (!PORT) {
  throw new Error(`Expected env.PORT to be a positive integer, got '${process.env.PORT}'!`)
}

const SERVER_API_URL = process.env.SERVER_API_URL;
if (!SERVER_API_URL) {
  throw new Error(`Expected env.SERVER_API_URL to be defined, got '${process.env.SERVER_API_URL}'!`)
}

log('sending requests to %o', SERVER_API_URL);

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
  await win.loadFile('index.html', { query: { serverApiUrl: SERVER_API_URL } });
};

app.whenReady().then(async () => {
  try {
    await createWindow();
    utilityProcess.fork(path.join(__dirname, 'utility.js'), [SERVER_API_URL], { respondToAuthRequestsFromMainProcess: true });
    await hckFetch(`${SERVER_API_URL}/main`, { method: 'PUT' });
  } finally {
    await wait(1000);
    startServer();
  }
});

app.on('login', (event, webContents, details, authInfo, callback) => {
  event.preventDefault();
  callback('user1', 'user1');
});

function startServer() {
  const app = express();
  app.get('/status', (_, res) => {
    res.status(200).send({ status: 'OK' });
  });
  app.listen(PORT);
}