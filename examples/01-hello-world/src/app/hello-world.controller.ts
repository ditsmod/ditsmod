import { controller, Res, route } from '@ditsmod/core';

@controller()
export class HelloWorldController {
  @route('GET', 'hello')
  tellHello(res: Res) {
    res.send('Hello, World!');
  }
}
