import { Injector } from '@ditsmod/core';
import { route, controller, RequestContext } from '@ditsmod/rest';

@controller()
export class Controller1 {
  @route('GET', 'fail1')
  method1(ctx: RequestContext, injector: Injector) {
    injector.get('non-existing-token');
    ctx.send('ok');
  }
}
