import { Request } from '../../../src/request';
import { Response } from '../../../src/response';
import { Status } from '../../../src/http-status-codes';
import { Controller, Route } from '../../../src/decorators';

@Controller({ path: '' })
export class HelloWorldController {
  constructor(private req: Request, private res: Response) {}

  @Route('GET', 'hello')
  helloWorld() {
    this.res.send('Hello, World!');
  }

  @Route('GET', 'show-log')
  showLog() {
    this.res.send(`Node Request **************\n${this.req}\nNode Reresponse **************\n${this.res}`);
  }

  @Route('GET', 'redirect-301')
  redirect301() {
    this.res.redirect(Status.MOVED_PERMANTENTLY, '/hello');
  }

  @Route('GET', 'send-error')
  sendError() {
    this.res.nodeRes.statusCode = Status.INTERNAL_SERVER_ERROR;
    this.res.send('Some error here!');
  }
}
