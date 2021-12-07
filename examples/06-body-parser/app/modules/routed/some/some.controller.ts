import { Controller, Req, Res, Route } from '@ditsmod/core';

@Controller()
export class SomeController {
  constructor(private req: Req, private res: Res) {}

  @Route('GET')
  tellHello() {
    this.res.send('Hello, you need send POST request\n');
  }

  @Route('POST')
  ok() {
    this.res.sendText(this.req.body);
  }
}
