import { controller, Res, route } from '@ditsmod/core';

@controller()
export class Controller1 {
  @route('GET', 'hello')
  ok(res: Res) {
    res.send('ok');
  }
}
