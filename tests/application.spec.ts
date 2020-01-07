import * as http from 'http';

import { Application } from '../src/application';
import { ApplicationOptions } from '../src/types';

describe('Application', () => {
  let app: Application;
  let server: http.Server;
  const port = 8081;

  beforeEach(done => {
    const options: ApplicationOptions = {
      log: {
        debug: (...args: any[]) => console.log(...args)
      }
    };
    app = new Application(options);
    server = http.createServer(app.requestListener);
    server.listen(port, done);
  });

  describe('requestListener', () => {
    it('should to send "Hello World!" with setting header "server"', done => {
      http
        .get(`http://localhost:${port}`, req => {
          expect(req instanceof http.IncomingMessage).toBe(true);

          const { headers, statusCode } = req;
          const { server: serverName } = headers;
          expect(statusCode).toBe(200);
          expect(serverName).toBe('restify-ts');

          const bodyArr: any[] = [];
          let body: string;

          req
            .on('data', chunk => bodyArr.push(chunk))
            .on('end', () => {
              body = Buffer.concat(bodyArr).toString();
              expect(body).toBe('Hello World!');
              done();
            })
            .on('error', done.fail);
        })
        .on('error', done.fail);
    });
  });
});
