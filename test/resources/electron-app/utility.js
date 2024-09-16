const { hckFetch } = require('../../../dist/cjs/index.cjs');

hckFetch('http://server:3000/initiators/utility', { method: 'PUT' });
