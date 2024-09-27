(async function() {
  const { hckFetch } = require('../../../dist/cjs/index.cjs');
  const serverApiUrl = process.argv[2];
  try {
    await hckFetch(`${serverApiUrl}/utility`, { method: 'PUT' });
    process.parentPort.postMessage({ isSuccess: true });
  } catch(error) {
    process.parentPort.postMessage({ isSuccess: false });
  }
})();
