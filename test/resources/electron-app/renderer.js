(async function () {
  const { hckFetch } = await import('../../../dist/esm/index.mjs');
  hckFetch('http://127.0.0.1:3000/renderer');
})();
