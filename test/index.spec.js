const assert = require('node:assert');
const { describe, it } = require('node:test');

describe('@hackolade/fetch library', () => {

  const SERVER = 'http://0.0.0.0:3000';

  async function assertServerReachedFrom(connectionType, initiator) {
    const response = await fetch(`${SERVER}/initiators/${connectionType}/${initiator}`);
    const { didSendRequest } = await response.json();
    assert.ok(didSendRequest, `The server did not receive any request from ${connectionType}/${initiator}!`);
  }

  it('should reach the server from the main process through a direct connection', async () => {
    await assertServerReachedFrom('direct', 'main');
  });

  it('should reach the server from the renderer process through a direct connection', async () => {
    await assertServerReachedFrom('direct', 'renderer');
  });

  it('should reach the server from the utility process through a direct connection', async () => {
    await assertServerReachedFrom('direct', 'utility');
  });

  it('should reach the server from the main process through a proxy', async () => {
    await assertServerReachedFrom('proxy', 'main');
  });

  it('should reach the server from the renderer process through a proxy', async () => {
    await assertServerReachedFrom('proxy', 'renderer');
  });

  it('should reach the server from the utility process through a proxy', async () => {
    await assertServerReachedFrom('proxy', 'utility');
  });
});
