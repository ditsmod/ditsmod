import { controller, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller()
export class Controller1 {
  @route('GET', '')
  ok(res: Res) {
    res.send('ok');
  }
}
