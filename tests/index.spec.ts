import * as http from 'http';
import { Worker } from 'worker_threads';

import { Status } from '../src/http-status-codes';
import { NodeRequest } from '../src/types';

describe('Application', () => {
  const port = 8090;

  function getBody(req: NodeRequest) {
    const bodyArr: any[] = [];

    return new Promise<string>((resolve, reject) => {
      req
        .on('data', chunk => bodyArr.push(chunk))
        .on('end', () => {
          const str = Buffer.concat(bodyArr).toString();
          resolve(str);
        })
        .on('error', reject);
    });
  }

  beforeAll(done => {
    new Worker(`${__dirname}/index.js`, { workerData: { port } })
      .on('message', done)
      .on('error', done.fail)
      .on('exit', code => {
        if (code !== 0) {
          done.fail(new Error(`Worker stopped with exit code ${code}`));
        }
      });
  });

  describe('Controller', () => {
    it('should to send "Hello, World!" with setting header "server"', done => {
      http
        .get(`http://localhost:${port}/hello`, req => {
          expect(req instanceof http.IncomingMessage).toBe(true);

          const { headers, statusCode } = req;
          const { server: serverName } = headers;
          expect(statusCode).toBe(Status.OK);
          expect(serverName).toBe('restify-ts');

          getBody(req)
            .then(body => expect(body).toBe('Hello, World!'))
            .then(done)
            .catch(done.fail);
        })
        .on('error', done.fail);
    });

    it('should send an error with statusCode == 500', done => {
      const callback = () => {
        http
          .get(`http://localhost:${port}/send-error`, req => {
            const { statusCode } = req;
            expect(statusCode).toBe(Status.INTERNAL_SERVER_ERROR);
            done();
          })
          .on('error', done.fail);
      };

      expect(callback).not.toThrow();
    });

    it('should send message from some resource', done => {
      http
        .get(`http://localhost:${port}/some-resource`, req => {
          const { statusCode } = req;
          expect(statusCode).toBe(Status.OK);

          getBody(req)
            .then(body => expect(body).toBe('This is data of some resource'))
            .then(done)
            .catch(done.fail);
        })
        .on('error', done.fail);
    });

    it('should to redirect a request', done => {
      http
        .get(`http://localhost:${port}/redirect-301`, req => {
          const { statusCode, headers } = req;
          expect(statusCode).toBe(Status.MOVED_PERMANTENTLY);
          expect(headers && headers.location).toBe('/hello');
          done();
        })
        .on('error', done.fail);
    });

    it('should to show log for request and response', done => {
      http
        .get({ port, path: `/show-log`, headers: { accept: 'text/plain' } }, req => {
          const { statusCode } = req;
          expect(statusCode).toBe(Status.OK);

          getBody(req)
            .then(body => {
              const str = `Node Request **************
GET /show-log HTTP/1.1
accept: text/plain
host: localhost:${port}
connection: close

Node Reresponse **************
HTTP/1.1 200 OK
accept: text/plain
host: localhost:${port}
connection: close
`;
              expect(body).toBe(str);
            })
            .then(done)
            .catch(done.fail);
        })
        .on('error', done.fail);
    });
  });
});
