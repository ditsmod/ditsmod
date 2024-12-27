import { controller, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller()
export class Controller1 {
  @route('GET', 'controler1-of-module3')
  ok(res: Res) {
    res.send('ok');
  }
}

@controller({ scope: 'module' })
export class Controller2 {
  @route('GET', 'controler2-of-module3')
  ok(res: Res) {
    res.send('ok');
  }
}
