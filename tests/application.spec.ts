import * as http from 'http';
import { Worker } from 'worker_threads';

describe('Application', () => {
  const port = 8081;

  beforeAll(done => {
    new Worker(`${__dirname}/run-server-in-worker.js`, { workerData: { port } })
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
          expect(statusCode).toBe(200);
          expect(serverName).toBe('restify-ts');

          const bodyArr: any[] = [];
          let body: string;

          req
            .on('data', chunk => bodyArr.push(chunk))
            .on('end', () => {
              body = Buffer.concat(bodyArr).toString();
              expect(body).toBe('Hello, World!');
              done();
            })
            .on('error', done.fail);
        })
        .on('error', done.fail);
    });

    it('should send an error with statusCode == 500', done => {
      const callback = () => {
        http
          .get(`http://localhost:${port}/send-error`, req => {
            const { statusCode } = req;
            expect(statusCode).toBe(500);
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
          expect(statusCode).toBe(200);

          const bodyArr: any[] = [];
          let body: string;

          req
            .on('data', chunk => bodyArr.push(chunk))
            .on('end', () => {
              body = Buffer.concat(bodyArr).toString();
              expect(body).toBe('This is data of some resource');
              done();
            })
            .on('error', done.fail);
        })
        .on('error', done.fail);
    });
  });
});
