import * as http from 'http';

import { Application } from '../src/application';

describe('Application', () => {
  let app: Application;
  let server: http.Server;
  const port = 8081;

  beforeEach(done => {
    app = new Application();
    server = http.createServer(app.requestListener);
    server.listen(port, done);
  });

  describe('requestListener', () => {
    it('should to send "Hello World!"', done => {
      http.get(`http://localhost:${port}`, req => {
        expect(req instanceof http.IncomingMessage).toBe(true);

        const { statusCode } = req;
        expect(statusCode).toBe(200);

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
      });
    });
  });
});
