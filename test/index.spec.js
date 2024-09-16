const debug = require('debug');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const { after, before, beforeEach, describe, it } = require('node:test');
const { resolve } = require('path');

const log = debug('hck-fetch').extend('test-server');

describe('@hackolade/fetch library', () => {

  const SERVER = 'http://localhost:3000';

  function runNpmTarget(target) {
    const childProcess = spawn('npm', ['run', target], {
      cwd: resolve(__dirname, '..'),
    });
    childProcess.stdout.on('data', (data) => log('%o: %o', target, data.toString()));
    childProcess.stderr.on('data', (data) => log('%o: %o', target, data.toString()));
    return childProcess;
  }

  async function startElectronApp() {
    const app = runNpmTarget('test:app');
    await wait(2000);
    app.kill();
  }

  async function startServer() {
    spawn('npm', ['run', 'test:server']);
    await wait(1000);
  }
  
  async function resetServer() {
    await fetch(`${SERVER}/reset`);
  }
  
  async function stopServer() {
    await fetch(`${SERVER}/stop`);
  }

  async function assertServerReachedFrom(initiator) {
    const response = await fetch(`${SERVER}/initiators/${initiator}`);
    const { didSendRequest } = await response.json();
    assert.ok(didSendRequest, `The server did not receive any request from the ${initiator} process!`);
  }

  function wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  before(() => startServer());

  beforeEach(() => resetServer());

  after(() => stopServer());

  it('should reach the server from the main process through a direct connection', async () => {
    await startElectronApp();
    await assertServerReachedFrom('main');
  });

  it('should reach the server from the renderer process through a direct connection', async () => {
    await startElectronApp();
    await assertServerReachedFrom('renderer');
  });

  it('should reach the server from the utility process through a direct connection', async () => {
    await startElectronApp();
    await assertServerReachedFrom('utility');
  });
});
