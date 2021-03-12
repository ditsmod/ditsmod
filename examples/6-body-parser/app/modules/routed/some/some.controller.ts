import { Controller, Request, Response, Route } from '@ditsmod/core';

@Controller()
export class SomeController {
  constructor(private req: Request, private res: Response) {}

  @Route('POST')
  ok() {
    this.res.sendText(this.req.body);
  }
}
