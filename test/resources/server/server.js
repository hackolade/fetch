const debug = require('debug');
const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');

const HTTP_PORT = 8080;
const HTTPS_PORT = 4443;
const log = debug('hck-fetch').extend('test-server');

function startServer() {
  log('starting server');
  const app = express();
  const initiators = new Map();
  
  app.get('/initiators/:connectionType/:initiator', (req, res) => {
    const { connectionType, initiator } = req.params;
    const didSendRequest = !!initiators.get(connectionType)?.has(initiator);
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

  app.listen(HTTP_PORT, () => {
    log(`server is listening to incoming HTTP requests`);
  });

  const httpsOptions = {
    key: fs.readFileSync(path.resolve(__dirname, '..', 'certs', 'gen', 'localhost.key')),
    cert: fs.readFileSync(path.resolve(__dirname, '..', 'certs', 'gen', 'localhost.crt')),
  };

 const httpsServer = https.createServer(httpsOptions, app);

  httpsServer.listen(HTTPS_PORT, () => {
    log('server is listening to incoming HTTPS requests');
  });
}

startServer();