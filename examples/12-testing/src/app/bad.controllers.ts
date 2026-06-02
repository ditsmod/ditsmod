import { Injector } from '@ditsmod/core';
import { route, controller, RequestContext } from '@ditsmod/rest';

@controller()
export class Controller1 {
  @route('GET', 'fail1')
  method1(reqCtx: RequestContext, injector: Injector) {
    injector.get('non-existing-token');
    reqCtx.send('ok');
  }
}
