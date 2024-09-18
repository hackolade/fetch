(async function () {
  const { hckFetch } = await import('../../../dist/esm/index.mjs');
  const params = new URL(document.location).searchParams;
  const serverApiUrl = params.get('serverApiUrl');
  hckFetch(`${serverApiUrl}/renderer`, { method: 'PUT' });
})();
