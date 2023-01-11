import { controller, Req, Res, route } from '@ditsmod/core';

@controller()
export class SomeController {
  @route('GET')
  tellHello(res: Res) {
    res.send('Hello, you need send POST request');
  }

  @route('POST')
  ok(req: Req, res: Res) {
    res.sendJson(req.body);
  }
}
