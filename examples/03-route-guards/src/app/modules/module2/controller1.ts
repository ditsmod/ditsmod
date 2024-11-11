import { controller, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller()
export class Controller1 {
  @route('GET', 'controler1-of-module2')
  ok(res: Res) {
    res.send('ok');
  }
}
