import { controller, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller()
export class HelloWorldController {
  @route('GET')
  tellHello(res: Res) {
    res.send('Hello World!\n');
  }
}
