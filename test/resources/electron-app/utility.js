const { hckFetch } = require('../../../dist/cjs/index.cjs');
const serverApiUrl = process.argv[2];
hckFetch(`${serverApiUrl}/utility`, { method: 'PUT' });
