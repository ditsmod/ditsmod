import { Res } from '@ditsmod/core';
import { controller, route } from '@ditsmod/routing';

@controller()
export class Controller1 {
  @route('GET', 'ok1')
  ok(res: Res) {
    res.send('ok1');
  }
}

@controller({ scope: 'ctx' })
export class Controller2 {
  @route('GET', 'ok2')
  ok(res: Res) {
    res.send('ok2');
  }
}
