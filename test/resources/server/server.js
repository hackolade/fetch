const debug = require('debug');
const express = require('express');

const log = debug('hck-fetch').extend('test-server');

function startServer() {
  log('starting server');
  const app = express();
  const initiators = new Map();
  
  app.get('/initiators/:connectionType/:initiator', (req, res) => {
    const { connectionType, initiator } = req.params;
    const didSendRequest = !!initiators.get(connectionType)?.has(initiator);
    log('did receive a request from %o? %o', `${connectionType}/${initiator}`, didSendRequest);
    res.status(200).send({ didSendRequest });
  });
  
  app.put('/initiators/:connectionType/:initiator', (req, res) => {
    const { connectionType, initiator } = req.params;
    log('received request from %o', `${connectionType}/${initiator}`);
    if (!initiators.has(connectionType)) {
      initiators.set(connectionType, new Map());
    }
    initiators.get(connectionType).set(initiator, true);
    res.status(200).end();
  });

  app.get('/status', (_, res) => {
    res.status(200).send({ status: 'OK' });
  });

  app.get('/reset', (_, res) => {
    log('resetting server');
    initiators.clear();
    res.status(200).end();
  });

  app.listen(3000);
  log('server is listening');
}

startServer();