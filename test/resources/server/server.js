const debug = require('debug');
const express = require('express');

const log = debug('hck-fetch').extend('test-server');

function startServer() {
  log('starting server');
  const app = express();
  const initiators = new Map();
  
  app.get('/initiators/:initiator', (req, res) => {
    const { initiator } = req.params;
    const didSendRequest = initiators.has(initiator);
    log('did receive a request from %o? %o', initiator, didSendRequest);
    res.status(200).send({ didSendRequest });
  });
  
  app.put('/initiators/:initiator', (req, res) => {
    const { initiator } = req.params;
    log('received request from %o', initiator);
    initiators.set(initiator, true);
    res.status(200).end();
  });

  app.get('/status', (_, res) => {
    res.status(200).end();
  });

  app.get('/reset', (_, res) => {
    log('resetting server');
    initiators.clear();
    res.status(200).end();
  });

  app.get('/stop', (_, res) => {
    log('stopping server');
    res.status(200).end();
    server.close();
    process.exit(0);
  });

  const server = app.listen(3000);
  log('server is listening');
}

startServer();