import { Injector } from '@ditsmod/core';
import { route, controller, Res } from '@ditsmod/routing';

@controller()
export class Controller1 {
  @route('GET', 'fail1')
  method1(res: Res, injector: Injector) {
    injector.get('non-existing-token');
    res.send('ok');
  }
}
