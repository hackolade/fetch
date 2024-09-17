const assert = require('node:assert');
const { describe, it } = require('node:test');

describe('@hackolade/fetch library', () => {

  const SERVER = 'http://0.0.0.0:3000';

  async function assertServerReachedFrom(initiator) {
    const response = await fetch(`${SERVER}/initiators/${initiator}`);
    const { didSendRequest } = await response.json();
    assert.ok(didSendRequest, `The server did not receive any request from the ${initiator} process!`);
  }

  it('should reach the server from the main process through a direct connection', async () => {
    await assertServerReachedFrom('main');
  });

  it('should reach the server from the renderer process through a direct connection', async () => {
    await assertServerReachedFrom('renderer');
  });

  it('should reach the server from the utility process through a direct connection', async () => {
    await assertServerReachedFrom('utility');
  });
});
