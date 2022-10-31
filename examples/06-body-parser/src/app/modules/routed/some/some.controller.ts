import { Controller, Req, Res, Route } from '@ditsmod/core';

@Controller()
export class SomeController {
  constructor(private req: Req, private res: Res) {}

  @Route('GET')
  tellHello() {
    this.res.send('Hello, you need send POST request');
  }

  @Route('POST')
  ok() {
    this.res.sendJson(this.req.body);
  }
}
