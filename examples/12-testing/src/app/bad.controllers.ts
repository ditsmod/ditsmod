import { Injector, Res, controller } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller()
export class Controller1 {
  @route('GET', 'fail1')
  method1(res: Res, injector: Injector) {
    injector.get('non-existing-token');
    res.send('ok');
  }
}
