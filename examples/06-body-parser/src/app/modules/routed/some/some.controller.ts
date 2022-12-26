import { controller, Req, Res, route } from '@ditsmod/core';

@controller()
export class SomeController {
  constructor(private req: Req, private res: Res) {}

  @route('GET')
  tellHello() {
    this.res.send('Hello, you need send POST request');
  }

  @route('POST')
  ok() {
    this.res.sendJson(this.req.body);
  }
}
