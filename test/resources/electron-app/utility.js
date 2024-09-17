const { hckFetch } = require('../../../dist/cjs/index.cjs');

hckFetch('http://hck-fetch-test-server:3000/initiators/utility', { method: 'PUT' });
