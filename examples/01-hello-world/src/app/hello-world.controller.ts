import { controller, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller()
export class HelloWorldController {
  @route('GET', 'hello')
  tellHello(res: Res) {
    res.send('Hello, World!');
  }

  @route('GET', 'symbol')
  [Symbol()](res: Res) {
    res.send('Hello, World!');
  }
}
