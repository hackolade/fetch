const debug = require('debug');
const express = require('express');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const { after, before, beforeEach, describe, it } = require('node:test');
const { resolve } = require('path');

const log = debug('hck').extend('test');

describe('@hackolade/fetch library', () => {
  let server;
  const initiators = [];

  function startServer() {
    log('starting server');
    const app = express();
    const ok = (initiator) => (req, res) => {
      log('received request from %o', initiator);
      initiators.push(initiator);
      res.status(200).end();
    };
    app.get('/main', ok('main'));
    app.get('/renderer', ok('renderer'));
    app.get('/utility', ok('utility'));
    server = app.listen(3000);
    log('server is listening');
  }

  function stopServer() {
    log('stopping server');
    server.close();
  }

  function clearInitiators() {
    initiators.splice(0, initiators.length);
  }

  function wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async function startElectronApp() {
    const appProcess = spawn('npm', ['run', 'test:app:electron'], {
      cwd: resolve(__dirname, '..'),
    });
    appProcess.stdout.on('data', (data) => log('STDOUT: %o', data.toString()));
    appProcess.stderr.on('data', (data) => log('STDERR: %o', data.toString()));
    await wait(2000);
    appProcess.kill();
  }

  function assertServerReachedFrom(initiator) {
    assert.ok(initiators.includes(initiator));
  }

  before(() => startServer());

  beforeEach(() => clearInitiators());

  after(() => stopServer());

  it('should reach the server from the main process', async () => {
    await startElectronApp();
    assertServerReachedFrom('main');
  });

  it('should reach the server from the renderer process', async () => {
    await startElectronApp();
    assertServerReachedFrom('renderer');
  });

  it('should reach the server from the utility process', async () => {
    await startElectronApp();
    assertServerReachedFrom('utility');
  });
});
