(async function () {
  const { hckFetch } = await import('../../../dist/esm/index.mjs');
  hckFetch('http://hck-fetch-test-server:3000/initiators/renderer', { method: 'PUT' });
})();
