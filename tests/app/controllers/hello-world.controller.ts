import { Injectable } from 'ts-di';

import { Request } from '../../../src/request';
import { Response } from '../../../src/response';
import { Status } from '../../../src/http-status-codes';

@Injectable()
export class HelloWorldController {
  constructor(private req: Request, private res: Response) {}

  helloWorld() {
    this.res.send('Hello, World!');
  }

  showLog() {
    this.res.send(`Node Request **************\n${this.req}\nNode Reresponse **************\n${this.res}`);
  }

  redirect301() {
    this.res.redirect(Status.MOVED_PERMANTENTLY, '/hello');
  }

  sendError() {
    this.res.nodeRes.statusCode = Status.INTERNAL_SERVER_ERROR;
    this.res.send('Some error here!');
  }
}
