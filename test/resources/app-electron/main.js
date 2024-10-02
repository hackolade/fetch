const debug = require('debug');
const { app, BrowserWindow, ipcMain, utilityProcess } = require('electron');
const express = require('express');
const path = require('path');
const { hckFetch } = require('../../../dist/cjs/index.cjs');

app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('enable-transparent-visuals');
app.disableHardwareAcceleration();

const log = debug('hck-fetch').extend('test-app');

const PROXY_USERNAME = 'user1';
const PROXY_PASSWORD = PROXY_USERNAME;

const PORT = Number.parseInt(process.env.PORT);
if (!PORT) {
  throw new Error(`Expected env.PORT to be a positive integer, got '${process.env.PORT}'!`);
}

const SERVER_API_URL = process.env.SERVER_API_URL;
if (!SERVER_API_URL) {
  throw new Error(`Expected env.SERVER_API_URL to be defined, got '${process.env.SERVER_API_URL}'!`);
}

log('sending requests to %o', SERVER_API_URL);

function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function logHckFetchResult({ process, isSuccess, error }) {
  if (!isSuccess) {
    console.log(`ERROR: Could not fetch from ${process} process!`, error);
  }
}

function renderHckFetchResult(window, { process, isSuccess }) {
  window.webContents.send('hck-fetch-result', { process, isSuccess });
}

async function fetchFromUtilityProcess({ logResult, renderResult }) {
  const child = utilityProcess.fork(path.join(__dirname, 'utility.js'), [SERVER_API_URL], {
    respondToAuthRequestsFromMainProcess: true,
  });
  child.on('message', result => {
    logResult(result);
    renderResult(result);
  });
}

const createWindow = async () => {
  const window = new BrowserWindow({
    width: 700,
    height: 450,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  await window.loadFile('index.html', { query: { serverApiUrl: SERVER_API_URL } });
  return window;
};

app.whenReady().then(async () => {
  try {
    const window = await createWindow();
    await fetchFromUtilityProcess({
      logResult: logHckFetchResult.bind(this),
      renderResult: renderHckFetchResult.bind(this, window),
    });
    try {
      await hckFetch(`${SERVER_API_URL}/main`, { method: 'PUT' });
      renderHckFetchResult(window, { process: 'main', isSuccess: true });
    } catch (error) {
      renderHckFetchResult(window, { process: 'main', isSuccess: false });
      console.log('ERROR: Could not fetch from main process!', error);
    }
  } finally {
    await wait(1000);
    startServer();
  }
});

ipcMain.on('hck-fetch-result', (_, result) => {
  logHckFetchResult(result);
});

app.on('login', (event, webContents, details, authInfo, callback) => {
  event.preventDefault();
  callback(PROXY_USERNAME, PROXY_PASSWORD);
});

function startServer() {
  const app = express();
  app.get('/status', (_, res) => {
    res.status(200).send({ status: 'OK' });
  });
  app.listen(PORT);
}
