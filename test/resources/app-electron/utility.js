(async function () {
  const { hckFetch } = require('../../../dist/cjs/index.cjs');
  const serverApiUrl = process.argv[2];
  try {
    await hckFetch(`${serverApiUrl}/utility`, { method: 'PUT' });
    const result = { process: 'utility', isSuccess: true };
    process.parentPort.postMessage(result);
  } catch (error) {
    const result = { process: 'utility', isSuccess: false, error };
    process.parentPort.postMessage(result);
  }
})();
