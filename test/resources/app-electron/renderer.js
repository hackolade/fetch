(async function () {
  const { hckFetch } = await import('../../../dist/esm/index.mjs');

  function renderHckFetchResult({ process, isSuccess }) {
    const resultClass = isSuccess ? 'hck-fetch-result-ok' : 'hck-fetch-result-nok';
    document.getElementById(`hck-fetch-result-${process}`).classList.add(resultClass);
  }

  // Listen for result of fetch() from other processes
  window.electronAPI.onHckFetchResult((_, { process, isSuccess }) => {
    renderHckFetchResult({ process, isSuccess });
  });

  // Try to fetch() from renderer process
  const params = new URL(document.location).searchParams;
  const serverApiUrl = params.get('serverApiUrl');
  document.getElementById('title').textContent = `ENDPOINT: ${serverApiUrl}`;
  try {
    await hckFetch(`${serverApiUrl}/renderer`, { method: 'PUT' });
    renderHckFetchResult({ process: 'renderer', isSuccess: true });
  } catch (error) {
    renderHckFetchResult({ process: 'renderer', isSuccess: false });
  }
})();
