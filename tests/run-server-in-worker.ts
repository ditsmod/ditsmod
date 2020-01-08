import 'reflect-metadata';
import * as http from 'http';
import { Router as RestifyRouter } from '@restify-ts/router';
import { parentPort, workerData } from 'worker_threads';

import { Application } from '../src/application';
import { ApplicationOptions, Logger, Router } from '../src/types';
import { Request } from '../src/request';
import { Response } from '../src/response';
import { Injectable } from 'ts-di';

const logger = { debug: (...args: any[]) => console.log(...args) };

class SomeService {
  methodOfSomeService() {
    return 'This is data of some resource';
  }
}

const options: ApplicationOptions = {
  providersPerApp: [
    //
    SomeService,
    { provide: Logger, useValue: logger },
    { provide: Router, useClass: RestifyRouter }
  ]
};

@Injectable()
class Controller {
  constructor(private req: Request, private res: Response, private someService: SomeService) {}

  helloWorld() {
    this.res.send('Hello, World!');
  }

  another() {
    this.res.send(`Here another response with params: ${JSON.stringify(this.req.params)}`);
  }

  sendError() {
    this.res.nodeRes.statusCode = 500;
    this.res.send('Some error here!');
  }

  getSomeResource() {
    const message = this.someService.methodOfSomeService();
    this.res.send(message);
  }
}

const app = new Application(options);
app.route('GET', '/hello', Controller, 'helloWorld');
app.route('GET', '/another/:param1/:param2', Controller, 'another');
app.route('GET', '/send-error', Controller, 'sendError');
app.route('GET', '/some-resource', Controller, 'getSomeResource');
const server = http.createServer(app.requestListener);
const { port } = workerData;
server.listen(port, () => {
  const msg = `server run on http://localhost:${port}/`;
  app.log.debug(msg);
  parentPort.postMessage(msg);
});
