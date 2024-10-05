import { controller, Res, route } from '@ditsmod/core';

@controller()
export class Controller1 {
  @route('GET', 'controler1-of-module2')
  ok(res: Res) {
    res.send('ok');
  }
}
