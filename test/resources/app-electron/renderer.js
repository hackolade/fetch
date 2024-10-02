(async function () {
  const { hckFetch } = await import('../../../dist/esm/index.mjs');
  const { onHckFetchResult, sendHckFetchResult } = window.electronAPI;

  function renderHckFetchResult({ process, isSuccess }) {
    const resultClass = isSuccess ? 'hck-fetch-result-ok' : 'hck-fetch-result-nok';
    document.getElementById(`hck-fetch-result-${process}`).classList.add(resultClass);
  }

  // Listen for result of fetch() from other processes
  onHckFetchResult((_, { process, isSuccess }) => renderHckFetchResult({ process, isSuccess }));

  // Try to fetch() from renderer process
  const params = new URL(document.location).searchParams;
  const serverApiUrl = params.get('serverApiUrl');
  document.getElementById('title').textContent = `ENDPOINT: ${serverApiUrl}`;
  try {
    await hckFetch(`${serverApiUrl}/renderer`, { method: 'PUT' });
    const result = { process: 'renderer', isSuccess: true };
    renderHckFetchResult(result);
    sendHckFetchResult(result);
  } catch (error) {
    const result = { process: 'renderer', isSuccess: false, error };
    renderHckFetchResult(result);
    sendHckFetchResult(result);
  }
})();
