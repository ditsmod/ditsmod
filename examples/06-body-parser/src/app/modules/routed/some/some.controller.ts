import { controller, inject, Res, route } from '@ditsmod/core';
import { HttpBody } from '@ditsmod/body-parser';

interface Body {
  one: number;
}

@controller()
export class SomeController {
  @route('GET')
  tellHello(res: Res) {
    res.send('Hello, you need send POST request');
  }

  @route('POST')
  ok(@inject(HttpBody) body: Body, res: Res) {
    res.sendJson(body);
  }
}
