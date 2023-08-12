import { controller, inject, Res, route } from '@ditsmod/core';
import { HTTP_BODY } from '@ditsmod/body-parser';

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
  post(res: Res, @inject(HTTP_BODY) body: Body) {
    res.sendJson(body);
  }
}
