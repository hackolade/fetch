const { hckFetch } = require('../../../dist/cjs/index.cjs');

hckFetch('http://127.0.0.1:3000/initiators/utility', { method: 'PUT' });
