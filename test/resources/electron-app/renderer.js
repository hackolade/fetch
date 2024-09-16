(async function () {
  const { hckFetch } = await import('../../../dist/esm/index.mjs');
  hckFetch('http://server:3000/initiators/renderer', { method: 'PUT' });
})();
