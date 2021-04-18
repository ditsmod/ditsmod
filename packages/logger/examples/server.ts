import * as http from 'http';

import { Logger } from '../src/logger';

// Example logging HTTP server request and response objects.

const log = new Logger({
  name: 'myserver',
  serializers: {
    req: Logger.stdSerializers.req,
    res: Logger.stdSerializers.res
  }
});

const server = http.createServer((req, res) => {
  log.info({ req }, 'start request'); // <-- this is the guy we're testing
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World\n');
  log.info({ res }, 'done response'); // <-- this is the guy we're testing
});
server.listen(1337, '127.0.0.1', () => {
  log.info('server listening');
  const options = {
    port: 1337,
    hostname: '127.0.0.1',
    path: '/path?q=1#anchor',
    headers: {
      'X-Hi': 'Mom'
    }
  };
  const req = http.request(options);
  req.on('response', res => {
    res.on('end', () => {
      process.exit();
    });
  });
  req.write('hi from the client');
  req.end();
});
