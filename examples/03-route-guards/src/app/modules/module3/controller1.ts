import { controller, Res, route } from '@ditsmod/core';

@controller()
export class Controller1 {
  @route('GET', '')
  ok(res: Res) {
    res.send('ok');
  }
}
